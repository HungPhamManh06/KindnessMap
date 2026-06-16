const { queryGet, queryRun, queryAll } = require('../config/db');

// AI Moderation Mockup keywords
const inappropriateKeywords = ['chửi', 'đánh', 'lừa đảo', 'giết', 'bạo lực', 'tệ nạn', 'spam', 'khốn', 'mẹ', 'fuck', 'hate'];

function performAIModeration(text) {
  const lower = text.toLowerCase();
  for (const kw of inappropriateKeywords) {
    if (lower.includes(kw)) {
      return { isClean: false, reason: `Phát hiện từ khóa nhạy cảm hoặc không phù hợp: "${kw}"` };
    }
  }
  return { isClean: true };
}

const createPost = async (req, res) => {
  try {
    const { title, description, category, imageUrl, latitude, longitude, locationName } = req.body;
    if (!title || !description || !category || !latitude || !longitude) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ tiêu đề, mô tả, danh mục và vị trí bản đồ.' });
    }

    // AI Moderation Check
    const modCheck = performAIModeration(`${title} ${description}`);
    let status = req.user.role === 'admin' ? 'Approved' : 'Pending';
    if (!modCheck.isClean) {
      status = 'Rejected';
    }

    const defaultImage = imageUrl || 'https://images.unsplash.com/photo-1593113598432-846f29edce7b?auto=format&fit=crop&w=800&q=80';

    const result = await queryRun(
      `INSERT INTO Posts (title, description, imageUrl, category, latitude, longitude, locationName, status, isFeatured, userId) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, defaultImage, category, latitude, longitude, locationName || 'Việt Nam', status, 0, req.user.id]
    );

    // If rejected by AI, notify user immediately
    if (status === 'Rejected') {
      await queryRun(
        `INSERT INTO Notifications (userId, title, message, type) VALUES (?, ?, ?, ?)`,
        [req.user.id, 'Bài viết bị hệ thống AI từ chối', `Bài viết "${title}" của bạn không qua được bộ lọc kiểm duyệt do: ${modCheck.reason}.`, 'warning']
      );
      return res.status(201).json({
        message: `Bài viết đã được gửi nhưng bị Hệ thống Kiểm duyệt AI tự động chuyển sang trạng thái Từ chối (${modCheck.reason}).`,
        post: { id: result.lastID, status: 'Rejected' }
      });
    } else if (status === 'Pending') {
      await queryRun(
        `INSERT INTO Notifications (userId, title, message, type) VALUES (?, ?, ?, ?)`,
        [req.user.id, 'Đã gửi câu chuyện việc tốt', `Câu chuyện "${title}" của bạn đang được Quản trị viên xem xét. Cảm ơn sự đóng góp của bạn!`, 'info']
      );
    }

    res.status(201).json({
      message: status === 'Approved' ? 'Đăng bài viết thành công!' : 'Đã gửi bài viết thành công! Đang chờ Quản trị viên phê duyệt.',
      post: { id: result.lastID, status }
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Có lỗi xảy ra khi tạo bài viết.' });
  }
};

const getPublicPosts = async (req, res) => {
  try {
    const { category, search, limit } = req.query;
    let sql = `
      SELECT p.*, u.fullName as authorName, u.avatar as authorAvatar,
        (SELECT COUNT(*) FROM Likes WHERE postId = p.id) as likesCount,
        (SELECT COUNT(*) FROM Comments WHERE postId = p.id) as commentsCount
      FROM Posts p
      JOIN Users u ON p.userId = u.id
      WHERE p.status = 'Approved'
    `;
    const params = [];

    if (category && category !== 'All' && category !== 'Tất cả') {
      sql += ` AND p.category = ?`;
      params.push(category);
    }

    if (search && search.trim() !== '') {
      sql += ` AND (p.title LIKE ? OR p.description LIKE ? OR p.locationName LIKE ?)`;
      const kw = `%${search.trim()}%`;
      params.push(kw, kw, kw);
    }

    sql += ` ORDER BY p.createdAt DESC`;
    if (limit) {
      sql += ` LIMIT ?`;
      params.push(parseInt(limit));
    }

    const posts = await queryAll(sql, params);
    res.status(200).json(posts);
  } catch (error) {
    console.error('Get public posts error:', error);
    res.status(500).json({ message: 'Có lỗi khi lấy danh sách bài viết.' });
  }
};

const getMapPosts = async (req, res) => {
  try {
    const posts = await queryAll(`
      SELECT p.id, p.title, p.description, p.category, p.latitude, p.longitude, p.locationName, p.imageUrl, u.fullName as authorName
      FROM Posts p
      JOIN Users u ON p.userId = u.id
      WHERE p.status = 'Approved'
    `);
    res.status(200).json(posts);
  } catch (error) {
    console.error('Get map posts error:', error);
    res.status(500).json({ message: 'Có lỗi khi lấy dữ liệu bản đồ.' });
  }
};

const getFeaturedStories = async (req, res) => {
  try {
    const stories = await queryAll(`
      SELECT p.*, u.fullName as authorName, u.avatar as authorAvatar,
        (SELECT COUNT(*) FROM Likes WHERE postId = p.id) as likesCount,
        (SELECT COUNT(*) FROM Comments WHERE postId = p.id) as commentsCount
      FROM Posts p
      JOIN Users u ON p.userId = u.id
      WHERE p.status = 'Approved' AND p.isFeatured = 1
      ORDER BY p.createdAt DESC LIMIT 6
    `);
    res.status(200).json(stories);
  } catch (error) {
    console.error('Get featured stories error:', error);
    res.status(500).json({ message: 'Có lỗi khi lấy danh sách câu chuyện nổi bật.' });
  }
};

const getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await queryGet(`
      SELECT p.*, u.fullName as authorName, u.avatar as authorAvatar,
        (SELECT COUNT(*) FROM Likes WHERE postId = p.id) as likesCount,
        (SELECT COUNT(*) FROM Comments WHERE postId = p.id) as commentsCount
      FROM Posts p
      JOIN Users u ON p.userId = u.id
      WHERE p.id = ?
    `, [id]);

    if (!post) return res.status(404).json({ message: 'Không tìm thấy câu chuyện này.' });

    // Check if current user liked
    let isLikedByMe = false;
    if (req.user) {
      const liked = await queryGet(`SELECT id FROM Likes WHERE userId = ? AND postId = ?`, [req.user.id, id]);
      if (liked) isLikedByMe = true;
    }

    // Get comments
    const comments = await queryAll(`
      SELECT c.*, u.fullName as authorName, u.avatar as authorAvatar
      FROM Comments c
      JOIN Users u ON c.userId = u.id
      WHERE c.postId = ?
      ORDER BY c.createdAt DESC
    `, [id]);

    res.status(200).json({ post, isLikedByMe, comments });
  } catch (error) {
    console.error('Get post by id error:', error);
    res.status(500).json({ message: 'Có lỗi khi chi tiết câu chuyện.' });
  }
};

const likePost = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await queryGet(`SELECT id FROM Likes WHERE userId = ? AND postId = ?`, [userId, id]);
    if (existing) {
      await queryRun(`DELETE FROM Likes WHERE id = ?`, [existing.id]);
      return res.status(200).json({ message: 'Bỏ thích thành công.', isLiked: false });
    } else {
      await queryRun(`INSERT INTO Likes (userId, postId) VALUES (?, ?)`, [userId, id]);
      return res.status(200).json({ message: 'Đã thích câu chuyện.', isLiked: true });
    }
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({ message: 'Có lỗi khi thực hiện thao tác thích.' });
  }
};

const commentPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Nội dung bình luận không được để trống.' });
    }

    const result = await queryRun(
      `INSERT INTO Comments (content, userId, postId) VALUES (?, ?, ?)`,
      [content, req.user.id, id]
    );

    // Notify post author if not their own
    const post = await queryGet(`SELECT userId, title FROM Posts WHERE id = ?`, [id]);
    if (post && post.userId !== req.user.id) {
      await queryRun(
        `INSERT INTO Notifications (userId, title, message, type) VALUES (?, ?, ?, ?)`,
        [post.userId, 'Bình luận mới', `${req.user.fullName} đã bình luận về bài viết "${post.title}" của bạn.`, 'info']
      );
    }

    const newComment = await queryGet(`
      SELECT c.*, u.fullName as authorName, u.avatar as authorAvatar
      FROM Comments c
      JOIN Users u ON c.userId = u.id
      WHERE c.id = ?
    `, [result.lastID]);

    res.status(201).json({ message: 'Bình luận thành công!', comment: newComment });
  } catch (error) {
    console.error('Comment post error:', error);
    res.status(500).json({ message: 'Có lỗi khi gửi bình luận.' });
  }
};

module.exports = {
  createPost,
  getPublicPosts,
  getMapPosts,
  getFeaturedStories,
  getPostById,
  likePost,
  commentPost
};
