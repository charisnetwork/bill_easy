/**
 * Enhanced Invoice PDF Service with Industry-Specific Templates
 * Supports: Retail, Automobile (Dual Table), Pharma, Services, Healthcare, Hospitality, Logistics
 */

const PDFDocument = require('pdfkit');
const path = require('path');
const { getIndustryConfig, INDUSTRY_GROUPS } = require('../config/industries');

// Import industry templates
const { renderRetailInvoice } = require('./invoiceTemplates/retailTemplate');
const { renderAutomobileInvoice } = require('./invoiceTemplates/automobileTemplate');
const { renderPharmaInvoice } = require('./invoiceTemplates/pharmaTemplate');
const { renderServiceInvoice } = require('./invoiceTemplates/serviceTemplate');
const { renderHealthcareInvoice } = require('./invoiceTemplates/healthcareTemplate');
const { renderHospitalityInvoice } = require('./invoiceTemplates/hospitalityTemplate');
const { renderLogisticsInvoice } = require('./invoiceTemplates/logisticsTemplate');

const generateInvoicePdf = async (invoice, company) => {
  // Get industry configuration
  const industryName = company.business_category || 'General Store';
  const config = getIndustryConfig(industryName);
  
  // Customization Settings
  const headerColor = company.invoice_header_color || '#1D70B8';
  const menuColor = company.invoice_menu_color || '#FFFFFF';
  const textSizeStr = company.invoice_text_size || '10pt';
  const baseSize = parseInt(textSizeStr) || 10;
  
  // Create PDF
  const doc = new PDFDocument({ 
    margin: 40,
    size: 'A4'
  });
  
  let buffers = [];
  doc.on("data", buffers.push.bind(buffers));
  
  return new Promise((resolve) => {
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    
    // ============================================
    // HEADER SECTION
    // ============================================
    
    // Header Background
    doc.rect(0, 0, 612, 130).fill('#f8fafc');
    
    // Company Logo (from GCS URL or local)
    if (company.logo) {
      try {
        const logoPath = company.logo.startsWith('http') 
          ? company.logo 
          : path.join(__dirname, '../uploads', company.logo);
        doc.image(logoPath, 40, 40, { height: 50 });
      } catch (e) {
        doc.fontSize(baseSize + 12).fillColor(headerColor).font('Helvetica-Bold').text(company.name, 40, 40);
      }
    } else {
      doc.fontSize(baseSize + 12).fillColor(headerColor).font('Helvetica-Bold').text(company.name, 40, 40);
    }
    
    // Invoice Title
    doc.fillColor('#475569').fontSize(baseSize + 4).font('Helvetica-Bold');
    doc.text("TAX INVOICE", 400, 40, { align: 'right' });
    
    // Company Details (Right aligned)
    doc.fillColor('#000000').fontSize(baseSize - 2).font('Helvetica');
    doc.text(company.address || '', 400, 60, { align: 'right' });
    doc.text(`${company.city || ''}, ${company.state || ''} - ${company.pincode || ''}`, 400, 72, { align: 'right' });
    doc.text(`Phone: ${company.phone || ''}`, 400, 84, { align: 'right' });
    if (company.email) doc.text(`Email: ${company.email}`, 400, 96, { align: 'right' });
    if (company.gst_number) {
      doc.font('Helvetica-Bold').text(`GSTIN: ${company.gst_number}`, 400, 108, { align: 'right' });
    }
    
    // ============================================
    // CUSTOMER & INVOICE DETAILS
    // ============================================
    
    const detailsTop = 145;
    
    // Customer Details (Left)
    doc.fillColor('#000000').fontSize(baseSize - 1).font('Helvetica-Bold').text("Bill To:", 40, detailsTop);
    doc.font('Helvetica-Bold').fontSize(baseSize).text(invoice.Customer?.name || 'Cash Customer', 40, detailsTop + 15);
    doc.fontSize(baseSize - 2).fillColor('#64748b').font('Helvetica');
    doc.text(invoice.Customer?.address || '', 40, detailsTop + 30, { width: 230 });
    doc.text(`${invoice.Customer?.city || ''}, ${invoice.Customer?.state || ''}`, 40, detailsTop + 42);
    doc.text(`Phone: ${invoice.Customer?.phone || ''}`, 40, detailsTop + 54);
    if (invoice.Customer?.gst_number) {
      doc.fillColor('#000000').font('Helvetica-Bold').text(`GSTIN: ${invoice.Customer.gst_number}`, 40, detailsTop + 66);
    }
    
    // Invoice Details (Right)
    doc.fillColor('#000000').fontSize(baseSize - 1).font('Helvetica-Bold').text("Invoice Details:", 350, detailsTop);
    doc.font('Helvetica').fontSize(baseSize - 1);
    doc.text(`Invoice No: ${invoice.invoice_number}`, 350, detailsTop + 15);
    doc.text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}`, 350, detailsTop + 28);
    if (invoice.due_date) {
      doc.text(`Due Date: ${new Date(invoice.due_date).toLocaleDateString('en-IN')}`, 350, detailsTop + 41);
    }
    doc.text(`Status: ${invoice.payment_status?.toUpperCase() || 'UNPAID'}`, 350, detailsTop + 54);
    
    // Industry-specific metadata fields
    let extraY = detailsTop + 70;
    const allMetadata = { ...(invoice.extra_fields || {}), ...(invoice.industry_metadata || {}) };
    
    Object.entries(allMetadata).forEach(([key, value]) => {
      if (value && extraY < 210) {
        const label = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        doc.text(`${label}: ${value}`, 350, extraY);
        extraY += 12;
      }
    });
    
    // ============================================
    // INDUSTRY-SPECIFIC INVOICE TABLE
    // ============================================
    
    const tableTop = Math.max(230, extraY + 10);
    
    // Select template based on industry group
    let templateResult = {};
    const templateOptions = { headerColor, baseSize, items: invoice.items, tableTop };
    
    switch (config.group) {
      case INDUSTRY_GROUPS.AUTOMOBILE_SERVICE:
        templateResult = renderAutomobileInvoice(doc, invoice, company, config, templateOptions);
        break;
      case INDUSTRY_GROUPS.PHARMA:
        templateResult = renderPharmaInvoice(doc, invoice, company, config, templateOptions);
        break;
      case INDUSTRY_GROUPS.PROFESSIONAL_SERVICES:
        templateResult = renderServiceInvoice(doc, invoice, company, config, templateOptions);
        break;
      case INDUSTRY_GROUPS.HEALTHCARE:
        templateResult = renderHealthcareInvoice(doc, invoice, company, config, templateOptions);
        break;
      case INDUSTRY_GROUPS.HOSPITALITY:
        templateResult = renderHospitalityInvoice(doc, invoice, company, config, templateOptions);
        break;
      case INDUSTRY_GROUPS.LOGISTICS:
        templateResult = renderLogisticsInvoice(doc, invoice, company, config, templateOptions);
        break;
      case INDUSTRY_GROUPS.RETAIL:
      default:
        templateResult = renderRetailInvoice(doc, invoice, company, config, templateOptions);
        break;
    }
    
    const { itemY, productSubtotal, productTaxTotal, serviceSubtotal, serviceTaxTotal } = templateResult;
    
    // Calculate totals
    const subtotal = (productSubtotal || 0) + (serviceSubtotal || 0);
    const taxAmount = (productTaxTotal || 0) + (serviceTaxTotal || 0);
    
    // ============================================
    // TAX SUMMARY TABLE (CGST/SGST Breakdown)
    // ============================================
    
    let currentY = itemY + 20;
    
    if (taxAmount > 0) {
      doc.rect(40, currentY, 250, 60).fill('#f8fafc');
      doc.fillColor('#000000').fontSize(baseSize - 1).font('Helvetica-Bold');
      doc.text('Tax Summary', 50, currentY + 8);
      
      doc.font('Helvetica').fontSize(baseSize - 2);
      const cgstAmount = taxAmount / 2;
      const sgstAmount = taxAmount / 2;
      
      doc.text(`CGST (9%): ${cgstAmount.toFixed(2)}`, 50, currentY + 25);
      doc.text(`SGST (9%): ${sgstAmount.toFixed(2)}`, 50, currentY + 38);
      doc.text(`Total Tax: ${taxAmount.toFixed(2)}`, 50, currentY + 51);
    }
    
    // ============================================
    // TOTALS SECTION
    // ============================================
    
    const totalX = 350;
    let totalY = currentY;
    
    // Subtotal
    doc.fillColor('#000000').font('Helvetica-Bold').fontSize(baseSize - 1);
    doc.text("Sub Total:", totalX, totalY);
    doc.font('Helvetica').text(`INR ${subtotal.toFixed(2)}`, totalX + 100, totalY, { width: 95, align: 'right' });
    totalY += 15;
    
    // Tax Amount
    doc.font('Helvetica-Bold').text("Tax Amount:", totalX, totalY);
    doc.font('Helvetica').text(`INR ${taxAmount.toFixed(2)}`, totalX + 100, totalY, { width: 95, align: 'right' });
    totalY += 15;
    
    // Discount
    if (invoice.discount_amount > 0) {
      doc.font('Helvetica-Bold').text("Discount:", totalX, totalY);
      doc.font('Helvetica').fillColor('#dc2626').text(`-INR ${parseFloat(invoice.discount_amount).toFixed(2)}`, totalX + 100, totalY, { width: 95, align: 'right' });
      doc.fillColor('#000000');
      totalY += 15;
    }
    
    // TDS
    if (invoice.tds_amount > 0) {
      doc.font('Helvetica-Bold').text(`TDS (${invoice.tds_rate}%):`, totalX, totalY);
      doc.font('Helvetica').fillColor('#dc2626').text(`-INR ${parseFloat(invoice.tds_amount).toFixed(2)}`, totalX + 100, totalY, { width: 95, align: 'right' });
      doc.fillColor('#000000');
      totalY += 15;
    }
    
    // TCS
    if (invoice.tcs_amount > 0) {
      doc.font('Helvetica-Bold').text(`TCS (${invoice.tcs_rate}%):`, totalX, totalY);
      doc.font('Helvetica').fillColor('#16a34a').text(`+INR ${parseFloat(invoice.tcs_amount).toFixed(2)}`, totalX + 100, totalY, { width: 95, align: 'right' });
      doc.fillColor('#000000');
      totalY += 15;
    }
    
    // Round Off
    if (invoice.round_off !== 0) {
      doc.font('Helvetica-Bold').text("Round Off:", totalX, totalY);
      doc.font('Helvetica').text(`INR ${parseFloat(invoice.round_off).toFixed(2)}`, totalX + 100, totalY, { width: 95, align: 'right' });
      totalY += 15;
    }
    
    // Final Amount (Highlighted)
    doc.rect(totalX - 5, totalY + 5, 210, 30).fill('#f8fafc');
    doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(baseSize + 2);
    doc.text("Total Amount:", totalX, totalY + 12);
    doc.fontSize(baseSize + 4).text(`INR ${parseFloat(invoice.final_amount || invoice.total_amount).toFixed(2)}`, totalX + 100, totalY + 10, { width: 95, align: 'right' });
    
    // Amount in words
    totalY += 40;
    doc.fillColor('#64748b').fontSize(baseSize - 2).font('Helvetica');
    const amountInWords = numberToWords(parseFloat(invoice.final_amount || invoice.total_amount));
    doc.text(`Amount in Words: ${amountInWords}`, totalX, totalY, { width: 200 });
    
    // ============================================
    // FOOTER SECTION
    // ============================================
    
    const footerY = 680;
    
    // Banking Info (Left)
    let leftY = footerY;
    if (company.bank_name) {
      doc.fillColor('#475569').fontSize(baseSize - 2).font('Helvetica-Bold').text("BANK DETAILS", 40, leftY);
      doc.fillColor('#000000').font('Helvetica').fontSize(baseSize - 2);
      doc.text(`Bank: ${company.bank_name}`, 40, leftY + 12);
      doc.text(`Account: ${company.account_number}`, 40, leftY + 24);
      doc.text(`IFSC: ${company.ifsc_code}`, 40, leftY + 36);
      doc.text(`Branch: ${company.branch_name || '-'}`, 40, leftY + 48);
      leftY += 65;
    }
    
    // QR Code (if available)
    if (company.qr_code) {
      try {
        const qrPath = company.qr_code.startsWith('http') 
          ? company.qr_code 
          : path.join(__dirname, '../uploads', company.qr_code);
        doc.image(qrPath, 40, leftY, { height: 60 });
        leftY += 70;
      } catch (e) {}
    }
    
    // Terms & Conditions
    if (company.terms_conditions || invoice.terms) {
      doc.fillColor('#475569').fontSize(baseSize - 3).font('Helvetica-Bold').text("TERMS & CONDITIONS", 40, leftY);
      doc.fillColor('#64748b').font('Helvetica').fontSize(baseSize - 3);
      doc.text(invoice.terms || company.terms_conditions, 40, leftY + 10, { width: 300, lineGap: 1 });
    }
    
    // Notes
    if (invoice.notes) {
      doc.fillColor('#475569').fontSize(baseSize - 3).font('Helvetica-Bold').text("NOTES", 40, 780);
      doc.fillColor('#64748b').font('Helvetica').fontSize(baseSize - 3);
      doc.text(invoice.notes, 40, 792, { width: 300, lineGap: 1 });
    }
    
    // Signature (Right)
    const signatureX = 400;
    const signatureWidth = 140;
    const sigY = footerY + 10;
    
    doc.fillColor('#000000').fontSize(baseSize - 2).font('Helvetica-Bold').text("Authorized Signatory", signatureX, sigY, { width: signatureWidth, align: 'center' });
    doc.moveTo(signatureX, sigY + 50).lineTo(signatureX + signatureWidth, sigY + 50).strokeColor('#000000').stroke();
    
    if (company.signature) {
      try {
        const sigPath = company.signature.startsWith('http') 
          ? company.signature 
          : path.join(__dirname, '../uploads', company.signature);
        doc.image(sigPath, signatureX + 20, sigY + 5, { width: 100 });
      } catch (e) {}
    }
    
    // Company Stamp/Name
    doc.fillColor('#000000').fontSize(baseSize - 2).font('Helvetica-Bold').text(company.name, signatureX, sigY + 55, { width: signatureWidth, align: 'center' });
    
    doc.end();
  });
};

/**
 * Convert number to words (Indian format)
 */
function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  function convertLessThanThousand(n) {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convertLessThanThousand(n % 100) : '');
  }
  
  if (num === 0) return 'Zero Rupees Only';
  
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = num % 1000;
  
  let result = '';
  if (crore > 0) result += convertLessThanThousand(crore) + ' Crore ';
  if (lakh > 0) result += convertLessThanThousand(lakh) + ' Lakh ';
  if (thousand > 0) result += convertLessThanThousand(thousand) + ' Thousand ';
  if (hundred > 0) result += convertLessThanThousand(hundred);
  
  // Handle paise
  const paise = Math.round((num % 1) * 100);
  if (paise > 0) {
    result += ' Rupees and ' + convertLessThanThousand(paise) + ' Paise';
  } else {
    result += ' Rupees';
  }
  
  return result + ' Only';
}

module.exports = { generateInvoicePdf };
