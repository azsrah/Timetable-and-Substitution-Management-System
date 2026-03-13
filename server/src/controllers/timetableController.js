const pool = require('../config/db');

// Get all periods
exports.getAllPeriods = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM periods ORDER BY start_time');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Get weekly timetable for a class
exports.getClassTimetable = async (req, res) => {
  const { classId } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT t.id, t.day_of_week, t.period_id, p.name as period_name, p.start_time, p.end_time, p.is_break,
             s.name as subject_name, u.name as teacher_name, r.name as resource_name, t.is_locked
      FROM timetables t
      JOIN periods p ON t.period_id = p.id
      JOIN subjects s ON t.subject_id = s.id
      JOIN users u ON t.teacher_id = u.id
      LEFT JOIN resources r ON t.resource_id = r.id
      WHERE t.class_id = ?
      ORDER BY FIELD(t.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), p.start_time
    `, [classId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get weekly timetable for a teacher
exports.getTeacherTimetable = async (req, res) => {
  const { teacherId } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT t.id, t.day_of_week, p.name as period_name, p.start_time, p.end_time, p.is_break,
             s.name as subject_name, c.grade, c.section, r.name as resource_name, t.is_locked, t.period_id
      FROM timetables t
      JOIN periods p ON t.period_id = p.id
      JOIN subjects s ON t.subject_id = s.id
      JOIN classes c ON t.class_id = c.id
      LEFT JOIN resources r ON t.resource_id = r.id
      WHERE t.teacher_id = ?
      ORDER BY FIELD(t.day_of_week, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'), p.start_time
    `, [teacherId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// Add or Update a Timetable Slot WITH Conflict Detection
exports.saveTimetableSlot = async (req, res) => {
  const { class_id, day_of_week, period_id, subject_id, teacher_id, resource_id } = req.body;
  
  try {
    // 1. Conflict Check: Is Teacher already booked for this period on this day?
    const [teacherConflict] = await pool.query(
      'SELECT id, class_id FROM timetables WHERE teacher_id = ? AND day_of_week = ? AND period_id = ?',
      [teacher_id, day_of_week, period_id]
    );
    
    // Allow updating the same slot but block if it's a different class
    if (teacherConflict.length > 0 && teacherConflict[0].class_id !== class_id) {
      return res.status(409).json({ message: 'Teacher is already booked for this period.' });
    }

    // 2. Conflict Check: Is Resource already booked?
    if (resource_id) {
      const [resourceConflict] = await pool.query(
        'SELECT id, class_id FROM timetables WHERE resource_id = ? AND day_of_week = ? AND period_id = ?',
        [resource_id, day_of_week, period_id]
      );
      if (resourceConflict.length > 0 && resourceConflict[0].class_id !== class_id) {
        return res.status(409).json({ message: 'Resource (Lab/Ground) is already booked for this period.' });
      }
    }

    // 3. Upsert slot for the class
    const [existingSlot] = await pool.query(
      'SELECT id, is_locked FROM timetables WHERE class_id = ? AND day_of_week = ? AND period_id = ?',
      [class_id, day_of_week, period_id]
    );

    if (existingSlot.length > 0) {
      if (existingSlot[0].is_locked) {
        return res.status(403).json({ message: 'This timetable slot is locked.' });
      }
      // Update
      await pool.query(
        'UPDATE timetables SET subject_id = ?, teacher_id = ?, resource_id = ? WHERE id = ?',
        [subject_id, teacher_id, resource_id || null, existingSlot[0].id]
      );
    } else {
      // Insert
      await pool.query(
        'INSERT INTO timetables (class_id, day_of_week, period_id, subject_id, teacher_id, resource_id) VALUES (?, ?, ?, ?, ?, ?)',
        [class_id, day_of_week, period_id, subject_id, teacher_id, resource_id || null]
      );
    }
    
    // Emit real-time change
    req.io.emit('timetable_updated', { class_id, day_of_week, period_id });

    res.json({ message: 'Timetable slot saved successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
