const { Enquiry } = require("../models");

exports.createEnquiry = async (req, res) => {
  try {
    const { name, phone, email, business_type, message } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: "Name and Phone Number are required." });
    }

    const enquiry = await Enquiry.create({
      name,
      phone,
      email,
      business_type,
      message,
      status: 'pending'
    });

    // New lead generated

    res.status(201).json({
      message: "Thank you! Our team will contact you soon.",
      data: enquiry
    });
  } catch (error) {
    // Error logged
    res.status(500).json({ error: "Failed to submit enquiry. Please try again later." });
  }
};
