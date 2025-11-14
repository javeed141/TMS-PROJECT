const nodemailer = require('nodemailer');

let transporter;
let configured = false;

function ensureTransporter() {
  if (configured) return transporter;
  configured = true;

  const {
    SMTP_URI,
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
  } = process.env;

  try {
    if (SMTP_URI) {
      transporter = nodemailer.createTransport(SMTP_URI);
      return transporter;
    }

    if (SMTP_HOST) {
      const port = SMTP_PORT ? Number(SMTP_PORT) : 587;
      const secure = typeof SMTP_SECURE === 'string'
        ? SMTP_SECURE.toLowerCase() === 'true'
        : port === 465;

      transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        secure,
        auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
      });
      return transporter;
    }
  } catch (err) {
    console.error('Failed to configure mail transport:', err);
    transporter = null;
  }

  return transporter;
}

async function sendMail(options = {}) {
  const emails = Array.isArray(options.to)
    ? options.to.filter(Boolean)
    : options.to
    ? [options.to]
    : [];

  if (!emails.length) {
    return { skipped: true, reason: 'no-recipients' };
  }

  const mailOptions = {
    from: process.env.MAIL_FROM || process.env.SMTP_FROM || 'no-reply@tms.local',
    subject: options.subject || 'Notification',
    text: options.text,
    html: options.html,
    to: emails.join(', '),
  };

  const transport = ensureTransporter();

  if (!transport) {
    console.log('[MAIL:FALLBACK]', mailOptions);
    return { mocked: true };
  }

  try {
    const info = await transport.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('sendMail error:', err);
    return { success: false, error: err.message };
  }
}

module.exports = { sendMail };
