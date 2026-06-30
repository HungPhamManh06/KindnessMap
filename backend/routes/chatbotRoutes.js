const express = require('express');
const { chatWithGemini } = require('../controllers/chatbotController');

const router = express.Router();

router.post('/', chatWithGemini);

module.exports = router;
