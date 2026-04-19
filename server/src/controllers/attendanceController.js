const pool = require('../config/db');

// Get attendance status for today
exports.getStatus = async (req, res) => {
  const teacherId = req.user.id;
  const today = new Date().toISOString().split('T')[0];

  try {
    const [rows] = await pool.query(
      'SELECT * FROM attendance_records WHERE user_id = ? AND date = ? AND user_type = "Teacher"',
      [teacherId, today]
    );

    if (rows.length === 0) {
      return res.json({ status: 'NotCheckedIn', record: null });
    }

    const record = rows[0];
    if (record.check_in_time && !record.check_out_time) {
      return res.json({ status: 'CheckedIn', record });
    } else if (record.check_in_time && record.check_out_time) {
      return res.json({ status: 'CheckedOut', record });
    }

    res.json({ status: record.status, record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check in
exports.checkIn = async (req, res) => {
  const teacherId = req.user.id;
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().split(' ')[0]; // HH:MM:SS

  try {
    // Check if record already exists
    const [existing] = await pool.query(
      'SELECT * FROM attendance_records WHERE user_id = ? AND date = ? AND user_type = "Teacher"',
      [teacherId, today]
    );

    if (existing.length > 0) {
      if (existing[0].check_in_time) {
        return res.status(400).json({ message: 'Already checked in today' });
      }
      // If record exists (maybe marked as Absent by admin?), update it
      await pool.query(
        'UPDATE attendance_records SET check_in_time = ?, status = "Present" WHERE id = ?',
        [now, existing[0].id]
      );
    } else {
      // Create new record
      await pool.query(
        'INSERT INTO attendance_records (user_id, date, status, user_type, check_in_time) VALUES (?, ?, "Present", "Teacher", ?)',
        [teacherId, today, now]
      );
    }

    res.status(200).json({ message: 'Checked in successfully', time: now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Check out
exports.checkOut = async (req, res) => {
  const teacherId = req.user.id;
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().split(' ')[0]; // HH:MM:SS

  try {
    const [existing] = await pool.query(
      'SELECT * FROM attendance_records WHERE user_id = ? AND date = ? AND user_type = "Teacher"',
      [teacherId, today]
    );

    if (existing.length === 0 || !existing[0].check_in_time) {
      return res.status(400).json({ message: 'You must check in first' });
    }

    if (existing[0].check_out_time) {
      return res.status(400).json({ message: 'Already checked out today' });
    }

    await pool.query(
      'UPDATE attendance_records SET check_out_time = ? WHERE id = ?',
      [now, existing[0].id]
    );

    res.status(200).json({ message: 'Checked out successfully', time: now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all attendance records for a specific date or range (for admins)
exports.getAllAttendance = async (req, res) => {
  const { date, startDate, endDate } = req.query;
  
  try {
    let rows;
    if (date) {
      // Single day view (Dashboard): Show ALL active teachers
      [rows] = await pool.query(`
        SELECT 
          u.id as user_id, 
          u.name as teacher_name, 
          u.email as teacher_email,
          ar.id,
          ar.date,
          COALESCE(ar.status, 'Absent') as status,
          ar.check_in_time,
          ar.check_out_time
        FROM users u
        LEFT JOIN attendance_records ar ON u.id = ar.user_id AND ar.date = ?
        WHERE u.role = 'Teacher' AND u.status = 'Active'
        ORDER BY teacher_name ASC
      `, [date]);
    } else if (startDate && endDate) {
      // Range view (Reports): Show historical records only
      [rows] = await pool.query(`
        SELECT ar.*, u.name as teacher_name, u.email as teacher_email
        FROM attendance_records ar
        JOIN users u ON ar.user_id = u.id
        WHERE ar.user_type = 'Teacher' AND ar.date BETWEEN ? AND ?
        ORDER BY ar.date DESC, ar.check_in_time DESC
      `, [startDate, endDate]);
    } else {
      // Default to today view (All teachers)
      const targetDate = new Date().toISOString().split('T')[0];
      [rows] = await pool.query(`
        SELECT 
          u.id as user_id, 
          u.name as teacher_name, 
          u.email as teacher_email,
          ar.id,
          ar.date,
          COALESCE(ar.status, 'Absent') as status,
          ar.check_in_time,
          ar.check_out_time
        FROM users u
        LEFT JOIN attendance_records ar ON u.id = ar.user_id AND ar.date = ?
        WHERE u.role = 'Teacher' AND u.status = 'Active'
        ORDER BY teacher_name ASC
      `, [targetDate]);
    }
    
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


