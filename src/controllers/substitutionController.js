// ─────────────────────────────────────────────────────────
// substitutionController.js — Substitution Management Logic
// Handles finding available substitute teachers, assigning
// substitutions, and accepting them with student notifications.
// ─────────────────────────────────────────────────────────

const pool = require('../config/db');
const emailService = require('../utils/emailService');

// ── suggestSubstitute ─────────────────────────────────────
// Finds active teachers who are FREE during a specific period on a given date.
// A teacher is considered free if:
//   - They have no regular class scheduled for that period/day
//   - They are not already assigned as a substitute for that date/period
exports.suggestSubstitute = async (req, res) => {
  const { day_of_week, period_id, date } = req.query;
  
  try {
    const [freeTeachers] = await pool.query(`
      SELECT u.id, u.name 
      FROM users u
      WHERE u.role = 'Teacher' AND u.status = 'Active'
      AND u.id NOT IN (
        -- Exclude teachers who already have a regular class this period/day
        SELECT teacher_id FROM timetables 
        WHERE day_of_week = ? AND period_id = ?
      )
      AND u.id NOT IN (
        -- Exclude teachers already doing a substitution at this date/period
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

// ── assignSubstitution ────────────────────────────────────
// Admin assigns a substitute teacher to cover an absent teacher's class.
// Creates a substitution record in 'Pending' state and immediately
// notifies the substitute teacher via in-app notification and Socket.io.
exports.assignSubstitution = async (req, res) => {
  const { absent_teacher_id, substitute_teacher_id, timetable_id, date } = req.body;
  try {
    // Create the substitution record — starts as Pending until the teacher accepts
    const [result] = await pool.query(
      'INSERT INTO substitutions (absent_teacher_id, substitute_teacher_id, timetable_id, date, status) VALUES (?, ?, ?, ?, "Pending")',
      [absent_teacher_id, substitute_teacher_id, timetable_id, date]
    );

    // Save a persistent notification for the substitute teacher in the database
    const message = 'You have been assigned a new substitution class.';
    await pool.query('INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
      [substitute_teacher_id, message, 'SubstitutionAssigned']
    );

    // Also send a real-time pop-up notification via Socket.io
    req.io.emit(`notification_${substitute_teacher_id}`, { message });

    res.status(201).json({ message: 'Substitution assigned successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── getAllSubstitutions ───────────────────────────────────
// Returns all substitution records for the admin overview,
// including teacher names, subject, class, period, and status.
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

// ── getTeacherSubstitutions ───────────────────────────────
// Returns all substitutions assigned to a specific teacher,
// showing which absent teacher they're covering for and the class details.
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
      WHERE s.substitute_teacher_id = ?  -- Only this teacher's assignments
      ORDER BY s.date DESC, p.start_time
    `, [teacherId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── acceptSubstitution ────────────────────────────────────
// Teacher accepts a substitution assignment.
// Updates status to 'Accepted', then:
//   - Emits a real-time admin alert via Socket.io
//   - Sends in-app notifications to all students in the affected class
//   - Sends email notifications to those students
exports.acceptSubstitution = async (req, res) => {
  const { id } = req.params;
  try {
    // Fetch the substitution details needed for the notification messages
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

    // Format the date nicely for the notification message (e.g. "15 Jan 2024")
    const formattedDate = new Date(info.date).toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });

    // Mark the substitution as accepted in the database
    await pool.query('UPDATE substitutions SET status = "Accepted" WHERE id = ?', [id]);

    // Notify the admin via real-time Socket.io broadcast
    req.io.emit('substitution_accepted', { 
      message: `Teacher ${info.teacher_name} accepted the substitution for ${info.period_name} on ${formattedDate}.` 
    });

    // Build the student-facing notification message
    const studentMessage = `Class Update: Your ${info.subject_name} class for ${info.period_name} on ${formattedDate} will be taken by ${info.teacher_name}.`;

    // Emit a class-specific socket event so students get a real-time pop-up
    req.io.emit(`notification_class_${info.class_id}`, {
      message: studentMessage
    });

    // Persist notifications and send emails to all students in the class
    try {
      const [students] = await pool.query('SELECT id, email FROM users WHERE class_id = ? AND role = "Student"', [info.class_id]);
      
      if (students.length > 0) {
        // Bulk insert — one DB notification row per student
        const notificationValues = students.map(s => [s.id, studentMessage, 'ClassSubstitution']);
        await pool.query('INSERT INTO notifications (user_id, message, type) VALUES ?', [notificationValues]);
        
        // Collect all valid student emails and send a single batch email
        const emails = students.map(s => s.email).filter(e => e);
        if (emails.length > 0) {
          await emailService.sendSubstitutionEmail(emails, info);
        }
      }
    } catch (err) {
      console.error('Failed to notify students:', err);
      // Don't block the response — partial notification failure is acceptable
    }

    res.json({ message: 'Substitution accepted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
