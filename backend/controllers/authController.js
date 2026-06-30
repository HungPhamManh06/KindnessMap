const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { queryGet, queryRun, queryAll } = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const createAuthToken = (user) => jwt.sign(
  {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    avatar: user.avatar
  },
  JWT_SECRET,
  { expiresIn: '7d' }
);

const toPublicUser = (user) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  points: user.points,
  level: user.level
});

// Update user level helper based on total points
async function checkAndUpdateLevel(userId) {
  const user = await queryGet(`SELECT points, level FROM Users WHERE id = ?`, [userId]);
  if (!user) return;

  let newLevel = 'Active Citizen';
  if (user.points > 500) newLevel = 'Community Hero';
  else if (user.points > 300) newLevel = 'Community Inspiration';
  else if (user.points > 100) newLevel = 'Kindness Ambassador';

  if (newLevel !== user.level) {
    await queryRun(`UPDATE Users SET level = ? WHERE id = ?`, [newLevel, userId]);
    // Insert notification
    await queryRun(
      `INSERT INTO Notifications (userId, title, message, type) VALUES (?, ?, ?, ?)`,
      [userId, 'Thăng hạng thành công!', `Chúc mừng! Với tổng ${user.points} điểm việc tốt, bạn đã được thăng hạng lên danh hiệu "${newLevel}".`, 'award']
    );
  }
}

const register = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ họ tên, email và mật khẩu.' });
    }

    const existing = await queryGet(`SELECT id FROM Users WHERE email = ?`, [email]);
    if (existing) {
      return res.status(400).json({ message: 'Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.' });
    }

    const hashedPw = await bcrypt.hash(password, 10);
    // Public registration always creates a normal user account.
    // Admin rights must be granted later by an existing admin from the Admin Panel.
    const userRole = 'user';
    const avatar = `https://api.dicebear.com/8.x/thumbs/svg?seed=${encodeURIComponent(fullName)}`;

    const result = await queryRun(
      `INSERT INTO Users (fullName, email, password, avatar, points, level, role) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [fullName, email, hashedPw, avatar, 10, 'Active Citizen', userRole]
    );

    // Welcome notification
    await queryRun(
      `INSERT INTO Notifications (userId, title, message, type) VALUES (?, ?, ?, ?)`,
      [result.lastID, 'Chào mừng đến với KindnessMap', 'Cảm ơn bạn đã tham gia Bản Đồ Việc Tốt. Bạn được tặng +10 điểm công dân số khởi đầu!', 'success']
    );

    const user = {
      id: result.lastID,
      fullName,
      email,
      role: userRole,
      avatar,
      points: 10,
      level: 'Active Citizen'
    };

    const token = createAuthToken(user);

    res.status(201).json({
      message: 'Đăng ký tài khoản thành công!',
      token,
      user
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi đăng ký tài khoản.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng điền email và mật khẩu.' });
    }

    const user = await queryGet(`SELECT * FROM Users WHERE email = ?`, [email]);
    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
    }

    const token = createAuthToken(user);

    res.status(200).json({
      message: 'Đăng nhập thành công!',
      token,
      user: toPublicUser(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi đăng nhập.' });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: 'Thiếu mã xác thực Google.' });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(500).json({ message: 'Máy chủ chưa cấu hình GOOGLE_CLIENT_ID.' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const email = payload?.email;
    const emailVerified = payload?.email_verified;

    if (!email || !emailVerified) {
      return res.status(401).json({ message: 'Tài khoản Google chưa xác minh email.' });
    }

    const fullName = payload.name || email.split('@')[0];
    const avatar = payload.picture || `https://api.dicebear.com/8.x/thumbs/svg?seed=${encodeURIComponent(fullName)}`;

    let user = await queryGet(`SELECT * FROM Users WHERE email = ?`, [email]);

    if (!user) {
      // Mật khẩu ngẫu nhiên để thỏa schema hiện tại; người dùng đăng nhập bằng Google không cần biết mật khẩu này.
      const randomPasswordHash = await bcrypt.hash(`google:${payload.sub}:${Date.now()}`, 10);
      const result = await queryRun(
        `INSERT INTO Users (fullName, email, password, avatar, points, level, role) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [fullName, email, randomPasswordHash, avatar, 10, 'Active Citizen', 'user']
      );

      await queryRun(
        `INSERT INTO Notifications (userId, title, message, type) VALUES (?, ?, ?, ?)`,
        [result.lastID, 'Chào mừng đến với KindnessMap', 'Bạn đã đăng nhập bằng Google thành công và được tặng +10 điểm công dân số khởi đầu!', 'success']
      );

      user = {
        id: result.lastID,
        fullName,
        email,
        password: randomPasswordHash,
        avatar,
        points: 10,
        level: 'Active Citizen',
        role: 'user'
      };
    } else if (avatar && avatar !== user.avatar) {
      // Đồng bộ avatar Google mới nhất, giữ nguyên quyền/điểm/tên nếu tài khoản đã tồn tại.
      await queryRun(`UPDATE Users SET avatar = ? WHERE id = ?`, [avatar, user.id]);
      user.avatar = avatar;
    }

    const token = createAuthToken(user);

    res.status(200).json({
      message: 'Đăng nhập bằng Google thành công!',
      token,
      user: toPublicUser(user)
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ message: 'Không thể xác thực tài khoản Google. Vui lòng thử lại.' });
  }
};

const getMe = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const user = await queryGet(
      `SELECT id, fullName, email, avatar, points, level, role, createdAt FROM Users WHERE id = ?`,
      [req.user.id]
    );
    if (!user) return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });

    // Fetch user badges
    const badges = await queryAll(
      `SELECT b.id, b.name, b.description, b.icon, ub.awardedAt 
       FROM UserBadges ub 
       JOIN Badges b ON ub.badgeId = b.id 
       WHERE ub.userId = ?`,
      [req.user.id]
    );

    // Fetch user posts
    const posts = await queryAll(
      `SELECT * FROM Posts WHERE userId = ? ORDER BY createdAt DESC`,
      [req.user.id]
    );

    res.status(200).json({
      user,
      badges,
      posts
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Có lỗi khi lấy thông tin tài khoản.' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, avatar } = req.body;
    await queryRun(
      `UPDATE Users SET fullName = ?, avatar = ? WHERE id = ?`,
      [fullName, avatar, req.user.id]
    );
    
    // Sign a new token with updated payload
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, fullName, role: req.user.role, avatar },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(200).json({ message: 'Cập nhật hồ sơ thành công!', token });
  } catch (error) {
    console.error('UpdateProfile error:', error);
    res.status(500).json({ message: 'Có lỗi khi cập nhật hồ sơ.' });
  }
};

const passwordReset = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await queryGet(`SELECT id FROM Users WHERE email = ?`, [email]);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản với email này.' });
    }

    const hashedPw = await bcrypt.hash(newPassword, 10);
    await queryRun(`UPDATE Users SET password = ? WHERE id = ?`, [hashedPw, user.id]);

    await queryRun(
      `INSERT INTO Notifications (userId, title, message, type) VALUES (?, ?, ?, ?)`,
      [user.id, 'Đổi mật khẩu thành công', 'Mật khẩu của bạn đã được thiết lập lại thành công.', 'info']
    );

    res.status(200).json({ message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Có lỗi khi đặt lại mật khẩu.' });
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  getMe,
  updateProfile,
  passwordReset,
  checkAndUpdateLevel
};
