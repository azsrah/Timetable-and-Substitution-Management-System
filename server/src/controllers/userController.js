// ─────────────────────────────────────────────────────────
// userController.js — User Management Logic
// Handles CRUD operations for teachers and students,
// status updates, password changes, and profile updates.
// ─────────────────────────────────────────────────────────

const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// ── getAllUsers ───────────────────────────────────────────
// Returns all non-admin users (teachers and students) with
// their class info and assigned subjects listed together.
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
      WHERE u.role != "Admin"     -- Exclude admin accounts from user list
      GROUP BY u.id               -- Group so subjects are aggregated per user
      ORDER BY u.role, u.name
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── createTeacher ─────────────────────────────────────────
// Creates a new teacher account and assigns them their subjects.
// Admin can also flag the teacher as temporary.
exports.createTeacher = async (req, res) => {
  const { name, email, password, is_temporary_teacher, subject_ids } = req.body;
  try {
    // Hash the password before storing (security best practice)
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert the new teacher — status is Active immediately (admin creates them directly)
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, status, is_temporary_teacher) VALUES (?, ?, ?, "Teacher", "Active", ?)',
      [name, email, passwordHash, is_temporary_teacher || false]
    );

    const teacherId = result.insertId;

    // If subjects were provided, link them to the teacher
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

// ── updateTeacher ─────────────────────────────────────────
// Updates the teacher's name, email, temporary status, and subjects.
// Password is only updated if a new one is provided.
exports.updateTeacher = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, is_temporary_teacher, subject_ids } = req.body;
  
  try {
    // Build the update query dynamically — only include password if it's being changed
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

    // Replace all subject assignments — remove old ones and re-insert
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

// ── updateUserStatus ──────────────────────────────────────
// Changes a user's status (e.g. 'Active' or 'Inactive').
// Used by admins to approve or deactivate student and teacher accounts.
exports.updateUserStatus = async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ message: 'User status updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── deleteUser ────────────────────────────────────────────
// Permanently removes a user from the database.
// Cascades will delete associated records like timetable slots.
exports.deleteUser = async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ── changePassword ────────────────────────────────────────
// Lets a logged-in user change their own password.
// Requires the current password to confirm identity first.
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id; // Comes from the JWT via verifyToken middleware

  try {
    // Fetch the stored password hash for this user
    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = rows[0];

    // Verify the current password matches before allowing a change
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    // Hash and save the new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newPasswordHash, userId]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── updateProfile ─────────────────────────────────────────
// Lets the logged-in user update their contact information
// (e.g. phone number or address) from their settings page.
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
