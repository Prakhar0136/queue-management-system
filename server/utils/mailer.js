const nodemailer = require("nodemailer");

// ✅ SAFE: Uses Environment Variables (No passwords visible in code)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS 
  }
});

const sendNotification = (email, token, service) => {
  const mailOptions = {
    from: '"Smart Queue System" <no-reply@queue.com>',
    to: email,
    subject: `It's your turn! Token #${token}`,
    text: `Hello, \n\nYour Token #${token} for ${service} is now being served. Please proceed to the counter.\n\nThank you.`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error sending email:", error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

module.exports = sendNotification;