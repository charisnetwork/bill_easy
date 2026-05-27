const { EWayBill, Invoice, Customer, Company, sequelize } = require('../models');

const getEWayBills = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await EWayBill.findAndCountAll({
      where: { company_id: req.companyId },
      include: [
        { model: Invoice, include: [Customer] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      ewayBills: rows,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch E-Way bills' });
  }
};

const generateEWayBill = async (req, res) => {
  try {
    const { 
      invoice_id, 
      transporter_name, 
      transporter_id, 
      vehicle_number, 
      from_place, 
      to_place, 
      distance 
    } = req.body;

    let invoice = null;
    if (invoice_id) {
      invoice = await Invoice.findOne({
        where: { id: invoice_id, company_id: req.companyId }
      });
      if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    }

    // Real API integration would go here (e.g., NIC/GST Portal)
    // For now, we simulate success
    const ewayBillNumber = `EW${Math.floor(100000000000 + Math.random() * 900000000000)}`;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + Math.max(1, Math.ceil(distance / 100)));

    const ewayBill = await EWayBill.create({
      company_id: req.companyId,
      invoice_id: invoice_id || null,
      eway_bill_number: ewayBillNumber,
      valid_until: validUntil,
      transporter_name,
      transporter_id,
      vehicle_number,
      from_place,
      to_place,
      distance,
      status: 'active'
    });

    res.status(201).json({
      message: 'E-Way bill generated successfully',
      ewayBill
    });
  } catch (error) {
    console.error('E-Way bill error:', error);
    res.status(500).json({ error: 'Failed to generate E-Way bill: ' + error.message });
  }
};

const getEWayBillDetails = async (req, res) => {
  try {
    const ewayBill = await EWayBill.findOne({
      where: { id: req.params.id, company_id: req.companyId },
      include: [
        { model: Invoice, include: [Customer] },
        { model: Company }
      ]
    });
    if (!ewayBill) return res.status(404).json({ error: 'E-Way bill not found' });
    res.json(ewayBill);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch E-Way bill details' });
  }
};

const downloadEWayBillPdf = async (req, res) => {
  // Since E-way bills are usually official documents from government, 
  // we normally would download the official JSON/PDF.
  // For this prototype, we'll generate a professional summary.
  try {
    const ewayBill = await EWayBill.findOne({
      where: { id: req.params.id, company_id: req.companyId },
      include: [{ model: Invoice, include: [Customer] }]
    });

    if (!ewayBill) return res.status(404).json({ error: 'E-Way bill not found' });

    // Placeholder for real PDF logic
    res.status(200).json({ message: "PDF download feature for E-Way bill is coming soon. Use the E-way bill number on the GST portal for now." });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process request' });
  }
};

module.exports = {
  getEWayBills,
  generateEWayBill,
  getEWayBillDetails,
  downloadEWayBillPdf
};
