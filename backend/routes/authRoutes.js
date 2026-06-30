const express = require('express');
const { register, login, googleLogin, getMe, updateProfile, passwordReset } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.post('/reset-password', passwordReset);

module.exports = router;
