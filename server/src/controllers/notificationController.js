const pool = require('../config/db');

// Get all notifications for the logged-in user
exports.getUserNotifications = async (req, res) => {
  const user_id = req.user.id;
  try {
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [user_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark a single notification as read
exports.markAsRead = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, user_id]
    );
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark all notifications as read for the user
exports.markAllAsRead = async (req, res) => {
  const user_id = req.user.id;
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
      [user_id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete all notifications for the user
exports.clearNotifications = async (req, res) => {
  const user_id = req.user.id;
  try {
    await pool.query('DELETE FROM notifications WHERE user_id = ?', [user_id]);
    res.json({ message: 'Notifications cleared' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
