const { Supplier, Purchase, Payment } = require('../models');
const { Op } = require('sequelize');

const getSuppliers = async (req, res) => {
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

    const { count, rows } = await Supplier.findAndCountAll({
      where,
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      suppliers: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    // Error logged
    res.status(500).json({ error: 'Failed to get suppliers' });
  }
};

const getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findOne({
      where: { id: req.params.id, company_id: req.companyId }
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.json(supplier);
  } catch (error) {
    // Error logged
    res.status(500).json({ error: 'Failed to get supplier' });
  }
};

const createSupplier = async (req, res) => {
  try {
    const { name, phone, email, gst_number, address, city, state, pincode } = req.body;

    const supplier = await Supplier.create({
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

    res.status(201).json({ message: 'Supplier created successfully', supplier });
  } catch (error) {
    // Error logged
    res.status(500).json({ error: 'Failed to create supplier' });
  }
};

const updateSupplier = async (req, res) => {
  try {
    const { name, phone, email, gst_number, address, city, state, pincode } = req.body;

    const supplier = await Supplier.findOne({
      where: { id: req.params.id, company_id: req.companyId }
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    await supplier.update({ name, phone, email, gst_number, address, city, state, pincode });
    res.json({ message: 'Supplier updated successfully', supplier });
  } catch (error) {
    // Error logged
    res.status(500).json({ error: 'Failed to update supplier' });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findOne({
      where: { id: req.params.id, company_id: req.companyId }
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const purchaseCount = await Purchase.count({ where: { supplier_id: supplier.id } });
    if (purchaseCount > 0) {
      return res.status(400).json({ error: 'Cannot delete supplier with existing purchases' });
    }

    await supplier.destroy();
    res.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    // Error logged
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
};

const getSupplierLedger = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const supplier = await Supplier.findOne({
      where: { id: req.params.id, company_id: req.companyId }
    });

    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const purchaseWhere = { supplier_id: supplier.id };
    const paymentWhere = { supplier_id: supplier.id };

    if (startDate && endDate) {
      purchaseWhere.bill_date = { [Op.between]: [new Date(startDate), new Date(endDate)] };
      paymentWhere.payment_date = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    const purchases = await Purchase.findAll({
      where: purchaseWhere,
      order: [['bill_date', 'DESC']]
    });

    const payments = await Payment.findAll({
      where: paymentWhere,
      order: [['payment_date', 'DESC']]
    });

    const ledger = [
      ...purchases.map(pur => ({
        type: 'purchase',
        date: pur.bill_date,
        reference: pur.bill_number,
        credit: parseFloat(pur.total_amount),
        debit: 0,
        id: pur.id
      })),
      ...payments.map(pay => ({
        type: 'payment',
        date: pay.payment_date,
        reference: pay.reference_number || 'Payment',
        credit: 0,
        debit: parseFloat(pay.amount),
        id: pay.id
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      supplier,
      ledger,
      outstanding_balance: supplier.outstanding_balance
    });
  } catch (error) {
    // Error logged
    res.status(500).json({ error: 'Failed to get supplier ledger' });
  }
};

module.exports = { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier, getSupplierLedger };
