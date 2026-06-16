const express = require('express');
const { createPost, getPublicPosts, getMapPosts, getFeaturedStories, getPostById, likePost, commentPost } = require('../controllers/postController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', authenticate, createPost);
router.get('/', getPublicPosts);
router.get('/map', getMapPosts);
router.get('/featured', getFeaturedStories);
router.get('/:id', getPostById);
router.post('/:id/like', authenticate, likePost);
router.post('/:id/comment', authenticate, commentPost);

module.exports = router;
