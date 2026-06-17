const express = require('express');
const {
  getProfile,
  updateProfile,
  createSupportRequest,
  listSupportRequests,
  getSupportRequestMatches,
  getRecommendations,
} = require('../controllers/matchingController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/recommendations', authenticate, getRecommendations);
router.get('/requests', authenticate, listSupportRequests);
router.post('/requests', authenticate, createSupportRequest);
router.get('/requests/:id/matches', authenticate, getSupportRequestMatches);

module.exports = router;
