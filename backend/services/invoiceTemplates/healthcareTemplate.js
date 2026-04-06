/**
 * Healthcare Template - For Hospitals, Clinics, Healthcare Centers
 * Features: Patient info, Doctor name, Treatment details
 */

const renderHealthcareInvoice = (doc, invoice, company, config, options) => {
  const { headerColor, baseSize, items } = options;
  
  // Patient/Doctor info box
  const metadata = invoice.industry_metadata || {};
  const infoY = options.tableTop ? options.tableTop - 40 : 200;
  
  doc.rect(40, infoY, 515, 30).fill('#f0fdfa');
  doc.fillColor('#0f766e').fontSize(baseSize - 1).font('Helvetica-Bold');
  
  let infoX = 50;
  if (metadata.patient_name) {
    doc.text(`Patient: ${metadata.patient_name}`, infoX, infoY + 10);
    infoX += 150;
  }
  if (metadata.doctor_name) {
    doc.text(`Dr.: ${metadata.doctor_name}`, infoX, infoY + 10);
    infoX += 150;
  }
  if (metadata.room_number) {
    doc.text(`Room: ${metadata.room_number}`, infoX, infoY + 10);
  }
  
  // Items Table Header
  const tableTop = infoY + 40;
  doc.rect(40, tableTop, 515, 20).fill(headerColor);
  doc.fillColor('#FFFFFF').fontSize(baseSize - 1).font('Helvetica-Bold');
  
  doc.text('#', 45, tableTop + 6, { width: 25 });
  doc.text('Treatment/Service', 75, tableTop + 6, { width: 180 });
  doc.text('Description', 260, tableTop + 6, { width: 120 });
  doc.text('Qty', 385, tableTop + 6, { width: 35, align: 'center' });
  doc.text('Rate', 425, tableTop + 6, { width: 50, align: 'right' });
  doc.text('Amount', 480, tableTop + 6, { width: 70, align: 'right' });
  
  // Items
  let itemY = tableTop + 25;
  doc.font('Helvetica').fontSize(baseSize - 1).fillColor('#000000');
  
  let productSubtotal = 0;
  let productTaxTotal = 0;
  
  if (items && items.length) {
    items.forEach((item, index) => {
      const product = item.Product || {};
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      const taxRate = parseFloat(item.tax_rate) || 0;
      
      const itemSubtotal = qty * price;
      const itemTax = (itemSubtotal * taxRate) / 100;
      const itemTotal = itemSubtotal + itemTax;
      
      productSubtotal += itemSubtotal;
      productTaxTotal += itemTax;
      
      doc.text((index + 1).toString(), 45, itemY, { width: 25 });
      doc.text(product.name || 'Treatment', 75, itemY, { width: 180 });
      doc.text(item.description || '-', 260, itemY, { width: 120 });
      doc.text(qty.toString(), 385, itemY, { width: 35, align: 'center' });
      doc.text(price.toFixed(2), 425, itemY, { width: 50, align: 'right' });
      doc.text(itemTotal.toFixed(2), 480, itemY, { width: 70, align: 'right' });
      
      // GST info
      if (taxRate > 0) {
        itemY += 12;
        doc.fontSize(baseSize - 2).fillColor('#64748b');
        const cgst = itemTax / 2;
        const sgst = itemTax / 2;
        doc.text(`CGST: ${cgst.toFixed(2)} | SGST: ${sgst.toFixed(2)} | Total Tax: ${itemTax.toFixed(2)}`, 260, itemY);
        doc.fontSize(baseSize - 1).fillColor('#000000');
      }
      
      itemY += 18;
      doc.moveTo(40, itemY - 5).lineTo(555, itemY - 5).strokeColor('#f1f5f9').stroke();
    });
  }
  
  return { itemY, productSubtotal, productTaxTotal };
};

module.exports = { renderHealthcareInvoice };
