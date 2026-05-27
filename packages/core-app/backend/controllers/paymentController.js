const { Payment, Invoice, Customer, Company, sequelize } = require('../models');
const { Op } = require('sequelize');

const getPayments = async (req, res) => {
  try {
    const { type, customer_id, startDate, endDate, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = { company_id: req.companyId };
    
    if (type) where.payment_type = type;
    if (customer_id) where.customer_id = customer_id;

    if (startDate && endDate) {
      where.payment_date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const { count, rows: payments } = await Payment.findAndCountAll({
      where,
      include: [
        { model: Customer, attributes: ['name', 'phone'] },
        { model: Invoice, attributes: ['invoice_number', 'total_amount'] }
      ],
      order: [['payment_date', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      payments,
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    // Error logged
    res.status(500).json({ error: "Failed to fetch payments" });
  }
};

const createPayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { 
      customer_id, 
      invoice_id, 
      amount, 
      payment_method, 
      payment_date, 
      reference_number, 
      notes,
      payment_type = 'received' 
    } = req.body;

    const payment = await Payment.create({
      company_id: req.companyId,
      customer_id,
      invoice_id,
      payment_type,
      amount,
      payment_method,
      payment_date: payment_date || new Date(),
      reference_number,
      notes
    }, { transaction });

    // Update Invoice if linked
    if (invoice_id && payment_type === 'received') {
      const invoice = await Invoice.findByPk(invoice_id, { transaction });
      if (invoice) {
        const newPaidAmount = parseFloat(invoice.paid_amount || 0) + parseFloat(amount);
        let status = invoice.payment_status;
        
        if (newPaidAmount >= parseFloat(invoice.total_amount)) {
          status = 'paid';
        } else if (newPaidAmount > 0) {
          status = 'partial';
        }
        
        await invoice.update({
          paid_amount: newPaidAmount,
          payment_status: status
        }, { transaction });
      }
    }

    // Update Customer Balance
    if (customer_id && payment_type === 'received') {
      await Customer.decrement('outstanding_balance', {
        by: amount,
        where: { id: customer_id },
        transaction
      });
    }

    await transaction.commit();
    res.status(201).json({
      message: "Payment recorded successfully",
      payment
    });
  } catch (error) {
    await transaction.rollback();
    // Error logged
    res.status(500).json({ error: "Failed to record payment" });
  }
};

const deletePayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const payment = await Payment.findOne({
      where: { id: req.params.id, company_id: req.companyId },
      transaction
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    // Revert Invoice
    if (payment.invoice_id && payment.payment_type === 'received') {
      const invoice = await Invoice.findByPk(payment.invoice_id, { transaction });
      if (invoice) {
        const newPaidAmount = parseFloat(invoice.paid_amount || 0) - parseFloat(payment.amount);
        let status = 'unpaid';
        if (newPaidAmount >= parseFloat(invoice.total_amount)) {
          status = 'paid';
        } else if (newPaidAmount > 0) {
          status = 'partial';
        }
        
        await invoice.update({
          paid_amount: Math.max(0, newPaidAmount),
          payment_status: status
        }, { transaction });
      }
    }

    // Revert Customer Balance
    if (payment.customer_id && payment.payment_type === 'received') {
      await Customer.increment('outstanding_balance', {
        by: payment.amount,
        where: { id: payment.customer_id },
        transaction
      });
    }

    await payment.destroy({ transaction });
    await transaction.commit();
    res.json({ message: "Payment deleted and balances reverted" });
  } catch (error) {
    await transaction.rollback();
    // Error logged
    res.status(500).json({ error: error.message || "Failed to delete payment" });
  }
};

module.exports = {
  getPayments,
  createPayment,
  deletePayment
};
