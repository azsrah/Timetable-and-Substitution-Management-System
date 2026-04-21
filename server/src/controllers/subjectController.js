// ─────────────────────────────────────────────────────────
// subjectController.js — Subject Management Logic
// Handles creating, updating, and deleting school subjects.
// Each subject can optionally require a specific resource type
// (e.g., Science needs a Lab).
// ─────────────────────────────────────────────────────────

const pool = require('../config/db');

// ── getAllSubjects ────────────────────────────────────────
// Returns all subjects sorted alphabetically.
// Used by dropdowns in the timetable editor and class management.
exports.getAllSubjects = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM subjects ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── createSubject ─────────────────────────────────────────
// Creates a new subject with a unique code and optional resource requirement.
// 'required_resource_type' enforces that this subject can only be scheduled
// in a room of that type (e.g., a Lab for Science).
exports.createSubject = async (req, res) => {
  const { name, code, required_resource_type } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO subjects (name, code, required_resource_type) VALUES (?, ?, ?)',
      [name, code, required_resource_type || 'None'] // Default to 'None' if no room type needed
    );
    res.status(201).json({ id: result.insertId, name, code, required_resource_type });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── updateSubject ─────────────────────────────────────────
// Updates an existing subject's name, code, or resource requirement.
exports.updateSubject = async (req, res) => {
  const { id } = req.params;
  const { name, code, required_resource_type } = req.body;
  try {
    await pool.query(
      'UPDATE subjects SET name = ?, code = ?, required_resource_type = ? WHERE id = ?',
      [name, code, required_resource_type || 'None', id]
    );
    res.json({ message: 'Subject updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── deleteSubject ─────────────────────────────────────────
// Deletes a subject. Cascading foreign keys will remove
// related class_subject and timetable entries automatically.
exports.deleteSubject = async (req, res) => {
  try {
    await pool.query('DELETE FROM subjects WHERE id = ?', [req.params.id]);
    res.json({ message: 'Subject deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
