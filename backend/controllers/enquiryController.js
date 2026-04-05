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
        console.log(`>>> [Brevo] Configuring SMTP with host: ${process.env.SMTP_HOST}, port: 587`);
        
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2'
          },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 10000
        });

        // IMPORTANT: Brevo requires a verified sender email
        // Using SMTP_USER as from address (this is the Brevo login email)
        // Reply-To is set to the person who submitted the form
        const mailOptions = {
          from: `"BillEasy Enquiries" <${process.env.SMTP_USER}>`,
          to: process.env.SUPPORT_EMAIL || "support@charisbilleasy.store",
          replyTo: email, // Replies go to the person who submitted the form
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

        console.log(`>>> [Brevo] Sending email to: ${mailOptions.to}`);
        console.log(`>>> [Brevo] From: ${mailOptions.from}`);
        console.log(`>>> [Brevo] Reply-To: ${mailOptions.replyTo}`);
        
        const info = await transporter.sendMail(mailOptions);
        console.log(`>>> [Brevo] Email sent successfully! Message ID: ${info.messageId}`);
        console.log(`>>> [Brevo] Accepted by: ${info.accepted?.join(', ')}`);
        console.log(`>>> [Brevo] Rejected: ${info.rejected?.join(', ') || 'none'}`);
        
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

// Test endpoint to verify email configuration
exports.testEmailConfig = async (req, res) => {
  try {
    console.log(">>> [Brevo] Testing email configuration...");
    console.log(">>> [Brevo] SMTP_HOST:", process.env.SMTP_HOST);
    console.log(">>> [Brevo] SMTP_USER:", process.env.SMTP_USER);
    console.log(">>> [Brevo] SMTP_PASS exists:", !!process.env.SMTP_PASS);
    console.log(">>> [Brevo] SUPPORT_EMAIL:", process.env.SUPPORT_EMAIL);

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(400).json({
        success: false,
        error: "SMTP credentials not configured",
        missing: {
          SMTP_HOST: !process.env.SMTP_HOST,
          SMTP_USER: !process.env.SMTP_USER,
          SMTP_PASS: !process.env.SMTP_PASS
        }
      });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    });

    // Send test email
    const testEmail = process.env.SUPPORT_EMAIL || "support@charisbilleasy.store";
    console.log(">>> [Brevo] Sending test email to:", testEmail);
    
    const info = await transporter.sendMail({
      from: `"BillEasy Test" <${process.env.SMTP_USER}>`,
      to: testEmail,
      subject: "SMTP Test - BillEasy",
      text: `This is a test email sent at ${new Date().toLocaleString()}.\n\nIf you received this, your email configuration is working correctly.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb;">SMTP Test Successful</h2>
          <p>This is a test email sent at <strong>${new Date().toLocaleString()}</strong>.</p>
          <p style="background: #dcfce7; padding: 10px; border-radius: 5px; color: #166534;">
            ✓ If you received this, your email configuration is working correctly!
          </p>
          <hr style="margin: 20px 0;">
          <p style="color: #6b7280; font-size: 12px;">
            SMTP User: ${process.env.SMTP_USER}<br>
            Recipient: ${testEmail}
          </p>
        </div>
      `
    });
    
    console.log(">>> [Brevo] Test email sent! Message ID:", info.messageId);

    res.json({
      success: true,
      message: "Test email sent successfully",
      messageId: info.messageId,
      recipient: testEmail,
      sender: process.env.SMTP_USER,
      note: "If you don't receive the email, check: 1) Spam/Junk folder, 2) Brevo sender verification, 3) Email address exists"
    });
  } catch (error) {
    console.error(">>> [Brevo] Test Error:", error.message);
    console.error(">>> [Brevo] Full Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Email test failed"
    });
  }
};
