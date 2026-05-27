const { Quotation, QuotationItem, Product, Customer, Godown, Company, sequelize } = require("../models");
const { generateQuotationPdf } = require("../services/quotationPdfService");
const { generateQuotationNumber, peekQuotationNumber } = require("../services/invoiceNumberService");

const getQuotations = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = { company_id: req.companyId };
    if (status) where.status = status;

    const { count, rows } = await Quotation.findAndCountAll({
      where,
      include: [
        { model: Customer, attributes: ['name', 'phone'] },
        { model: Godown, attributes: ['name'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true
    });

    res.json({
      quotations: rows,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    // Error logged
    res.status(500).json({ error: "Failed to fetch quotations" });
  }
};

const getQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findOne({
      where: { id: req.params.id, company_id: req.companyId },
      include: [
        { model: Customer },
        { model: Godown },
        { model: QuotationItem, as: 'items', include: [Product] }
      ]
    });

    if (!quotation) return res.status(404).json({ error: "Quotation not found" });
    res.json(quotation);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch quotation" });
  }
};

const getNextQuotationNumber = async (req, res) => {
  try {
    const quotationNumber = await peekQuotationNumber(req.companyId);
    res.json({ quotation_number: quotationNumber });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate quotation number" });
  }
};

const createQuotation = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      customer_id,
      godown_id,
      quotation_number,
      quotation_date,
      valid_until,
      items,
      notes,
      terms,
      industry_metadata
    } = req.body;

    const qNumber = quotation_number || await generateQuotationNumber(req.companyId, transaction);

    let finalGodownId = godown_id;
    if (!finalGodownId) {
      const defaultGodown = await Godown.findOne({
        where: { company_id: req.companyId, is_default: true },
        transaction
      });
      finalGodownId = defaultGodown ? defaultGodown.id : null;
    }

    let subtotal = 0;
    let tax_amount = 0;
    let total_amount = 0;

    // Calculate totals first
    const processedItems = items.map(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      const taxRate = parseFloat(item.tax_rate) || 0;
      
      const itemSubtotal = qty * price;
      const itemTax = (itemSubtotal * taxRate) / 100;
      const itemTotal = itemSubtotal + itemTax;

      subtotal += itemSubtotal;
      tax_amount += itemTax;
      total_amount += itemTotal;

      return { ...item, quantity: qty, unit_price: price, tax_rate: taxRate, tax_amount: itemTax, total: itemTotal };
    });

    const quotation = await Quotation.create({
      company_id: req.companyId,
      customer_id: customer_id || null,
      godown_id: finalGodownId,
      quotation_number: qNumber,
      quotation_date: quotation_date || new Date(),
      valid_until: valid_until || null,
      notes,
      terms,
      industry_metadata: industry_metadata || {},
      status: 'draft',
      subtotal: subtotal.toFixed(2),
      tax_amount: tax_amount.toFixed(2),
      total_amount: total_amount.toFixed(2)
    }, { transaction });

    for (const item of processedItems) {
      await QuotationItem.create({
        quotation_id: quotation.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        tax_amount: item.tax_amount,
        total: item.total,
        description: item.description
      }, { transaction });
    }

    await transaction.commit();
    res.status(201).json(quotation);
  } catch (error) {
    if (transaction) await transaction.rollback();
    // Error logged
    res.status(500).json({ error: "Failed to create quotation: " + error.message });
  }
};

const updateQuotation = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      customer_id,
      godown_id,
      quotation_date,
      valid_until,
      status,
      items,
      notes,
      terms,
      industry_metadata
    } = req.body;

    const quotation = await Quotation.findOne({
      where: { id, company_id: req.companyId }
    });

    if (!quotation) return res.status(404).json({ error: "Quotation not found" });

    await QuotationItem.destroy({ where: { quotation_id: id }, transaction });

    let subtotal = 0;
    let tax_amount = 0;
    let total_amount = 0;

    const processedItems = items.map(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      const taxRate = parseFloat(item.tax_rate) || 0;

      const itemSubtotal = qty * price;
      const itemTax = (itemSubtotal * taxRate) / 100;
      const itemTotal = itemSubtotal + itemTax;

      subtotal += itemSubtotal;
      tax_amount += itemTax;
      total_amount += itemTotal;

      return { ...item, quantity: qty, unit_price: price, tax_rate: taxRate, tax_amount: itemTax, total: itemTotal };
    });

    for (const item of processedItems) {
      await QuotationItem.create({
        quotation_id: quotation.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        tax_amount: item.tax_amount,
        total: item.total,
        description: item.description
      }, { transaction });
    }

    let finalGodownId = godown_id || quotation.godown_id;
    if (!finalGodownId) {
      const defaultGodown = await Godown.findOne({
        where: { company_id: req.companyId, is_default: true },
        transaction
      });
      finalGodownId = defaultGodown ? defaultGodown.id : null;
    }

    await quotation.update({
      customer_id: customer_id || null,
      godown_id: finalGodownId,
      quotation_date,
      valid_until: valid_until || null,
      status,
      notes,
      terms,
      industry_metadata: industry_metadata || {},
      subtotal: subtotal.toFixed(2),
      tax_amount: tax_amount.toFixed(2),
      total_amount: total_amount.toFixed(2)
    }, { transaction });

    await transaction.commit();
    res.json(quotation);
  } catch (error) {
    if (transaction) await transaction.rollback();
    // Error logged
    res.status(500).json({ error: "Failed to update quotation: " + error.message });
  }
};

const deleteQuotation = async (req, res) => {
  try {
    const result = await Quotation.destroy({
      where: { id: req.params.id, company_id: req.companyId }
    });
    if (!result) return res.status(404).json({ error: "Quotation not found" });
    res.json({ message: "Quotation deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete quotation" });
  }
};

const downloadQuotationPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await Quotation.findOne({
      where: { id, company_id: req.companyId },
      include: [
        { model: Customer },
        { model: QuotationItem, as: 'items', include: [Product] }
      ]
    });

    if (!quotation) return res.status(404).json({ error: "Quotation not found" });

    const company = await Company.findByPk(req.companyId);
    const pdfBuffer = await generateQuotationPdf(quotation, company);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=quotation_${quotation.quotation_number}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    // Error logged
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

module.exports = {
  getQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  getNextQuotationNumber,
  deleteQuotation,
  downloadQuotationPdf
};
