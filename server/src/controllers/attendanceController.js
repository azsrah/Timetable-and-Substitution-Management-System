// ─────────────────────────────────────────────────────────
// attendanceController.js — Teacher Attendance Logic
// Manages daily check-in/check-out for teachers and
// provides admin with attendance records for any date or range.
// ─────────────────────────────────────────────────────────

const pool = require('../config/db');

// ── getStatus ─────────────────────────────────────────────
// Returns the current attendance status for the logged-in teacher today.
// Possible statuses: 'NotCheckedIn', 'CheckedIn', 'CheckedOut', or the raw DB status.
exports.getStatus = async (req, res) => {
  const teacherId = req.user.id; // From JWT via verifyToken middleware
  const today = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD" format

  try {
    const [rows] = await pool.query(
      'SELECT * FROM attendance_records WHERE user_id = ? AND date = ? AND user_type = "Teacher"',
      [teacherId, today]
    );

    // No record means the teacher hasn't done anything yet today
    if (rows.length === 0) {
      return res.json({ status: 'NotCheckedIn', record: null });
    }

    const record = rows[0];

    // Determine exact status based on which timestamps are filled
    if (record.check_in_time && !record.check_out_time) {
      return res.json({ status: 'CheckedIn', record });
    } else if (record.check_in_time && record.check_out_time) {
      return res.json({ status: 'CheckedOut', record });
    }

    // Fallback: return whatever status is stored in the DB (e.g., 'Absent')
    res.json({ status: record.status, record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── checkIn ───────────────────────────────────────────────
// Records the teacher's check-in time for today.
// If the teacher was already marked as Absent by admin, it updates the record.
// Prevents double check-in.
exports.checkIn = async (req, res) => {
  const teacherId = req.user.id;
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().split(' ')[0]; // "HH:MM:SS" format

  try {
    // Check if an attendance record already exists for today
    const [existing] = await pool.query(
      'SELECT * FROM attendance_records WHERE user_id = ? AND date = ? AND user_type = "Teacher"',
      [teacherId, today]
    );

    if (existing.length > 0) {
      // If already checked in, reject the duplicate
      if (existing[0].check_in_time) {
        return res.status(400).json({ message: 'Already checked in today' });
      }
      // Record exists (e.g., admin marked absent) — update it with check-in info
      await pool.query(
        'UPDATE attendance_records SET check_in_time = ?, status = "Present" WHERE id = ?',
        [now, existing[0].id]
      );
    } else {
      // No record yet — create a new one with status Present
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

// ── checkOut ──────────────────────────────────────────────
// Records the teacher's check-out time for today.
// The teacher must have already checked in, and can only check out once.
exports.checkOut = async (req, res) => {
  const teacherId = req.user.id;
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toTimeString().split(' ')[0]; // "HH:MM:SS"

  try {
    const [existing] = await pool.query(
      'SELECT * FROM attendance_records WHERE user_id = ? AND date = ? AND user_type = "Teacher"',
      [teacherId, today]
    );

    // Can't check out without first checking in
    if (existing.length === 0 || !existing[0].check_in_time) {
      return res.status(400).json({ message: 'You must check in first' });
    }

    // Prevent double check-out
    if (existing[0].check_out_time) {
      return res.status(400).json({ message: 'Already checked out today' });
    }

    // Save the check-out time
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

// ── getAllAttendance ───────────────────────────────────────
// Admin endpoint to view attendance records.
// Supports three modes:
//   - Single date ('date'): Shows ALL active teachers, even those who haven't checked in (shown as Absent)
//   - Date range ('startDate' + 'endDate'): Shows historical check-in/out records only
//   - No params: Defaults to today's full teacher list
exports.getAllAttendance = async (req, res) => {
  const { date, startDate, endDate } = req.query;
  
  try {
    let rows;
    if (date) {
      // Single day view: LEFT JOIN shows teachers with no record as Absent
      [rows] = await pool.query(`
        SELECT 
          u.id as user_id, 
          u.name as teacher_name, 
          u.email as teacher_email,
          ar.id,
          ar.date,
          COALESCE(ar.status, 'Absent') as status,   -- If no record, treat as Absent
          ar.check_in_time,
          ar.check_out_time
        FROM users u
        LEFT JOIN attendance_records ar ON u.id = ar.user_id AND ar.date = ?
        WHERE u.role = 'Teacher' AND u.status = 'Active'  -- Only active teachers
        ORDER BY teacher_name ASC
      `, [date]);
    } else if (startDate && endDate) {
      // Date range view: Only shows records that actually exist (inner join)
      [rows] = await pool.query(`
        SELECT ar.*, u.name as teacher_name, u.email as teacher_email
        FROM attendance_records ar
        JOIN users u ON ar.user_id = u.id
        WHERE ar.user_type = 'Teacher' AND ar.date BETWEEN ? AND ?
        ORDER BY ar.date DESC, ar.check_in_time DESC
      `, [startDate, endDate]);
    } else {
      // Default: today's full teacher list with COALESCE to show Absent for missing records
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
