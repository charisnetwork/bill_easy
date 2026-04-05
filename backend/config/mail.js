const nodemailer = require('nodemailer');

/**
 * Brevo SMTP Configuration
 * 
 * IMPORTANT:
 * - SMTP_USER: Your Brevo login (e.g., a723be001@smtp-brevo.com)
 * - SMTP_FROM: Your verified sender email (e.g., support@charisbilleasy.store)
 * - SMTP_HOST: smtp-relay.brevo.com
 * 
 * The 'from' address must be a verified sender in your Brevo account.
 * The 'auth.user' must be your Brevo SMTP login, not the sender email.
 */

const createTransporter = () => {
  // Validate required environment variables
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('[Mail Config] Missing SMTP configuration:');
    console.error('[Mail Config] SMTP_HOST:', !!process.env.SMTP_HOST);
    console.error('[Mail Config] SMTP_USER:', !!process.env.SMTP_USER);
    console.error('[Mail Config] SMTP_PASS:', !!process.env.SMTP_PASS);
    return null;
  }

  // Brevo SMTP configuration
  const config = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // Use STARTTLS
    auth: {
      // Brevo SMTP login (NOT the sender email)
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
      ciphers: 'SSLv3'
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
  };

  console.log('[Mail Config] Creating transporter with:');
  console.log('[Mail Config] Host:', config.host);
  console.log('[Mail Config] Port:', config.port);
  console.log('[Mail Config] Auth User:', config.auth.user);

  return nodemailer.createTransport(config);
};

/**
 * Get the verified sender email address
 * This MUST be a verified sender in your Brevo account
 */
const getSenderAddress = () => {
  // Use SMTP_FROM env var, or fall back to support@charisbilleasy.store
  // This email MUST be verified in Brevo as a sender identity
  const sender = process.env.SMTP_FROM || 'support@charisbilleasy.store';
  return `"BillEasy System" <${sender}>`;
};

/**
 * Get the raw sender email (without name)
 */
const getRawSenderEmail = () => {
  return process.env.SMTP_FROM || 'support@charisbilleasy.store';
};

/**
 * Get the support/recipient email
 */
const getSupportEmail = () => {
  return process.env.SUPPORT_EMAIL || 'support@charisbilleasy.store';
};

module.exports = {
  createTransporter,
  getSenderAddress,
  getRawSenderEmail,
  getSupportEmail
};
