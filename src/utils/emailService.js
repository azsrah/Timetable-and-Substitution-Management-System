const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendOTP = async (email, otp, type) => {
  const subject = type === 'registration' ? 'Email Verification OTP' : 'Password Reset OTP';
  const text = `Your OTP for ${type === 'registration' ? 'registration' : 'password reset'} is: ${otp}. It will expire in 5 minutes.`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
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

exports.sendSubstitutionEmail = async (emails, info) => {
  if (!emails || emails.length === 0) return;

  const subject = `Class Update: Substitution for ${info.subject_name}`;
  const text = `Dear Student,

Please be informed that your ${info.subject_name} class for ${info.period_name} today (${new Date(info.date).toLocaleDateString()}) will be taken by ${info.teacher_name} instead of your regular teacher.

This is an automated notification. Please check your student dashboard for your updated "Today's Schedule".

Best regards,
School Management System`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: emails.join(','), 
    subject: subject,
    text: text
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Substitution emails sent to ${emails.length} students`);
  } catch (err) {
    console.error('Error sending substitution emails:', err);
  }
};
