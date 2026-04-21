// ─────────────────────────────────────────────────────────
// authController.js — Authentication Logic
// Handles user login, student registration, OTP verification,
// password reset, and fetching the current logged-in user.
// ─────────────────────────────────────────────────────────

const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const emailService = require('../utils/emailService');

// Helper: generate a random 6-digit OTP number
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ── login ─────────────────────────────────────────────────
// Authenticates a user by email & password.
// Returns a JWT token and basic user info on success.
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Fetch user along with class info if they're a student
    const [rows] = await pool.query(`
      SELECT u.*, c.grade, c.section 
      FROM users u 
      LEFT JOIN classes c ON u.class_id = c.id 
      WHERE u.email = ?
    `, [email]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];

    // Compare the entered password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Students must verify their email before they can log in
    if (user.role === 'Student' && user.email_verified === 0) {
      return res.status(403).json({ message: 'Please verify your email before logging in' });
    }

    // Block inactive or pending-approval accounts
    if (user.status !== 'Active') {
      return res.status(403).json({ message: 'Account is inactive or pending approval' });
    }

    // Build the JWT payload with just the essentials
    const payload = {
      id: user.id,
      role: user.role,
      name: user.name
    };

    // Sign a token that expires in 1 day
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    // Return the token and safe user details (no password hash)
    res.json({ token, user: { 
      id: user.id, 
      name: user.name, 
      role: user.role, 
      email: user.email, 
      class_id: user.class_id,
      grade: user.grade,
      section: user.section
    } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── registerStudent ───────────────────────────────────────
// Registers a new student account and sends a verification OTP.
// If the email exists but is unverified, it updates the info and resends the OTP.
exports.registerStudent = async (req, res) => {
    const { name, email, password, contact_info, class_id } = req.body;
  try {
    // Check if this email is already in the database
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      if (existing[0].email_verified === 1) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      // Email found but not yet verified — update details and send a new OTP
      const passwordHash = await bcrypt.hash(password, 10);
      await pool.query(
        `UPDATE users SET name = ?, password_hash = ?, contact_info = ?, class_id = ? WHERE email = ?`,
        [name, passwordHash, contact_info, class_id, email]
      );

      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP valid for 5 minutes
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

    // Hash the password before storing it (never store plain text passwords)
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create the student account — status is Inactive until admin approves, email_verified starts as 0
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, contact_info, class_id, status) 
       VALUES (?, ?, ?, 'Student', ?, ?, 'Inactive')`,
      [name, email, passwordHash, contact_info, class_id]
    );

    // Generate and store a time-limited OTP for email verification
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await pool.query(
      'INSERT INTO otps (email, otp, expires_at, type) VALUES (?, ?, ?, "registration")',
      [email, otp, expiresAt]
    );

    // Send the OTP to the student's email
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

// ── verifyEmail ───────────────────────────────────────────
// Validates the OTP entered by the student after registration.
// Marks the user's email as verified on success.
exports.verifyEmail = async (req, res) => {
  const { email, otp } = req.body;
  try {
    // Look for a matching, non-expired OTP for this email
    const [otpRows] = await pool.query(
      'SELECT * FROM otps WHERE email = ? AND otp = ? AND type = "registration" AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );

    if (otpRows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Mark email as verified and clean up the used OTP
    await pool.query('UPDATE users SET email_verified = 1 WHERE email = ?', [email]);
    await pool.query('DELETE FROM otps WHERE email = ? AND type = "registration"', [email]);

    res.json({ message: 'Email verified successfully. Waiting for Admin approval.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── forgotPassword ────────────────────────────────────────
// Initiates the password reset flow by sending a reset OTP
// to the user's registered email address.
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    // Make sure this email belongs to an existing user
    const [userRows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User with this email not found' });
    }

    // Generate and store the reset OTP (valid for 5 minutes)
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

// ── resetPassword ─────────────────────────────────────────
// Completes password reset by verifying the OTP and updating
// the user's password with the new hashed value.
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    // Verify the OTP is correct and hasn't expired
    const [otpRows] = await pool.query(
      'SELECT * FROM otps WHERE email = ? AND otp = ? AND type = "forgot_password" AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [email, otp]
    );

    if (otpRows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Hash the new password before saving
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [passwordHash, email]);

    // Delete the used OTP so it cannot be reused
    await pool.query('DELETE FROM otps WHERE email = ? AND type = "forgot_password"', [email]);

    res.json({ message: 'Password reset successful. You can now login.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── getMe ─────────────────────────────────────────────────
// Returns the full profile of the currently logged-in user.
// Used by the frontend on page load to restore the session.
exports.getMe = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.name, u.email, u.role, u.contact_info, u.class_id, u.is_temporary_teacher, u.status,
             c.grade, c.section
      FROM users u
      LEFT JOIN classes c ON u.class_id = c.id
      WHERE u.id = ?
    `, [req.user.id]); // req.user is set by the verifyToken middleware
    if(rows.length === 0) return res.status(404).json({message: 'User not found'});
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
