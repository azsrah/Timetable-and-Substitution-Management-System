// ─────────────────────────────────────────────────────────
// announcementController.js — Announcement Management Logic
// Handles fetching, creating, and deleting announcements.
// Each role sees only the announcements relevant to them.
// ─────────────────────────────────────────────────────────

const pool = require('../config/db');

// ── getAllAnnouncements ───────────────────────────────────
// Returns announcements filtered by the logged-in user's role:
//   - Admin: sees ALL announcements
//   - Student: sees announcements for 'All', 'Students', or their specific class
//   - Teacher: sees announcements for 'All', 'Teachers', or ones they created
exports.getAllAnnouncements = async (req, res) => {
  try {
    const { role, id } = req.user; // User info attached by verifyToken middleware
    let rows;
    
    if (role === 'Admin') {
      // Admins see everything — including author name for each announcement
      [rows] = await pool.query(`
        SELECT a.*, u.name as author_name 
        FROM announcements a 
        LEFT JOIN users u ON a.author_id = u.id 
        ORDER BY a.created_at DESC
      `);
    } else if (role === 'Student') {
      // Get this student's class so we can include class-specific announcements
      const [uRows] = await pool.query('SELECT class_id FROM users WHERE id = ?', [id]);
      const classId = uRows[0]?.class_id;

      // Students see: school-wide, student-wide, or their specific class announcements
      [rows] = await pool.query(`
        SELECT a.*, u.name as author_name 
        FROM announcements a 
        LEFT JOIN users u ON a.author_id = u.id 
        WHERE a.target_audience = 'All' 
        OR a.target_audience = 'Students' 
        OR (a.target_class_id = ? AND a.target_class_id IS NOT NULL)
        ORDER BY a.created_at DESC
      `, [classId]);
    } else if (role === 'Teacher') {
      // Teachers see: school-wide, teacher-wide, or announcements they authored
      [rows] = await pool.query(`
        SELECT a.*, u.name as author_name 
        FROM announcements a 
        LEFT JOIN users u ON a.author_id = u.id 
        WHERE a.target_audience = 'All' 
        OR a.target_audience = 'Teachers' 
        OR a.author_id = ?
        ORDER BY a.created_at DESC
      `, [id]);
    }
    
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── createAnnouncement ────────────────────────────────────
// Creates a new announcement. If multiple class IDs are provided,
// it creates a separate announcement entry per class (one-to-one mapping).
// Also broadcasts a real-time Socket.io event to connected clients.
exports.createAnnouncement = async (req, res) => {
  const { title, message, target_audience, target_class_id, target_class_ids } = req.body;
  const author_id = req.user.id; // The logged-in user who created the announcement
  try {
    if (target_class_ids && Array.isArray(target_class_ids) && target_class_ids.length > 0) {
      // Multiple classes selected — create one announcement record per class
      const queries = target_class_ids.map(classId => 
        pool.query(
          'INSERT INTO announcements (title, message, target_audience, author_id, target_class_id) VALUES (?, ?, ?, ?, ?)',
          [title, message, 'Students', author_id, classId]
        )
      );
      await Promise.all(queries); // Run all inserts in parallel for efficiency
    } else {
      // Single target — insert one announcement
      await pool.query(
        'INSERT INTO announcements (title, message, target_audience, author_id, target_class_id) VALUES (?, ?, ?, ?, ?)',
        [title, message, target_audience || 'All', author_id, target_class_id || null]
      );
    }

    // Push a real-time event so clients can refresh their announcement list instantly
    req.io.emit('new_announcement', { title, message, target_audience, target_class_id });

    res.status(201).json({ message: 'Announcement created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── deleteAnnouncement ────────────────────────────────────
// Deletes an announcement by its ID.
// Used by admins to remove outdated or incorrect announcements.
exports.deleteAnnouncement = async (req, res) => {
  try {
    await pool.query('DELETE FROM announcements WHERE id = ?', [req.params.id]);
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
