// ─────────────────────────────────────────────────────────
// emailService.js — Email Sending Utility
// Handles all outgoing emails: OTP verification and
// substitution notifications sent to students.
// Uses Nodemailer with Gmail as the transport provider.
// ─────────────────────────────────────────────────────────

const nodemailer = require('nodemailer');

// Create a reusable email transport using Gmail credentials from .env
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // The Gmail address used to send emails
    pass: process.env.EMAIL_PASS  // App password (not regular Gmail password)
  }
});

// ── sendOTP ───────────────────────────────────────────────
// Sends a 6-digit OTP email to the given address.
// Used for:
//   - 'registration': email verification when a student signs up
//   - 'forgot_password': password reset flow
exports.sendOTP = async (email, otp, type) => {
  // Build subject and body based on what type of OTP it is
  const subject = type === 'registration' ? 'Email Verification OTP' : 'Password Reset OTP';
  const text = `Your OTP for ${type === 'registration' ? 'registration' : 'password reset'} is: ${otp}. It will expire in 5 minutes.`;

  const mailOptions = {
    from: process.env.EMAIL_USER, // Sender address
    to: email,                    // Recipient
    subject: subject,
    text: text
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
  } catch (err) {
    console.error('Error sending email:', err);
    throw new Error('Failed to send OTP email');
  }
};

// ── sendSubstitutionEmail ─────────────────────────────────
// Sends a class update email to a list of students when their
// teacher is replaced by a substitute for a specific period.
// Called when a substitute teacher accepts their assignment.
exports.sendSubstitutionEmail = async (emails, info) => {
  // Skip if there are no student emails to notify
  if (!emails || emails.length === 0) return;

  const subject = `Class Update: Substitution for ${info.subject_name}`;

  // Build a friendly notification message for students
  const text = `Dear Student,

Please be informed that your ${info.subject_name} class for ${info.period_name} today (${new Date(info.date).toLocaleDateString()}) will be taken by ${info.teacher_name} instead of your regular teacher.

This is an automated notification. Please check your student dashboard for your updated "Today's Schedule".

Best regards,
School Management System`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: emails.join(','),  // Send to all students in a single email (comma-separated)
    subject: subject,
    text: text
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Substitution emails sent to ${emails.length} students`);
  } catch (err) {
    console.error('Error sending substitution emails:', err);
    // Don't throw here — email failure shouldn't break the substitution acceptance
  }
};
