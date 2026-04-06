const { Invoice, InvoiceItem, Customer, Product, Company, Payment, User, StockLevel, StockMovement, Godown, Subscription, sequelize } = require('../models');
const { generateInvoiceNumber, peekInvoiceNumber } = require('../services/invoiceNumberService');
const { generateInvoicePdf } = require('../services/invoicePdfService');
const { Op } = require('sequelize');
const SubscriptionGuard = require('../utils/subscriptionGuard');

const getInvoices = async (req, res) => {
  try {
    const { search, status, payment_status, customer_id, startDate, endDate, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = { company_id: req.companyId };

    if (search) {
      where[Op.or] = [
        { invoice_number: { [Op.iLike]: `%${search}%` } },
        { '$Customer.name$': { [Op.iLike]: `%${search}%` } },
        { '$Customer.phone$': { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (status) where.status = status;
    if (payment_status) where.payment_status = payment_status;
    if (customer_id) where.customer_id = customer_id;

    if (startDate && endDate) {
      where.invoice_date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const { count, rows: invoices } = await Invoice.findAndCountAll({
      where,
      include: [{ 
        model: Customer, 
        attributes: ['name', 'phone'],
        required: search ? (search.startsWith('INV') ? false : true) : false // Hint to sequelize about the join
      }],
      order: [['invoice_date', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
      subQuery: false // Important for findAndCountAll with associations and limits
    });

    res.json({
      invoices,
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error("Get invoices error:", error);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
};

const getInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      where: { id: req.params.id, company_id: req.companyId },
      include: [
        { model: Customer },
        { model: InvoiceItem, include: [Product], as: 'items' },
        { model: Payment, order: [['payment_date', 'DESC']] }
      ]
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    res.json(invoice);
  } catch (error) {
    console.error("Get invoice error:", error);
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
};

const getNextInvoiceNumber = async (req, res) => {
  try {
    const number = await peekInvoiceNumber(req.companyId);
    res.json({
      invoice_number: number
    });
  } catch (error) {
    console.error("Invoice number error:", error);
    res.status(500).json({
      error: "Failed to generate invoice number"
    });
  }
};

const createInvoice = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const invoiceNumber = await generateInvoiceNumber(req.companyId, transaction);
    const items = req.body.items || [];
    
    let totalTax = 0;
    let totalAmount = 0;
    
    const processedItems = items.map(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      const discount = parseFloat(item.discount) || 0;
      const taxRate = parseFloat(item.tax_rate) || 0;
      const itemType = item.item_type || 'product';
      
      const itemSubtotal = (qty * price) - discount;
      const tax = (itemSubtotal * taxRate) / 100;
      const total = itemSubtotal + tax;
      
      totalTax += tax;
      totalAmount += total;
      
      return {
        ...item,
        item_type: itemType,
        total: total.toFixed(2)
      };
    });

    const subtotal_sum = totalAmount - totalTax;
    const globalDiscount = parseFloat(req.body.discount) || 0;
    const discountType = req.body.discount_type || 'fixed';
    let discountAmount = 0;
    
    if (discountType === 'percentage') {
      discountAmount = (totalAmount * globalDiscount / 100);
    } else {
      discountAmount = globalDiscount;
    }
    
    const amount_with_gst = totalAmount - discountAmount;
    
    // TDS & TCS Logic
    const tds_rate = parseFloat(req.body.tds_rate || 0);
    const tcs_rate = parseFloat(req.body.tcs_rate || 0);
    
    const tds_amount = (amount_with_gst * tds_rate / 100);
    const tcs_amount = (amount_with_gst * tcs_rate / 100);
    
    const final_amount = amount_with_gst + tcs_amount - tds_amount;

    let godown_id = req.body.godown_id;
    if (!godown_id) {
      const defaultGodown = await Godown.findOne({
        where: { company_id: req.companyId, is_default: true },
        transaction
      });
      if (defaultGodown) {
        godown_id = defaultGodown.id;
      }
      // If still no godown_id, it will be null (optional)
    }

    // Stock Validation (only for products, not services)
    for (const item of items) {
      const itemType = item.item_type || 'product';
      
      // Skip stock validation for service items
      if (itemType === 'service') continue;
      
      const qty = parseFloat(item.quantity) || 0;
      const product = await Product.findByPk(item.product_id, { transaction });
      
      if (!product) {
        throw new Error(`Product with ID ${item.product_id} not found`);
      }

      // Check global stock
      if (parseFloat(product.stock_quantity) < qty) {
        throw new Error(`Insufficient global stock for ${product.name}. Available: ${product.stock_quantity}`);
      }

      // If godown specified, check godown stock
      if (godown_id) {
        const stock = await StockLevel.findOne({
          where: { product_id: item.product_id, godown_id },
          transaction
        });
        if (!stock || parseFloat(stock.quantity) < qty) {
          throw new Error(`Insufficient stock for ${product.name} in selected godown. Available: ${stock?.quantity || 0}`);
        }
      }
    }

    // Wallet Handling
    const walletUsed = parseFloat(req.body.wallet_amount || 0);
    let finalPaidAmount = 0;
    let paymentStatus = "unpaid";

    if (walletUsed > 0) {
      const customer = await Customer.findByPk(req.body.customer_id, { transaction });
      if (customer) {
        const usableAmount = Math.min(parseFloat(customer.wallet_balance || 0), walletUsed, totalAmount);
        if (usableAmount > 0) {
          customer.wallet_balance = parseFloat(customer.wallet_balance) - usableAmount;
          await customer.save({ transaction });
          
          finalPaidAmount = usableAmount;
          if (finalPaidAmount >= Math.round(totalAmount)) {
            paymentStatus = "paid";
          } else if (finalPaidAmount > 0) {
            paymentStatus = "partial";
          }
        }
      }
    }

    const invoice = await Invoice.create({
      company_id: req.companyId,
      customer_id: req.body.customer_id,
      godown_id: godown_id,
      invoice_number: invoiceNumber,
      invoice_date: req.body.invoice_date || new Date(),
      due_date: req.body.due_date || null,
      subtotal: subtotal_sum.toFixed(2),
      tax_amount: totalTax.toFixed(2),
      discount_type: discountType,
      discount_amount: discountAmount.toFixed(2),
      tds_rate: tds_rate,
      tds_amount: tds_amount.toFixed(2),
      tcs_rate: tcs_rate,
      tcs_amount: tcs_amount.toFixed(2),
      total_amount: Math.round(amount_with_gst),
      final_amount: Math.round(final_amount),
      paid_amount: finalPaidAmount,
      payment_status: paymentStatus,
      notes: req.body.notes,
      status: req.body.status || 'sent',
      extra_fields: req.body.extra_fields || {},
      industry_metadata: req.body.industry_metadata || {},
      eway_bill_number: req.body.eway_bill_number,
      wallet_amount: walletUsed
    }, { transaction });

    for (const item of processedItems) {
      // Create InvoiceItem with all fields including industry-specific ones
      await InvoiceItem.create({
        invoice_id: invoice.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount: item.discount || 0,
        tax_rate: item.tax_rate || 0,
        tax_amount: item.tax_amount || 0,
        total: item.total,
        description: item.description || '',
        // Industry-specific fields
        item_type: item.item_type || 'product',
        batch_number: item.batch_number || null,
        expiry_date: item.expiry_date || null,
        hsn_code: item.hsn_code || null,
        sku: item.sku || null,
        lr_number: item.lr_number || null,
        weight: item.weight || null
      }, { transaction });

      // Only deduct stock for products, not services
      if (item.item_type !== 'service') {
        await Product.decrement("stock_quantity", {
          by: item.quantity,
          where: { id: item.product_id },
          transaction
        });

        // Godown stock deduction
        if (invoice.godown_id) {
          await StockLevel.decrement("quantity", {
            by: item.quantity,
            where: { product_id: item.product_id, godown_id: invoice.godown_id },
            transaction
          });

          // Record movement
          await StockMovement.create({
            company_id: req.companyId,
            product_id: item.product_id,
            godown_id: invoice.godown_id,
            type: 'out',
            quantity: item.quantity,
            reference_type: 'invoice',
            reference_id: invoice.id,
            notes: `Invoice #${invoice.invoice_number || invoiceNumber}`
          }, { transaction });
        }
      }
    }

    await Customer.increment("outstanding_balance", {
      by: Math.round(final_amount) - finalPaidAmount,
      where: { id: req.body.customer_id },
      transaction
    });

    // Increment Usage
    const sub = await Subscription.findOne({ where: { company_id: req.companyId }, transaction });
    if (sub) {
      const usage = sub.usage || {};
      usage.invoices = (usage.invoices || 0) + 1;
      await sub.update({ usage }, { transaction });
    }

    await transaction.commit();
    res.status(201).json({
      message: "Invoice created successfully",
      invoice
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Create invoice error:", error);
    res.status(500).json({
      error: "Failed to create invoice: " + error.message
    });
  }
};

const downloadInvoicePdf = async (req, res) => {
  try {
    const [invoice, company] = await Promise.all([
      Invoice.findOne({
        where: { id: req.params.id, company_id: req.companyId },
        include: [
          { model: Customer },
          { model: InvoiceItem, include: [Product], as: "items" }
        ]
      }),
      Company.findByPk(req.companyId, {
        include: [{ 
          model: User, 
          where: { role: 'owner' },
          required: false
        }]
      })
    ]);

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const pdf = await generateInvoicePdf(invoice, company);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${invoice.invoice_number}.pdf`
    );

    res.send(pdf);
  } catch (error) {
    console.error("PDF error:", error);
    res.status(500).json({ error: "Failed to generate pdf" });
  }
};

const bulkDownloadInvoices = async (req, res) => {
  try {
    const { invoiceIds } = req.body;
    if (!invoiceIds || !Array.isArray(invoiceIds)) {
      return res.status(400).json({ error: 'Invalid invoice IDs' });
    }

    const [invoices, company] = await Promise.all([
      Invoice.findAll({
        where: { id: invoiceIds, company_id: req.companyId },
        include: [
          { model: Customer },
          { model: InvoiceItem, include: [Product], as: "items" }
        ]
      }),
      Company.findByPk(req.companyId, {
        include: [{ 
          model: User, 
          where: { role: 'owner' },
          required: false
        }]
      })
    ]);

    if (!invoices.length) {
      return res.status(404).json({ error: "No invoices found" });
    }

    try {
      const archiver = require('archiver');
      const archive = archiver('zip', { zlib: { level: 9 } });
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=invoices.zip');
      
      archive.pipe(res);
      
      for (const inv of invoices) {
        const pdfBuffer = await generateInvoicePdf(inv, company);
        archive.append(pdfBuffer, { name: `${inv.invoice_number}.pdf` });
      }
      
      archive.finalize();
    } catch (err) {
      console.warn('Archiver not found, falling back to simple status');
      res.status(501).json({ error: 'ZIP export not available on this server' });
    }
  } catch (error) {
    console.error("Bulk PDF error:", error);
    res.status(500).json({ error: "Failed to generate PDFs" });
  }
};

const generateEWayBill = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({
      where: { id: req.params.id, company_id: req.companyId }
    });
    if (!invoice) return res.status(404).json({ error: "Invoice not found" });
    res.json({ message: "E-Way Bill generation placeholder" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteInvoice = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const invoice = await Invoice.findOne({
      where: { id: req.params.id, company_id: req.companyId },
      include: [{ model: InvoiceItem, as: 'items' }]
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Revert wallet balance if used
    if (parseFloat(invoice.wallet_amount || 0) > 0) {
      await Customer.increment('wallet_balance', {
        by: invoice.wallet_amount,
        where: { id: invoice.customer_id },
        transaction
      });
    }

    // Restore stock
    for (const item of invoice.items) {
      await Product.increment('stock_quantity', {
        by: item.quantity,
        where: { id: item.product_id },
        transaction
      });

      if (invoice.godown_id) {
        await StockLevel.increment('quantity', {
          by: item.quantity,
          where: { product_id: item.product_id, godown_id: invoice.godown_id },
          transaction
        });

        await StockMovement.create({
          company_id: req.companyId,
          product_id: item.product_id,
          godown_id: invoice.godown_id,
          type: 'in',
          quantity: item.quantity,
          reference_type: 'invoice_deletion',
          reference_id: invoice.id,
          notes: `Reverted from Deleted Invoice #${invoice.invoice_number}`
        }, { transaction });
      }
    }

    // Revert customer outstanding balance
    await Customer.decrement('outstanding_balance', {
      by: parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount),
      where: { id: invoice.customer_id },
      transaction
    });

    await invoice.destroy({ transaction });
    await transaction.commit();
    res.json({ message: "Invoice deleted successfully" });
  } catch (error) {
    if (transaction) await transaction.rollback();
    res.status(500).json({ error: "Failed to delete invoice" });
  }
};

const updateInvoice = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const invoice = await Invoice.findOne({
      where: { id, company_id: req.companyId },
      include: [{ model: InvoiceItem, as: 'items' }]
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Restore stock for old items
    for (const item of invoice.items) {
      await Product.increment('stock_quantity', {
        by: item.quantity,
        where: { id: item.product_id },
        transaction
      });
    }

    // Revert old wallet usage if any
    if (parseFloat(invoice.wallet_amount || 0) > 0) {
      await Customer.increment('wallet_balance', {
        by: invoice.wallet_amount,
        where: { id: invoice.customer_id },
        transaction
      });
    }

    // Revert customer outstanding balance (old total minus old paid amount)
    await Customer.decrement('outstanding_balance', {
      by: parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount),
      where: { id: invoice.customer_id },
      transaction
    });

    // Delete old items
    await InvoiceItem.destroy({ where: { invoice_id: id }, transaction });

    // Process new items and calculate totals
    const items = req.body.items || [];
    let totalTax = 0;
    let totalAmount = 0;
    
    const processedItems = items.map(item => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      const discount = parseFloat(item.discount) || 0;
      const taxRate = parseFloat(item.tax_rate) || 0;
      
      const itemSubtotal = (qty * price) - discount;
      const tax = (itemSubtotal * taxRate) / 100;
      const total = itemSubtotal + tax;
      
      totalTax += tax;
      totalAmount += total;
      
      return { ...item, total: total.toFixed(2) };
    });

    const globalDiscount = parseFloat(req.body.discount) || 0;
    const discountType = req.body.discount_type || 'fixed';
    let discountAmount = 0;
    
    if (discountType === 'percentage') {
      discountAmount = (totalAmount * globalDiscount / 100);
    } else {
      discountAmount = globalDiscount;
    }
    
    totalAmount = totalAmount - discountAmount;

    let godown_id = req.body.godown_id || invoice.godown_id;
    if (!godown_id) {
      const defaultGodown = await Godown.findOne({
        where: { company_id: req.companyId, is_default: true },
        transaction
      });
      godown_id = defaultGodown ? defaultGodown.id : null;
    }

    // Apply new wallet usage
    const walletUsed = parseFloat(req.body.wallet_amount || 0);
    // Base paid amount is old paid amount minus old wallet usage
    let basePaidAmount = parseFloat(invoice.paid_amount || 0) - parseFloat(invoice.wallet_amount || 0);
    let finalPaidAmount = basePaidAmount;
    let paymentStatus = "unpaid";

    if (walletUsed > 0) {
      const customer = await Customer.findByPk(invoice.customer_id, { transaction });
      if (customer) {
        const usableAmount = Math.min(parseFloat(customer.wallet_balance || 0), walletUsed, totalAmount);
        if (usableAmount > 0) {
          customer.wallet_balance = parseFloat(customer.wallet_balance) - usableAmount;
          await customer.save({ transaction });
          
          finalPaidAmount += usableAmount;
        }
      }
    }

    if (finalPaidAmount >= Math.round(totalAmount)) {
      paymentStatus = "paid";
    } else if (finalPaidAmount > 0) {
      paymentStatus = "partial";
    }

    // Update invoice
    await invoice.update({
      customer_id: req.body.customer_id,
      godown_id: godown_id,
      invoice_date: req.body.invoice_date || invoice.invoice_date,
      due_date: req.body.due_date || null,
      total_amount: Math.round(totalAmount),
      tax_amount: totalTax.toFixed(2),
      discount_type: discountType,
      discount_amount: discountAmount.toFixed(2),
      paid_amount: finalPaidAmount,
      payment_status: paymentStatus,
      notes: req.body.notes,
      extra_fields: req.body.extra_fields || {},
      industry_metadata: req.body.industry_metadata || {},
      eway_bill_number: req.body.eway_bill_number,
      wallet_amount: walletUsed
    }, { transaction });

    // Create new items and update stock
    for (const item of processedItems) {
      await InvoiceItem.create({
        invoice_id: invoice.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
        description: item.description || ''
      }, { transaction });

      await Product.decrement("stock_quantity", {
        by: item.quantity,
        where: { id: item.product_id },
        transaction
      });

      // Godown stock deduction
      if (invoice.godown_id) {
        await StockLevel.decrement("quantity", {
          by: item.quantity,
          where: { product_id: item.product_id, godown_id: invoice.godown_id },
          transaction
        });

        // Record movement
        await StockMovement.create({
          company_id: req.companyId,
          product_id: item.product_id,
          godown_id: invoice.godown_id,
          type: 'out',
          quantity: item.quantity,
          reference_type: 'invoice',
          reference_id: invoice.id,
          notes: `Invoice #${invoice.invoice_number}`
        }, { transaction });
      }
    }

    // Update customer outstanding balance with NEW difference
    await Customer.increment("outstanding_balance", {
      by: Math.round(totalAmount) - finalPaidAmount,
      where: { id: req.body.customer_id },
      transaction
    });

    await transaction.commit();
    res.json({ message: "Invoice updated successfully", invoice });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Update invoice error:", error);
    res.status(500).json({ error: "Failed to update invoice: " + error.message });
  }
};

const recordPayment = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { amount, payment_method, payment_date, reference_number, notes } = req.body;
    const invoice = await Invoice.findOne({
      where: { id: req.params.id, company_id: req.companyId }
    });

    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const newPaidAmount = parseFloat(invoice.paid_amount) + parseFloat(amount);
    let payment_status = 'partial';
    if (newPaidAmount >= invoice.total_amount) {
      payment_status = 'paid';
    }

    // Create payment record
    await Payment.create({
      company_id: req.companyId,
      customer_id: invoice.customer_id,
      invoice_id: invoice.id,
      payment_type: 'received',
      amount,
      payment_method,
      payment_date: payment_date || new Date(),
      reference_number,
      notes
    }, { transaction });

    await invoice.update({
      paid_amount: newPaidAmount,
      payment_status
    }, { transaction });

    await Customer.decrement('outstanding_balance', {
      by: amount,
      where: { id: invoice.customer_id },
      transaction
    });

    await transaction.commit();
    res.json({ message: "Payment recorded successfully", invoice });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Record payment error:", error);
    res.status(500).json({ error: "Failed to record payment" });
  }
};

module.exports = {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  getNextInvoiceNumber,
  downloadInvoicePdf,
  bulkDownloadInvoices,
  generateEWayBill,
  deleteInvoice,
  recordPayment
};
