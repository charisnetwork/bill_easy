/**
 * Service Template - For IT, Consultants, Professional Services
 * Features: Service descriptions, hourly/daily rates, project references
 */

const renderServiceInvoice = (doc, invoice, company, config, options) => {
  const { headerColor, baseSize, items } = options;
  
  // Items Table Header
  const tableTop = options.tableTop || 230;
  doc.rect(40, tableTop, 515, 20).fill(headerColor);
  doc.fillColor('#FFFFFF').fontSize(baseSize - 1).font('Helvetica-Bold');
  
  doc.text('#', 45, tableTop + 6, { width: 25 });
  doc.text('Service Description', 75, tableTop + 6, { width: 200 });
  doc.text('Period', 280, tableTop + 6, { width: 80 });
  doc.text('Hours/Days', 365, tableTop + 6, { width: 50, align: 'center' });
  doc.text('Rate', 420, tableTop + 6, { width: 50, align: 'right' });
  doc.text('Amount', 475, tableTop + 6, { width: 70, align: 'right' });
  
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
      
      // Period info from metadata
      const metadata = invoice.industry_metadata || {};
      const periodStart = metadata.period_start ? new Date(metadata.period_start).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '';
      const periodEnd = metadata.period_end ? new Date(metadata.period_end).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '';
      const period = periodStart && periodEnd ? `${periodStart} - ${periodEnd}` : '-';
      
      // Row
      doc.text((index + 1).toString(), 45, itemY, { width: 25 });
      doc.text(product.name || 'Service', 75, itemY, { width: 200 });
      doc.text(period, 280, itemY, { width: 80 });
      doc.text(qty.toString(), 365, itemY, { width: 50, align: 'center' });
      doc.text(price.toFixed(2), 420, itemY, { width: 50, align: 'right' });
      doc.text(itemTotal.toFixed(2), 475, itemY, { width: 70, align: 'right' });
      
      // Description
      if (item.description) {
        itemY += 12;
        doc.fontSize(baseSize - 2).fillColor('#64748b');
        doc.text(item.description, 75, itemY, { width: 200 });
        doc.fontSize(baseSize - 1).fillColor('#000000');
      }
      
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

module.exports = { renderServiceInvoice };
