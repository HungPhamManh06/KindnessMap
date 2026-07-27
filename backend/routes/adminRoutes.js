const express = require('express');
const { getAllPosts, moderatePost, getAllUsers, updateUserRole, getAdminAwards, createAward, deleteAward, getAnalytics } = require('../controllers/adminController');
const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply protect middleware
router.use(authenticate, authorizeAdmin);

router.get('/posts', getAllPosts);
router.put('/posts/:id/moderate', moderatePost);
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.get('/awards', getAdminAwards);
router.post('/awards', createAward);
router.delete('/awards/:id', deleteAward);
router.get('/analytics', getAnalytics);

module.exports = router;
