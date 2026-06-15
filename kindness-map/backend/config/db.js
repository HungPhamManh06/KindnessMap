const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbUrl = process.env.DATABASE_URL || 'mysql://localhost:3306/kindness_map';

let dbType = 'mysql';
let pool = null;
let sqliteDb = null;

// Giữ nguyên giao diện Promise để code Controller chạy mượt 100%
const queryAll = async (sql, params = []) => {
  if (dbType === 'mysql') {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } else {
    // Chuyển đổi một số cú pháp MySQL sang SQLite nếu cần (ví dụ ENUM, INSERT IGNORE, etc.)
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

const queryGet = async (sql, params = []) => {
  if (dbType === 'mysql') {
    const [rows] = await pool.execute(sql, params);
    return rows[0] || null;
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row || null);
      });
    });
  }
};

const queryRun = async (sql, params = []) => {
  if (dbType === 'mysql') {
    const [result] = await pool.execute(sql, params);
    return {
      lastID: result.insertId,
      changes: result.affectedRows
    };
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.run(sql, params, function(err) {
        if (err) reject(err);
        else {
          resolve({
            lastID: this.lastID,
            changes: this.changes
          });
        }
      });
    });
  }
};

// LÕI TỰ ĐỘNG KHỞI TẠO BẢNG & VIỆC TỐT MẪU VÀO AIVEN MySQL
async function initMySqlDb() {
  try {
    console.log('🔄 Đang kiểm tra và khởi tạo Cơ sở dữ liệu MySQL trên Cloud Aiven...');
    
    // 1. Tạo các bảng
    const schemaSql = `
      CREATE TABLE IF NOT EXISTS Users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          fullName VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          avatar LONGTEXT,
          points INT DEFAULT 0,
          level VARCHAR(100) DEFAULT 'Active Citizen',
          role ENUM('guest', 'user', 'admin') DEFAULT 'user',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS Badges (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          icon VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS UserBadges (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          badgeId INT NOT NULL,
          awardedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
          FOREIGN KEY (badgeId) REFERENCES Badges(id) ON DELETE CASCADE
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS Posts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(300) NOT NULL,
          description TEXT NOT NULL,
          imageUrl VARCHAR(1000) NOT NULL,
          category VARCHAR(100) NOT NULL,
          latitude DECIMAL(10, 8) NOT NULL,
          longitude DECIMAL(11, 8) NOT NULL,
          locationName VARCHAR(300) DEFAULT 'Hà Nội, Việt Nam',
          status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
          isFeatured BOOLEAN DEFAULT FALSE,
          pointsAwarded BOOLEAN DEFAULT FALSE,
          userId INT NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS Comments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          content TEXT NOT NULL,
          userId INT NOT NULL,
          postId INT NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
          FOREIGN KEY (postId) REFERENCES Posts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS Likes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          postId INT NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
          FOREIGN KEY (postId) REFERENCES Posts(id) ON DELETE CASCADE
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS Notifications (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          type VARCHAR(50) DEFAULT 'info',
          isRead BOOLEAN DEFAULT FALSE,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

      CREATE TABLE IF NOT EXISTS CommunityAwards (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          month VARCHAR(50) NOT NULL,
          description TEXT NOT NULL,
          recipientUserId INT NOT NULL,
          awardPoints INT DEFAULT 100,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (recipientUserId) REFERENCES Users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `;
    await pool.query(schemaSql);

    // Bọc thép db: Upgrade avatar column to LONGTEXT safely if table already existed
    try {
      await pool.query("ALTER TABLE Users MODIFY COLUMN avatar LONGTEXT");
      console.log('✅ Đã cập nhật Users.avatar thành LONGTEXT.');
    } catch (e) {
      console.log('⚠️ Bỏ qua cập nhật Users.avatar (đã tồn tại hoặc không thể thay đổi).');
    }

    // Migration an toàn: đánh dấu bài đã từng cộng điểm để tránh cộng điểm lặp khi duyệt lại
    try {
      await pool.query("ALTER TABLE Posts ADD COLUMN pointsAwarded BOOLEAN DEFAULT FALSE");
      await pool.query("UPDATE Posts SET pointsAwarded = 1 WHERE status = 'Approved' AND pointsAwarded = 0");
      console.log('✅ Đã thêm Posts.pointsAwarded để chống cộng điểm trùng.');
    } catch (e) {
      console.log('⚠️ Bỏ qua thêm Posts.pointsAwarded (đã tồn tại).');
      try {
        await pool.query("UPDATE Posts SET pointsAwarded = 1 WHERE status = 'Approved' AND pointsAwarded = 0");
      } catch (innerError) {
        console.log('⚠️ Không thể đồng bộ Posts.pointsAwarded cho dữ liệu cũ.');
      }
    }

    // 2. Kiểm tra nếu bảng Users trống thì Tự động nén dữ liệu mẫu vào
    const [userRows] = await pool.query(`SELECT COUNT(*) as cnt FROM Users`);
    if (userRows[0].cnt === 0) {
      console.log('🌱 Bảng trống, đang tự động nén dữ liệu Việc Tốt Việt Nam vào Aiven...');

      // Badges
      const badges = [
        ['Environmental Guardian', 'Người gác đền môi trường, tích cực tham gia các hoạt động làm sạch tự nhiên.', 'leaf'],
        ['Kindness Ambassador', 'Đại sứ việc tốt, truyền cảm hứng mạnh mẽ cho cộng đồng.', 'heart'],
        ['Blood Donation Hero', 'Anh hùng hiến máu, mang lại cơ hội sống cho bệnh nhân cần máu.', 'droplet'],
        ['Community Volunteer', 'Tình nguyện viên cống hiến, luôn có mặt hỗ trợ hoàn cảnh khó khăn.', 'users'],
        ['Social Impact Maker', 'Người tạo tác động xã hội bền vững cho địa phương.', 'star']
      ];
      for (const b of badges) {
        await pool.execute(`INSERT INTO Badges (name, description, icon) VALUES (?, ?, ?)`, b);
      }

      // Hashed Password ('password123')
      const hashedPw = await bcrypt.hash('password123', 10);

      // Users
      const users = [
        ['Phạm Mạnh Hùng', 'admin@kindnessmap.vn', hashedPw, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', 850, 'Community Hero', 'admin'],
        ['Trần Minh Tuấn', 'tuan.tran@student.vn', hashedPw, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', 340, 'Community Inspiration', 'user'],
        ['Lê Hoàng Yến', 'hoangyen.volunteer@gmail.com', hashedPw, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', 520, 'Community Hero', 'user'],
        ['Phạm Quốc Bảo', 'quocbao.dev@yahoo.com', hashedPw, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', 190, 'Kindness Ambassador', 'user'],
        ['Hoàng Thị Mai', 'maihoang.resident@hotmail.com', hashedPw, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80', 90, 'Active Citizen', 'user']
      ];
      for (const u of users) {
        await pool.execute(`INSERT INTO Users (fullName, email, password, avatar, points, level, role) VALUES (?, ?, ?, ?, ?, ?, ?)`, u);
      }

      // UserBadges
      const userBadges = [
        [1, 1], [1, 2], [1, 3], [1, 4], [1, 5],
        [2, 1], [2, 4],
        [3, 2], [3, 3], [3, 4], [3, 5],
        [4, 1], [4, 2],
        [5, 4]
      ];
      for (const ub of userBadges) {
        await pool.execute(`INSERT INTO UserBadges (userId, badgeId) VALUES (?, ?)`, ub);
      }

      // Posts
      const posts = [
        ['Nhóm bạn trẻ dọn sạch rác tại Hồ Tây cuối tuần', 'Sáng Chủ Nhật vừa qua, hơn 20 bạn sinh viên và người dân quanh khu vực Hồ Tây đã cùng nhau thu gom được 15 bao rác thải nhựa.', 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80', 'Môi trường', 21.0583, 105.8159, 'Hồ Tây, Hà Nội', 'Approved', 1, 2],
        ['Trồng 50 cây xanh tại khuôn viên trường Đại học', 'Đoàn thanh niên phối hợp cùng Câu lạc bộ Môi trường đã thực hiện chiến dịch phủ xanh đất trống trong trường.', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80', 'Trồng cây', 21.0382, 105.7826, 'Cầu Giấy, Hà Nội', 'Approved', 1, 3],
        ['Ngày hội hiến máu Giọt Hồng Yêu Thương 2026', 'Chương trình hiến máu nhân đạo đã thu hút hơn 300 lượt đăng ký, đóng góp hàng trăm đơn vị máu.', 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=800&q=80', 'Hiến máu', 10.7769, 106.7009, 'Quận 1, TP. Hồ Chí Minh', 'Approved', 1, 3],
        ['Tặng quà và thăm hỏi các cụ già neo đơn', 'Cuối tuần qua, chúng mình đã mang những món quà nhỏ gồm sữa và bánh ấm đến thăm các cụ ở viện dưỡng lão.', 'https://images.unsplash.com/photo-1516307365426-bea591f05011?auto=format&fit=crop&w=800&q=80', 'Người cao tuổi', 10.7925, 106.6541, 'Tân Bình, TP. Hồ Chí Minh', 'Approved', 1, 4]
      ];
      for (const p of posts) {
        await pool.execute(`INSERT INTO Posts (title, description, imageUrl, category, latitude, longitude, locationName, status, isFeatured, pointsAwarded, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`, p);
      }

      console.log('🎉 Đã khởi tạo và tải dữ liệu Việc tốt thành công rực rỡ vào Aiven MySQL!');
    } else {
      console.log('✅ Cơ sở dữ liệu Aiven MySQL đã có sẵn dữ liệu hoạt động trơn tru.');
    }
  } catch (error) {
    console.error('⚠️ Lỗi khởi tạo MySQL:', error);
    throw error; // Ném ra lỗi để initDb bắt và fallback sang SQLite
  }
}

// LÕI TỰ ĐỘNG KHỞI TẠO BẢNG & VIỆC TỐT MẪU VÀO SQLite
async function initSqliteDb() {
  try {
    const dbPath = path.resolve(__dirname, '../kindness_map.db');
    sqliteDb = new sqlite3.Database(dbPath);
    
    const runSql = (sql) => new Promise((resolve, reject) => {
      sqliteDb.run(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    await runSql(`CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullName TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        avatar TEXT,
        points INTEGER DEFAULT 0,
        level TEXT DEFAULT 'Active Citizen',
        role TEXT DEFAULT 'user',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    await runSql(`CREATE TABLE IF NOT EXISTS Badges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL
    )`);

    await runSql(`CREATE TABLE IF NOT EXISTS UserBadges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        badgeId INTEGER NOT NULL,
        awardedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (badgeId) REFERENCES Badges(id) ON DELETE CASCADE
    )`);

    await runSql(`CREATE TABLE IF NOT EXISTS Posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        imageUrl TEXT NOT NULL,
        category TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        locationName TEXT DEFAULT 'Hà Nội, Việt Nam',
        status TEXT DEFAULT 'Pending',
        isFeatured INTEGER DEFAULT 0,
        pointsAwarded INTEGER DEFAULT 0,
        userId INTEGER NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
    )`);

    await runSql(`CREATE TABLE IF NOT EXISTS Comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        userId INTEGER NOT NULL,
        postId INTEGER NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (postId) REFERENCES Posts(id) ON DELETE CASCADE
    )`);

    await runSql(`CREATE TABLE IF NOT EXISTS Likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        postId INTEGER NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (postId) REFERENCES Posts(id) ON DELETE CASCADE
    )`);

    await runSql(`CREATE TABLE IF NOT EXISTS Notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        isRead INTEGER DEFAULT 0,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
    )`);

    await runSql(`CREATE TABLE IF NOT EXISTS CommunityAwards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        month TEXT NOT NULL,
        description TEXT NOT NULL,
        recipientUserId INTEGER NOT NULL,
        awardPoints INTEGER DEFAULT 100,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recipientUserId) REFERENCES Users(id) ON DELETE CASCADE
    )`);

    // Migration an toàn
    try {
      await runSql("ALTER TABLE Users ADD COLUMN avatar TEXT");
    } catch(e) {}
    try {
      await runSql("ALTER TABLE Posts ADD COLUMN pointsAwarded INTEGER DEFAULT 0");
    } catch(e) {}

    // Check count
    const userCount = await new Promise((resolve) => {
      sqliteDb.get("SELECT COUNT(*) as cnt FROM Users", (err, row) => {
        resolve(row ? row.cnt : 0);
      });
    });

    if (userCount === 0) {
      console.log('🌱 Bảng SQLite trống, đang tự động thêm dữ liệu Việc Tốt mẫu vào SQLite...');
      
      const runInsert = (sql, params) => new Promise((resolve, reject) => {
        sqliteDb.run(sql, params, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      // Badges
      const badges = [
        ['Environmental Guardian', 'Người gác đền môi trường, tích cực tham gia các hoạt động làm sạch tự nhiên.', 'leaf'],
        ['Kindness Ambassador', 'Đại sứ việc tốt, truyền cảm hứng mạnh mẽ cho cộng đồng.', 'heart'],
        ['Blood Donation Hero', 'Anh hùng hiến máu, mang lại cơ hội sống cho bệnh nhân cần máu.', 'droplet'],
        ['Community Volunteer', 'Tình nguyện viên cống hiến, luôn có mặt hỗ trợ hoàn cảnh khó khăn.', 'users'],
        ['Social Impact Maker', 'Người tạo tác động xã hội bền vững cho địa phương.', 'star']
      ];
      for (const b of badges) {
        await runInsert(`INSERT INTO Badges (name, description, icon) VALUES (?, ?, ?)`, b);
      }

      const hashedPw = await bcrypt.hash('password123', 10);

      // Users
      const users = [
        ['Phạm Mạnh Hùng', 'admin@kindnessmap.vn', hashedPw, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', 850, 'Community Hero', 'admin'],
        ['Trần Minh Tuấn', 'tuan.tran@student.vn', hashedPw, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', 340, 'Community Inspiration', 'user'],
        ['Lê Hoàng Yến', 'hoangyen.volunteer@gmail.com', hashedPw, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', 520, 'Community Hero', 'user'],
        ['Phạm Quốc Bảo', 'quocbao.dev@yahoo.com', hashedPw, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', 190, 'Kindness Ambassador', 'user'],
        ['Hoàng Thị Mai', 'maihoang.resident@hotmail.com', hashedPw, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80', 90, 'Active Citizen', 'user']
      ];
      for (const u of users) {
        await runInsert(`INSERT INTO Users (fullName, email, password, avatar, points, level, role) VALUES (?, ?, ?, ?, ?, ?, ?)`, u);
      }

      // UserBadges
      const userBadges = [
        [1, 1], [1, 2], [1, 3], [1, 4], [1, 5],
        [2, 1], [2, 4],
        [3, 2], [3, 3], [3, 4], [3, 5],
        [4, 1], [4, 2],
        [5, 4]
      ];
      for (const ub of userBadges) {
        await runInsert(`INSERT INTO UserBadges (userId, badgeId) VALUES (?, ?)`, ub);
      }

      // Posts
      const posts = [
        ['Nhóm bạn trẻ dọn sạch rác tại Hồ Tây cuối tuần', 'Sáng Chủ Nhật vừa qua, hơn 20 bạn sinh viên và người dân quanh khu vực Hồ Tây đã cùng nhau thu gom được 15 bao rác thải nhựa.', 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80', 'Môi trường', 21.0583, 105.8159, 'Hồ Tây, Hà Nội', 'Approved', 1, 2],
        ['Trồng 50 cây xanh tại khuôn viên trường Đại học', 'Đoàn thanh niên phối hợp cùng Câu lạc bộ Môi trường đã thực hiện chiến dịch phủ xanh đất trống trong trường.', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80', 'Trồng cây', 21.0382, 105.7826, 'Cầu Giấy, Hà Nội', 'Approved', 1, 3],
        ['Ngày hội hiến máu Giọt Hồng Yêu Thương 2026', 'Chương trình hiến máu nhân đạo đã thu hút hơn 300 lượt đăng ký, đóng góp hàng trăm đơn vị máu.', 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=800&q=80', 'Hiến máu', 10.7769, 106.7009, 'Quận 1, TP. Hồ Chí Minh', 'Approved', 1, 3],
        ['Tặng quà và thăm hỏi các cụ già neo đơn', 'Cuối tuần qua, chúng mình đã mang những món quà nhỏ gồm sữa và bánh ấm đến thăm các cụ ở viện dưỡng lão.', 'https://images.unsplash.com/photo-1516307365426-bea591f05011?auto=format&fit=crop&w=800&q=80', 'Người cao tuổi', 10.7925, 106.6541, 'Tân Bình, TP. Hồ Chí Minh', 'Approved', 1, 4]
      ];
      for (const p of posts) {
        await runInsert(`INSERT INTO Posts (title, description, imageUrl, category, latitude, longitude, locationName, status, isFeatured, pointsAwarded, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`, p);
      }

      console.log('🎉 Đã khởi tạo và tải dữ liệu Việc tốt vào SQLite thành công rực rỡ!');
    } else {
      console.log('✅ Cơ sở dữ liệu SQLite đã có sẵn dữ liệu hoạt động trơn tru.');
    }
  } catch (error) {
    console.error('⚠️ Lỗi khởi tạo SQLite:', error);
  }
}

// HÀM KHỞI TẠO CHUNG
async function initDb() {
  try {
    console.log('🔄 Đang thử kết nối tới MySQL Cloud...');
    pool = mysql.createPool({
      uri: dbUrl,
      waitForConnections: true,
      connectionLimit: 3,
      queueLimit: 0,
      multipleStatements: true,
      ssl: { rejectUnauthorized: false },
      connectTimeout: 5000 // Chờ kết nối tối đa 5 giây
    });
    // Test thử một query để xác minh kết nối có thực sự tồn tại
    const conn = await pool.getConnection();
    conn.release();
    dbType = 'mysql';
    console.log('✅ Kết nối MySQL Cloud thành công!');
    await initMySqlDb();
  } catch (err) {
    console.warn('⚠️ Lỗi kết nối MySQL Cloud:', err.message);
    console.log('🔄 Đang chuyển sang sử dụng Cơ sở dữ liệu dự phòng SQLite cục bộ...');
    dbType = 'sqlite';
    if (pool) {
      try {
        await pool.end();
      } catch (e) {}
      pool = null;
    }
    await initSqliteDb();
  }
}

// Chạy tự động khởi tạo cơ sở dữ liệu khi load file
initDb();

module.exports = {
  get pool() { return pool; },
  queryAll,
  queryGet,
  queryRun
};

