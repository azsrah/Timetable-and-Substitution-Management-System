// ─────────────────────────────────────────────────────────
// resourceController.js — Resource Request Management
// Handles school resources (Labs, Grounds, etc.) and the
// request/approval workflow between teachers and admins.
// ─────────────────────────────────────────────────────────

const pool = require('../config/db');

// ── getAllRequests ────────────────────────────────────────
// Returns all resource requests for the admin to review,
// including resource name, teacher name, period, date, and status.
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

// ── getMyRequests ─────────────────────────────────────────
// Returns only the resource requests submitted by the logged-in teacher,
// so they can track the status of their own requests.
exports.getMyRequests = async (req, res) => {
  const teacher_id = req.user.id; // From JWT via verifyToken middleware
  try {
    const [rows] = await pool.query(`
      SELECT rr.id, rr.date, p.name as period_name, p.start_time, r.name as resource_name, r.type as resource_type, rr.status
      FROM resource_requests rr
      JOIN periods p ON rr.period_id = p.id
      JOIN resources r ON rr.resource_id = r.id
      WHERE rr.teacher_id = ?         -- Only show this teacher's requests
      ORDER BY rr.created_at DESC
    `, [teacher_id]);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── getAllResources ───────────────────────────────────────
// Returns all available school resources (e.g. Lab A, Sports Ground).
// Used by the teacher's resource request form dropdown.
exports.getAllResources = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM resources ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── createResource ────────────────────────────────────────
// Admin creates a new school resource with its type and capacity.
// Types: Lab, Ground, Auditorium, Library.
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

// ── requestResource ───────────────────────────────────────
// Teacher submits a request to use a specific resource on a given date and period.
// After saving, notifies all admin users via both the DB and real-time Socket.io.
exports.requestResource = async (req, res) => {
  const { resource_id, date, period_id } = req.body;
  const teacher_id = req.user.id;

  try {
    // Save the resource request (starts as Pending)
    const [result] = await pool.query(
      'INSERT INTO resource_requests (teacher_id, resource_id, date, period_id, status) VALUES (?, ?, ?, ?, "Pending")',
      [teacher_id, resource_id, date, period_id]
    );

    // Notify all admin users about this new request
    try {
      const [admins] = await pool.query('SELECT id FROM users WHERE role = "Admin"');
      const [teacher] = await pool.query('SELECT name FROM users WHERE id = ?', [teacher_id]);
      const teacherName = teacher[0]?.name || 'A teacher';
      const adminMessage = `${teacherName} has requested a resource.`;
      
      if (admins.length > 0) {
        // Bulk insert one notification per admin into the database
        const adminNotifs = admins.map(admin => [admin.id, adminMessage, 'NewResourceRequest']);
        await pool.query('INSERT INTO notifications (user_id, message, type) VALUES ?', [adminNotifs]);
        
        // Also send a targeted real-time pop-up to each admin's browser session
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
      // Don't fail the overall request if notifications fail
    }

    // Broadcast a generic event so the admin resource panel can auto-refresh
    req.io.emit('new_resource_request', { id: result.insertId, teacher_id, resource_id, date, period_id });

    res.status(201).json({ message: 'Resource requested successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── updateRequestStatus ───────────────────────────────────
// Admin approves, rejects, or reschedules a resource request.
// After updating, notifies the requesting teacher via DB and Socket.io.
exports.updateRequestStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // Expected values: 'Approved', 'Rejected', or 'Rescheduled'
  
  try {
    // Update the request status in the database
    await pool.query('UPDATE resource_requests SET status = ? WHERE id = ?', [status, id]);
    
    // Look up the teacher who submitted the request so we can notify them
    const [requestInfo] = await pool.query('SELECT teacher_id FROM resource_requests WHERE id = ?', [id]);
    if (requestInfo.length > 0) {
      // Save a persistent notification in the teacher's inbox
      await pool.query('INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
        [requestInfo[0].teacher_id, `Your resource request has been ${status}`, 'ResourceUpdate']
      );
      // Send a real-time socket notification to the teacher's active session
      req.io.emit(`notification_${requestInfo[0].teacher_id}`, { message: `Your resource request has been ${status}` });
    }

    res.json({ message: `Request ${status}` });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
