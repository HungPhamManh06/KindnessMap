const rateLimit = require('express-rate-limit');

// ============================================================
// Rate Limiting Middleware – Chống brute force & DDoS cơ bản
// ============================================================

/**
 * Global rate limiter: 100 requests / 15 phút cho mọi route.
 * Đủ rộng cho browse thông thường, nhưng chặn bot spam.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100,
  standardHeaders: true,  // Gửi `RateLimit-*` headers
  legacyHeaders: false,   // Tắt `X-RateLimit-*` cũ
  message: {
    message: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.'
  },
});

/**
 * Auth rate limiter: 15 requests / 15 phút.
 * Áp dụng cho login, register, forgot-password, reset-password.
 * Chống brute force mật khẩu và spam OTP.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Quá nhiều lần thử đăng nhập/đăng ký. Vui lòng đợi 15 phút rồi thử lại.'
  },
});

/**
 * API mutation limiter: 60 requests / 15 phút.
 * Áp dụng cho các thao tác tạo/sửa dữ liệu (post, comment, like, upload).
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Bạn đã thực hiện quá nhiều thao tác. Vui lòng thử lại sau.'
  },
});

module.exports = {
  globalLimiter,
  authLimiter,
  apiLimiter,
};
