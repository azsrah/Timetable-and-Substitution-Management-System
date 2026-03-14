const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('../utils/emailService');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

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

    if (user.role === 'Student' && user.email_verified === 0) {
      return res.status(403).json({ message: 'Please verify your email before logging in' });
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
      if (existing[0].email_verified === 1) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      // If found but unverified, update info and send new OTP
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE users SET name = ?, password_hash = ?, contact_info = ?, class_id = ? WHERE email = ?`,
        [name, passwordHash, contact_info, class_id, email]
      );

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      await pool.query(
        'INSERT INTO otps (email, otp, expires_at, type) VALUES (?, ?, ?, "registration")',
        [email, otp, expiresAt]
      );
      await emailService.sendOTP(email, otp, 'registration');

      return res.json({ 
        message: 'Account exists but is not verified. A new OTP has been sent.',
        email: email 
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Default status is Inactive. email_verified is 0 by default.
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, contact_info, class_id, status) 
       VALUES (?, ?, ?, 'Student', ?, ?, 'Inactive')`,
      [name, email, passwordHash, contact_info, class_id]
    );

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await pool.query(
      'INSERT INTO otps (email, otp, expires_at, type) VALUES (?, ?, ?, "registration")',
      [email, otp, expiresAt]
    );

    await emailService.sendOTP(email, otp, 'registration');

    res.status(201).json({ 
      message: 'Student registered. Please verify your email with the OTP sent.',
      email: email 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verifyEmail = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const [otpRows] = await pool.query(
      'SELECT * FROM otps WHERE email = ? AND otp = ? AND type = "registration" AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );

    if (otpRows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    await pool.query('UPDATE users SET email_verified = 1 WHERE email = ?', [email]);
    await pool.query('DELETE FROM otps WHERE email = ? AND type = "registration"', [email]);

    res.json({ message: 'Email verified successfully. Waiting for Admin approval.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const [userRows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User with this email not found' });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await pool.query(
      'INSERT INTO otps (email, otp, expires_at, type) VALUES (?, ?, ?, "forgot_password")',
      [email, otp, expiresAt]
    );

    await emailService.sendOTP(email, otp, 'forgot_password');

    res.json({ message: 'Password reset OTP sent to your email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const [otpRows] = await pool.query(
      'SELECT * FROM otps WHERE email = ? AND otp = ? AND type = "forgot_password" AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );

    if (otpRows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [passwordHash, email]);
    await pool.query('DELETE FROM otps WHERE email = ? AND type = "forgot_password"', [email]);

    res.json({ message: 'Password reset successful. You can now login.' });
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
