const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, '../kindness_map.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log('Connected to robust SQLite database successfully.');
    initDb();
  }
});

// Helper functions for Promise-based SQL queries
const queryAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const queryGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const queryRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this); // 'this' contains lastID and changes
    });
  });
};

// Initialize database schema and seed data
async function initDb() {
  try {
    // 1. Users Table
    await queryRun(`
      CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullName TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        avatar TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        points INTEGER DEFAULT 0,
        level TEXT DEFAULT 'Active Citizen',
        role TEXT DEFAULT 'user',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Badges Table
    await queryRun(`
      CREATE TABLE IF NOT EXISTS Badges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL
      )
    `);

    // 3. UserBadges Table
    await queryRun(`
      CREATE TABLE IF NOT EXISTS UserBadges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        badgeId INTEGER NOT NULL,
        awardedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (badgeId) REFERENCES Badges(id) ON DELETE CASCADE
      )
    `);

    // 4. Posts Table
    await queryRun(`
      CREATE TABLE IF NOT EXISTS Posts (
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
        userId INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
      )
    `);

    // 5. Comments Table
    await queryRun(`
      CREATE TABLE IF NOT EXISTS Comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        userId INTEGER NOT NULL,
        postId INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (postId) REFERENCES Posts(id) ON DELETE CASCADE
      )
    `);

    // 6. Likes Table
    await queryRun(`
      CREATE TABLE IF NOT EXISTS Likes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        postId INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE,
        FOREIGN KEY (postId) REFERENCES Posts(id) ON DELETE CASCADE
      )
    `);

    // 7. Notifications Table
    await queryRun(`
      CREATE TABLE IF NOT EXISTS Notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        isRead INTEGER DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES Users(id) ON DELETE CASCADE
      )
    `);

    // 8. CommunityAwards Table
    await queryRun(`
      CREATE TABLE IF NOT EXISTS CommunityAwards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        month TEXT NOT NULL,
        description TEXT NOT NULL,
        recipientUserId INTEGER NOT NULL,
        awardPoints INTEGER DEFAULT 100,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recipientUserId) REFERENCES Users(id) ON DELETE CASCADE
      )
    `);

    // Check if seeded
    const count = await queryGet(`SELECT COUNT(*) as cnt FROM Users`);
    if (count.cnt === 0) {
      console.log('Seeding initial Vietnamese sample data...');

      // Badges
      const badges = [
        ['Environmental Guardian', 'Người gác đền môi trường, tích cực tham gia các hoạt động làm sạch và bảo vệ tự nhiên.', 'leaf'],
        ['Kindness Ambassador', 'Đại sứ việc tốt, truyền cảm hứng mạnh mẽ cho cộng đồng qua những hành động thiết thực.', 'heart'],
        ['Blood Donation Hero', 'Anh hùng hiến máu, mang lại cơ hội sống và hy vọng cho những bệnh nhân cần máu.', 'droplet'],
        ['Community Volunteer', 'Tình nguyện viên cống hiến, luôn có mặt trong các phong trào hỗ trợ hoàn cảnh khó khăn.', 'users'],
        ['Social Impact Maker', 'Người tạo tác động xã hội, có những đóng góp mang tính bền vững cho địa phương.', 'star']
      ];
      for (const b of badges) {
        await queryRun(`INSERT INTO Badges (name, description, icon) VALUES (?, ?, ?)`, b);
      }

      // Hashed Password for seed users ('password123')
      const hashedPw = await bcrypt.hash('password123', 10);

      // Users
      const users = [
        ['Nguyễn Văn Quản Trị', 'admin@kindnessmap.vn', hashedPw, 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', 850, 'Community Hero', 'admin'],
        ['Trần Minh Tuấn', 'tuan.tran@student.vn', hashedPw, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', 340, 'Community Inspiration', 'user'],
        ['Lê Hoàng Yến', 'hoangyen.volunteer@gmail.com', hashedPw, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', 520, 'Community Hero', 'user'],
        ['Phạm Quốc Bảo', 'quocbao.dev@yahoo.com', hashedPw, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80', 190, 'Kindness Ambassador', 'user'],
        ['Hoàng Thị Mai', 'maihoang.resident@hotmail.com', hashedPw, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80', 90, 'Active Citizen', 'user']
      ];
      for (const u of users) {
        await queryRun(`INSERT INTO Users (fullName, email, password, avatar, points, level, role) VALUES (?, ?, ?, ?, ?, ?, ?)`, u);
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
        await queryRun(`INSERT INTO UserBadges (userId, badgeId) VALUES (?, ?)`, ub);
      }

      // Posts
      const posts = [
        ['Nhóm bạn trẻ dọn sạch rác tại Hồ Tây cuối tuần', 'Sáng Chủ Nhật vừa qua, hơn 20 bạn sinh viên và người dân quanh khu vực Hồ Tây đã cùng nhau thu gom được 15 bao rác thải nhựa và chai lọ, trả lại cảnh quan xanh sạch cho bờ hồ.', 'https://images.unsplash.com/photo-1618477461853-cf6ed80faba5?auto=format&fit=crop&w=800&q=80', 'Môi trường', 21.0583, 105.8159, 'Hồ Tây, Hà Nội', 'Approved', 1, 2],
        ['Trồng 50 cây xanh tại khuôn viên trường Đại học', 'Đoàn thanh niên phối hợp cùng Câu lạc bộ Môi trường đã thực hiện chiến dịch phủ xanh đất trống, trồng và bảo vệ 50 cây phượng và bằng lăng trong trường.', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80', 'Trồng cây', 21.0382, 105.7826, 'Cầu Giấy, Hà Nội', 'Approved', 1, 3],
        ['Ngày hội hiến máu Giọt Hồng Yêu Thương 2026', 'Chương trình hiến máu nhân đạo đã thu hút hơn 300 lượt đăng ký, đóng góp hàng trăm đơn vị máu quý giá vào ngân hàng máu quốc gia phục vụ cấp cứu.', 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=800&q=80', 'Hiến máu', 10.7769, 106.7009, 'Quận 1, TP. Hồ Chí Minh', 'Approved', 1, 3],
        ['Tặng quà và thăm hỏi các cụ già neo đơn tại viện dưỡng lão', 'Cuối tuần qua, chúng mình đã mang những món quà nhỏ gồm sữa, bánh và khăn ấm đến thăm các cụ. Được lắng nghe những câu chuyện đời và thấy nụ cười của các cụ là điều tuyệt vời nhất.', 'https://images.unsplash.com/photo-1516307365426-bea591f05011?auto=format&fit=crop&w=800&q=80', 'Người cao tuổi', 10.7925, 106.6541, 'Quận Tân Bình, TP. Hồ Chí Minh', 'Approved', 1, 4],
        ['Dạy học miễn phí cho trẻ em làng chài ven sông', 'Lớp học tình thương buổi tối được tổ chức đều đặn vào thứ 3 và thứ 5 hàng tuần giúp các em nhỏ có hoàn cảnh khó khăn duy trì con chữ.', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80', 'Giáo dục', 16.0544, 108.2022, 'Đà Nẵng', 'Approved', 1, 2],
        ['Phát suất ăn đêm cho người vô gia cư ở ga Trần Quý Cáp', 'Nhóm tình nguyện Đêm Ấm đã trao tặng 80 suất xôi chả và sữa nóng cho cô chú công nhân vệ sinh và người vô gia cư trong đêm đông.', 'https://images.unsplash.com/photo-1593113598432-846f29edce7b?auto=format&fit=crop&w=800&q=80', 'Tình nguyện', 21.0285, 105.8402, 'Đống Đa, Hà Nội', 'Approved', 0, 5],
        ['Giải cứu nông sản và hỗ trợ bà con nông dân bị ảnh hưởng bão', 'Hỗ trợ thu hoạch và phân phối gần 2 tấn dưa hấu giúp bà con nông dân vượt qua giai đoạn thiên tai khó khăn.', 'https://images.unsplash.com/photo-1592417817098-8f3d6eb263d7?auto=format&fit=crop&w=800&q=80', 'Cộng đồng', 10.0333, 105.7833, 'Cần Thơ', 'Pending', 0, 4],
        ['Sửa chữa mái nhà giúp cụ già neo đơn bị dột sau mưa', 'Hỗ trợ thay mới ngói và sửa lại đường ống thoát nước cho cụ Hương ở ngõ nhỏ.', 'https://images.unsplash.com/photo-1588702545922-521e82355fb4?auto=format&fit=crop&w=800&q=80', 'Người cao tuổi', 21.0123, 105.8234, 'Hai Bà Trưng, Hà Nội', 'Rejected', 0, 5]
      ];
      for (const p of posts) {
        await queryRun(`INSERT INTO Posts (title, description, imageUrl, category, latitude, longitude, locationName, status, isFeatured, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, p);
      }

      // Comments
      const comments = [
        ['Hành động thật ý nghĩa, hy vọng sẽ có thêm nhiều hoạt động như thế này!', 3, 1],
        ['Cho mình hỏi lần tới nhóm có tổ chức ở khu vực Cầu Giấy không để mình tham gia với?', 4, 1],
        ['Tuyệt vời quá Yến ơi! Lần sau đi nhớ rủ tớ nhé.', 2, 3],
        ['Các cụ ở viện dưỡng lão dễ thương lắm, cảm ơn tấm lòng của các bạn.', 5, 4],
        ['Một nghĩa cử cao đẹp, xứng đáng là tấm gương sáng cho cộng đồng.', 1, 2]
      ];
      for (const c of comments) {
        await queryRun(`INSERT INTO Comments (content, userId, postId) VALUES (?, ?, ?)`, c);
      }

      // Likes
      const likes = [
        [1, 1], [2, 1], [3, 1], [4, 1], [5, 1],
        [1, 2], [2, 2], [4, 2],
        [1, 3], [2, 3], [4, 3], [5, 3],
        [1, 4], [3, 4], [5, 4],
        [1, 5], [3, 5]
      ];
      for (const l of likes) {
        await queryRun(`INSERT INTO Likes (userId, postId) VALUES (?, ?)`, l);
      }

      // Notifications
      const notifs = [
        [2, 'Bài viết được phê duyệt!', 'Bài viết "Nhóm bạn trẻ dọn sạch rác tại Hồ Tây" của bạn đã được quản trị viên duyệt và hiển thị trên Bản Đồ Việc Tốt. Bạn nhận được +10 điểm.', 'success'],
        [3, 'Huy hiệu mới!', 'Chúc mừng bạn đã đạt huy hiệu "Blood Donation Hero" nhờ những đóng góp xuất sắc trong chiến dịch Giọt Hồng Yêu Thương.', 'award'],
        [2, 'Cộng đồng vinh danh', 'Bạn hiện đang lọt vào Top 3 Bảng xếp hạng tuần này. Hãy tiếp tục phát huy nhé!', 'point']
      ];
      for (const n of notifs) {
        await queryRun(`INSERT INTO Notifications (userId, title, message, type) VALUES (?, ?, ?, ?)`, n);
      }

      // Awards
      const awards = [
        ['Hiệp Sĩ Môi Trường Của Tháng', 'Tháng 5, 2026', 'Trao tặng cho Trần Minh Tuấn với chuỗi 4 dự án làm sạch cảnh quan đô thị và truyền cảm hứng mạnh mẽ cho sinh viên Hà Nội.', 2, 200],
        ['Đại Sứ Trái Tim Vàng', 'Tháng 4, 2026', 'Trao tặng cho Lê Hoàng Yến vì những nỗ lực không mệt mỏi trong các chiến dịch vận động hiến máu và hỗ trợ bệnh nhân.', 3, 200]
      ];
      for (const a of awards) {
        await queryRun(`INSERT INTO CommunityAwards (title, month, description, recipientUserId, awardPoints) VALUES (?, ?, ?, ?, ?)`, a);
      }

      console.log('Database seeded successfully.');
    }
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

module.exports = {
  db,
  queryAll,
  queryGet,
  queryRun
};
