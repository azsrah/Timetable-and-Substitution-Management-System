// ─────────────────────────────────────────────────────────
// classController.js — Class & Subject Assignment Logic
// Manages school classes and links subjects to them.
// ─────────────────────────────────────────────────────────

const pool = require('../config/db');

// ── getAllClasses ─────────────────────────────────────────
// Returns all classes sorted by grade then section.
// Used by dropdowns in the timetable editor and registration form.
exports.getAllClasses = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM classes ORDER BY grade, section');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── createClass ───────────────────────────────────────────
// Adds a new class (e.g. Grade 10, Section A, Room 101).
// Returns the newly created record including its generated ID.
exports.createClass = async (req, res) => {
  const { grade, section, room_number } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO classes (grade, section, room_number) VALUES (?, ?, ?)',
      [grade, section, room_number]
    );
    res.status(201).json({ id: result.insertId, grade, section, room_number });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── deleteClass ───────────────────────────────────────────
// Deletes a class and all its associated timetable entries
// (foreign key CASCADE ensures related data is cleaned up).
exports.deleteClass = async (req, res) => {
  try {
    await pool.query('DELETE FROM classes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Class deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── assignSubjectToClass ──────────────────────────────────
// Links a subject and an optional teacher to a specific class.
// This forms the curriculum — which subjects a class studies and who teaches them.
exports.assignSubjectToClass = async (req, res) => {
  const { classId } = req.params;
  const { subject_id, assigned_teacher_id } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO class_subjects (class_id, subject_id, assigned_teacher_id) VALUES (?, ?, ?)',
      [classId, subject_id, assigned_teacher_id]
    );
    res.status(201).json({ message: 'Subject assigned successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
