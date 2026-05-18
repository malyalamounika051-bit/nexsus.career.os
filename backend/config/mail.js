const nodemailer = require('nodemailer');

const createTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('⚠️  SMTP not configured — emails will be mock-logged to console.');
    console.log('   Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS to backend/.env');
    return null;
  }

  const port = parseInt(process.env.SMTP_PORT, 10);
  console.log(`📧 Creating SMTP transporter for host: ${process.env.SMTP_HOST}:${port}`);

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,          // true for 465 (SSL), false for 587 (STARTTLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,   // Allow self-signed certs in dev
    },
  });

  // Verify connection on startup (non-blocking)
  transport.verify()
    .then(() => console.log('✅ SMTP connection verified — emails are live!'))
    .catch((err) => console.error('❌ SMTP connection failed:', err.message));

  return transport;
};

const transporter = createTransporter();
console.log('📊 Transporter object:', transporter ? 'CREATED ✅' : 'NULL ❌');

module.exports = { transporter, createTransporter };
