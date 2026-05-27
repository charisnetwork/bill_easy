const PDFDocument = require('pdfkit');
const path = require('path');

// Helper: draw shared header (logo + company info + invoice details)
const drawHeader = (doc, invoice, company, uploadsPath, baseSize, accentColor) => {
  if (company.logo) {
    try { doc.image(path.join(uploadsPath, company.logo), 40, 30, { height: 55 }); } catch (e) {}
  }
  doc.fontSize(baseSize + 2).fillColor(accentColor).font('Helvetica-Bold')
    .text(company.name || '', 110, 32);
  doc.fontSize(baseSize - 1).fillColor('#475569').font('Helvetica')
    .text(company.address || '', 110, 50)
    .text(`${company.city || ''}, ${company.state || ''} - ${company.pincode || ''}`, 110, 62)
    .text(`Ph: ${company.phone || ''}  |  Email: ${company.email || ''}`, 110, 74);
  if (company.gst_number) {
    doc.font('Helvetica-Bold').fillColor(accentColor)
      .text(`GSTIN: ${company.gst_number}`, 110, 86);
  }
  // Right side: invoice label + number + date
  doc.fontSize(baseSize + 1).fillColor('#ffffff').font('Helvetica-Bold')
    .rect(400, 32, 152, 22).fill(accentColor).fillColor('#ffffff')
    .text('TAX INVOICE', 400, 38, { width: 152, align: 'center' });
  doc.fillColor('#000000').fontSize(baseSize - 1).font('Helvetica')
    .text(`Invoice No: ${invoice.invoice_number}`, 400, 60)
    .text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}`, 400, 72)
    .text(`Status: ${(invoice.payment_status || 'unpaid').toUpperCase()}`, 400, 84);
};

// Helper: draw customer + company boxes
const drawAddressBlock = (doc, invoice, company, baseSize, topY) => {
  doc.fontSize(baseSize - 1).font('Helvetica-Bold').fillColor('#475569')
    .text('FROM:', 40, topY);
  doc.font('Helvetica-Bold').fontSize(baseSize).fillColor('#000000')
    .text(company.name || '', 40, topY + 13);
  doc.font('Helvetica').fontSize(baseSize - 2).fillColor('#64748b')
    .text(company.address || '', 40, topY + 26, { width: 200 })
    .text(`Ph: ${company.phone || ''}`, 40, topY + 52);

  doc.fontSize(baseSize - 1).font('Helvetica-Bold').fillColor('#475569')
    .text('BILL TO:', 340, topY);
  doc.font('Helvetica-Bold').fontSize(baseSize).fillColor('#000000')
    .text(invoice.Customer?.name || '', 340, topY + 13);
  doc.font('Helvetica').fontSize(baseSize - 2).fillColor('#64748b')
    .text(invoice.Customer?.address || '', 340, topY + 26, { width: 200 })
    .text(`${invoice.Customer?.city || ''}, ${invoice.Customer?.state || ''}`, 340, topY + 38)
    .text(`Ph: ${invoice.Customer?.phone || ''}`, 340, topY + 50);
  if (invoice.Customer?.gst_number) {
    doc.font('Helvetica-Bold').fillColor('#000000')
      .text(`GSTIN: ${invoice.Customer.gst_number}`, 340, topY + 62);
  }
};

// Helper: draw totals block
const drawTotals = (doc, invoice, baseSize, currentY, accentColor) => {
  const subtotal = parseFloat(invoice.subtotal || 0);
  const tax = parseFloat(invoice.tax_amount || 0);
  const total = parseFloat(invoice.total_amount || 0);
  const paid = parseFloat(invoice.paid_amount || 0);
  const balance = total - paid;

  doc.font('Helvetica').fontSize(baseSize - 1).fillColor('#000000')
    .text('Subtotal:', 380, currentY)
    .text(`INR ${subtotal.toFixed(2)}`, 460, currentY, { width: 90, align: 'right' });
  currentY += 14;
  doc.text('Tax Amount:', 380, currentY)
    .text(`INR ${tax.toFixed(2)}`, 460, currentY, { width: 90, align: 'right' });
  currentY += 14;
  doc.rect(375, currentY + 2, 180, 22).fill(accentColor);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(baseSize)
    .text('TOTAL:', 380, currentY + 8)
    .text(`INR ${total.toFixed(2)}`, 460, currentY + 8, { width: 90, align: 'right' });
  currentY += 30;
  if (paid > 0) {
    doc.fillColor('#059669').font('Helvetica').fontSize(baseSize - 2)
      .text('Paid:', 380, currentY)
      .text(`INR ${paid.toFixed(2)}`, 460, currentY, { width: 90, align: 'right' });
    currentY += 14;
  }
  const balanceColor = balance <= 0 ? '#059669' : balance < total ? '#d97706' : '#dc2626';
  doc.rect(375, currentY, 180, 20).fill(balanceColor);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(baseSize - 1)
    .text('Balance Due:', 380, currentY + 6)
    .text(`INR ${balance.toFixed(2)}`, 460, currentY + 6, { width: 90, align: 'right' });
  return currentY + 30;
};

// Helper: draw footer (bank, qr, terms, signature)
const drawFooter = (doc, company, uploadsPath, baseSize, footerY) => {
  let leftY = footerY;
  if (company.bank_name) {
    doc.fillColor('#475569').fontSize(baseSize - 2).font('Helvetica-Bold').text('BANK DETAILS', 40, leftY);
    doc.fillColor('#000000').font('Helvetica').fontSize(baseSize - 2)
      .text(`Bank: ${company.bank_name}`, 40, leftY + 12)
      .text(`A/C: ${company.account_number}`, 40, leftY + 22)
      .text(`IFSC: ${company.ifsc_code}  Branch: ${company.branch_name || ''}`, 40, leftY + 32);
    leftY += 55;
  }
  if (company.qr_code) {
    try { doc.image(path.join(uploadsPath, company.qr_code), 40, leftY, { height: 55 }); leftY += 65; } catch (e) {}
  }
  if (company.terms_conditions) {
    doc.fillColor('#475569').fontSize(baseSize - 3).font('Helvetica-Bold').text('TERMS & CONDITIONS', 40, leftY);
    doc.fillColor('#64748b').font('Helvetica').fontSize(baseSize - 3)
      .text(company.terms_conditions, 40, leftY + 10, { width: 280, lineGap: 1 });
  }
  // Signature
  const sigX = 420, sigY = footerY + 20;
  doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold')
    .text('Authorized Signatory', sigX, sigY, { width: 130, align: 'center' });
  if (company.signature) {
    try { doc.image(path.join(uploadsPath, company.signature), sigX + 25, sigY + 14, { height: 40 }); } catch (e) {}
  }
  const ownerName = company.Users?.[0]?.name || '';
  if (ownerName) {
    doc.moveTo(sigX, sigY + 60).lineTo(sigX + 130, sigY + 60).strokeColor('#000').stroke();
    doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold')
      .text(ownerName, sigX, sigY + 64, { width: 130, align: 'center' });
  }
};

// ─── TEMPLATE: Modern (dark header bar) ───────────────────────────────────────
const generateModernPdf = (doc, invoice, company, uploadsPath, baseSize) => {
  const accent = company.invoice_header_color || '#1e293b';
  doc.rect(0, 0, 612, 110).fill('#f8fafc');
  doc.rect(0, 0, 612, 6).fill(accent);
  drawHeader(doc, invoice, company, uploadsPath, baseSize, accent);
  doc.rect(0, 108, 612, 1).fill('#e2e8f0');
  drawAddressBlock(doc, invoice, company, baseSize, 125);

  const tableTop = 215;
  doc.rect(40, tableTop, 515, 22).fill(accent);
  doc.fillColor('#ffffff').fontSize(baseSize - 1).font('Helvetica-Bold')
    .text('#', 45, tableTop + 7, { width: 20 })
    .text('Item', 70, tableTop + 7, { width: 200 })
    .text('Qty', 275, tableTop + 7, { width: 50, align: 'center' })
    .text('Rate', 330, tableTop + 7, { width: 70, align: 'right' })
    .text('Tax%', 405, tableTop + 7, { width: 45, align: 'center' })
    .text('Amount', 455, tableTop + 7, { width: 95, align: 'right' });

  let itemY = tableTop + 28;
  doc.font('Helvetica').fontSize(baseSize - 1).fillColor('#000000');
  (invoice.items || []).forEach((item, i) => {
    const total = parseFloat(item.total || 0);
    doc.text((i + 1).toString(), 45, itemY, { width: 20 })
      .text(item.Product?.name || 'Item', 70, itemY, { width: 200 })
      .text(String(item.quantity), 275, itemY, { width: 50, align: 'center' })
      .text(parseFloat(item.unit_price).toFixed(2), 330, itemY, { width: 70, align: 'right' })
      .text(`${item.tax_rate || 0}%`, 405, itemY, { width: 45, align: 'center' })
      .text(total.toFixed(2), 455, itemY, { width: 95, align: 'right' });
    itemY += 20;
    doc.moveTo(40, itemY - 2).lineTo(555, itemY - 2).strokeColor('#f1f5f9').stroke();
  });

  drawTotals(doc, invoice, baseSize, itemY + 15, accent);
  drawFooter(doc, company, uploadsPath, baseSize, 630);
};

// ─── TEMPLATE: Classic (blue bordered) ────────────────────────────────────────
const generateClassicPdf = (doc, invoice, company, uploadsPath, baseSize) => {
  const accent = '#1a3a6e';
  doc.rect(0, 0, 612, 8).fill(accent);
  drawHeader(doc, invoice, company, uploadsPath, baseSize, accent);
  doc.moveTo(40, 112).lineTo(572, 112).lineWidth(2).strokeColor(accent).stroke();
  drawAddressBlock(doc, invoice, company, baseSize, 122);
  doc.moveTo(40, 205).lineTo(572, 205).lineWidth(2).strokeColor(accent).stroke();

  const tableTop = 212;
  doc.rect(40, tableTop, 515, 22).fill(accent);
  doc.fillColor('#ffffff').fontSize(baseSize - 1).font('Helvetica-Bold')
    .text('#', 45, tableTop + 7, { width: 20 })
    .text('Item Description', 70, tableTop + 7, { width: 190 })
    .text('HSN', 265, tableTop + 7, { width: 55, align: 'center' })
    .text('Qty', 325, tableTop + 7, { width: 40, align: 'center' })
    .text('Rate', 370, tableTop + 7, { width: 65, align: 'right' })
    .text('GST%', 440, tableTop + 7, { width: 35, align: 'center' })
    .text('Amount', 478, tableTop + 7, { width: 72, align: 'right' });

  let itemY = tableTop + 28;
  doc.font('Helvetica').fontSize(baseSize - 1).fillColor('#000000');
  (invoice.items || []).forEach((item, i) => {
    if (i % 2 === 1) doc.rect(40, itemY - 4, 515, 20).fill('#eef3fb').fillColor('#000000');
    doc.text((i + 1).toString(), 45, itemY, { width: 20 })
      .text(item.Product?.name || 'Item', 70, itemY, { width: 190 })
      .text(item.Product?.hsn_code || '-', 265, itemY, { width: 55, align: 'center' })
      .text(String(item.quantity), 325, itemY, { width: 40, align: 'center' })
      .text(parseFloat(item.unit_price).toFixed(2), 370, itemY, { width: 65, align: 'right' })
      .text(`${item.tax_rate || 0}%`, 440, itemY, { width: 35, align: 'center' })
      .text(parseFloat(item.total || 0).toFixed(2), 478, itemY, { width: 72, align: 'right' });
    itemY += 20;
    doc.moveTo(40, itemY - 2).lineTo(555, itemY - 2).strokeColor('#cbd5e1').stroke();
  });

  drawTotals(doc, invoice, baseSize, itemY + 15, accent);
  drawFooter(doc, company, uploadsPath, baseSize, 630);
  doc.rect(0, 825, 612, 6).fill(accent);
};

// ─── TEMPLATE: Minimal (clean, monochrome) ─────────────────────────────────────
const generateMinimalPdf = (doc, invoice, company, uploadsPath, baseSize) => {
  if (company.logo) {
    try { doc.image(path.join(uploadsPath, company.logo), 40, 40, { height: 45 }); } catch (e) {}
  }
  doc.fontSize(baseSize + 4).fillColor('#0f172a').font('Helvetica-Bold')
    .text(company.name || '', 40, company.logo ? 92 : 40);
  doc.fontSize(baseSize - 2).fillColor('#94a3b8').font('Helvetica')
    .text(`${company.address || ''}  |  ${company.city || ''}, ${company.state || ''}  |  ${company.phone || ''}`, 40, company.logo ? 106 : 56);
  if (company.gst_number) {
    doc.fillColor('#64748b').text(`GSTIN: ${company.gst_number}`, 40, company.logo ? 118 : 68);
  }

  // Invoice number top right
  doc.fontSize(baseSize + 6).fillColor('#0f172a').font('Helvetica-Bold')
    .text(`#${invoice.invoice_number}`, 350, 40, { width: 202, align: 'right' });
  doc.fontSize(baseSize - 1).fillColor('#94a3b8').font('Helvetica')
    .text(new Date(invoice.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }), 350, 66, { width: 202, align: 'right' });

  doc.moveTo(40, 138).lineTo(572, 138).strokeColor('#e2e8f0').lineWidth(1).stroke();

  // Bill to
  const billTop = 150;
  doc.fontSize(baseSize - 2).fillColor('#94a3b8').font('Helvetica-Bold').text('BILLED TO', 40, billTop);
  doc.fontSize(baseSize).fillColor('#0f172a').font('Helvetica-Bold').text(invoice.Customer?.name || '', 40, billTop + 14);
  doc.fontSize(baseSize - 2).fillColor('#64748b').font('Helvetica')
    .text(`${invoice.Customer?.address || ''}`, 40, billTop + 28)
    .text(`${invoice.Customer?.city || ''}, ${invoice.Customer?.state || ''}`, 40, billTop + 40)
    .text(`Ph: ${invoice.Customer?.phone || ''}`, 40, billTop + 52);

  doc.moveTo(40, 218).lineTo(572, 218).strokeColor('#e2e8f0').lineWidth(1).stroke();

  const tableTop = 226;
  doc.fontSize(baseSize - 2).fillColor('#94a3b8').font('Helvetica-Bold')
    .text('ITEM', 40, tableTop, { width: 220 })
    .text('QTY', 265, tableTop, { width: 60, align: 'center' })
    .text('RATE', 330, tableTop, { width: 80, align: 'right' })
    .text('AMOUNT', 415, tableTop, { width: 140, align: 'right' });

  doc.moveTo(40, tableTop + 14).lineTo(572, tableTop + 14).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

  let itemY = tableTop + 22;
  doc.font('Helvetica').fontSize(baseSize - 1).fillColor('#1e293b');
  (invoice.items || []).forEach((item) => {
    doc.text(item.Product?.name || 'Item', 40, itemY, { width: 220 })
      .text(String(item.quantity), 265, itemY, { width: 60, align: 'center' })
      .text(parseFloat(item.unit_price).toFixed(2), 330, itemY, { width: 80, align: 'right' })
      .text(parseFloat(item.total || 0).toFixed(2), 415, itemY, { width: 140, align: 'right' });
    itemY += 18;
    doc.moveTo(40, itemY - 2).lineTo(572, itemY - 2).strokeColor('#f8fafc').stroke();
  });

  doc.moveTo(40, itemY + 4).lineTo(572, itemY + 4).strokeColor('#e2e8f0').lineWidth(1).stroke();
  drawTotals(doc, invoice, baseSize, itemY + 14, '#0f172a');
  drawFooter(doc, company, uploadsPath, baseSize, 630);
};

// ─── TEMPLATE: GST Standard (full CGST/SGST breakdown) ────────────────────────
const generateGstStandardPdf = (doc, invoice, company, uploadsPath, baseSize) => {
  const accent = '#047857';
  doc.rect(0, 0, 612, 6).fill(accent);

  // Centered header
  if (company.logo) {
    try { doc.image(path.join(uploadsPath, company.logo), 40, 20, { height: 50 }); } catch (e) {}
  }
  doc.fontSize(baseSize + 3).fillColor('#0f172a').font('Helvetica-Bold')
    .text(company.name || '', 0, 22, { align: 'center' });
  doc.fontSize(baseSize - 2).fillColor('#475569').font('Helvetica')
    .text(`${company.address || ''}, ${company.city || ''}, ${company.state || ''} - ${company.pincode || ''}`, 0, 38, { align: 'center' })
    .text(`Ph: ${company.phone || ''}  |  Email: ${company.email || ''}`, 0, 50, { align: 'center' });
  if (company.gst_number) {
    doc.font('Helvetica-Bold').fillColor(accent)
      .text(`GSTIN: ${company.gst_number}`, 0, 62, { align: 'center' });
  }
  doc.rect(0, 78, 612, 22).fill(accent);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(baseSize + 1)
    .text('TAX INVOICE', 0, 85, { align: 'center' });

  // Details grid
  const detY = 110;
  doc.rect(40, detY, 515, 1).fillColor('#cbd5e1').fill();
  doc.fontSize(baseSize - 2).fillColor('#475569').font('Helvetica-Bold')
    .text('Invoice No:', 40, detY + 8).text('Date:', 200, detY + 8)
    .text('Bill To:', 350, detY + 8);
  doc.font('Helvetica').fillColor('#000000')
    .text(invoice.invoice_number, 40, detY + 20)
    .text(new Date(invoice.invoice_date).toLocaleDateString('en-IN'), 200, detY + 20)
    .text(invoice.Customer?.name || '', 350, detY + 20)
    .text(`${invoice.Customer?.address || ''}`, 350, detY + 32, { width: 200 })
    .text(`${invoice.Customer?.city || ''}, ${invoice.Customer?.state || ''}`, 350, detY + 44)
    .text(`Ph: ${invoice.Customer?.phone || ''}`, 350, detY + 56);
  if (invoice.Customer?.gst_number) {
    doc.font('Helvetica-Bold').text(`GSTIN: ${invoice.Customer.gst_number}`, 350, detY + 68);
  }

  const tableTop = detY + 82;
  doc.rect(40, tableTop, 515, 20).fill(accent);
  doc.fillColor('#ffffff').fontSize(baseSize - 2).font('Helvetica-Bold')
    .text('#', 42, tableTop + 6, { width: 18 })
    .text('Description', 62, tableTop + 6, { width: 140 })
    .text('HSN', 205, tableTop + 6, { width: 45, align: 'center' })
    .text('Qty', 253, tableTop + 6, { width: 35, align: 'center' })
    .text('Rate', 291, tableTop + 6, { width: 55, align: 'right' })
    .text('Tax%', 349, tableTop + 6, { width: 35, align: 'center' })
    .text('CGST', 387, tableTop + 6, { width: 45, align: 'right' })
    .text('SGST', 435, tableTop + 6, { width: 45, align: 'right' })
    .text('Total', 483, tableTop + 6, { width: 67, align: 'right' });

  let itemY = tableTop + 24;
  let totalCgst = 0, totalSgst = 0;
  doc.font('Helvetica').fontSize(baseSize - 2).fillColor('#000000');
  (invoice.items || []).forEach((item, i) => {
    const taxRate = parseFloat(item.tax_rate || 0);
    const itemTotal = parseFloat(item.total || 0);
    const itemTax = (parseFloat(item.quantity) * parseFloat(item.unit_price) * taxRate) / 100;
    const cgst = itemTax / 2; const sgst = itemTax / 2;
    totalCgst += cgst; totalSgst += sgst;
    if (i % 2 === 1) doc.rect(40, itemY - 3, 515, 18).fill('#ecfdf5').fillColor('#000000');
    doc.text((i + 1).toString(), 42, itemY, { width: 18 })
      .text(item.Product?.name || 'Item', 62, itemY, { width: 140 })
      .text(item.Product?.hsn_code || '-', 205, itemY, { width: 45, align: 'center' })
      .text(String(item.quantity), 253, itemY, { width: 35, align: 'center' })
      .text(parseFloat(item.unit_price).toFixed(2), 291, itemY, { width: 55, align: 'right' })
      .text(`${taxRate}%`, 349, itemY, { width: 35, align: 'center' })
      .text(cgst.toFixed(2), 387, itemY, { width: 45, align: 'right' })
      .text(sgst.toFixed(2), 435, itemY, { width: 45, align: 'right' })
      .text(itemTotal.toFixed(2), 483, itemY, { width: 67, align: 'right' });
    itemY += 18;
    doc.moveTo(40, itemY - 1).lineTo(555, itemY - 1).strokeColor('#d1fae5').stroke();
  });

  // GST summary row
  doc.rect(40, itemY, 515, 18).fill('#d1fae5');
  doc.fillColor(accent).font('Helvetica-Bold').fontSize(baseSize - 2)
    .text('Total CGST:', 300, itemY + 5)
    .text(totalCgst.toFixed(2), 387, itemY + 5, { width: 45, align: 'right' })
    .text('Total SGST:', 300, itemY + 5)
    .text(totalSgst.toFixed(2), 435, itemY + 5, { width: 45, align: 'right' });
  itemY += 22;

  drawTotals(doc, invoice, baseSize, itemY + 10, accent);
  drawFooter(doc, company, uploadsPath, baseSize, 640);
  doc.rect(0, 830, 612, 5).fill(accent);
  doc.fontSize(7).fillColor('#94a3b8').font('Helvetica')
    .text('This is a computer-generated invoice.', 0, 838, { align: 'center' });
};

// ─── Main export ──────────────────────────────────────────────────────────────
const generateInvoicePdf = async (invoice, company) => {
  const templateId = company.settings?.template_id || company.settings?.invoice_template || 'modern';
  const textSizeStr = company.invoice_text_size || '10pt';
  const baseSize = parseInt(textSizeStr) || 10;
  const uploadsPath = path.join(__dirname, '../uploads');

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  let buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    if (templateId === 'classic') {
      generateClassicPdf(doc, invoice, company, uploadsPath, baseSize);
    } else if (templateId === 'minimal') {
      generateMinimalPdf(doc, invoice, company, uploadsPath, baseSize);
    } else if (templateId === 'gst-standard') {
      generateGstStandardPdf(doc, invoice, company, uploadsPath, baseSize);
    } else {
      generateModernPdf(doc, invoice, company, uploadsPath, baseSize);
    }

    doc.end();
  });
};

module.exports = { generateInvoicePdf };
