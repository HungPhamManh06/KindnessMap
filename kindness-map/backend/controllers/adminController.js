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
        (SELECT COUNT(*) FROM Posts WHERE userId = u.id) as postsCount,
        (SELECT COUNT(*) FROM Posts WHERE userId = u.id AND status = 'Approved') as approvedPostsCount
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

const getAdminAwards = async (req, res) => {
  try {
    const awards = await queryAll(`
      SELECT ca.*, u.fullName as recipientName, u.email as recipientEmail, u.avatar as recipientAvatar, u.level as recipientLevel
      FROM CommunityAwards ca
      JOIN Users u ON ca.recipientUserId = u.id
      ORDER BY ca.createdAt DESC
    `);
    res.status(200).json(awards);
  } catch (error) {
    console.error('Get admin awards error:', error);
    res.status(500).json({ message: 'Có lỗi khi lấy danh sách giải thưởng.' });
  }
};

const createAward = async (req, res) => {
  try {
    const { title, month, description, recipientUserId, awardPoints } = req.body;

    if (!title || !month || !description || !recipientUserId) {
      return res.status(400).json({ message: 'Vui lòng nhập đủ tiêu đề, tháng, mô tả và người nhận.' });
    }

    const points = Number(awardPoints || 100);
    if (!Number.isInteger(points) || points < 0 || points > 5000) {
      return res.status(400).json({ message: 'Điểm thưởng phải là số nguyên từ 0 đến 5000.' });
    }

    const recipient = await queryGet(`SELECT id, fullName FROM Users WHERE id = ?`, [recipientUserId]);
    if (!recipient) return res.status(404).json({ message: 'Không tìm thấy người nhận giải thưởng.' });

    const result = await queryRun(
      `INSERT INTO CommunityAwards (title, month, description, recipientUserId, awardPoints) VALUES (?, ?, ?, ?, ?)`,
      [title.trim(), month.trim(), description.trim(), recipientUserId, points]
    );

    if (points > 0) {
      await queryRun(`UPDATE Users SET points = points + ? WHERE id = ?`, [points, recipientUserId]);
      await checkAndUpdateLevel(recipientUserId);
    }

    await queryRun(
      `INSERT INTO Notifications (userId, title, message, type) VALUES (?, ?, ?, ?)`,
      [
        recipientUserId,
        'Bạn được vinh danh giải thưởng tháng!',
        `Chúc mừng ${recipient.fullName}! Bạn đã nhận giải "${title.trim()}" (${month.trim()}) và được cộng +${points} điểm thưởng cộng đồng.`,
        'award'
      ]
    );

    const createdAward = await queryGet(`
      SELECT ca.*, u.fullName as recipientName, u.email as recipientEmail, u.avatar as recipientAvatar, u.level as recipientLevel
      FROM CommunityAwards ca
      JOIN Users u ON ca.recipientUserId = u.id
      WHERE ca.id = ?
    `, [result.lastID]);

    res.status(201).json({ message: 'Đã tạo giải thưởng và cộng điểm cho người nhận.', award: createdAward });
  } catch (error) {
    console.error('Create award error:', error);
    res.status(500).json({ message: 'Có lỗi khi tạo giải thưởng.' });
  }
};

const deleteAward = async (req, res) => {
  try {
    const { id } = req.params;
    const award = await queryGet(`SELECT * FROM CommunityAwards WHERE id = ?`, [id]);
    if (!award) return res.status(404).json({ message: 'Không tìm thấy giải thưởng.' });

    await queryRun(`DELETE FROM CommunityAwards WHERE id = ?`, [id]);
    res.status(200).json({ message: 'Đã xóa giải thưởng khỏi sảnh vinh danh.' });
  } catch (error) {
    console.error('Delete award error:', error);
    res.status(500).json({ message: 'Có lỗi khi xóa giải thưởng.' });
  }
};

const pointCaseSql = `
  CASE
    WHEN category IN ('Môi trường', 'Environment') THEN 10
    WHEN category IN ('Người cao tuổi', 'Elderly Care') THEN 20
    WHEN category IN ('Trồng cây', 'Tree Planting') THEN 30
    WHEN category IN ('Hiến máu', 'Blood Donation') THEN 50
    ELSE 25
  END
`;

const getAnalytics = async (req, res) => {
  try {
    const totalUsers = await queryGet(`SELECT COUNT(*) as cnt FROM Users`);
    const approvedPosts = await queryGet(`SELECT COUNT(*) as cnt FROM Posts WHERE status = 'Approved'`);
    const pendingPosts = await queryGet(`SELECT COUNT(*) as cnt FROM Posts WHERE status = 'Pending'`);
    const rejectedPosts = await queryGet(`SELECT COUNT(*) as cnt FROM Posts WHERE status = 'Rejected'`);
    const totalPoints = await queryGet(`SELECT SUM(points) as total FROM Users`);

    const statusBreakdownRows = await queryAll(`
      SELECT status, COUNT(*) as count
      FROM Posts
      GROUP BY status
    `);

    const statusBreakdown = statusBreakdownRows.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, { Pending: 0, Approved: 0, Rejected: 0 });

    // Real monthly activity from approved posts in the last 6 months.
    const monthlyRows = await queryAll(`
      SELECT
        DATE_FORMAT(createdAt, '%Y-%m') as monthKey,
        DATE_FORMAT(createdAt, 'Tháng %c/%Y') as month,
        COUNT(*) as posts,
        SUM(${pointCaseSql}) as points
      FROM Posts
      WHERE status = 'Approved'
        AND createdAt >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
      GROUP BY monthKey, month
      ORDER BY monthKey ASC
    `);

    const now = new Date();
    const monthlyActivity = Array.from({ length: 6 }, (_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const matched = monthlyRows.find((row) => row.monthKey === monthKey);
      return {
        month: `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`,
        posts: matched ? Number(matched.posts) : 0,
        points: matched ? Number(matched.points || 0) : 0
      };
    });

    // Most active locations
    const activeLocations = await queryAll(`
      SELECT locationName, COUNT(*) as deedsCount
      FROM Posts
      WHERE status = 'Approved'
      GROUP BY locationName
      ORDER BY deedsCount DESC
      LIMIT 5
    `);

    const categoryBreakdown = await queryAll(`
      SELECT
        category,
        COUNT(*) as postsCount,
        SUM(${pointCaseSql}) as pointsPotential
      FROM Posts
      WHERE status = 'Approved'
      GROUP BY category
      ORDER BY postsCount DESC, pointsPotential DESC
      LIMIT 8
    `);

    const topContributors = await queryAll(`
      SELECT
        u.id,
        u.fullName,
        u.email,
        u.avatar,
        u.points,
        u.level,
        COALESCE(pc.approvedPosts, 0) as approvedPosts
      FROM Users u
      LEFT JOIN (
        SELECT userId, COUNT(*) as approvedPosts
        FROM Posts
        WHERE status = 'Approved'
        GROUP BY userId
      ) pc ON pc.userId = u.id
      ORDER BY u.points DESC, approvedPosts DESC
      LIMIT 5
    `);

    const recentPending = await queryAll(`
      SELECT p.id, p.title, p.category, p.locationName, p.createdAt, u.fullName as authorName
      FROM Posts p
      JOIN Users u ON p.userId = u.id
      WHERE p.status = 'Pending'
      ORDER BY p.createdAt DESC
      LIMIT 5
    `);

    res.status(200).json({
      totalUsers: totalUsers.cnt,
      totalPosts: approvedPosts.cnt,
      approvedPosts: approvedPosts.cnt,
      pendingPosts: pendingPosts.cnt,
      rejectedPosts: rejectedPosts.cnt,
      totalPoints: totalPoints.total || 0,
      statusBreakdown,
      monthlyActivity,
      activeLocations,
      categoryBreakdown,
      topContributors,
      recentPending
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
  getAdminAwards,
  createAward,
  deleteAward,
  getAnalytics
};
