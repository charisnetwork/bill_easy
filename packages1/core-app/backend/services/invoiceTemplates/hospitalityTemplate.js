/**
 * Hospitality Template - For Hotels, Restaurants
 * Features: Check-in/out dates, Room number, Guest count
 */

const renderHospitalityInvoice = (doc, invoice, company, config, options) => {
  const { headerColor, baseSize, items } = options;
  
  // Guest/Stay info box
  const metadata = invoice.industry_metadata || {};
  const infoY = options.tableTop ? options.tableTop - 50 : 190;
  
  doc.rect(40, infoY, 515, 40).fill('#fff7ed');
  doc.fillColor('#c2410c').fontSize(baseSize - 1).font('Helvetica-Bold');
  
  let row1Y = infoY + 8;
  let row2Y = infoY + 25;
  
  if (metadata.guest_name) {
    doc.text(`Guest: ${metadata.guest_name}`, 50, row1Y);
  }
  if (metadata.check_in && metadata.check_out) {
    const checkIn = new Date(metadata.check_in).toLocaleDateString('en-IN');
    const checkOut = new Date(metadata.check_out).toLocaleDateString('en-IN');
    doc.text(`Stay: ${checkIn} to ${checkOut}`, 200, row1Y);
  }
  if (metadata.room_number) {
    doc.text(`Room: ${metadata.room_number}`, 400, row1Y);
  }
  if (metadata.number_of_guests) {
    doc.text(`Guests: ${metadata.number_of_guests}`, 480, row1Y);
  }
  
  // Items Table Header
  const tableTop = infoY + 50;
  doc.rect(40, tableTop, 515, 20).fill(headerColor);
  doc.fillColor('#FFFFFF').fontSize(baseSize - 1).font('Helvetica-Bold');
  
  doc.text('#', 45, tableTop + 6, { width: 25 });
  doc.text('Item/Service', 75, tableTop + 6, { width: 160 });
  doc.text('Description', 240, tableTop + 6, { width: 120 });
  doc.text('Qty/Nights', 365, tableTop + 6, { width: 50, align: 'center' });
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
      
      doc.text((index + 1).toString(), 45, itemY, { width: 25 });
      doc.text(product.name || 'Item', 75, itemY, { width: 160 });
      doc.text(item.description || '-', 240, itemY, { width: 120 });
      doc.text(qty.toString(), 365, itemY, { width: 50, align: 'center' });
      doc.text(price.toFixed(2), 420, itemY, { width: 50, align: 'right' });
      doc.text(itemTotal.toFixed(2), 475, itemY, { width: 70, align: 'right' });
      
      // GST info
      if (taxRate > 0) {
        itemY += 12;
        doc.fontSize(baseSize - 2).fillColor('#64748b');
        const cgst = itemTax / 2;
        const sgst = itemTax / 2;
        doc.text(`CGST (${taxRate/2}%): ${cgst.toFixed(2)} | SGST (${taxRate/2}%): ${sgst.toFixed(2)}`, 240, itemY);
        doc.fontSize(baseSize - 1).fillColor('#000000');
      }
      
      itemY += 18;
      doc.moveTo(40, itemY - 5).lineTo(555, itemY - 5).strokeColor('#f1f5f9').stroke();
    });
  }
  
  return { itemY, productSubtotal, productTaxTotal };
};

module.exports = { renderHospitalityInvoice };
