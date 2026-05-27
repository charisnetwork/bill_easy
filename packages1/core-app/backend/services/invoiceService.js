const { Invoice, InvoiceItem, Product, Customer, Company, Subscription, StockMovement, sequelize } = require('../models');

class InvoiceService {
  static async generateInvoiceNumber(companyId) {
    const company = await Company.findByPk(companyId);
    const prefix = company?.invoice_prefix || 'INV';
    const currentYear = new Date().getFullYear();
    
    const lastInvoice = await Invoice.findOne({
      where: { company_id: companyId },
      order: [['created_at', 'DESC']]
    });

    let nextNumber = 1;
    if (lastInvoice) {
      const match = lastInvoice.invoice_number.match(/(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }

    return `${prefix}-${currentYear}-${String(nextNumber).padStart(5, '0')}`;
  }

  static calculateTotals(items, discount = 0, discountType = 'fixed') {
    let subtotal = 0;
    let taxAmount = 0;

    const calculatedItems = items.map(item => {
      const itemTotal = item.quantity * item.unit_price;
      const itemDiscount = item.discount || 0;
      const itemAfterDiscount = itemTotal - itemDiscount;
      const itemTax = (itemAfterDiscount * (item.tax_rate || 0)) / 100;
      
      subtotal += itemAfterDiscount;
      taxAmount += itemTax;

      return {
        ...item,
        tax_amount: itemTax,
        total: itemAfterDiscount + itemTax
      };
    });

    let discountAmount = 0;
    if (discountType === 'percentage') {
      discountAmount = (subtotal * discount) / 100;
    } else {
      discountAmount = discount;
    }

    const totalBeforeRound = subtotal + taxAmount - discountAmount;
    const roundOff = Math.round(totalBeforeRound) - totalBeforeRound;
    const totalAmount = Math.round(totalBeforeRound);

    return {
      items: calculatedItems,
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      round_off: roundOff,
      total_amount: totalAmount
    };
  }

  static async createInvoice(companyId, data) {
    const t = await sequelize.transaction();

    try {
      const invoiceNumber = await this.generateInvoiceNumber(companyId);
      const calculations = this.calculateTotals(data.items, data.discount, data.discount_type);

      const invoice = await Invoice.create({
        company_id: companyId,
        customer_id: data.customer_id,
        invoice_number: invoiceNumber,
        invoice_date: data.invoice_date || new Date(),
        due_date: data.due_date,
        subtotal: calculations.subtotal,
        tax_amount: calculations.tax_amount,
        discount_amount: calculations.discount_amount,
        discount_type: data.discount_type || 'fixed',
        round_off: calculations.round_off,
        total_amount: calculations.total_amount,
        payment_method: data.payment_method,
        notes: data.notes,
        terms: data.terms,
        status: data.status || 'draft'
      }, { transaction: t });

      // Create invoice items and update stock
      for (const item of calculations.items) {
        await InvoiceItem.create({
          invoice_id: invoice.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount || 0,
          tax_rate: item.tax_rate || 0,
          tax_amount: item.tax_amount,
          total: item.total
        }, { transaction: t });

        // Update product stock
        const product = await Product.findByPk(item.product_id, { transaction: t });
        if (product) {
          const previousStock = parseFloat(product.stock_quantity);
          const newStock = previousStock - parseFloat(item.quantity);

          await product.update({ stock_quantity: newStock }, { transaction: t });

          // Record stock movement
          await StockMovement.create({
            company_id: companyId,
            product_id: item.product_id,
            type: 'out',
            quantity: item.quantity,
            previous_stock: previousStock,
            new_stock: newStock,
            reference_type: 'invoice',
            reference_id: invoice.id
          }, { transaction: t });
        }
      }

      // Update customer outstanding balance
      await Customer.increment('outstanding_balance', {
        by: calculations.total_amount,
        where: { id: data.customer_id },
        transaction: t
      });

      // Update subscription usage - proper JSON field update
      const subscription = await Subscription.findOne({ 
        where: { company_id: companyId },
        transaction: t 
      });
      if (subscription) {
        const usage = subscription.usage || { invoices: 0, products: 0, eway_bills: 0, godowns: 0 };
        usage.invoices = (usage.invoices || 0) + 1;
        await subscription.update({ usage }, { transaction: t });
      }

      await t.commit();
      return invoice;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  static async getInvoiceWithDetails(invoiceId) {
    return Invoice.findByPk(invoiceId, {
      include: [
        { model: Customer },
        { model: Company },
        { 
          model: InvoiceItem, 
          as: 'items',
          include: [Product]
        }
      ]
    });
  }
}

module.exports = InvoiceService;
