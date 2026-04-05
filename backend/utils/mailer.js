const SibApiV3Sdk = require('sib-api-v3-sdk');

/**
 * Brevo Email Service using HTTP API
 * 
 * Render Free tier blocks SMTP ports (25, 465, 587).
 * Using Brevo's HTTP API to bypass SMTP restrictions.
 * 
 * Required Environment Variables:
 * - BREVO_API_KEY: Your Brevo API key
 * - SMTP_FROM: Verified sender email (e.g., support@charisbilleasy.store)
 * - SUPPORT_EMAIL: Recipient email for enquiries
 */

// Initialize Brevo API client
const defaultClient = SibApiV3Sdk.ApiClient.instance;

/**
 * Configure Brevo API with API Key
 */
const configureApiKey = () => {
  const apiKey = process.env.BREVO_API_KEY;
  
  if (!apiKey) {
    console.error('[Brevo API] Missing BREVO_API_KEY environment variable');
    return false;
  }
  
  const apiV3Key = defaultClient.authentications['api-key'];
  apiV3Key.apiKey = apiKey;
  
  return true;
};

/**
 * Send email using Brevo Transactional Email API
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.textContent - Plain text content
 * @param {string} options.htmlContent - HTML content
 * @param {string} options.replyTo - Reply-to email address
 */
const sendEmailViaAPI = async ({
  to,
  subject,
  textContent,
  htmlContent,
  replyTo
}) => {
  if (!configureApiKey()) {
    throw new Error('BREVO_API_KEY not configured');
  }
  
  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  
  const senderEmail = process.env.SMTP_FROM || 'support@charisbilleasy.store';
  const senderName = 'BillEasy System';
  
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  
  // Set sender (must be verified in Brevo)
  sendSmtpEmail.sender = {
    email: senderEmail,
    name: senderName
  };
  
  // Set recipient
  sendSmtpEmail.to = [{ email: to }];
  
  // Set reply-to
  if (replyTo) {
    sendSmtpEmail.replyTo = {
      email: replyTo
    };
  }
  
  // Set subject
  sendSmtpEmail.subject = subject;
  
  // Set content
  if (htmlContent) {
    sendSmtpEmail.htmlContent = htmlContent;
  }
  if (textContent) {
    sendSmtpEmail.textContent = textContent;
  }
  
  console.log('[Brevo API] Sending email via HTTP API...');
  console.log('[Brevo API] From:', senderEmail);
  console.log('[Brevo API] To:', to);
  console.log('[Brevo API] Subject:', subject);
  
  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('[Brevo API] Email sent successfully! Message ID:', data.messageId);
    return data;
  } catch (error) {
    console.error('[Brevo API] Error sending email:', error.message);
    if (error.response) {
      console.error('[Brevo API] Response:', error.response.text);
    }
    throw error;
  }
};

/**
 * Send enquiry notification email
 * @param {Object} enquiryData - Enquiry data
 */
const sendEnquiryEmail = async (enquiryData) => {
  const { name, phone, email, business_type, message } = enquiryData;
  
  const to = process.env.SUPPORT_EMAIL || 'support@charisbilleasy.store';
  const subject = `New Enquiry from ${name}`;
  
  const textContent = `
NEW ENQUIRY RECEIVED
====================

Name: ${name}
Phone: ${phone}
Email: ${email}
Business Type: ${business_type || 'N/A'}
Message: ${message || 'N/A'}

Submitted: ${new Date().toLocaleString()}

---
This enquiry was submitted via the BillEasy website footer form.
Reply to this email to respond to ${name} at ${email}.
  `;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background: #2563eb; color: white; padding: 20px;">
        <h2 style="margin: 0; font-size: 20px;">New Enquiry Received</h2>
      </div>
      <div style="padding: 20px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151; width: 30%;">Name:</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #111827;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Phone:</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #111827;">${phone}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Email:</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #111827;"><a href="mailto:${email}">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold; color: #374151;">Business Type:</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #111827;">${business_type || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 12px; font-weight: bold; color: #374151; vertical-align: top;">Message:</td>
            <td style="padding: 12px; color: #111827; white-space: pre-wrap;">${message || 'N/A'}</td>
          </tr>
        </table>
      </div>
      <div style="background: #f9fafb; padding: 15px 20px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 0; color: #6b7280; font-size: 12px;">
          Submitted: ${new Date().toLocaleString()}<br>
          Reply to this email to respond directly to ${name}.
        </p>
      </div>
    </div>
  `;
  
  return await sendEmailViaAPI({
    to,
    subject,
    textContent,
    htmlContent,
    replyTo: email
  });
};

/**
 * Test Brevo API configuration
 */
const testApiConfig = async () => {
  try {
    if (!process.env.BREVO_API_KEY) {
      return {
        success: false,
        error: 'BREVO_API_KEY not configured'
      };
    }
    
    const senderEmail = process.env.SMTP_FROM || 'support@charisbilleasy.store';
    const to = process.env.SUPPORT_EMAIL || 'support@charisbilleasy.store';
    
    await sendEmailViaAPI({
      to,
      subject: 'Brevo API Test - BillEasy',
      textContent: `This is a test email sent via Brevo HTTP API at ${new Date().toLocaleString()}`,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #2563eb;">Brevo API Test</h2>
          <p>If you received this email, your Brevo HTTP API configuration is working!</p>
          <p style="color: #6b7280; font-size: 12px;">Time: ${new Date().toLocaleString()}</p>
        </div>
      `
    });
    
    return {
      success: true,
      message: 'Test email sent successfully',
      config: {
        sender: senderEmail,
        recipient: to
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  sendEmailViaAPI,
  sendEnquiryEmail,
  testApiConfig
};
