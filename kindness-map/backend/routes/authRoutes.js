const express = require('express');
const { register, login, getMe, updateProfile, passwordReset } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.post('/reset-password', passwordReset);

module.exports = router;
