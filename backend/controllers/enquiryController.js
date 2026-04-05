const { Enquiry } = require("../models");
const nodemailer = require("nodemailer");

exports.createEnquiry = async (req, res) => {
  try {
    const { name, phone, email, business_type, message } = req.body;

    if (!name || !phone || !email) {
      return res.status(400).json({ error: "Name, Phone Number, and Email are required." });
    }

    const enquiry = await Enquiry.create({
      name,
      phone,
      email,
      business_type,
      message: message || '',
      status: 'pending'
    });

    console.log(`>>> New Lead Generated: ${name} (${phone})`);

    // --- Email Forwarding Logic ---
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        console.log(`>>> [Brevo] Configuring SMTP with host: ${process.env.SMTP_HOST}`);
        
        // Brevo SMTP configuration - Alternative ports for Render compatibility
        // Try port 587 with STARTTLS first, fallback to 2525 or 465
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: 2525, // Alternative port that often works on Render
          secure: false, // false for STARTTLS
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false,
            ciphers: 'SSLv3'
          },
          connectionTimeout: 15000, // 15 seconds
          greetingTimeout: 15000,
          socketTimeout: 15000,
          debug: true, // Enable debug logging
          logger: true  // Enable logger
        });

        const mailOptions = {
          from: `"BillEasy Enquiries" <${process.env.SMTP_USER}>`,
          to: process.env.SUPPORT_EMAIL || "support@charisbilleasy.store",
          replyTo: email,
          subject: `New Enquiry from ${name}`,
          text: `
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
          `,
          html: `
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
          `
        };

        console.log(`>>> [Brevo] Attempting to send email to: ${mailOptions.to}`);
        
        const info = await transporter.sendMail(mailOptions);
        console.log(`>>> [Brevo] Email sent successfully! Message ID: ${info.messageId}`);
        console.log(`>>> [Brevo] Response:`, info.response);
        
      } catch (mailErr) {
        console.error(">>> [Brevo] Mail Sending Error:", mailErr.message);
        console.error(">>> [Brevo] Full Error:", mailErr);
        // Log but don't fail the request - enquiry is still saved
      }
    } else {
      console.warn(">>> [Brevo] SMTP credentials missing. Email notification skipped.");
      console.warn(">>> [Brevo] Required: SMTP_HOST, SMTP_USER, SMTP_PASS");
    }

    res.status(201).json({
      message: "Thank you! Our team will contact you soon.",
      data: enquiry
    });
  } catch (error) {
    console.error(">>> Enquiry Error:", error.message);
    console.error(">>> Enquiry Full Error:", error);
    res.status(500).json({ error: "Failed to submit enquiry. Please try again later." });
  }
};

// Test endpoint to verify email configuration with multiple ports
exports.testEmailConfig = async (req, res) => {
  const results = [];
  
  const testConfigs = [
    { port: 587, secure: false, name: 'STARTTLS (587)' },
    { port: 2525, secure: false, name: 'Alternative (2525)' },
    { port: 465, secure: true, name: 'SSL (465)' }
  ];

  for (const config of testConfigs) {
    try {
      console.log(`>>> [Brevo] Testing ${config.name}...`);
      
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: config.port,
        secure: config.secure,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3'
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000
      });

      const testEmail = process.env.SUPPORT_EMAIL || "support@charisbilleasy.store";
      const info = await transporter.sendMail({
        from: `"BillEasy Test" <${process.env.SMTP_USER}>`,
        to: testEmail,
        subject: `SMTP Test - ${config.name}`,
        text: `Test email via port ${config.port} at ${new Date().toLocaleString()}`
      });
      
      results.push({
        config: config.name,
        port: config.port,
        success: true,
        messageId: info.messageId
      });
      
      console.log(`>>> [Brevo] ${config.name} SUCCESS!`);
      
    } catch (error) {
      console.error(`>>> [Brevo] ${config.name} FAILED:`, error.message);
      results.push({
        config: config.name,
        port: config.port,
        success: false,
        error: error.message
      });
    }
  }

  const anySuccess = results.some(r => r.success);
  
  res.json({
    overall: anySuccess ? 'SUCCESS' : 'ALL_FAILED',
    results: results,
    recommendation: anySuccess 
      ? 'Use the successful configuration'
      : 'All SMTP configurations failed. Check Brevo account or use alternative email service.'
  });
};
