/**
 * Automobile Template - For Automobile, Service Centers
 * Features: Two separate tables - Spare Parts and Services
 */

const renderAutomobileInvoice = (doc, invoice, company, config, options) => {
  const { headerColor, baseSize } = options;
  let tableTop = options.tableTop || 220;
  
  // Separate products and services
  const products = options.items?.filter(item => item.item_type === 'product' || !item.item_type) || [];
  const services = options.items?.filter(item => item.item_type === 'service') || [];
  
  let productSubtotal = 0;
  let productTaxTotal = 0;
  let serviceSubtotal = 0;
  let serviceTaxTotal = 0;
  let itemY = tableTop;
  
  // ===== PRODUCTS TABLE =====
  if (products.length > 0) {
    // Section Header
    doc.rect(40, itemY, 515, 22).fill('#1e40af');
    doc.fillColor('#FFFFFF').fontSize(baseSize).font('Helvetica-Bold');
    doc.text('SPARE PARTS & MATERIALS', 45, itemY + 6);
    
    itemY += 25;
    
    // Table Header
    doc.rect(40, itemY, 515, 18).fill(headerColor);
    doc.fillColor('#FFFFFF').fontSize(baseSize - 1);
    doc.text('#', 45, itemY + 5, { width: 25 });
    doc.text('Part Description', 75, itemY + 5, { width: 150 });
    doc.text('Part No', 230, itemY + 5, { width: 70 });
    doc.text('Qty', 305, itemY + 5, { width: 35, align: 'center' });
    doc.text('Rate', 345, itemY + 5, { width: 55, align: 'right' });
    doc.text('GST%', 405, itemY + 5, { width: 35, align: 'center' });
    doc.text('Amount', 445, itemY + 5, { width: 70, align: 'right' });
    
    itemY += 22;
    doc.font('Helvetica').fontSize(baseSize - 1).fillColor('#000000');
    
    products.forEach((item, index) => {
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
      doc.text(product.name || 'Part', 75, itemY, { width: 150 });
      doc.text(product.sku || '-', 230, itemY, { width: 70 });
      doc.text(qty.toString(), 305, itemY, { width: 35, align: 'center' });
      doc.text(price.toFixed(2), 345, itemY, { width: 55, align: 'right' });
      doc.text(`${taxRate}%`, 405, itemY, { width: 35, align: 'center' });
      doc.text(itemTotal.toFixed(2), 445, itemY, { width: 70, align: 'right' });
      
      // Tax breakdown
      if (taxRate > 0) {
        itemY += 12;
        doc.fontSize(baseSize - 2).fillColor('#64748b');
        const cgst = itemTax / 2;
        const sgst = itemTax / 2;
        doc.text(`CGST: ${cgst.toFixed(2)} | SGST: ${sgst.toFixed(2)}`, 230, itemY);
        doc.fontSize(baseSize - 1).fillColor('#000000');
      }
      
      itemY += 16;
      doc.moveTo(40, itemY - 3).lineTo(555, itemY - 3).strokeColor('#f1f5f9').stroke();
    });
    
    // Products Subtotal
    itemY += 8;
    doc.rect(350, itemY, 205, 20).fill('#f0f9ff');
    doc.fillColor('#1e40af').font('Helvetica-Bold').fontSize(baseSize);
    doc.text('Parts Subtotal:', 360, itemY + 5);
    doc.text((productSubtotal + productTaxTotal).toFixed(2), 445, itemY + 5, { width: 70, align: 'right' });
    itemY += 25;
  }
  
  // ===== SERVICES TABLE =====
  if (services.length > 0) {
    // Section Header
    doc.rect(40, itemY, 515, 22).fill('#047857');
    doc.fillColor('#FFFFFF').fontSize(baseSize).font('Helvetica-Bold');
    doc.text('SERVICES & LABOUR CHARGES', 45, itemY + 6);
    
    itemY += 25;
    
    // Table Header
    doc.rect(40, itemY, 515, 18).fill(headerColor);
    doc.fillColor('#FFFFFF').fontSize(baseSize - 1);
    doc.text('#', 45, itemY + 5, { width: 25 });
    doc.text('Service Description', 75, itemY + 5, { width: 180 });
    doc.text('Hrs', 260, itemY + 5, { width: 35, align: 'center' });
    doc.text('Rate', 300, itemY + 5, { width: 55, align: 'right' });
    doc.text('GST%', 360, itemY + 5, { width: 35, align: 'center' });
    doc.text('Amount', 400, itemY + 5, { width: 70, align: 'right' });
    
    itemY += 22;
    doc.font('Helvetica').fontSize(baseSize - 1).fillColor('#000000');
    
    services.forEach((item, index) => {
      const product = item.Product || {};
      const hours = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.unit_price) || 0;
      const taxRate = parseFloat(item.tax_rate) || 0;
      const itemSubtotal = hours * rate;
      const itemTax = (itemSubtotal * taxRate) / 100;
      const itemTotal = itemSubtotal + itemTax;
      
      serviceSubtotal += itemSubtotal;
      serviceTaxTotal += itemTax;
      
      doc.text((index + 1).toString(), 45, itemY, { width: 25 });
      doc.text(product.name || 'Service', 75, itemY, { width: 180 });
      doc.text(hours.toString(), 260, itemY, { width: 35, align: 'center' });
      doc.text(rate.toFixed(2), 300, itemY, { width: 55, align: 'right' });
      doc.text(`${taxRate}%`, 360, itemY, { width: 35, align: 'center' });
      doc.text(itemTotal.toFixed(2), 400, itemY, { width: 70, align: 'right' });
      
      // Tax breakdown
      if (taxRate > 0) {
        itemY += 12;
        doc.fontSize(baseSize - 2).fillColor('#64748b');
        const cgst = itemTax / 2;
        const sgst = itemTax / 2;
        doc.text(`CGST: ${cgst.toFixed(2)} | SGST: ${sgst.toFixed(2)}`, 260, itemY);
        doc.fontSize(baseSize - 1).fillColor('#000000');
      }
      
      itemY += 16;
      doc.moveTo(40, itemY - 3).lineTo(555, itemY - 3).strokeColor('#f1f5f9').stroke();
    });
    
    // Services Subtotal
    itemY += 8;
    doc.rect(350, itemY, 205, 20).fill('#ecfdf5');
    doc.fillColor('#047857').font('Helvetica-Bold').fontSize(baseSize);
    doc.text('Services Subtotal:', 360, itemY + 5);
    doc.text((serviceSubtotal + serviceTaxTotal).toFixed(2), 400, itemY + 5, { width: 70, align: 'right' });
    itemY += 25;
  }
  
  return { 
    itemY, 
    productSubtotal, 
    productTaxTotal, 
    serviceSubtotal, 
    serviceTaxTotal,
    hasProducts: products.length > 0,
    hasServices: services.length > 0
  };
};

module.exports = { renderAutomobileInvoice };
