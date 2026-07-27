const express = require('express');
const { register, login, googleLogin, getMe, updateProfile, forgotPassword, passwordReset, facebookRedirect, facebookCallback } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/facebook', facebookRedirect);
router.get('/facebook/callback', facebookCallback);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', passwordReset);

module.exports = router;
