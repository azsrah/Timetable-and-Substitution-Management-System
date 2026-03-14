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
