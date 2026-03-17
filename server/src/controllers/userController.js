const pool = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.status, u.is_temporary_teacher,
             c.grade, c.section,
             GROUP_CONCAT(DISTINCT s.name SEPARATOR ', ') as subjects,
             GROUP_CONCAT(DISTINCT s.id SEPARATOR ',') as subject_ids_string
      FROM users u
      LEFT JOIN teacher_subjects ts ON u.id = ts.teacher_id
      LEFT JOIN subjects s ON ts.subject_id = s.id
      LEFT JOIN classes c ON u.class_id = c.id
      WHERE u.role != "Admin"
      GROUP BY u.id
      ORDER BY u.role, u.name
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.createTeacher = async (req, res) => {
  const { name, email, password, is_temporary_teacher, subject_ids } = req.body;
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, status, is_temporary_teacher) VALUES (?, ?, ?, "Teacher", "Active", ?)',
      [name, email, passwordHash, is_temporary_teacher || false]
    );

    const teacherId = result.insertId;

    if (subject_ids && Array.isArray(subject_ids) && subject_ids.length > 0) {
      const tsValues = subject_ids.map(sid => [teacherId, parseInt(sid)]);
      await pool.query('INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES ?', [tsValues]);
    }

    res.status(201).json({ message: 'Teacher created successfully', id: teacherId });
  } catch (err) {
    console.error('Error in createTeacher:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateTeacher = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, is_temporary_teacher, subject_ids } = req.body;
  
  try {
    let updateQuery = 'UPDATE users SET name = ?, email = ?, is_temporary_teacher = ?';
    let updateParams = [name, email, is_temporary_teacher || false];

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updateQuery += ', password_hash = ?';
      updateParams.push(passwordHash);
    }
    
    updateQuery += ' WHERE id = ?';
    updateParams.push(id);

    await pool.query(updateQuery, updateParams);

    await pool.query('DELETE FROM teacher_subjects WHERE teacher_id = ?', [id]);
    
    if (subject_ids && Array.isArray(subject_ids) && subject_ids.length > 0) {
      const tsValues = subject_ids.map(sid => [id, parseInt(sid)]);
      await pool.query('INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES ?', [tsValues]);
    }

    res.json({ message: 'Teacher updated successfully' });
  } catch (err) {
    console.error('Error in updateTeacher:', err);
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

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newPasswordHash, userId]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  const { contact_info } = req.body;
  const userId = req.user.id;
  try {
    await pool.query('UPDATE users SET contact_info = ? WHERE id = ?', [contact_info, userId]);
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
