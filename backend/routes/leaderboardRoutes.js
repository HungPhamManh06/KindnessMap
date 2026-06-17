const express = require('express');
const { getRankings } = require('../controllers/leaderboardController');

const router = express.Router();

router.get('/', getRankings);

module.exports = router;
