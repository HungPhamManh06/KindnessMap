const express = require('express');
const { getUserNotifications, markAsRead } = require('../controllers/notificationController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.get('/', getUserNotifications);
router.put('/:id/read', markAsRead);

module.exports = router;
