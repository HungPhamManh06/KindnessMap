const { queryAll, queryRun } = require('../config/db');

const getUserNotifications = async (req, res) => {
  try {
    const notifs = await queryAll(`
      SELECT * FROM Notifications 
      WHERE userId = ? 
      ORDER BY createdAt DESC 
      LIMIT 20
    `, [req.user.id]);
    res.status(200).json(notifs);
  } catch (error) {
    console.error('Get notifs error:', error);
    res.status(500).json({ message: 'Có lỗi khi lấy thông báo.' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'all') {
      await queryRun(`UPDATE Notifications SET isRead = 1 WHERE userId = ?`, [req.user.id]);
    } else {
      await queryRun(`UPDATE Notifications SET isRead = 1 WHERE id = ? AND userId = ?`, [id, req.user.id]);
    }
    res.status(200).json({ message: 'Đã đánh dấu đã đọc.' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Có lỗi thao tác.' });
  }
};

module.exports = {
  getUserNotifications,
  markAsRead
};
