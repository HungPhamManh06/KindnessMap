const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');

// Load env
dotenv.config();

const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const adminRoutes = require('./routes/adminRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const awardRoutes = require('./routes/awardRoutes');
const matchingRoutes = require('./routes/matchingRoutes');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: '*', // allow any origin in development
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve uploads or static mock images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/awards', awardRoutes);
app.use('/api/matching', matchingRoutes);

// Health check and simulation endpoints
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'KindnessMap Backend API is running successfully.', timestamp: new Date().toISOString() });
});

// Config endpoint to fetch map API key (securely served from backend env)
app.get('/api/config/map', (req, res) => {
  const key = process.env.MAPTILER_API_KEY || '';
  res.status(200).json({
    maptilerApiKey: key,
    // === DEBUG INFO (temporary - remove after fix is confirmed) ===
    _debug: {
      envExists: key.length > 0,
      envLength: key.length,
      envPrefix: key.length >= 3 ? key.substring(0, 3) : '---',
      runtime: process.env.NODE_ENV || 'unknown',
      serverNote: 'This response is served by the Express backend on Render.com'
    }
  });
});

// Simulation of real-time incoming good deeds
app.get('/api/stream/live-deeds', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial ping
  res.write(`data: ${JSON.stringify({ type: 'ping', time: new Date().toLocaleTimeString() })}\n\n`);

  const sampleDeeds = [
    { title: 'Một bạn sinh viên giúp cụ già qua đường ở Ngã Tư Sở', category: 'Người cao tuổi', location: 'Đống Đa, Hà Nội', author: 'Nguyễn Tuấn' },
    { title: 'Tặng 20 lốc sữa cho trẻ em Viện Huyết học', category: 'Giáo dục', location: 'Cầu Giấy, Hà Nội', author: 'Hà Linh' },
    { title: 'Nhóm bạn dọn sạch công viên Tao Đàn', category: 'Môi trường', location: 'Quận 1, TP. HCM', author: 'Lê Minh' },
    { title: 'Hiến máu cứu người tại Bệnh viện Chợ Rẫy', category: 'Hiến máu', location: 'Quận 5, TP. HCM', author: 'Quốc Bảo' }
  ];

  const interval = setInterval(() => {
    const randomDeed = sampleDeeds[Math.floor(Math.random() * sampleDeeds.length)];
    res.write(`data: ${JSON.stringify({ type: 'new_deed', deed: { ...randomDeed, time: new Date().toLocaleTimeString() } })}\n\n`);
  }, 12000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ message: 'Lỗi hệ thống máy chủ nội bộ.', error: err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`✨ KindnessMap Backend API is running on port ${PORT}`);
  console.log(`🔗 Access API at http://localhost:${PORT}/api/health`);
  console.log(`=========================================`);
});
