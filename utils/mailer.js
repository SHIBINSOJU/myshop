const nodemailer = require('nodemailer');

// Configure the transporter (using Gmail for testing)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // This is your Google "App Password"
  },
});

const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: `"YourBrandName" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your One-Time Password (OTP)',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="text-align: center; color: #333;">YourBrandName Login</h2>
        <p style="font-size: 16px;">Hello,</p>
        <p style="font-size: 16px;">Your One-Time Password (OTP) for logging in is:</p>
        <p style="text-align: center; font-size: 24px; font-weight: bold; background: #f4f4f4; padding: 15px; border-radius: 5px; letter-spacing: 2px;">
          ${otp}
        </p>
        <p style="font-size: 16px;">This OTP is valid for <strong>5 minutes</strong>. Please do not share this code with anyone.</p>
        <hr>
        <p style="font-size: 12px; color: #888; text-align: center;">© ${new Date().getFullYear()} YourBrandName</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`Error sending OTP email: ${error}`);
    return false;
  }
};

module.exports = { sendOTPEmail };
