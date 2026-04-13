const { Purchase, PurchaseItem, Supplier, Product, Payment, StockMovement, StockLevel, Godown, sequelize } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');
// Suppress pdf-parse warnings in Node.js 20+
process.env.PDFJS_DISABLE_WORKER = 'true';
const pdf = require('pdf-parse');

const generateBillNumber = async (companyId) => {
  const currentYear = new Date().getFullYear();
  
  const lastPurchase = await Purchase.findOne({
    where: { company_id: companyId },
    order: [['created_at', 'DESC']]
  });

  let nextNumber = 1;
  if (lastPurchase) {
    const match = lastPurchase.bill_number.match(/(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  return `PUR-${currentYear}-${String(nextNumber).padStart(5, '0')}`;
};

const getPurchases = async (req, res) => {
  try {
    const { search, status, payment_status, supplier_id, startDate, endDate, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = { company_id: req.companyId };

    if (search) {
      where[Op.or] = [
        { bill_number: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (status) where.status = status;
    if (payment_status) where.payment_status = payment_status;
    if (supplier_id) where.supplier_id = supplier_id;

    if (startDate && endDate) {
      where.bill_date = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }

    const { count, rows } = await Purchase.findAndCountAll({
      where,
      include: [{ model: Supplier, attributes: ['id', 'name', 'phone'] }],
      order: [['bill_date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      purchases: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({ error: 'Failed to get purchases' });
  }
};

const getPurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findOne({
      where: { id: req.params.id, company_id: req.companyId },
      include: [
        { model: Supplier },
        { model: PurchaseItem, as: 'items', include: [Product] }
      ]
    });

    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    res.json(purchase);
  } catch (error) {
    console.error('Get purchase error:', error);
    res.status(500).json({ error: 'Failed to get purchase' });
  }
};

const createPurchase = async (req, res) => {
  try {
    const { 
      supplier_id, godown_id, items, bill_date, due_date, bill_number, 
      discount_amount, notes, paid_amount, payment_method 
    } = req.body;

    const t = await sequelize.transaction();

    try {
      let finalGodownId = godown_id;
      if (!finalGodownId) {
        const defaultGodown = await Godown.findOne({
          where: { company_id: req.companyId, is_default: true },
          transaction: t
        });
        if (defaultGodown) {
          finalGodownId = defaultGodown.id;
        } else {
          throw new Error("No default godown found. Please create a godown first.");
        }
      }

      const finalBillNumber = bill_number || await generateBillNumber(req.companyId);

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

      const totalAmount = subtotal + taxAmount - (parseFloat(discount_amount) || 0);
      const paid = parseFloat(paid_amount) || 0;
      const paymentStatus = paid >= totalAmount ? 'paid' : (paid > 0 ? 'partial' : 'unpaid');

      const purchase = await Purchase.create({
        company_id: req.companyId,
        supplier_id,
        godown_id: finalGodownId,
        bill_number: finalBillNumber,
        bill_date: bill_date || new Date(),
        due_date: due_date === "" ? null : due_date,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: parseFloat(discount_amount) || 0,
        total_amount: totalAmount,
        paid_amount: paid,
        payment_status: paymentStatus,
        notes,
        status: 'received'
      }, { transaction: t });

      // Create items and update stock
      for (const item of calculatedItems) {
        await PurchaseItem.create({
          purchase_id: purchase.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate || 0,
          tax_amount: item.tax_amount,
          total: item.total
        }, { transaction: t });

        // Update product stock
        const product = await Product.findByPk(item.product_id, { transaction: t });
        if (product) {
          const previousStock = parseFloat(product.stock_quantity);
          const newStock = previousStock + parseFloat(item.quantity);

          await product.update({ stock_quantity: newStock }, { transaction: t });

          // Update Godown specific stock
          if (finalGodownId) {
            const [stockLevel, created] = await StockLevel.findOrCreate({
              where: { product_id: item.product_id, godown_id: finalGodownId, company_id: req.companyId },
              defaults: { quantity: 0 },
              transaction: t
            });
            
            await stockLevel.increment('quantity', {
              by: item.quantity,
              transaction: t
            });
          }

          await StockMovement.create({
            company_id: req.companyId,
            product_id: item.product_id,
            godown_id: finalGodownId || null,
            type: 'in',
            quantity: item.quantity,
            previous_stock: previousStock,
            new_stock: newStock,
            reference_type: 'purchase',
            reference_id: purchase.id
          }, { transaction: t });
        }
      }

      // If payment was made, record it
      if (paid > 0) {
        await Payment.create({
          company_id: req.companyId,
          supplier_id,
          purchase_id: purchase.id,
          payment_type: 'made',
          amount: paid,
          payment_method: payment_method || 'Cash',
          payment_date: bill_date || new Date(),
          notes: 'Automatic payment record for purchase'
        }, { transaction: t });
      }

      // Update supplier balance
      const outstandingIncrease = totalAmount - paid;
      if (outstandingIncrease !== 0) {
        await Supplier.increment('outstanding_balance', {
          by: outstandingIncrease,
          where: { id: supplier_id },
          transaction: t
        });
      }

      await t.commit();

      const fullPurchase = await Purchase.findByPk(purchase.id, {
        include: [
          { model: Supplier },
          { model: PurchaseItem, as: 'items', include: [Product] }
        ]
      });

      res.status(201).json({ message: 'Purchase created successfully', purchase: fullPurchase });
    } catch (error) {
      await t.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Create purchase error:', error);
    res.status(500).json({ error: 'Failed to create purchase' });
  }
};

const deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findOne({
      where: { id: req.params.id, company_id: req.companyId },
      include: [{ model: PurchaseItem, as: 'items' }]
    });

    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    if (purchase.status === 'cancelled') {
      return res.status(400).json({ error: 'Cancelled purchases cannot be deleted again' });
    }

    const t = await sequelize.transaction();

    try {
      for (const item of purchase.items) {
        await Product.decrement('stock_quantity', {
          by: parseFloat(item.quantity),
          where: { id: item.product_id },
          transaction: t
        });
      }

      await Supplier.decrement('outstanding_balance', {
        by: parseFloat(purchase.total_amount),
        where: { id: purchase.supplier_id },
        transaction: t
      });

      await PurchaseItem.destroy({ where: { purchase_id: purchase.id }, transaction: t });
      await purchase.destroy({ transaction: t });

      await t.commit();
      res.json({ message: 'Purchase deleted successfully' });
    } catch (error) {
      await t.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Delete purchase error:', error);
    res.status(500).json({ error: 'Failed to delete purchase' });
  }
};

const recordPayment = async (req, res) => {
  try {
    const { amount, payment_method, reference_number, notes } = req.body;

    const purchase = await Purchase.findOne({
      where: { id: req.params.id, company_id: req.companyId }
    });

    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    const remainingAmount = parseFloat(purchase.total_amount) - parseFloat(purchase.paid_amount);
    if (parseFloat(amount) > remainingAmount) {
      return res.status(400).json({ error: 'Payment amount exceeds remaining balance' });
    }

    const t = await sequelize.transaction();

    try {
      const payment = await Payment.create({
        company_id: req.companyId,
        supplier_id: purchase.supplier_id,
        purchase_id: purchase.id,
        payment_type: 'made',
        amount,
        payment_method,
        reference_number,
        notes
      }, { transaction: t });

      const newPaidAmount = parseFloat(purchase.paid_amount) + parseFloat(amount);
      const newStatus = newPaidAmount >= parseFloat(purchase.total_amount) ? 'paid' : 'partial';

      await purchase.update({
        paid_amount: newPaidAmount,
        payment_status: newStatus
      }, { transaction: t });

      await Supplier.decrement('outstanding_balance', {
        by: parseFloat(amount),
        where: { id: purchase.supplier_id },
        transaction: t
      });

      await t.commit();
      res.json({ message: 'Payment recorded successfully', payment });
    } catch (error) {
      await t.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
};

const updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      supplier_id, godown_id, items, bill_date, due_date, bill_number, 
      discount_amount, notes, status 
    } = req.body;

    const purchase = await Purchase.findOne({
      where: { id, company_id: req.companyId },
      include: [{ model: PurchaseItem, as: 'items' }]
    });

    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    const t = await sequelize.transaction();

    try {
      let finalGodownId = godown_id || purchase.godown_id;
      if (!finalGodownId) {
        const defaultGodown = await Godown.findOne({
          where: { company_id: req.companyId, is_default: true },
          transaction: t
        });
        finalGodownId = defaultGodown ? defaultGodown.id : null;
      }

      // Revert old stock and supplier balance
      for (const item of purchase.items) {
        const product = await Product.findByPk(item.product_id, { transaction: t });
        if (product) {
          const previousStock = parseFloat(product.stock_quantity);
          const newStock = previousStock - parseFloat(item.quantity);
          await product.update({ stock_quantity: newStock }, { transaction: t });
          
          await StockMovement.create({
            company_id: req.companyId,
            product_id: item.product_id,
            type: 'out',
            quantity: item.quantity,
            previous_stock: previousStock,
            new_stock: newStock,
            reference_type: 'purchase_update_revert',
            reference_id: purchase.id
          }, { transaction: t });
        }
      }

      const currentBalanceImpact = parseFloat(purchase.total_amount) - parseFloat(purchase.paid_amount);
      await Supplier.decrement('outstanding_balance', {
        by: currentBalanceImpact,
        where: { id: purchase.supplier_id },
        transaction: t
      });

      // Calculate new totals
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

      const totalAmount = subtotal + taxAmount - (parseFloat(discount_amount) || 0);
      const paymentStatus = parseFloat(purchase.paid_amount) >= totalAmount ? 'paid' : (parseFloat(purchase.paid_amount) > 0 ? 'partial' : 'unpaid');

      // Update purchase
      await purchase.update({
        supplier_id,
        godown_id: finalGodownId,
        bill_number,
        bill_date,
        due_date,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: parseFloat(discount_amount) || 0,
        total_amount: totalAmount,
        payment_status: paymentStatus,
        notes,
        status: status || purchase.status
      }, { transaction: t });

      // Remove old items and create new ones
      await PurchaseItem.destroy({ where: { purchase_id: purchase.id }, transaction: t });

      for (const item of calculatedItems) {
        await PurchaseItem.create({
          purchase_id: purchase.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          tax_rate: item.tax_rate || 0,
          tax_amount: item.tax_amount,
          total: item.total
        }, { transaction: t });

        // Update product stock with new quantities
        const product = await Product.findByPk(item.product_id, { transaction: t });
        if (product) {
          const previousStock = parseFloat(product.stock_quantity);
          const newStock = previousStock + parseFloat(item.quantity);
          await product.update({ stock_quantity: newStock }, { transaction: t });

          await StockMovement.create({
            company_id: req.companyId,
            product_id: item.product_id,
            godown_id: finalGodownId,
            type: 'in',
            quantity: item.quantity,
            previous_stock: previousStock,
            new_stock: newStock,
            reference_type: 'purchase_update',
            reference_id: purchase.id
          }, { transaction: t });
        }
      }

      // Update supplier balance with new amount
      const newBalanceImpact = totalAmount - parseFloat(purchase.paid_amount);
      await Supplier.increment('outstanding_balance', {
        by: newBalanceImpact,
        where: { id: supplier_id },
        transaction: t
      });

      await t.commit();

      const fullPurchase = await Purchase.findByPk(purchase.id, {
        include: [
          { model: Supplier },
          { model: PurchaseItem, as: 'items', include: [Product] }
        ]
      });

      res.json({ message: 'Purchase updated successfully', purchase: fullPurchase });
    } catch (error) {
      await t.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Update purchase error:', error);
    res.status(500).json({ error: 'Failed to update purchase' });
  }
};

const stringSimilarity = require('string-similarity');

const parsePurchasePDF = async (req, res) => {
  try {
    console.log('[parsePurchasePDF] Start');
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const dataBuffer = fs.readFileSync(req.file.path);
    
    // Correct API for pdf-parse v2
    const parser = new pdf.PDFParse({ data: dataBuffer });
    const data = await parser.getText();
    await parser.destroy(); // Always call destroy() to free memory
    
    if (!data || !data.text) {
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(422).json({ error: 'Failed to extract text from PDF.' });
    }

    const text = data.text;
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    const products = await Product.findAll({ where: { company_id: req.companyId } });
    
    let bill_number = '';
    const billMatch = text.match(/(?:Bill|Invoice|No|Number)[:.\s#]+([A-Z0-9\-\/]+)/i);
    if (billMatch) bill_number = billMatch[1];

    let bill_date = '';
    const dateMatch = text.match(/(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/);
    if (dateMatch) bill_date = dateMatch[1];

    const extractedItems = [];
    
    // Improved Line Processing
    for (const line of lines) {
      const cleanLine = line.toLowerCase();
      
      // Try to find numbers (Qty, Rate, Total)
      const numbers = line.match(/(\d+(?:\.\d+)?)/g);
      if (!numbers || numbers.length < 2) continue;

      let matchedProduct = null;
      let matchType = 'none';

      // 1. Try HSN Match first
      const hsnCandidate = numbers.find(n => n.length >= 4 && n.length <= 8);
      if (hsnCandidate) {
        matchedProduct = products.find(p => p.hsn_code === hsnCandidate);
        if (matchedProduct) matchType = 'hsn';
      }

      // 2. Try Fuzzy Name Match if no HSN match
      if (!matchedProduct) {
        const nameCandidates = products.map(p => p.name.toLowerCase());
        if (nameCandidates.length > 0) {
          const { bestMatch } = stringSimilarity.findBestMatch(cleanLine, nameCandidates);
          if (bestMatch.rating > 0.85) {
            matchedProduct = products.find(p => p.name.toLowerCase() === bestMatch.target);
            matchType = 'fuzzy';
          }
        }
      }

      if (matchedProduct || numbers.length >= 3) {
        // Simple heuristic: Qty is usually smaller than Rate
        // This is a very basic extraction and would ideally be improved with layout awareness
        let quantity = parseFloat(numbers[0]);
        let unit_price = parseFloat(numbers[1]);
        
        if (matchedProduct) {
          // If match found, check if price changed
          if (parseFloat(matchedProduct.purchase_price) !== unit_price) {
            await matchedProduct.update({ new_price: unit_price });
          }

          extractedItems.push({
            product_id: matchedProduct.id,
            name: matchedProduct.name,
            quantity,
            unit_price,
            tax_rate: matchedProduct.gst_rate,
            total: quantity * unit_price * (1 + (matchedProduct.gst_rate / 100)),
            match_type: matchType
          });
        } else {
          // Flag for manual creation
          extractedItems.push({
            product_id: null,
            name: line.replace(/[\d.,]+/g, '').trim(), // Rough name extraction
            quantity,
            unit_price,
            tax_rate: 18, // Default
            total: quantity * unit_price * 1.18,
            is_new: true
          });
        }
      }
    }

    // Deduplicate items extracted from the same line or similar lines
    const uniqueItems = [];
    const seen = new Set();
    extractedItems.forEach(item => {
      const key = `${item.product_id}-${item.name}-${item.quantity}-${item.unit_price}`;
      if (!seen.has(key)) {
        uniqueItems.push(item);
        seen.add(key);
      }
    });

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.json({ 
      items: uniqueItems,
      bill_number,
      bill_date,
      message: uniqueItems.length > 0 ? `Extracted ${uniqueItems.length} items.` : "No items detected."
    });
  } catch (error) {
    console.error('[parsePurchasePDF] Error:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Failed to parse PDF: ' + error.message });
  }
};

module.exports = { 
  getPurchases, getPurchase, createPurchase, 
  updatePurchase, deletePurchase, recordPayment,
  parsePurchasePDF 
};
