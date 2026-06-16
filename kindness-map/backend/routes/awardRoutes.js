const express = require('express');
const { getMonthlyAwards } = require('../controllers/awardController');

const router = express.Router();

router.get('/', getMonthlyAwards);

module.exports = router;
