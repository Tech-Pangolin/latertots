const { onRequest } = require('firebase-functions/v2/https');
const corsLib = require('cors');
const nodemailer = require('nodemailer');
const logger = require('firebase-functions/logger');

const cors = corsLib({ origin: true });
const { latertotsEmail, emailPasscode } = require('../config');

exports.sendContactEmail = onRequest({ 
  region: "us-central1", 
  secrets: [
    require('../config').latertotsEmail, 
    require('../config').emailPasscode
  ] 
}, async (req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      res.status(405).json({ success: false, message: "Method Not Allowed" });
      return;
    }

    const { name, email, subject, message } = req.body;

    // Create transporter inside the function where secrets are available
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: latertotsEmail.value(),
        pass: emailPasscode.value(),
      },
    });

    const mailOptions = {
      from: latertotsEmail.value(),
      to: latertotsEmail.value(),
      subject: subject || "New Contact Form Message",
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
    };

    try {
      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: "Email sent successfully!" });
    } catch (error) {
      logger.error("Email send failed", error);
      res.status(500).json({ success: false, message: "Failed to send email" });
    }
  });
});
