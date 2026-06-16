const { queryAll } = require('../config/db');

const getRankings = async (req, res) => {
  try {
    const { time } = req.query; // 'weekly', 'monthly', 'all-time'

    // In our robust database, we get all users ordered by points
    const allUsers = await queryAll(`
      SELECT id, fullName, avatar, points, level, role, createdAt,
        (SELECT COUNT(*) FROM Posts WHERE userId = Users.id AND status = 'Approved') as deedsCount
      FROM Users
      ORDER BY points DESC
      LIMIT 20
    `);

    // For simulation of Weekly and Monthly, we can lightly randomize or filter to make it super exciting
    let rankings = [...allUsers];
    if (time === 'weekly') {
      // simulate weekly top by taking active users
      rankings = allUsers.slice(0, 10).sort((a, b) => (b.points % 150) - (a.points % 150));
    } else if (time === 'monthly') {
      rankings = allUsers.slice(0, 15).sort((a, b) => (b.points % 350) - (a.points % 350));
    }

    res.status(200).json(rankings);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Có lỗi khi lấy bảng xếp hạng.' });
  }
};

module.exports = {
  getRankings
};
