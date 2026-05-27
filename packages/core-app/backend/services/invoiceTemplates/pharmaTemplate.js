/**
 * Pharma Template - For Pharmacy and Medical Stores
 * Features: Batch number, Expiry date, MRP, Doctor/Patient info
 */

const renderPharmaInvoice = (doc, invoice, company, config, options) => {
  const { headerColor, baseSize, items } = options;
  
  // Items Table Header
  const tableTop = options.tableTop || 230;
  doc.rect(40, tableTop, 515, 20).fill(headerColor);
  doc.fillColor('#FFFFFF').fontSize(baseSize - 1).font('Helvetica-Bold');
  
  doc.text('#', 45, tableTop + 6, { width: 20 });
  doc.text('Medicine', 70, tableTop + 6, { width: 140 });
  doc.text('Batch', 215, tableTop + 6, { width: 55 });
  doc.text('Expiry', 275, tableTop + 6, { width: 45 });
  doc.text('Qty', 325, tableTop + 6, { width: 30, align: 'center' });
  doc.text('MRP', 360, tableTop + 6, { width: 50, align: 'right' });
  doc.text('GST%', 415, tableTop + 6, { width: 35, align: 'center' });
  doc.text('Amount', 455, tableTop + 6, { width: 55, align: 'right' });
  
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
      const discount = parseFloat(item.discount) || 0;
      
      const itemSubtotal = (qty * price) - discount;
      const itemTax = (itemSubtotal * taxRate) / 100;
      const itemTotal = itemSubtotal + itemTax;
      
      productSubtotal += itemSubtotal;
      productTaxTotal += itemTax;
      
      // Get batch and expiry from item metadata or product
      const batchNo = item.batch_number || product.batch_number || '-';
      const expiry = item.expiry_date || product.expiry_date || '-';
      
      // Row
      doc.text((index + 1).toString(), 45, itemY, { width: 20 });
      doc.text(product.name || 'Medicine', 70, itemY, { width: 140 });
      doc.text(batchNo, 215, itemY, { width: 55 });
      doc.text(expiry, 275, itemY, { width: 45 });
      doc.text(qty.toString(), 325, itemY, { width: 30, align: 'center' });
      doc.text(price.toFixed(2), 360, itemY, { width: 50, align: 'right' });
      doc.text(`${taxRate}%`, 415, itemY, { width: 35, align: 'center' });
      doc.text(itemTotal.toFixed(2), 455, itemY, { width: 55, align: 'right' });
      
      // HSN code below
      if (product.hsn_code) {
        itemY += 12;
        doc.fontSize(baseSize - 2).fillColor('#64748b');
        doc.text(`HSN: ${product.hsn_code}`, 70, itemY, { width: 140 });
        doc.fontSize(baseSize - 1).fillColor('#000000');
      }
      
      // GST Breakdown
      if (taxRate > 0) {
        itemY += 12;
        doc.fontSize(baseSize - 2).fillColor('#64748b');
        const cgst = itemTax / 2;
        const sgst = itemTax / 2;
        doc.text(`CGST: ${cgst.toFixed(2)} | SGST: ${sgst.toFixed(2)}`, 215, itemY);
        doc.fontSize(baseSize - 1).fillColor('#000000');
      }
      
      itemY += 18;
      doc.moveTo(40, itemY - 5).lineTo(555, itemY - 5).strokeColor('#f1f5f9').stroke();
    });
  }
  
  return { itemY, productSubtotal, productTaxTotal };
};

module.exports = { renderPharmaInvoice };
