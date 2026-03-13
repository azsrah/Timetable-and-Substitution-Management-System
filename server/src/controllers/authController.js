const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({ message: 'Account is inactive or pending approval' });
    }

    const payload = {
      id: user.id,
      role: user.role,
      name: user.name
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email, class_id: user.class_id } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.registerStudent = async (req, res) => {
    const { name, email, password, contact_info, class_id } = req.body;
  try {
    // Check if email exists
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // Student registration might need admin approval, so default status = Inactive initially, 
    // but requirement says "approve students" for Admin, so we set to 'Inactive'.
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role, contact_info, class_id, status) 
       VALUES (?, ?, ?, 'Student', ?, ?, 'Inactive')`,
      [name, email, passwordHash, contact_info, class_id]
    );

    res.status(201).json({ message: 'Student registered successfully. Waiting for Admin approval.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, role, contact_info, class_id, is_temporary_teacher, status FROM users WHERE id = ?', [req.user.id]);
    if(rows.length === 0) return res.status(404).json({message: 'User not found'});
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
