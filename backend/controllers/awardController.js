const { queryAll } = require('../config/db');

const getMonthlyAwards = async (req, res) => {
  try {
    const awards = await queryAll(`
      SELECT ca.*, u.fullName as recipientName, u.avatar as recipientAvatar, u.level as recipientLevel
      FROM CommunityAwards ca
      JOIN Users u ON ca.recipientUserId = u.id
      ORDER BY ca.createdAt DESC
    `);
    res.status(200).json(awards);
  } catch (error) {
    console.error('Get awards error:', error);
    res.status(500).json({ message: 'Có lỗi khi lấy danh sách giải thưởng cộng đồng.' });
  }
};

module.exports = {
  getMonthlyAwards
};
