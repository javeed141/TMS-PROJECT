





// let nodemailer = require('nodemailer');

// let transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'javeedshaik7346@gmail.com',
//     pass: 'qlwo uvad ctyr gkbp'
//   }
// });

// let mailOptions = {
//   from: 'javeedshaik7346@gmail.com',
//   to: 'maggi9119@gmail.com',
//   subject: 'Sending Email using Node.js',
//   text: 'That was easy!'
// };

// transporter.sendMail(mailOptions, function(error, info){
//   if (error) {
//     console.log(error);
//   } else {
//     console.log('Email sent: ' + info.response);
//   }
// });
// routes/email.js
// const express = require("express");
// const router = express.Router();
// const nodemailer = require("nodemailer");

// // Use environment variables for credentials (recommended)
// const SMTP_USER = process.env.SMTP_USER;
// const SMTP_PASS = process.env.SMTP_PASS ; // replace with env var in production

// // create transporter (Gmail with app password)
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: SMTP_USER,
//     pass: SMTP_PASS,
//   },
// });

// // Basic health check
// router.get("/ping", (req, res) => {
//   res.json({ ok: true, msg: "email route alive" });
// });

// /**
//  * POST /send
//  * Body: { to, subject, text, html? }
//  */
// router.post("/send", async (req, res) => {
//   try {
//     const { to, subject, text, html } = req.body || {};

//     if (!to || (!text && !html) || !subject) {
//       return res.status(400).json({ ok: false, error: "Missing required fields: to, subject and text/html" });
//     }

//     const mailOptions = {
//       from: SMTP_USER,
//       to,
//       subject,
//       text: text || undefined,
//       html: html || undefined,
//     };

//     // sendMail returns a Promise when not using callback
//     const info = await transporter.sendMail(mailOptions);

//     return res.json({ ok: true, messageId: info.messageId, response: info.response });
//   } catch (err) {
//     console.error("Error sending email:", err);
//     // Do not leak internal stack in production; return safe message
//     return res.status(500).json({ ok: false, error: "Failed to send email" });
//   }
// });

// module.exports = router;
// ./lib/mailer.js
const dotenv = require('dotenv');
dotenv.config();

const nodemailer = require('nodemailer');

const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;
const SMTP_SERVICE =  'gmail';
console.log(SMTP_USER, SMTP_PASS, SMTP_FROM)
if (!SMTP_USER || !SMTP_PASS) {
  console.warn('Mailer: SMTP_USER or SMTP_PASS not set in environment variables.');
}

const transporter = nodemailer.createTransport({
  service: SMTP_SERVICE,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
  // optional pool/limits for production: pool: true, maxConnections, etc.
});

async function sendMail({ to, subject, text, html }) {
  if (!to || !subject || (!text && !html)) {
    throw new Error('sendMail missing required fields: to, subject and text/html');
  }

  const mailOptions = {
    from: "tmsproject@gmail.com",
    to: Array.isArray(to) ? to.join(',') : to,
    subject,
    text,
    html,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}

module.exports = { sendMail, transporter };
