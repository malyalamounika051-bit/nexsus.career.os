const { transporter } = require('../config/mail');

const sendEmail = async (options) => {
  console.log('📧 sendEmail() called with:', { email: options.email, subject: options.subject });
  
  // If SMTP is not configured, fallback to console log
  if (!transporter) {
    console.log('--------------------------------------------------');
    console.log(`[MOCK EMAIL] To: ${options.email}`);
    console.log(`[MOCK EMAIL] Subject: ${options.subject}`);
    console.log(`[MOCK EMAIL] Message: \n${options.message}`);
    console.log('--------------------------------------------------');
    console.log('Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS to .env to send real emails');
    return;
  }

  const message = {
    from: `${process.env.FROM_NAME || 'Nexus Career OS'} <${process.env.FROM_EMAIL || 'noreply@nexus.com'}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html, // Optional HTML version
  };

  try {
    console.log('📤 Sending email via SMTP...');
    const info = await transporter.sendMail(message);
    console.log('✅ Email sent successfully! Message ID:', info.messageId);
  } catch (err) {
    console.error('❌ SMTP sendMail error:', err.message);
    throw err;
  }
};

module.exports = sendEmail;
