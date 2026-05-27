/**
 * Retail Template - For General Store, Retail Shop, Cloth Store, Distribution, Electronics, Hardware
 */

const renderRetailInvoice = (doc, invoice, company, config, options) => {
  const { headerColor, baseSize, items } = options;
  
  // Items Table Header
  const tableTop = options.tableTop || 230;
  doc.rect(40, tableTop, 515, 20).fill(headerColor);
  doc.fillColor('#FFFFFF').fontSize(baseSize - 1).font('Helvetica-Bold');
  
  doc.text('#', 45, tableTop + 6, { width: 25 });
  doc.text('Item Description', 75, tableTop + 6, { width: 180 });
  doc.text('HSN', 260, tableTop + 6, { width: 60 });
  doc.text('Qty', 325, tableTop + 6, { width: 40, align: 'center' });
  doc.text('Rate', 370, tableTop + 6, { width: 60, align: 'right' });
  doc.text('GST%', 435, tableTop + 6, { width: 40, align: 'center' });
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
      const discount = parseFloat(item.discount) || 0;
      
      const itemSubtotal = (qty * price) - discount;
      const itemTax = (itemSubtotal * taxRate) / 100;
      const itemTotal = itemSubtotal + itemTax;
      
      productSubtotal += itemSubtotal;
      productTaxTotal += itemTax;
      
      // Row
      doc.text((index + 1).toString(), 45, itemY, { width: 25 });
      doc.text(product.name || 'Item', 75, itemY, { width: 180 });
      doc.text(product.hsn_code || '-', 260, itemY, { width: 60 });
      doc.text(qty.toString(), 325, itemY, { width: 40, align: 'center' });
      doc.text(price.toFixed(2), 370, itemY, { width: 60, align: 'right' });
      doc.text(`${taxRate}%`, 435, itemY, { width: 40, align: 'center' });
      doc.text(itemTotal.toFixed(2), 480, itemY, { width: 70, align: 'right' });
      
      // Description if exists
      if (item.description) {
        itemY += 12;
        doc.fontSize(baseSize - 2).fillColor('#64748b');
        doc.text(item.description, 75, itemY, { width: 180 });
        doc.fontSize(baseSize - 1).fillColor('#000000');
      }
      
      // GST Breakdown row
      if (taxRate > 0) {
        itemY += 12;
        doc.fontSize(baseSize - 2).fillColor('#64748b');
        const cgst = itemTax / 2;
        const sgst = itemTax / 2;
        doc.text(`CGST: ${cgst.toFixed(2)} | SGST: ${sgst.toFixed(2)}`, 260, itemY);
        doc.fontSize(baseSize - 1).fillColor('#000000');
      }
      
      itemY += 18;
      doc.moveTo(40, itemY - 5).lineTo(555, itemY - 5).strokeColor('#f1f5f9').stroke();
    });
  }
  
  return { itemY, productSubtotal, productTaxTotal };
};

module.exports = { renderRetailInvoice };
