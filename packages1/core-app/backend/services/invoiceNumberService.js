const { InvoiceCounter, QuotationCounter, Company, Invoice, Quotation, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Peek at what the next invoice number will be (for display only, no DB change).
 */
const peekInvoiceNumber = async (companyId) => {
  try {
    const counter = await InvoiceCounter.findOne({ where: { company_id: companyId } });
    const company = await Company.findByPk(companyId);
    const prefix = company?.invoice_prefix || 'INV';
    const nextNumber = counter ? (counter.last_number + 1) : 1;
    return `${prefix}-${nextNumber}`;
  } catch (error) {
    console.error('Peek Invoice Number error:', error);
    return 'INV-1';
  }
};

/**
 * Generate a guaranteed-unique invoice number.
 *
 * Strategy:
 *  1. Increment the counter within the OUTER transaction (no separate commit).
 *  2. After incrementing, verify the generated number doesn't already exist in invoices.
 *  3. If it does exist (race condition / previous rollback left counter desync), 
 *     keep incrementing until we find a free slot.
 */
const generateInvoiceNumber = async (companyId, existingTransaction = null) => {
  // We always run inside the caller's transaction — never create our own.
  // If no transaction is provided we still won't create one; just run without.
  const t = existingTransaction || null;

  try {
    let [counter] = await InvoiceCounter.findOrCreate({
      where: { company_id: companyId },
      defaults: { last_number: 0 },
      transaction: t,
      lock: t ? true : false,
    });

    const company = await Company.findByPk(companyId, { transaction: t });
    const prefix = company?.invoice_prefix || 'INV';

    // Keep trying until we find a number that doesn't exist yet
    let invoiceNumber;
    let attempts = 0;
    const MAX_ATTEMPTS = 20;

    while (attempts < MAX_ATTEMPTS) {
      await counter.increment('last_number', { by: 1, transaction: t });
      await counter.reload({ transaction: t });

      invoiceNumber = `${prefix}-${counter.last_number}`;

      // Check globally — the DB constraint is not company-scoped
      const existing = await Invoice.findOne({
        where: { invoice_number: invoiceNumber },
        transaction: t,
      });

      if (!existing) break; // Free slot found

      console.warn(`[INVOICE NUMBER] ${invoiceNumber} already exists, trying next...`);
      attempts++;
    }

    if (attempts >= MAX_ATTEMPTS) {
      throw new Error('Could not generate a unique invoice number after multiple attempts');
    }

    return invoiceNumber;
  } catch (error) {
    throw error;
  }
};

/**
 * Peek at what the next quotation number will be.
 */
const peekQuotationNumber = async (companyId) => {
  try {
    const counter = await QuotationCounter.findOne({ where: { company_id: companyId } });
    const nextNumber = counter ? (counter.last_number + 1) : 1;
    return `QTN-${nextNumber}`;
  } catch (error) {
    console.error('Peek Quotation Number error:', error);
    return 'QTN-1';
  }
};

/**
 * Generate a guaranteed-unique quotation number.
 */
const generateQuotationNumber = async (companyId, existingTransaction = null) => {
  const t = existingTransaction || null;

  try {
    let [counter] = await QuotationCounter.findOrCreate({
      where: { company_id: companyId },
      defaults: { last_number: 0 },
      transaction: t,
      lock: t ? true : false,
    });

    let quotationNumber;
    let attempts = 0;
    const MAX_ATTEMPTS = 20;

    while (attempts < MAX_ATTEMPTS) {
      await counter.increment('last_number', { by: 1, transaction: t });
      await counter.reload({ transaction: t });

      quotationNumber = `QTN-${counter.last_number}`;

      // Check globally
      const existing = await Quotation.findOne({
        where: { quotation_number: quotationNumber },
        transaction: t,
      });

      if (!existing) break;

      console.warn(`[QUOTATION NUMBER] ${quotationNumber} already exists, trying next...`);
      attempts++;
    }

    return quotationNumber;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  generateInvoiceNumber,
  generateQuotationNumber,
  peekInvoiceNumber,
  peekQuotationNumber,
};
