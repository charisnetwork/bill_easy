const { Enquiry } = require("../models");
const { createTransporter, getSenderAddress, getSupportEmail } = require("../config/mail");

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
    const transporter = createTransporter();
    
    if (transporter) {
      try {
        const fromAddress = getSenderAddress();
        const toAddress = getSupportEmail();
        
        console.log(`>>> [Brevo] From: ${fromAddress}`);
        console.log(`>>> [Brevo] To: ${toAddress}`);
        console.log(`>>> [Brevo] Reply-To: ${email}`);

        const mailOptions = {
          from: fromAddress,         // Must be verified sender in Brevo
          to: toAddress,             // Recipient
          replyTo: email,            // Replies go to the person who submitted the form
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

        console.log(`>>> [Brevo] Sending email...`);
        const info = await transporter.sendMail(mailOptions);
        console.log(`>>> [Brevo] Email sent successfully! Message ID: ${info.messageId}`);
        console.log(`>>> [Brevo] Response: ${info.response}`);
        
      } catch (mailErr) {
        console.error(">>> [Brevo] Mail Sending Error:", mailErr.message);
        console.error(">>> [Brevo] Full Error:", mailErr);
        // Log but don't fail the request - enquiry is still saved
      }
    } else {
      console.warn(">>> [Brevo] Transporter not created. Email notification skipped.");
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

// Test endpoint to verify email configuration
exports.testEmailConfig = async (req, res) => {
  try {
    console.log(">>> [Brevo] Testing email configuration...");
    
    const transporter = createTransporter();
    
    if (!transporter) {
      return res.status(400).json({
        success: false,
        error: "SMTP configuration missing",
        required: ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"],
        current: {
          SMTP_HOST: !!process.env.SMTP_HOST,
          SMTP_USER: !!process.env.SMTP_USER,
          SMTP_PASS: !!process.env.SMTP_PASS,
          SMTP_FROM: process.env.SMTP_FROM || 'support@charisbilleasy.store (default)'
        }
      });
    }

    const fromAddress = getSenderAddress();
    const toAddress = getSupportEmail();
    
    console.log(">>> [Brevo] Testing with config:");
    console.log(">>> [Brevo] From:", fromAddress);
    console.log(">>> [Brevo] To:", toAddress);

    const info = await transporter.sendMail({
      from: fromAddress,
      to: toAddress,
      subject: "SMTP Configuration Test - BillEasy",
      text: `This is a test email to verify SMTP configuration.\n\nSent at: ${new Date().toLocaleString()}\nFrom: ${fromAddress}\nTo: ${toAddress}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">SMTP Configuration Test</h2>
          <p>If you received this email, your Brevo SMTP configuration is working correctly!</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>From:</strong> ${fromAddress}</p>
            <p style="margin: 5px 0;"><strong>To:</strong> ${toAddress}</p>
            <p style="margin: 5px 0;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="color: #6b7280; font-size: 12px;">This is an automated test from BillEasy.</p>
        </div>
      `
    });
    
    console.log(">>> [Brevo] Test email sent! Message ID:", info.messageId);

    res.json({
      success: true,
      message: "Test email sent successfully",
      messageId: info.messageId,
      config: {
        from: fromAddress,
        to: toAddress,
        smtpUser: process.env.SMTP_USER,
        smtpHost: process.env.SMTP_HOST
      },
      note: "If you don't see the email, check your spam folder and verify the sender is authenticated in Brevo."
    });
  } catch (error) {
    console.error(">>> [Brevo] Test Error:", error.message);
    console.error(">>> [Brevo] Full Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Email configuration test failed",
      hint: "Make sure 'support@charisbilleasy.store' is added as a verified sender in your Brevo account."
    });
  }
};
