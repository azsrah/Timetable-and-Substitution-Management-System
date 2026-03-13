const pool = require('../config/db');

exports.getAllClasses = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM classes ORDER BY grade, section');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

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

exports.deleteClass = async (req, res) => {
  try {
    await pool.query('DELETE FROM classes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Class deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

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
