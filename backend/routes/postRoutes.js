const express = require('express');
const multer = require('multer');
const { uploadPostImage, createPost, getPublicPosts, getMapPosts, getFeaturedStories, getPublicStats, proxyImage, getPostById, likePost, commentPost } = require('../controllers/postController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.post('/upload-image', authenticate, upload.single('image'), uploadPostImage);
router.post('/', authenticate, createPost);
router.get('/', getPublicPosts);
router.get('/map', getMapPosts);
router.get('/featured', getFeaturedStories);
router.get('/stats', getPublicStats);
router.get('/image-proxy', proxyImage);
router.get('/:id', getPostById);
router.post('/:id/like', authenticate, likePost);
router.post('/:id/comment', authenticate, commentPost);

module.exports = router;
