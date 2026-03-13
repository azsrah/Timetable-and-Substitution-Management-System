const pool = require('../config/db');

// Record attendance
exports.recordAttendance = async (req, res) => {
  const { user_id, date, status, user_type } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO attendance_records (user_id, date, status, user_type) VALUES (?, ?, ?, ?)',
      [user_id, date, status, user_type]
    );
    res.status(201).json({ message: 'Attendance recorded successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Suggest a substitute for an absent teacher for a given period
exports.suggestSubstitute = async (req, res) => {
  const { day_of_week, period_id } = req.query;
  
  try {
    // A teacher is a good substitute if they are NOT booked for this period
    // and ideally they teach the same subject or are just generally free.
    // For simplicity: Find any teacher who is not in the timetables for this period and day.
    const [freeTeachers] = await pool.query(`
      SELECT u.id, u.name 
      FROM users u
      WHERE u.role = 'Teacher' AND u.status = 'Active'
      AND u.id NOT IN (
        SELECT teacher_id FROM timetables 
        WHERE day_of_week = ? AND period_id = ?
      )
    `, [day_of_week, period_id]);

    res.json(freeTeachers);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Assign substitution
exports.assignSubstitution = async (req, res) => {
  const { absent_teacher_id, substitute_teacher_id, timetable_id, date } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO substitutions (absent_teacher_id, substitute_teacher_id, timetable_id, date, status) VALUES (?, ?, ?, ?, "Pending")',
      [absent_teacher_id, substitute_teacher_id, timetable_id, date]
    );

    // Notify the substitute teacher
    req.io.emit(`notification_${substitute_teacher_id}`, { message: 'You have been assigned a new substitution class.' });

    res.status(201).json({ message: 'Substitution assigned successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// List all substitutions (for admin)
exports.getAllSubstitutions = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT s.id, s.date, s.status, 
             u1.name as absent_teacher_name, 
             u2.name as substitute_teacher_name,
             p.name as period_name, p.start_time,
             c.grade, c.section, sub.name as subject_name
      FROM substitutions s
      JOIN users u1 ON s.absent_teacher_id = u1.id
      JOIN users u2 ON s.substitute_teacher_id = u2.id
      JOIN timetables t ON s.timetable_id = t.id
      JOIN periods p ON t.period_id = p.id
      JOIN classes c ON t.class_id = c.id
      JOIN subjects sub ON t.subject_id = sub.id
      ORDER BY s.date DESC, p.start_time
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// List substitutions for a specific teacher
exports.getTeacherSubstitutions = async (req, res) => {
  const { teacherId } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT s.id, s.date, s.status, 
             u1.name as absent_teacher_name, 
             p.name as period_name, p.start_time, p.end_time,
             c.grade, c.section, sub.name as subject_name
      FROM substitutions s
      JOIN users u1 ON s.absent_teacher_id = u1.id
      JOIN timetables t ON s.timetable_id = t.id
      JOIN periods p ON t.period_id = p.id
      JOIN classes c ON t.class_id = c.id
      JOIN subjects sub ON t.subject_id = sub.id
      WHERE s.substitute_teacher_id = ?
      ORDER BY s.date DESC, p.start_time
    `, [teacherId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Substitute accepts
exports.acceptSubstitution = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE substitutions SET status = "Accepted" WHERE id = ?', [id]);
    res.json({ message: 'Substitution accepted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
