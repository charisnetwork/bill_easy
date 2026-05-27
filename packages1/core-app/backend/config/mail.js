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

// SMTP Configuration for port 587 (STARTTLS)
const SMTP_CONFIG_587 = {
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 15000, // 15 seconds
  greetingTimeout: 15000,
  socketTimeout: 15000,
  debug: process.env.NODE_ENV === 'development',
  logger: process.env.NODE_ENV === 'development'
};

// SMTP Configuration for port 465 (SSL) - Fallback
const SMTP_CONFIG_465 = {
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: 465,
  secure: true, // Use SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000,
  debug: process.env.NODE_ENV === 'development',
  logger: process.env.NODE_ENV === 'development'
};

const createTransporter = async () => {
  // Validate required environment variables
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('[Mail Config] Missing SMTP configuration:');
    console.error('[Mail Config] SMTP_HOST:', !!process.env.SMTP_HOST);
    console.error('[Mail Config] SMTP_USER:', !!process.env.SMTP_USER);
    console.error('[Mail Config] SMTP_PASS:', !!process.env.SMTP_PASS);
    return null;
  }

  // Try port 587 first (STARTTLS)
  console.log('[Mail Config] Attempting connection on port 587 (STARTTLS)...');
  const transporter587 = nodemailer.createTransport(SMTP_CONFIG_587);
  
  try {
    await transporter587.verify();
    console.log('[Mail Config] Port 587 connection successful!');
    return transporter587;
  } catch (error587) {
    console.error('[Mail Config] Port 587 failed:', error587.message);
    
    // Fallback to port 465 (SSL)
    console.log('[Mail Config] Falling back to port 465 (SSL)...');
    const transporter465 = nodemailer.createTransport(SMTP_CONFIG_465);
    
    try {
      await transporter465.verify();
      console.log('[Mail Config] Port 465 connection successful!');
      return transporter465;
    } catch (error465) {
      console.error('[Mail Config] Port 465 failed:', error465.message);
      console.error('[Mail Config] Both SMTP ports failed. Email will not be sent.');
      return null;
    }
  }
};

/**
 * Create transporter without verification (for immediate use)
 * Use this when you want to send without pre-verification
 */
const createTransporterSync = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('[Mail Config] Missing SMTP configuration');
    return null;
  }

  console.log('[Mail Config] Creating transporter (port 587 STARTTLS)...');
  return nodemailer.createTransport(SMTP_CONFIG_587);
};

/**
 * Get the verified sender email address
 * This MUST be a verified sender in your Brevo account
 */
const getSenderAddress = () => {
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
  createTransporterSync,
  getSenderAddress,
  getRawSenderEmail,
  getSupportEmail,
  SMTP_CONFIG_587,
  SMTP_CONFIG_465
};
