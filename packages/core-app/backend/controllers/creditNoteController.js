const { CreditNote, CreditNoteItem, Invoice, InvoiceItem, Product, Customer, Company, sequelize } = require('../models');
const { generateCreditNotePdf } = require('../services/creditNotePdfService');

const getCreditNotes = async (req, res) => {
  try {
    const { search, customer_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = { company_id: req.companyId };
    if (customer_id) where.customer_id = customer_id;

    const { count, rows } = await CreditNote.findAndCountAll({
      where,
      include: [
        { model: Customer, attributes: ['name', 'phone'] },
        { model: Invoice, attributes: ['invoice_number'] }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      creditNotes: rows,
      total: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    // Error logged
    res.status(500).json({ error: "Failed to fetch credit notes" });
  }
};

const createCreditNote = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      invoice_id,
      items, // [{ product_id, quantity, unit_price, tax_rate }]
      reason,
      industry_metadata
    } = req.body;

    const invoice = await Invoice.findOne({
      where: { id: invoice_id, company_id: req.companyId },
      include: [{ model: Customer }]
    });

    if (!invoice) throw new Error("Invoice not found");

    const count = await CreditNote.count({ where: { company_id: req.companyId } });
    const creditNoteNumber = `CN-${count + 1001}`;

    let subtotal = 0;
    let tax_amount = 0;
    let total_amount = 0;

    const creditNote = await CreditNote.create({
      company_id: req.companyId,
      customer_id: invoice.customer_id,
      invoice_id: invoice.id,
      credit_note_number: creditNoteNumber,
      reason,
      industry_metadata: industry_metadata || {},
      date: new Date()
    }, { transaction });

    for (const item of items) {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      const taxRate = parseFloat(item.tax_rate) || 0;

      const itemSubtotal = qty * price;
      const itemTax = (itemSubtotal * taxRate) / 100;
      const itemTotal = itemSubtotal + itemTax;

      subtotal += itemSubtotal;
      tax_amount += itemTax;
      total_amount += itemTotal;

      await CreditNoteItem.create({
        credit_note_id: creditNote.id,
        product_id: item.product_id,
        quantity: qty,
        unit_price: price,
        tax_rate: taxRate,
        tax_amount: itemTax,
        total: itemTotal
      }, { transaction });

      const product = await Product.findByPk(item.product_id, { transaction });
      if (product) {
        product.stock_quantity = parseFloat(product.stock_quantity) + qty;
        await product.save({ transaction });
      }
    }

    await creditNote.update({ subtotal, tax_amount, total_amount }, { transaction });

    const balanceDue = parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount);
    if (balanceDue > 0) {
      const reduction = Math.min(balanceDue, total_amount);
      invoice.paid_amount = parseFloat(invoice.paid_amount) + reduction;
      await invoice.save({ transaction });

      const remainingCN = total_amount - reduction;
      if (remainingCN > 0) {
        const customer = await Customer.findByPk(invoice.customer_id, { transaction });
        customer.wallet_balance = parseFloat(customer.wallet_balance || 0) + remainingCN;
        await customer.save({ transaction });
      }
    } else {
      const customer = await Customer.findByPk(invoice.customer_id, { transaction });
      customer.wallet_balance = parseFloat(customer.wallet_balance || 0) + total_amount;
      await customer.save({ transaction });
    }

    await transaction.commit();
    res.status(201).json(creditNote);
  } catch (error) {
    if (transaction) await transaction.rollback();
    res.status(500).json({ error: error.message || "Failed to create credit note" });
  }
};

const downloadCreditNotePdf = async (req, res) => {
  try {
    const creditNote = await CreditNote.findOne({
      where: { id: req.params.id, company_id: req.companyId },
      include: [
        { model: Customer },
        { model: Invoice },
        { model: CreditNoteItem, as: 'items', include: [Product] }
      ]
    });

    if (!creditNote) return res.status(404).json({ error: "Credit Note not found" });

    const company = await Company.findByPk(req.companyId);
    const pdfBuffer = await generateCreditNotePdf(creditNote, company);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=credit_note_${creditNote.credit_note_number}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    // Error logged
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

module.exports = {
  getCreditNotes,
  createCreditNote,
  downloadCreditNotePdf
};
