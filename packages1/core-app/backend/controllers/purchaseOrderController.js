const { PurchaseOrder, PurchaseOrderItem, Supplier, Product, sequelize } = require('../models');
const { Op } = require('sequelize');

const generatePONumber = async (companyId) => {
  const currentYear = new Date().getFullYear();
  
  const lastPO = await PurchaseOrder.findOne({
    where: { company_id: companyId },
    order: [['created_at', 'DESC']]
  });

  let nextNumber = 1;
  if (lastPO) {
    const match = lastPO.po_number.match(/(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  return `PO-${currentYear}-${String(nextNumber).padStart(5, '0')}`;
};

const getPurchaseOrders = async (req, res) => {
  try {
    const { search, status, supplier_id, startDate, endDate, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = { company_id: req.companyId };

    if (search) {
      where[Op.or] = [
        { po_number: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (status) where.status = status;
    if (supplier_id) where.supplier_id = supplier_id;

    if (startDate && endDate) {
      where.po_date = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    const { count, rows } = await PurchaseOrder.findAndCountAll({
      where,
      include: [{ model: Supplier, attributes: ['id', 'name', 'phone'] }],
      order: [['po_date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      pos: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    // Error logged
    res.status(500).json({ error: 'Failed to get purchase orders' });
  }
};

const getPurchaseOrder = async (req, res) => {
  try {
    const po = await PurchaseOrder.findOne({
      where: { id: req.params.id, company_id: req.companyId },
      include: [
        { model: Supplier },
        { model: PurchaseOrderItem, as: 'items', include: [Product] }
      ]
    });

    if (!po) {
      return res.status(404).json({ error: 'Purchase Order not found' });
    }

    res.json(po);
  } catch (error) {
    // Error logged
    res.status(500).json({ error: 'Failed to get purchase order' });
  }
};

const createPurchaseOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { 
      supplier_id, items, po_date, expected_date, po_number, notes 
    } = req.body;

    const finalPONumber = po_number || await generatePONumber(req.companyId);

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;

    const calculatedItems = items.map(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      const taxRate = parseFloat(item.tax_rate) || 0;
      
      const itemTotal = qty * price;
      const itemTax = (itemTotal * taxRate) / 100;
      
      subtotal += itemTotal;
      taxAmount += itemTax;
      
      return {
        ...item,
        tax_amount: itemTax,
        total: itemTotal + itemTax
      };
    });

    const totalAmount = subtotal + taxAmount;

    const po = await PurchaseOrder.create({
      company_id: req.companyId,
      supplier_id,
      po_number: finalPONumber,
      po_date: po_date || new Date(),
      expected_date: expected_date === "" ? null : expected_date,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      notes,
      status: 'draft'
    }, { transaction: t });

    for (const item of calculatedItems) {
      await PurchaseOrderItem.create({
        purchase_order_id: po.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate || 0,
        tax_amount: item.tax_amount,
        total: item.total
      }, { transaction: t });
    }

    await t.commit();
    res.status(201).json({ message: 'Purchase Order created successfully', po });
  } catch (error) {
    await t.rollback();
    // Error logged
    res.status(500).json({ error: 'Failed to create purchase order' });
  }
};

const updatePurchaseOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { 
      supplier_id, items, po_date, expected_date, po_number, notes, status 
    } = req.body;

    const po = await PurchaseOrder.findOne({
      where: { id, company_id: req.companyId }
    });

    if (!po) {
      return res.status(404).json({ error: 'Purchase Order not found' });
    }

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;

    const calculatedItems = items.map(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      const taxRate = parseFloat(item.tax_rate) || 0;
      
      const itemTotal = qty * price;
      const itemTax = (itemTotal * taxRate) / 100;
      
      subtotal += itemTotal;
      taxAmount += itemTax;
      
      return {
        ...item,
        tax_amount: itemTax,
        total: itemTotal + itemTax
      };
    });

    const totalAmount = subtotal + taxAmount;

    await po.update({
      supplier_id,
      po_number,
      po_date,
      expected_date,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      notes,
      status: status || po.status
    }, { transaction: t });

    await PurchaseOrderItem.destroy({ where: { purchase_order_id: po.id }, transaction: t });

    for (const item of calculatedItems) {
      await PurchaseOrderItem.create({
        purchase_order_id: po.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate || 0,
        tax_amount: item.tax_amount,
        total: item.total
      }, { transaction: t });
    }

    await t.commit();
    res.json({ message: 'Purchase Order updated successfully' });
  } catch (error) {
    await t.rollback();
    // Error logged
    res.status(500).json({ error: 'Failed to update purchase order' });
  }
};

const deletePurchaseOrder = async (req, res) => {
  try {
    const po = await PurchaseOrder.findOne({
      where: { id: req.params.id, company_id: req.companyId }
    });

    if (!po) {
      return res.status(404).json({ error: 'Purchase Order not found' });
    }

    await po.destroy();
    res.json({ message: 'Purchase Order deleted successfully' });
  } catch (error) {
    // Error logged
    res.status(500).json({ error: 'Failed to delete purchase order' });
  }
};

const { generatePurchaseOrderPdf } = require('../services/purchaseOrderPdfService');
const { Company } = require('../models');

const downloadPdf = async (req, res) => {
  try {
    const po = await PurchaseOrder.findOne({
      where: { id: req.params.id, company_id: req.companyId },
      include: [
        { model: Supplier },
        { model: PurchaseOrderItem, as: 'items', include: [Product] }
      ]
    });

    if (!po) {
      return res.status(404).json({ error: 'Purchase Order not found' });
    }

    const company = await Company.findByPk(req.companyId);

    const pdfBuffer = await generatePurchaseOrderPdf(po, company);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=PO_${po.po_number}_${new Date(po.po_date).toISOString().split('T')[0]}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    // Error logged
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
};

module.exports = {
  getPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  downloadPdf
};
