const { Enquiry } = require("../models");
const { sendEnquiryEmail, testApiConfig } = require("../utils/mailer");

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

    // --- Email Forwarding Logic using Brevo HTTP API ---
    // Render Free tier blocks SMTP ports, so we use Brevo's HTTP API instead
    try {
      console.log(`>>> [Brevo API] Sending enquiry email via HTTP API...`);
      await sendEnquiryEmail({ name, phone, email, business_type, message });
      console.log(`>>> [Brevo API] Email sent successfully!`);
    } catch (mailErr) {
      console.error(">>> [Brevo API] Mail Sending Error:", mailErr.message);
      // Log but don't fail the request - enquiry is still saved
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

// Test endpoint to verify Brevo API configuration
exports.testEmailConfig = async (req, res) => {
  try {
    console.log(">>> [Brevo API] Testing email configuration...");
    
    const result = await testApiConfig();
    
    if (result.success) {
      res.json({
        success: true,
        message: "Test email sent successfully via Brevo HTTP API",
        config: result.config,
        note: "If you don't see the email, check your spam folder and verify the sender is authenticated in Brevo."
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        message: "Email configuration test failed",
        hint: "Make sure BREVO_API_KEY is set in your environment variables."
      });
    }
  } catch (error) {
    console.error(">>> [Brevo API] Test Error:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Email configuration test failed"
    });
  }
};
