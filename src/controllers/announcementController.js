const pool = require('../config/db');

exports.getAllAnnouncements = async (req, res) => {
  try {
    const { role, id } = req.user;
    let rows;
    
    if (role === 'Admin') {
      [rows] = await pool.query(`
        SELECT a.*, u.name as author_name 
        FROM announcements a 
        LEFT JOIN users u ON a.author_id = u.id 
        ORDER BY a.created_at DESC
      `);
    } else if (role === 'Student') {
      // Get student's class_id
      const [uRows] = await pool.query('SELECT class_id FROM users WHERE id = ?', [id]);
      const classId = uRows[0]?.class_id;

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

exports.createAnnouncement = async (req, res) => {
  const { title, message, target_audience, target_class_id, target_class_ids } = req.body;
  const author_id = req.user.id;
  try {
    // If multiple classes are selected, create multiple announcement entries
    if (target_class_ids && Array.isArray(target_class_ids) && target_class_ids.length > 0) {
      const queries = target_class_ids.map(classId => 
        pool.query(
          'INSERT INTO announcements (title, message, target_audience, author_id, target_class_id) VALUES (?, ?, ?, ?, ?)',
          [title, message, 'Students', author_id, classId]
        )
      );
      await Promise.all(queries);
    } else {
      await pool.query(
        'INSERT INTO announcements (title, message, target_audience, author_id, target_class_id) VALUES (?, ?, ?, ?, ?)',
        [title, message, target_audience || 'All', author_id, target_class_id || null]
      );
    }

    // Emit real-time notification
    req.io.emit('new_announcement', { title, message, target_audience, target_class_id });

    res.status(201).json({ message: 'Announcement created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    await pool.query('DELETE FROM announcements WHERE id = ?', [req.params.id]);
    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
