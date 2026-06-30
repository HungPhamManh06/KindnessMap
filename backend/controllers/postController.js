const { queryGet, queryRun, queryAll } = require('../config/db');

const FALLBACK_IMAGE_URL = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%201200%20700%27%3E%3Cdefs%3E%3ClinearGradient%20id%3D%27g%27%20x1%3D%270%27%20x2%3D%271%27%20y1%3D%270%27%20y2%3D%271%27%3E%3Cstop%20stop-color%3D%27%2310b981%27%2F%3E%3Cstop%20offset%3D%270.55%27%20stop-color%3D%27%230f766e%27%2F%3E%3Cstop%20offset%3D%271%27%20stop-color%3D%27%230f172a%27%2F%3E%3C%2FlinearGradient%3E%3CradialGradient%20id%3D%27r%27%20cx%3D%2750%25%27%20cy%3D%2735%25%27%20r%3D%2760%25%27%3E%3Cstop%20stop-color%3D%27%23ffffff%27%20stop-opacity%3D%270.22%27%2F%3E%3Cstop%20offset%3D%271%27%20stop-color%3D%27%23ffffff%27%20stop-opacity%3D%270%27%2F%3E%3C%2FradialGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%271200%27%20height%3D%27700%27%20fill%3D%27url(%23g)%27%2F%3E%3Crect%20width%3D%271200%27%20height%3D%27700%27%20fill%3D%27url(%23r)%27%2F%3E%3Cg%20fill%3D%27none%27%20stroke%3D%27%23ffffff%27%20stroke-width%3D%2718%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%20opacity%3D%270.92%27%20transform%3D%27translate(510%20225)%20scale(3.3)%27%3E%3Cpath%20d%3D%27M20.8%204.6a5.5%205.5%200%200%200-7.8%200L12%205.7l-1-1.1a5.5%205.5%200%200%200-7.8%207.8l1%201L12%2021l7.8-7.6%201-1a5.5%205.5%200%200%200%200-7.8z%27%2F%3E%3Cpath%20d%3D%27M12%205.7l-2.6%202.6a2%202%200%200%200%200%202.8l.2.2a2%202%200%200%200%202.8%200L14%209.8%27%2F%3E%3C%2Fg%3E%3Ctext%20x%3D%27600%27%20y%3D%27525%27%20text-anchor%3D%27middle%27%20font-family%3D%27Inter%2CArial%2Csans-serif%27%20font-size%3D%2756%27%20font-weight%3D%27800%27%20fill%3D%27%23ffffff%27%3EKindnessMap%3C%2Ftext%3E%3Ctext%20x%3D%27600%27%20y%3D%27590%27%20text-anchor%3D%27middle%27%20font-family%3D%27Inter%2CArial%2Csans-serif%27%20font-size%3D%2728%27%20font-weight%3D%27600%27%20fill%3D%27%23d1fae5%27%3EB%E1%BA%A3n%20%C4%90%E1%BB%93%20Vi%E1%BB%87c%20T%E1%BB%91t%3C%2Ftext%3E%3C%2Fsvg%3E';

const normalizeImageUrl = (url) => {
  const raw = String(url || '').trim();
  if (!raw) return FALLBACK_IMAGE_URL;
  if (raw.startsWith('data:image/')) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('/uploads/')) return raw;
  return FALLBACK_IMAGE_URL;
};

const normalizePostImages = (posts) => posts.map((post) => ({
  ...post,
  imageUrl: normalizeImageUrl(post.imageUrl),
  authorAvatar: normalizeImageUrl(post.authorAvatar),
}));

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
    res.status(200).json(normalizePostImages(posts));
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
    res.status(200).json(posts.map((post) => ({ ...post, imageUrl: normalizeImageUrl(post.imageUrl) })));
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
    res.status(200).json(normalizePostImages(stories));
  } catch (error) {
    console.error('Get featured stories error:', error);
    res.status(500).json({ message: 'Có lỗi khi lấy danh sách câu chuyện nổi bật.' });
  }
};

const normalizeCoveredArea = (locationName = '') => {
  const raw = String(locationName || '').trim();
  if (!raw) return null;

  const parts = raw.split(',').map((part) => part.trim()).filter(Boolean);
  const candidate = parts.length > 1 ? parts[parts.length - 1] : parts[0];
  const normalized = candidate
    .replace(/^TP\.?\s*/i, '')
    .replace(/^Thành phố\s+/i, '')
    .replace(/^Tỉnh\s+/i, '')
    .trim();

  return normalized || raw;
};

const getPublicStats = async (req, res) => {
  try {
    const [approvedPosts, activeUsers, totalPoints, locations] = await Promise.all([
      queryGet(`SELECT COUNT(*) as cnt FROM Posts WHERE status = 'Approved'`),
      queryGet(`SELECT COUNT(*) as cnt FROM Users WHERE role IN ('user', 'admin')`),
      queryGet(`SELECT COALESCE(SUM(points), 0) as total FROM Users WHERE role IN ('user', 'admin')`),
      queryAll(`SELECT locationName FROM Posts WHERE status = 'Approved' AND locationName IS NOT NULL`),
    ]);

    const coveredAreas = new Set(
      locations
        .map((row) => normalizeCoveredArea(row.locationName))
        .filter(Boolean)
        .map((area) => area.toLocaleLowerCase('vi-VN'))
    );

    res.status(200).json({
      pinnedGoodDeeds: Number(approvedPosts?.cnt || 0),
      activeCitizens: Number(activeUsers?.cnt || 0),
      kindnessPoints: Number(totalPoints?.total || 0),
      coveredCities: coveredAreas.size,
    });
  } catch (error) {
    console.error('Get public stats error:', error);
    res.status(500).json({ message: 'Có lỗi khi lấy số liệu tổng quan.' });
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

    res.status(200).json({
      post: { ...post, imageUrl: normalizeImageUrl(post.imageUrl), authorAvatar: normalizeImageUrl(post.authorAvatar) },
      isLikedByMe,
      comments: comments.map((comment) => ({ ...comment, authorAvatar: normalizeImageUrl(comment.authorAvatar) }))
    });
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

    res.status(201).json({
      message: 'Bình luận thành công!',
      comment: { ...newComment, authorAvatar: normalizeImageUrl(newComment.authorAvatar) }
    });
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
  getPublicStats,
  getPostById,
  likePost,
  commentPost
};
