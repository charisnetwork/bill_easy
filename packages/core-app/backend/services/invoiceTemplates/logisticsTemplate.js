/**
 * Logistics Template - For Transport, Logistics Companies
 * Features: LR Number, From/To locations, Weight, Vehicle info
 */

const renderLogisticsInvoice = (doc, invoice, company, config, options) => {
  const { headerColor, baseSize, items } = options;
  
  // Transport info box
  const metadata = invoice.industry_metadata || {};
  const infoY = options.tableTop ? options.tableTop - 50 : 190;
  
  doc.rect(40, infoY, 515, 40).fill('#eff6ff');
  doc.fillColor('#1e40af').fontSize(baseSize - 1).font('Helvetica-Bold');
  
  if (metadata.lr_number) {
    doc.text(`LR No: ${metadata.lr_number}`, 50, infoY + 8);
  }
  if (metadata.vehicle_number) {
    doc.text(`Vehicle: ${metadata.vehicle_number}`, 200, infoY + 8);
  }
  if (metadata.freight_type) {
    doc.text(`Freight: ${metadata.freight_type}`, 380, infoY + 8);
  }
  if (metadata.from_location && metadata.to_location) {
    doc.text(`Route: ${metadata.from_location} → ${metadata.to_location}`, 50, infoY + 25);
  }
  if (metadata.weight) {
    doc.text(`Weight: ${metadata.weight} kg`, 350, infoY + 25);
  }
  
  // Items Table Header
  const tableTop = infoY + 50;
  doc.rect(40, tableTop, 515, 20).fill(headerColor);
  doc.fillColor('#FFFFFF').fontSize(baseSize - 1).font('Helvetica-Bold');
  
  doc.text('#', 45, tableTop + 6, { width: 25 });
  doc.text('Description', 75, tableTop + 6, { width: 200 });
  doc.text('LR No', 280, tableTop + 6, { width: 70 });
  doc.text('Weight(kg)', 355, tableTop + 6, { width: 50, align: 'center' });
  doc.text('Rate', 410, tableTop + 6, { width: 50, align: 'right' });
  doc.text('Amount', 465, tableTop + 6, { width: 70, align: 'right' });
  
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
      
      const lrNo = item.lr_number || metadata.lr_number || '-';
      const weight = item.weight || metadata.weight || '-';
      
      doc.text((index + 1).toString(), 45, itemY, { width: 25 });
      doc.text(product.name || 'Consignment', 75, itemY, { width: 200 });
      doc.text(lrNo, 280, itemY, { width: 70 });
      doc.text(weight.toString(), 355, itemY, { width: 50, align: 'center' });
      doc.text(price.toFixed(2), 410, itemY, { width: 50, align: 'right' });
      doc.text(itemTotal.toFixed(2), 465, itemY, { width: 70, align: 'right' });
      
      // GST info
      if (taxRate > 0) {
        itemY += 12;
        doc.fontSize(baseSize - 2).fillColor('#64748b');
        const cgst = itemTax / 2;
        const sgst = itemTax / 2;
        doc.text(`CGST (${taxRate/2}%): ${cgst.toFixed(2)} | SGST (${taxRate/2}%): ${sgst.toFixed(2)}`, 280, itemY);
        doc.fontSize(baseSize - 1).fillColor('#000000');
      }
      
      itemY += 18;
      doc.moveTo(40, itemY - 5).lineTo(555, itemY - 5).strokeColor('#f1f5f9').stroke();
    });
  }
  
  return { itemY, productSubtotal, productTaxTotal };
};

module.exports = { renderLogisticsInvoice };
