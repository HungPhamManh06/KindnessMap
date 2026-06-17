const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'kindness_map_super_secret_jwt_2026';

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
