const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { queryGet, queryRun, queryAll } = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const { isMailerConfigured, sendPasswordResetEmail } = require('../utils/mailer');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
if (!GOOGLE_CLIENT_ID) {
  console.warn('⚠️  GOOGLE_CLIENT_ID chưa được cấu hình trong .env. Đăng nhập Google sẽ không hoạt động.');
}
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '';
if (!FACEBOOK_APP_ID) {
  console.warn('⚠️  FACEBOOK_APP_ID chưa được cấu hình trong .env. Đăng nhập Facebook sẽ không hoạt động.');
}

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

// Chuẩn hoá email: bỏ khoảng trắng + viết thường để "Abc@x.com" và "abc@x.com" là một tài khoản
const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const MIN_PASSWORD_LENGTH = 6;

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
    const { fullName, password } = req.body;
    const email = normalizeEmail(req.body.email);
    const trimmedName = String(fullName || '').trim();

    if (!trimmedName || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ họ tên, email và mật khẩu.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Địa chỉ email không hợp lệ. Vui lòng kiểm tra lại.' });
    }
    if (String(password).length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ message: `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.` });
    }

    const existing = await queryGet(`SELECT id FROM Users WHERE LOWER(email) = ?`, [email]);
    if (existing) {
      return res.status(400).json({ message: 'Email này đã được đăng ký. Vui lòng sử dụng email khác hoặc đăng nhập.' });
    }

    const hashedPw = await bcrypt.hash(password, 10);
    // Public registration always creates a normal user account.
    // Admin rights must be granted later by an existing admin from the Admin Panel.
    const userRole = 'user';
    const avatar = `https://api.dicebear.com/8.x/thumbs/svg?seed=${encodeURIComponent(trimmedName)}`;

    const result = await queryRun(
      `INSERT INTO Users (fullName, email, password, avatar, points, level, role) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [trimmedName, email, hashedPw, avatar, 10, 'Active Citizen', userRole]
    );

    // Welcome notification
    await queryRun(
      `INSERT INTO Notifications (userId, title, message, type) VALUES (?, ?, ?, ?)`,
      [result.lastID, 'Chào mừng đến với KindnessMap', 'Cảm ơn bạn đã tham gia Bản Đồ Việc Tốt. Bạn được tặng +10 điểm công dân số khởi đầu!', 'success']
    );

    const user = {
      id: result.lastID,
      fullName: trimmedName,
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
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);
    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng điền email và mật khẩu.' });
    }

    const user = await queryGet(`SELECT * FROM Users WHERE LOWER(email) = ?`, [email]);
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

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const email = normalizeEmail(payload?.email);
    const emailVerified = payload?.email_verified;

    if (!email || !emailVerified) {
      return res.status(401).json({ message: 'Tài khoản Google chưa xác minh email.' });
    }

    const fullName = payload.name || email.split('@')[0];
    const avatar = payload.picture || `https://api.dicebear.com/8.x/thumbs/svg?seed=${encodeURIComponent(fullName)}`;

    let user = await queryGet(`SELECT * FROM Users WHERE LOWER(email) = ?`, [email]);

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
    } else {
      // Đồng bộ avatar và tên từ Google mới nhất (giữ nguyên quyền/điểm)
      const updates = [];
      const params = [];
      if (avatar && avatar !== user.avatar) {
        updates.push('avatar = ?');
        params.push(avatar);
        user.avatar = avatar;
      }
      if (fullName && fullName !== user.fullName) {
        updates.push('fullName = ?');
        params.push(fullName);
        user.fullName = fullName;
      }
      if (updates.length > 0) {
        params.push(user.id);
        await queryRun(`UPDATE Users SET ${updates.join(', ')} WHERE id = ?`, params);
      }
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
    let { fullName, avatar } = req.body;

    // Validate fullName: must be a non-empty string
    if (fullName !== undefined) {
      fullName = String(fullName).trim();
      if (!fullName) {
        return res.status(400).json({ message: 'Họ tên không được để trống.' });
      }
      if (fullName.length > 100) {
        return res.status(400).json({ message: 'Họ tên không được quá 100 ký tự.' });
      }
    } else {
      fullName = req.user.fullName;
    }

    // Validate avatar: must be a valid URL or empty
    if (avatar !== undefined && avatar !== null) {
      avatar = String(avatar).trim();
      if (avatar && !/^https?:\/\//i.test(avatar) && !avatar.startsWith('data:image/')) {
        return res.status(400).json({ message: 'Avatar phải là đường dẫn URL hợp lệ hoặc dữ liệu ảnh.' });
      }
    } else {
      avatar = req.user.avatar || '';
    }

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

// ==========================================================================
// ĐẶT LẠI MẬT KHẨU AN TOÀN (2 BƯỚC VỚI MÃ OTP GỬI QUA EMAIL)
// Bước 1: POST /auth/forgot-password  { email }              -> gửi mã 6 số
// Bước 2: POST /auth/reset-password   { email, code, newPassword } -> đổi mật khẩu
// ==========================================================================

const OTP_EXPIRES_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;          // số lần nhập sai tối đa cho 1 mã
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // chờ 60s giữa 2 lần gửi mã

// Lưu OTP trong bộ nhớ: Map<email, { codeHash, expiresAt, attempts, lastSentAt }>
// (Đủ dùng cho 1 tiến trình server; nếu sau này chạy nhiều instance thì chuyển sang bảng DB/Redis.)
const resetOtpStore = new Map();

const hashOtp = (code) => crypto.createHash('sha256').update(String(code)).digest('hex');

// Dọn các mã hết hạn để Map không phình to
const cleanupExpiredOtps = () => {
  const now = Date.now();
  for (const [key, entry] of resetOtpStore) {
    if (entry.expiresAt < now) resetOtpStore.delete(key);
  }
};

const forgotPassword = async (req, res) => {
  try {
    cleanupExpiredOtps();

    const email = normalizeEmail(req.body.email);
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: 'Vui lòng nhập địa chỉ email hợp lệ.' });
    }

    // Chống spam gửi mã liên tục
    const existing = resetOtpStore.get(email);
    if (existing && Date.now() - existing.lastSentAt < OTP_RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil((OTP_RESEND_COOLDOWN_MS - (Date.now() - existing.lastSentAt)) / 1000);
      return res.status(429).json({ message: `Bạn vừa yêu cầu mã. Vui lòng chờ ${waitSec} giây rồi thử lại.` });
    }

    const user = await queryGet(`SELECT id, fullName FROM Users WHERE LOWER(email) = ?`, [email]);

    // Luôn trả về thông điệp giống nhau dù email có tồn tại hay không,
    // để tránh kẻ xấu dò xem email nào đã đăng ký (user enumeration).
    const genericMessage = `Nếu email này đã đăng ký, mã xác nhận gồm 6 chữ số đã được gửi tới hộp thư của bạn (hiệu lực ${OTP_EXPIRES_MINUTES} phút).`;
    // Cờ devMode phải đồng nhất kể cả khi email không tồn tại,
    // để response không tiết lộ email nào đã đăng ký (chống user enumeration).
    const devMode = !isMailerConfigured();
    const genericResponse = devMode ? { message: genericMessage, devMode: true } : { message: genericMessage };

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // Sinh mã 6 số bảo mật (crypto), lưu dạng hash
    const code = crypto.randomInt(100000, 1000000).toString();
    resetOtpStore.set(email, {
      codeHash: hashOtp(code),
      expiresAt: Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000,
      attempts: 0,
      lastSentAt: Date.now()
    });

    if (isMailerConfigured()) {
      await sendPasswordResetEmail(email, user.fullName, code, OTP_EXPIRES_MINUTES);
      return res.status(200).json(genericResponse);
    }

    // ===== CHẾ ĐỘ DEV (chưa cấu hình SMTP) =====
    // In mã ra console server để lập trình viên test được luồng đầy đủ.
    console.log('==============================================');
    console.log(`🔐 [DEV] Mã đặt lại mật khẩu cho ${email}: ${code}`);
    console.log('   (Cấu hình SMTP_HOST/SMTP_USER/SMTP_PASS để gửi email thật)');
    console.log('==============================================');

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Có lỗi khi gửi mã xác nhận. Vui lòng thử lại.' });
  }
};

const passwordReset = async (req, res) => {
  try {
    cleanupExpiredOtps();

    const { newPassword } = req.body;
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code || '').trim();

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng điền email, mã xác nhận và mật khẩu mới.' });
    }
    if (String(newPassword).length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ message: `Mật khẩu mới phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.` });
    }

    const entry = resetOtpStore.get(email);
    if (!entry || entry.expiresAt < Date.now()) {
      resetOtpStore.delete(email);
      return res.status(400).json({ message: 'Mã xác nhận không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu mã mới.' });
    }

    if (entry.attempts >= OTP_MAX_ATTEMPTS) {
      resetOtpStore.delete(email);
      return res.status(429).json({ message: 'Bạn đã nhập sai mã quá nhiều lần. Vui lòng yêu cầu mã mới.' });
    }

    if (hashOtp(code) !== entry.codeHash) {
      entry.attempts += 1;
      const remaining = OTP_MAX_ATTEMPTS - entry.attempts;
      if (remaining <= 0) {
        resetOtpStore.delete(email);
        return res.status(429).json({ message: 'Bạn đã nhập sai mã quá nhiều lần. Vui lòng yêu cầu mã mới.' });
      }
      return res.status(400).json({ message: `Mã xác nhận không đúng. Bạn còn ${remaining} lần thử.` });
    }

    const user = await queryGet(`SELECT id FROM Users WHERE LOWER(email) = ?`, [email]);
    if (!user) {
      resetOtpStore.delete(email);
      return res.status(404).json({ message: 'Không tìm thấy tài khoản với email này.' });
    }

    const hashedPw = await bcrypt.hash(newPassword, 10);
    await queryRun(`UPDATE Users SET password = ? WHERE id = ?`, [hashedPw, user.id]);

    // Mã dùng một lần: xoá ngay sau khi đổi mật khẩu thành công
    resetOtpStore.delete(email);

    await queryRun(
      `INSERT INTO Notifications (userId, title, message, type) VALUES (?, ?, ?, ?)`,
      [user.id, 'Đổi mật khẩu thành công', 'Mật khẩu của bạn đã được thiết lập lại thành công qua mã xác nhận email.', 'info']
    );

    res.status(200).json({ message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Có lỗi khi đặt lại mật khẩu.' });
  }
};

// ==========================================================================
// ĐĂNG NHẬP FACEBOOK — Server-side OAuth Redirect Flow
// Bước 1: GET /auth/facebook         -> chuyển hướng sang Facebook
// Bước 2: GET /auth/facebook/callback <- Facebook gọi lại, xử lý, redirect về frontend
// ==========================================================================

// Lưu CSRF state cho OAuth Facebook (in-memory, tương tự resetOtpStore)
const facebookOAuthState = new Map();

const cleanupExpiredFacebookState = () => {
  const now = Date.now();
  for (const [key, entry] of facebookOAuthState) {
    if (entry.expiresAt < now) facebookOAuthState.delete(key);
  }
};

// Bước 1: Chuyển hướng người dùng đến Facebook OAuth dialog
const facebookRedirect = async (req, res) => {
  try {
    cleanupExpiredFacebookState();

    const appSecret = process.env.FACEBOOK_APP_SECRET;
    if (!appSecret) {
      return res.status(500).json({ message: 'Máy chủ chưa cấu hình FACEBOOK_APP_SECRET. Vui lòng thêm vào biến môi trường.' });
    }

    // Sinh CSRF state để防止 tấn công CSRF
    const state = crypto.randomBytes(16).toString('hex');
    const frontendUrl = req.query.redirect || 'http://localhost:3000';

    facebookOAuthState.set(state, {
      frontendUrl,
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 phút
    });

    // Xác định callback URL (chính là request này)
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/facebook/callback`;

    // Tạo URL Facebook OAuth
    const facebookAuthUrl = [
      'https://www.facebook.com/v22.0/dialog/oauth',
      `?client_id=${encodeURIComponent(FACEBOOK_APP_ID)}`,
      `&redirect_uri=${encodeURIComponent(redirectUri)}`,
      `&state=${encodeURIComponent(state)}`,
      '&scope=email,public_profile',
      '&response_type=code'
    ].join('');

    console.log(`🔄 [Facebook OAuth] Redirecting user to Facebook...`);
    res.redirect(facebookAuthUrl);
  } catch (error) {
    console.error('Facebook redirect error:', error);
    res.redirect(`${req.query.redirect || 'http://localhost:3000'}?error=facebook_redirect_error`);
  }
};

// Bước 2: Xử lý callback từ Facebook
const facebookCallback = async (req, res) => {
  try {
    cleanupExpiredFacebookState();

    const { code, state, error: fbError } = req.query;

    // Mặc định chuyển hướng về frontend (lấy từ state đã lưu hoặc mặc định)
    const storedState = state ? facebookOAuthState.get(state) : null;
    const frontendUrl = storedState?.frontendUrl || 'http://localhost:3000';

    // Xoá state ngay sau khi dùng (dùng 1 lần)
    if (state) facebookOAuthState.delete(state);

    // Kiểm tra lỗi từ Facebook
    if (fbError) {
      console.log(`⚠️ [Facebook OAuth] User denied or error: ${fbError}`);
      return res.redirect(`${frontendUrl}?error=${fbError}`);
    }

    // Kiểm tra state (CSRF)
    if (!state || !storedState) {
      console.log('⚠️ [Facebook OAuth] Invalid or expired state');
      return res.redirect(`${frontendUrl}?error=invalid_state`);
    }

    if (storedState.expiresAt < Date.now()) {
      console.log('⚠️ [Facebook OAuth] State expired');
      return res.redirect(`${frontendUrl}?error=expired_state`);
    }

    if (!code) {
      console.log('⚠️ [Facebook OAuth] Missing authorization code');
      return res.redirect(`${frontendUrl}?error=missing_code`);
    }

    const appSecret = process.env.FACEBOOK_APP_SECRET;
    if (!appSecret) {
      return res.redirect(`${frontendUrl}?error=server_not_configured`);
    }

    // Bước A: Đổi code lấy access token
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/facebook/callback`;
    const tokenUrl = [
      'https://graph.facebook.com/v22.0/oauth/access_token',
      `?client_id=${encodeURIComponent(FACEBOOK_APP_ID)}`,
      `&redirect_uri=${encodeURIComponent(redirectUri)}`,
      `&client_secret=${encodeURIComponent(appSecret)}`,
      `&code=${encodeURIComponent(code)}`
    ].join('');

    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error('❌ [Facebook OAuth] Token exchange error:', tokenData.error);
      return res.redirect(`${frontendUrl}?error=token_exchange_failed`);
    }

    const accessToken = tokenData.access_token;

    // Bước B: Lấy thông tin người dùng
    const fields = 'id,name,email,picture';
    const userUrl = `https://graph.facebook.com/v22.0/me?fields=${encodeURIComponent(fields)}&access_token=${encodeURIComponent(accessToken)}`;

    const userRes = await fetch(userUrl);
    const fbUser = await userRes.json();

    if (fbUser.error) {
      console.error('❌ [Facebook OAuth] Get user info error:', fbUser.error);
      return res.redirect(`${frontendUrl}?error=user_info_failed`);
    }

    const facebookId = fbUser.id;
    const fullName = fbUser.name || `Facebook User ${facebookId}`;
    const email = fbUser.email ? normalizeEmail(fbUser.email) : `fb_${facebookId}@facebook.kindnessmap.vn`;
    const avatar = fbUser.picture?.data?.url || `https://api.dicebear.com/8.x/thumbs/svg?seed=${encodeURIComponent(fullName)}`;

    // Bước C: Tìm hoặc tạo user trong DB
    let user = await queryGet(`SELECT * FROM Users WHERE LOWER(email) = ?`, [email]);

    if (!user) {
      const randomPasswordHash = await bcrypt.hash(`facebook:${facebookId}:${Date.now()}`, 10);
      const result = await queryRun(
        `INSERT INTO Users (fullName, email, password, avatar, points, level, role) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [fullName, email, randomPasswordHash, avatar, 10, 'Active Citizen', 'user']
      );

      await queryRun(
        `INSERT INTO Notifications (userId, title, message, type) VALUES (?, ?, ?, ?)`,
        [result.lastID, 'Chào mừng đến với KindnessMap', 'Bạn đã đăng nhập bằng Facebook thành công và được tặng +10 điểm công dân số khởi đầu!', 'success']
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
    } else {
      // Đồng bộ avatar và tên từ Facebook mới nhất
      const updates = [];
      const params = [];
      if (avatar && avatar !== user.avatar) {
        updates.push('avatar = ?');
        params.push(avatar);
        user.avatar = avatar;
      }
      if (fullName && fullName !== user.fullName) {
        updates.push('fullName = ?');
        params.push(fullName);
        user.fullName = fullName;
      }
      if (updates.length > 0) {
        params.push(user.id);
        await queryRun(`UPDATE Users SET ${updates.join(', ')} WHERE id = ?`, params);
      }
    }

    const token = createAuthToken(user);
    const userData = toPublicUser(user);

    // Bước D: Chuyển hướng về frontend kèm token và thông tin user
    const redirectUrl = `${frontendUrl}?token=${encodeURIComponent(token)}&user=${encodeURIComponent(JSON.stringify(userData))}`;
    console.log(`✅ [Facebook OAuth] User ${email} logged in successfully. Redirecting to frontend...`);
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('❌ [Facebook OAuth] Callback error:', error);
    // Cố gắng lấy frontendUrl từ state (nếu còn) hoặc query param redirect, fallback về localhost
    const fallbackState = req.query?.state ? facebookOAuthState.get(req.query.state) : null;
    const fbFrontendUrl = fallbackState?.frontendUrl || req.query?.redirect || 'http://localhost:3000';
    res.redirect(`${fbFrontendUrl}?error=server_error`);
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  facebookRedirect,
  facebookCallback,
  getMe,
  updateProfile,
  forgotPassword,
  passwordReset,
  checkAndUpdateLevel
};
