const nodemailer = require('nodemailer');

// Cấu hình transporter (dùng Gmail SMTP – bạn có thể dùng service khác)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // email gửi
    pass: process.env.EMAIL_PASS, // mật khẩu ứng dụng (không phải mật khẩu Gmail thường)
  },
});

// Hàm gửi email
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `"Cửa hàng điện máy" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = sendEmail;