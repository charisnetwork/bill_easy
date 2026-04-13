const axios = require("axios");
const { GstCache } = require("../models");
const { Op } = require("sequelize");

exports.getPincode = async (req, res) => {
  try {
    const { pincode } = req.params;
    
    // Validate pincode
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ error: "Invalid pincode format" });
    }
    
    const response = await axios.get(
      `https://api.postalpincode.in/pincode/${pincode}`,
      { timeout: 5000 }
    );
    
    // Check if API returned valid data
    if (response.data && Array.isArray(response.data) && response.data[0]?.Status === 'Success') {
      return res.json(response.data);
    } else if (response.data?.[0]?.Status === 'Error') {
      return res.status(404).json({ error: "Pincode not found" });
    }
    
    res.json(response.data);
  } catch (error) {
    console.error("Pincode Lookup Error:", error.message);
    res.status(500).json({
      error: "Pincode lookup failed",
      message: error.message
    });
  }
};

exports.getGST = async (req, res) => {
  try {
    const { gst: gstin } = req.params;

    // 1. Check Cache
    const cached = await GstCache.findOne({
      where: {
        gstin,
        expires_at: { [Op.gt]: new Date() }
      }
    });

    if (cached) {
      return res.json(cached.data);
    }

    // 2. Call External API (Using a mock/placeholder as real API key is needed)
    // In a real scenario, we would use Razorpay, Karza, etc.
    // Example: const response = await axios.get(`https://api.karza.in/v3/gst/lookup?gstin=${gstin}`, { headers: { 'x-karza-key': process.env.GST_API_KEY } });
    
    // For this implementation, we simulate a successful lookup for valid-looking GSTINs
    // GSTIN format: 15 characters (2 state, 10 PAN, 1 entity, 1 Z, 1 checksum)
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gstin)) {
      return res.status(400).json({ error: "Invalid GSTIN format" });
    }

    // Mock response data
    const mockData = {
      legal_name: "BILLEASY SOLUTIONS PVT LTD",
      trade_name: "BillEasy",
      address_details: {
        building_name: "Tech Park",
        street: "Main Road",
        location: "HSR Layout",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560102"
      },
      registration_date: "2024-01-01",
      gstin: gstin
    };

    // 3. Save to Cache (Expires in 24 hours)
    const expires_at = new Date();
    expires_at.setHours(expires_at.getHours() + 24);

    await GstCache.upsert({
      gstin,
      data: mockData,
      expires_at
    });

    res.json(mockData);

  } catch (error) {
    console.error("GST Lookup Error:", error);
    res.status(500).json({
      error: "GST lookup failed"
    });
  }
};
