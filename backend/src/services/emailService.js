/**
 * emailService.js — Sends transactional email via SMTP (Nodemailer).
 * Silently no-ops in dev if SMTP creds aren't configured, so local dev never crashes.
 */
const nodemailer = require('nodemailer');

let transporter = null;
let creatingTestTransport = null;

async function getTransporter() {
  if (transporter) return transporter;

  // Use explicit SMTP creds if provided
  if (process.env.SMTP_USER && process.env.SMTP_USER !== 'your_email@gmail.com') {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    return transporter;
  }

  // In production without SMTP configured, do not send
  if (process.env.NODE_ENV === 'production') return null;

  // In development, create an Ethereal test account for quick local testing
  if (!creatingTestTransport) {
    creatingTestTransport = (async () => {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      console.log('[emailService] Using Ethereal test SMTP account for local email previews');
      return transporter;
    })();
  }

  return creatingTestTransport;
}

async function sendEmail({ to, subject, html }) {
  const t = await getTransporter();
  if (!t) {
    console.log(`[emailService] SMTP not configured — skipped email to ${to}: ${subject}`);
    return { skipped: true };
  }

  const info = await t.sendMail({ from: process.env.EMAIL_FROM || 'no-reply@example.com', to, subject, html });
  // If using Ethereal test account, log a preview URL
  try {
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) console.log(`[emailService] Preview URL: ${preview}`);
  } catch (e) {
    // ignore
  }
  return info;
}

module.exports = { sendEmail };
