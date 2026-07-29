const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// ============================================================
// JWT Secret – KHÔNG dùng fallback hardcoded trong production
// ============================================================
let JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    console.error('❌ FATAL: Biến môi trường JWT_SECRET chưa được cấu hình! Server không thể khởi động an toàn trong production.');
    process.exit(1);
  }
  // Dev mode: tự sinh secret ngẫu nhiên mỗi lần restart (token cũ sẽ invalid – chấp nhận được khi dev)
  JWT_SECRET = crypto.randomBytes(32).toString('hex');
  console.warn('⚠️  [DEV] JWT_SECRET chưa được cấu hình. Đang dùng secret ngẫu nhiên tạm thời.');
  console.warn('   → Thiết lập JWT_SECRET trong backend/.env để token không bị mất khi restart server.');
}

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Vui lòng đăng nhập để thực hiện chức năng này.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Phiên đăng nhập hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.' });
  }
};

const authorizeAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Quyền truy cập bị từ chối. Chỉ dành cho Quản trị viên (Admin).' });
  }
  next();
};

module.exports = {
  authenticate,
  authorizeAdmin,
  JWT_SECRET
};
