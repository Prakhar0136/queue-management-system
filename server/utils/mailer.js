const nodemailer = require("nodemailer");

// ⚠️ REPLACE WITH YOUR REAL CREDENTIALS OR USE ETHEREAL.EMAIL FOR TESTING
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "immortal0136@gmail.com", 
    pass: "jahf xyqu ctmk gyab" 
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