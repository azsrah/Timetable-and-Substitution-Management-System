const pool = require('../config/db');
const emailService = require('../utils/emailService');

// Suggest a substitute for a teacher for a given period
exports.suggestSubstitute = async (req, res) => {
  const { day_of_week, period_id, date } = req.query;
  
  try {
    const [freeTeachers] = await pool.query(`
      SELECT u.id, u.name 
      FROM users u
      WHERE u.role = 'Teacher' AND u.status = 'Active'
      AND u.id NOT IN (
        -- Not in regular timetable for this period
        SELECT teacher_id FROM timetables 
        WHERE day_of_week = ? AND period_id = ?
      )
      AND u.id NOT IN (
        -- Not already doing a substitution for this date and period
        SELECT s.substitute_teacher_id 
        FROM substitutions s
        JOIN timetables t ON s.timetable_id = t.id
        WHERE s.date = ? AND t.period_id = ? AND s.status = 'Accepted'
      )
    `, [day_of_week, period_id, date, period_id]);

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
    const message = 'You have been assigned a new substitution class.';
    await pool.query('INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
      [substitute_teacher_id, message, 'SubstitutionAssigned']
    );
    req.io.emit(`notification_${substitute_teacher_id}`, { message });


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
    const [details] = await pool.query(`
      SELECT s.date, p.name as period_name, u.name as teacher_name, t.class_id, sub.name as subject_name
      FROM substitutions s
      JOIN users u ON s.substitute_teacher_id = u.id
      JOIN timetables t ON s.timetable_id = t.id
      JOIN periods p ON t.period_id = p.id
      JOIN subjects sub ON t.subject_id = sub.id
      WHERE s.id = ?
    `, [id]);

    if (details.length === 0) return res.status(404).json({ message: 'Substitution not found' });
    
    const info = details[0];
    const formattedDate = new Date(info.date).toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });

    await pool.query('UPDATE substitutions SET status = "Accepted" WHERE id = ?', [id]);

    req.io.emit('substitution_accepted', { 
      message: `Teacher ${info.teacher_name} accepted the substitution for ${info.period_name} on ${formattedDate}.` 
    });

    const studentMessage = `Class Update: Your ${info.subject_name} class for ${info.period_name} on ${formattedDate} will be taken by ${info.teacher_name}.`;
    req.io.emit(`notification_class_${info.class_id}`, {
      message: studentMessage
    });

    // Persistent notifications for students
    try {
      const [students] = await pool.query('SELECT id, email FROM users WHERE class_id = ? AND role = "Student"', [info.class_id]);
      
      // Bulk insert notifications for students
      if (students.length > 0) {
        const notificationValues = students.map(s => [s.id, studentMessage, 'ClassSubstitution']);
        await pool.query('INSERT INTO notifications (user_id, message, type) VALUES ?', [notificationValues]);
        
        const emails = students.map(s => s.email).filter(e => e);
        if (emails.length > 0) {
          await emailService.sendSubstitutionEmail(emails, info);
        }
      }
    } catch (err) {
      console.error('Failed to notify students:', err);
    }


    res.json({ message: 'Substitution accepted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
