const pool = require('../config/db');

// List all resource requests (for admin)
exports.getAllRequests = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT rr.id, rr.date, p.name as period_name, r.name as resource_name, r.type as resource_type,
             u.name as teacher_name, rr.status
      FROM resource_requests rr
      JOIN periods p ON rr.period_id = p.id
      JOIN resources r ON rr.resource_id = r.id
      JOIN users u ON rr.teacher_id = u.id
      ORDER BY rr.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// List resource requests for the logged-in teacher
exports.getMyRequests = async (req, res) => {
  const teacher_id = req.user.id;
  try {
    const [rows] = await pool.query(`
      SELECT rr.id, rr.date, p.name as period_name, p.start_time, r.name as resource_name, r.type as resource_type, rr.status
      FROM resource_requests rr
      JOIN periods p ON rr.period_id = p.id
      JOIN resources r ON rr.resource_id = r.id
      WHERE rr.teacher_id = ?
      ORDER BY rr.created_at DESC
    `, [teacher_id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// List all resources
exports.getAllResources = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM resources ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a resource
exports.createResource = async (req, res) => {
  const { name, type, capacity } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO resources (name, type, capacity) VALUES (?, ?, ?)',
      [name, type, capacity]
    );
    res.status(201).json({ id: result.insertId, name, type, capacity });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Teacher requests a resource
exports.requestResource = async (req, res) => {
  const { resource_id, date, period_id } = req.body;
  const teacher_id = req.user.id;

  try {
    const [result] = await pool.query(
      'INSERT INTO resource_requests (teacher_id, resource_id, date, period_id, status) VALUES (?, ?, ?, ?, "Pending")',
      [teacher_id, resource_id, date, period_id]
    );

    // Notify all Admins
    try {
      const [admins] = await pool.query('SELECT id FROM users WHERE role = "Admin"');
      const [teacher] = await pool.query('SELECT name FROM users WHERE id = ?', [teacher_id]);
      const teacherName = teacher[0]?.name || 'A teacher';
      const adminMessage = `${teacherName} has requested a resource.`;
      
      if (admins.length > 0) {
        // Bulk database insertion
        const adminNotifs = admins.map(admin => [admin.id, adminMessage, 'NewResourceRequest']);
        await pool.query('INSERT INTO notifications (user_id, message, type) VALUES ?', [adminNotifs]);
        
        // Targeted real-time socket updates for each admin
        admins.forEach(admin => {
          req.io.emit(`notification_${admin.id}`, { 
            message: adminMessage,
            type: 'info',
            title: 'Resource Request'
          });
        });
      }
    } catch (err) {
      console.error('Failed to notify admins of resource request:', err);
    }

    req.io.emit('new_resource_request', { id: result.insertId, teacher_id, resource_id, date, period_id });

    res.status(201).json({ message: 'Resource requested successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Admin approves or rejects
exports.updateRequestStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'Approved', 'Rejected', 'Rescheduled'
  
  try {
    await pool.query('UPDATE resource_requests SET status = ? WHERE id = ?', [status, id]);
    
    // Notify the teacher
    const [requestInfo] = await pool.query('SELECT teacher_id FROM resource_requests WHERE id = ?', [id]);
    if (requestInfo.length > 0) {
      await pool.query('INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
        [requestInfo[0].teacher_id, `Your resource request has been ${status}`, 'ResourceUpdate']
      );
      req.io.emit(`notification_${requestInfo[0].teacher_id}`, { message: `Your resource request has been ${status}` });
    }

    res.json({ message: `Request ${status}` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
