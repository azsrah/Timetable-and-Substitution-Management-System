// ─────────────────────────────────────────────────────────
// notificationController.js — Notification Inbox Logic
// Manages persistent in-app notifications stored in the database.
// Users can view, mark as read, and clear their notification inbox.
// ─────────────────────────────────────────────────────────

const pool = require('../config/db');

// ── getUserNotifications ──────────────────────────────────
// Fetches the 50 most recent notifications for the logged-in user,
// newest first. These are persistent (stored in DB), unlike Socket.io toasts.
exports.getUserNotifications = async (req, res) => {
  const user_id = req.user.id; // From JWT via verifyToken middleware
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

// ── markAsRead ────────────────────────────────────────────
// Marks a single notification as read so the unread badge count decreases.
// Requires user_id check to prevent users from marking others' notifications.
exports.markAsRead = async (req, res) => {
  const { id } = req.params;       // Notification ID from the URL
  const user_id = req.user.id;     // Ensure only the owner can mark it
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

// ── markAllAsRead ─────────────────────────────────────────
// Marks ALL of the user's unread notifications as read at once.
// Triggered when the user clicks "Mark all as read" in the notification panel.
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

// ── clearNotifications ────────────────────────────────────
// Deletes ALL notifications for the user — empties their inbox.
// Triggered by the "Clear all" button in the notification panel.
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
