const pool = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, role, status, is_temporary_teacher FROM users WHERE role != "Admin" ORDER BY role, name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createTeacher = async (req, res) => {
  const { name, email, password, is_temporary_teacher } = req.body;
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (name, email, password_hash, role, status, is_temporary_teacher) VALUES (?, ?, ?, "Teacher", "Active", ?)',
      [name, email, passwordHash, is_temporary_teacher || false]
    );
    res.status(201).json({ message: 'Teacher created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateUserStatus = async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'User status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
