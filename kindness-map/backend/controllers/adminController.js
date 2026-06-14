const { queryGet, queryRun, queryAll } = require('../config/db');
const { checkAndUpdateLevel } = require('./authController');

const getPointForCategory = (category) => {
  switch (category) {
    case 'Môi trường':
    case 'Environment':
      return 10;
    case 'Người cao tuổi':
    case 'Elderly Care':
      return 20;
    case 'Trồng cây':
    case 'Tree Planting':
      return 30;
    case 'Hiến máu':
    case 'Blood Donation':
      return 50;
    default:
      return 25;
  }
};

const getBadgeForCategory = (category) => {
  switch (category) {
    case 'Môi trường':
    case 'Trồng cây':
    case 'Environment':
    case 'Tree Planting':
      return { id: 1, name: 'Environmental Guardian' };
    case 'Hiến máu':
    case 'Blood Donation':
      return { id: 3, name: 'Blood Donation Hero' };
    case 'Người cao tuổi':
    case 'Elderly Care':
    case 'Giáo dục':
    case 'Education':
      return { id: 4, name: 'Community Volunteer' };
    default:
      return { id: 2, name: 'Kindness Ambassador' };
  }
};

const getAllPosts = async (req, res) => {
  try {
    const { status } = req.query;
    let sql = `
      SELECT p.*, u.fullName as authorName, u.email as authorEmail
      FROM Posts p
      JOIN Users u ON p.userId = u.id
    `;
    const params = [];
    if (status && status !== 'All') {
      sql += ` WHERE p.status = ?`;
      params.push(status);
    }
    sql += ` ORDER BY p.createdAt DESC`;

    const posts = await queryAll(sql, params);
    res.status(200).json(posts);
  } catch (error) {
    console.error('Get all posts error:', error);
    res.status(500).json({ message: 'Có lỗi khi lấy danh sách bài viết.' });
  }
};

const moderatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isFeatured } = req.body; // status: 'Approved' | 'Rejected'

    const post = await queryGet(`SELECT * FROM Posts WHERE id = ?`, [id]);
    if (!post) return res.status(404).json({ message: 'Không tìm thấy bài viết.' });

    await queryRun(`UPDATE Posts SET status = ?, isFeatured = ? WHERE id = ?`, [status, isFeatured ? 1 : 0, id]);

    if (status === 'Approved' && post.status !== 'Approved') {
      const awardPts = getPointForCategory(post.category);
      await queryRun(`UPDATE Users SET points = points + ? WHERE id = ?`, [awardPts, post.userId]);

      // Check level upgrade
      await checkAndUpdateLevel(post.userId);

      // Award specific badge
      const badgeInfo = getBadgeForCategory(post.category);
      const userBadge = await queryGet(`SELECT id FROM UserBadges WHERE userId = ? AND badgeId = ?`, [post.userId, badgeInfo.id]);
      if (!userBadge) {
        await queryRun(`INSERT INTO UserBadges (userId, badgeId) VALUES (?, ?)`, [post.userId, badgeInfo.id]);
        await queryRun(
          `INSERT INTO Notifications (userId, title, message, type) VALUES (?, ?, ?, ?)`,
          [post.userId, 'Nhận huy hiệu mới!', `Bạn đã được trao tặng huy hiệu "${badgeInfo.name}" nhờ câu chuyện việc tốt của mình.`, 'award']
        );
      }

      await queryRun(
        `INSERT INTO Notifications (userId, title, message, type) VALUES (?, ?, ?, ?)`,
        [post.userId, 'Bài viết được phê duyệt!', `Bài viết "${post.title}" của bạn đã được duyệt và hiển thị trên Bản Đồ Việc Tốt. Bạn nhận được +${awardPts} điểm công dân.`, 'success']
      );
    } else if (status === 'Rejected') {
      await queryRun(
        `INSERT INTO Notifications (userId, title, message, type) VALUES (?, ?, ?, ?)`,
        [post.userId, 'Bài viết không được phê duyệt', `Bài viết "${post.title}" của bạn chưa đáp ứng đủ tiêu chí cộng đồng hoặc cần xác thực thêm.`, 'warning']
      );
    }

    res.status(200).json({ message: `Đã chuyển trạng thái bài viết thành ${status}.` });
  } catch (error) {
    console.error('Moderate post error:', error);
    res.status(500).json({ message: 'Có lỗi khi kiểm duyệt bài viết.' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await queryAll(`
      SELECT u.id, u.fullName, u.email, u.avatar, u.points, u.level, u.role, u.createdAt,
        (SELECT COUNT(*) FROM Posts WHERE userId = u.id) as postsCount
      FROM Users u
      ORDER BY u.points DESC
    `);
    res.status(200).json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Có lỗi khi lấy danh sách người dùng.' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    await queryRun(`UPDATE Users SET role = ? WHERE id = ?`, [role, id]);
    res.status(200).json({ message: `Cập nhật quyền người dùng thành ${role}.` });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Có lỗi khi cập nhật quyền.' });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const totalUsers = await queryGet(`SELECT COUNT(*) as cnt FROM Users`);
    const totalPosts = await queryGet(`SELECT COUNT(*) as cnt FROM Posts WHERE status = 'Approved'`);
    const totalPoints = await queryGet(`SELECT SUM(points) as total FROM Users`);
    const pendingPosts = await queryGet(`SELECT COUNT(*) as cnt FROM Posts WHERE status = 'Pending'`);

    // Monthly activity charts simulation (last 6 months)
    const monthlyActivity = [
      { month: 'Tháng 1', posts: 12, points: 290 },
      { month: 'Tháng 2', posts: 18, points: 410 },
      { month: 'Tháng 3', posts: 25, points: 620 },
      { month: 'Tháng 4', posts: 34, points: 850 },
      { month: 'Tháng 5', posts: 45, points: 1200 },
      { month: 'Tháng 6 (Hiện tại)', posts: 58, points: 1540 }
    ];

    // Most active locations
    const activeLocations = await queryAll(`
      SELECT locationName, COUNT(*) as deedsCount 
      FROM Posts 
      WHERE status = 'Approved' 
      GROUP BY locationName 
      ORDER BY deedsCount DESC 
      LIMIT 5
    `);

    res.status(200).json({
      totalUsers: totalUsers.cnt,
      totalPosts: totalPosts.cnt,
      totalPoints: totalPoints.total || 0,
      pendingPosts: pendingPosts.cnt,
      monthlyActivity,
      activeLocations
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Có lỗi khi thống kê dữ liệu.' });
  }
};

module.exports = {
  getAllPosts,
  moderatePost,
  getAllUsers,
  updateUserRole,
  getAnalytics
};
