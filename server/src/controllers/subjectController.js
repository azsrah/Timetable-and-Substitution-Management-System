const pool = require('../config/db');

exports.getAllSubjects = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM subjects ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createSubject = async (req, res) => {
  const { name, code } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO subjects (name, code) VALUES (?, ?)',
      [name, code]
    );
    res.status(201).json({ id: result.insertId, name, code });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    await pool.query('DELETE FROM subjects WHERE id = ?', [req.params.id]);
    res.json({ message: 'Subject deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
