const { Customer, Invoice, Payment, sequelize } = require('../models');
const { Op } = require('sequelize');

const getCustomers = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = { company_id: req.companyId };
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await Customer.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      customers: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    // Error logged
    res.status(500).json({ error: 'Failed to get customers' });
  }
};

const getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: { id: req.params.id, company_id: req.companyId }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customer);
  } catch (error) {
    // Error logged
    res.status(500).json({ error: 'Failed to get customer' });
  }
};

const createCustomer = async (req, res) => {
  try {
    const { name, phone, email, gst_number, address, city, state, pincode } = req.body;

    const customer = await Customer.create({
      company_id: req.companyId,
      name,
      phone,
      email,
      gst_number,
      address,
      city,
      state,
      pincode
    });

    res.status(201).json({ message: 'Customer created successfully', customer });
  } catch (error) {
    // Error logged
    res.status(500).json({ error: 'Failed to create customer' });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { name, phone, email, gst_number, address, city, state, pincode } = req.body;

    const customer = await Customer.findOne({
      where: { id: req.params.id, company_id: req.companyId }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await customer.update({ name, phone, email, gst_number, address, city, state, pincode });
    res.json({ message: 'Customer updated successfully', customer });
  } catch (error) {
    // Error logged
    res.status(500).json({ error: 'Failed to update customer' });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      where: { id: req.params.id, company_id: req.companyId }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Check if customer has invoices
    const invoiceCount = await Invoice.count({ where: { customer_id: customer.id } });
    if (invoiceCount > 0) {
      return res.status(400).json({ error: 'Cannot delete customer with existing invoices' });
    }

    await customer.destroy();
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    // Error logged
    res.status(500).json({ error: 'Failed to delete customer' });
  }
};

const getCustomerLedger = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const customer = await Customer.findOne({
      where: { id: req.params.id, company_id: req.companyId }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const invoiceWhere = { customer_id: customer.id };
    const paymentWhere = { customer_id: customer.id };

    if (startDate && endDate) {
      invoiceWhere.invoice_date = { [Op.between]: [new Date(startDate), new Date(endDate)] };
      paymentWhere.payment_date = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    const invoices = await Invoice.findAll({
      where: invoiceWhere,
      order: [['invoice_date', 'DESC']]
    });

    const payments = await Payment.findAll({
      where: paymentWhere,
      order: [['payment_date', 'DESC']]
    });

    // Combine and sort by date
    const ledger = [
      ...invoices.map(inv => ({
        type: 'invoice',
        date: inv.invoice_date,
        reference: inv.invoice_number,
        debit: parseFloat(inv.total_amount),
        credit: 0,
        id: inv.id
      })),
      ...payments.map(pay => ({
        type: 'payment',
        date: pay.payment_date,
        reference: pay.reference_number || 'Payment',
        debit: 0,
        credit: parseFloat(pay.amount),
        id: pay.id
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      customer,
      ledger,
      outstanding_balance: customer.outstanding_balance
    });
  } catch (error) {
    // Error logged
    res.status(500).json({ error: 'Failed to get customer ledger' });
  }
};

module.exports = { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer, getCustomerLedger };
