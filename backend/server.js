const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { queryAll } = require('./config/db');
const { globalLimiter, authLimiter, apiLimiter } = require('./middleware/rateLimiter');

// Load env
dotenv.config();

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const adminRoutes = require('./routes/adminRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const awardRoutes = require('./routes/awardRoutes');
const matchingRoutes = require('./routes/matchingRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');

const app = express();
const server = http.createServer(app);

// ============================================================
// CORS – Chỉ cho phép các domain đáng tin cậy
// ============================================================
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Cho phép requests không có origin (mobile apps, Postman, curl, SSE)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} không được phép truy cập API.`), false);
  },
  credentials: true
}));

// ============================================================
// Security Headers
// ============================================================
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// ============================================================
// Global Rate Limiter (100 req / 15 phút)
// ============================================================
app.use(globalLimiter);

// ============================================================
// Body Parser – Giới hạn 5MB (upload ảnh đã dùng multer riêng)
// ============================================================
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

// Serve uploads or static mock images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/posts', apiLimiter, postRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/awards', awardRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/chatbot', apiLimiter, chatbotRoutes);
// apiLimiter is applied per-segment inside matching routes for mutation endpoints

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'KindnessMap Backend API is running successfully.', timestamp: new Date().toISOString() });
});

// Config endpoint to fetch map API key (securely served from backend env)
app.get('/api/config/map', (req, res) => {
  const key = process.env.MAPTILER_API_KEY || '';
  res.status(200).json({
    maptilerApiKey: key,
  });
});

// Simulation of real-time incoming good deeds (SSE)
const SSE_MAX_DURATION_MS = 5 * 60 * 1000; // 5 phút timeout

app.get('/api/stream/live-deeds', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'ping', time: new Date().toLocaleTimeString() })}\n\n`);

  const sendRandomRealDeed = async () => {
    try {
      const deeds = await queryAll(`
        SELECT p.id, p.title, p.category, p.locationName as location, u.fullName as author
        FROM Posts p
        JOIN Users u ON p.userId = u.id
        WHERE p.status = 'Approved'
        ORDER BY p.createdAt DESC
        LIMIT 80
      `);

      if (!deeds.length) return;

      const randomDeed = deeds[Math.floor(Math.random() * deeds.length)];
      res.write(`data: ${JSON.stringify({
        type: 'new_deed',
        deed: { ...randomDeed, time: new Date().toLocaleTimeString('vi-VN') }
      })}\n\n`);
    } catch (error) {
      console.error('Live deeds stream error:', error.message);
    }
  };

  sendRandomRealDeed();
  const interval = setInterval(sendRandomRealDeed, 12000);

  // Tự động đóng connection sau 5 phút để tránh resource leak
  const maxDurationTimeout = setTimeout(() => {
    res.write(`data: ${JSON.stringify({ type: 'timeout', message: 'Connection timed out. Please reconnect.' })}\n\n`);
    res.end();
  }, SSE_MAX_DURATION_MS);

  req.on('close', () => {
    clearInterval(interval);
    clearTimeout(maxDurationTimeout);
  });
});

// ============================================================
// Error Handler – KHÔNG lộ chi tiết lỗi nội bộ ra client
// ============================================================
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({
    message: 'Lỗi hệ thống máy chủ nội bộ.',
    ...(isProduction ? {} : { error: err.message })
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`✨ KindnessMap Backend API is running on port ${PORT}`);
  console.log(`🔗 Access API at http://localhost:${PORT}/api/health`);
  console.log(`=========================================`);
});

