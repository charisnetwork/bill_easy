const PDFDocument = require('pdfkit');
const path = require('path');

const generateQuotationPdf = async (quotation, company) => {
  const industry = company.business_category || 'General Store';
  
  const industryConfigs = {
    "Services": ["Consulting", "IT", "Photography", "Accounting", "Service Centres", "Education"],
    "Healthcare": ["Healthcare", "Pharma", "Medical Devices"],
    "Construction": ["Construction", "Interiors", "Real Estate", "Engineering"],
    "Hospitality": ["Hospitality", "Restaurants", "Hotel"]
  };

  let category = "Retail";
  for (const [cat, industries] of Object.entries(industryConfigs)) {
    if (industries.includes(industry)) {
      category = cat;
      break;
    }
  }

  const labels = {
    itemName: (category === "Services") ? "SERVICE DESCRIPTION" : "ITEM DESCRIPTION",
    qty: (category === "Services") ? "HOURS" : "QTY",
    price: (category === "Services") ? "RATE/HR" : "PRICE"
  };

  const showQty = category !== "Services";

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

    // --- Header Section ---
    const uploadsPath = path.join(__dirname, '../uploads');
    
    // Logo
    if (company.logo) {
      try {
        doc.image(path.join(uploadsPath, company.logo), 40, 40, { height: 50 });
      } catch (e) {
        doc.fontSize(20).text(company.name, 40, 40);
      }
    } else {
      doc.fontSize(20).fillColor('#10b981').text(company.name, 40, 40);
    }

    doc.fillColor('#475569').fontSize(10);
    doc.text("QUOTATION", 400, 40, { align: 'right' });
    
    doc.fillColor('#000000').fontSize(12).text(company.name, 400, 55, { align: 'right' });
    doc.fontSize(8).fillColor('#64748b');
    doc.text(company.address || '', 400, 70, { align: 'right' });
    doc.text(`${company.city || ''}, ${company.state || ''}`, 400, 80, { align: 'right' });
    doc.text(`Phone: ${company.phone || ''}`, 400, 90, { align: 'right' });
    if (company.gst_number) doc.text(`GSTIN: ${company.gst_number}`, 400, 100, { align: 'right' });

    doc.moveDown(4);

    // --- Quotation Info ---
    const top = 140;
    doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold').text("Quote To:", 40, top);
    doc.font('Helvetica').text(quotation.Customer.name, 40, top + 15);
    doc.fontSize(8).fillColor('#64748b');
    doc.text(quotation.Customer.address || '', 40, top + 30);
    doc.text(`${quotation.Customer.city || ''}, ${quotation.Customer.state || ''}`, 40, top + 40);
    doc.text(`Phone: ${quotation.Customer.phone || ''}`, 40, top + 50);

    doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold').text("Quotation Details:", 350, top);
    doc.font('Helvetica').fontSize(9);
    doc.text(`Quote No: ${quotation.quotation_number}`, 350, top + 15);
    doc.text(`Date: ${new Date(quotation.quotation_date).toLocaleDateString()}`, 350, top + 30);
    if (quotation.valid_until) {
      doc.text(`Valid Until: ${new Date(quotation.valid_until).toLocaleDateString()}`, 350, top + 45);
    }
    doc.text(`Status: ${quotation.status.toUpperCase()}`, 350, top + 60);

    doc.moveDown(4);

    // --- Table ---
    const tableTop = 230;
    doc.rect(40, tableTop, 515, 20).fill('#f8fafc');
    doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold');
    doc.text(labels.itemName, 50, tableTop + 6);
    if (showQty) doc.text(labels.qty, 300, tableTop + 6, { width: 50, align: 'center' });
    doc.text(labels.price, 360, tableTop + 6, { width: 80, align: 'right' });
    doc.text("TOTAL", 450, tableTop + 6, { width: 95, align: 'right' });

    let itemY = tableTop + 25;
    doc.font('Helvetica').fontSize(9).fillColor('#000000');

    quotation.items.forEach((item, i) => {
      const name = item.Product?.name || 'Item';
      const desc = item.description ? `\n${item.description}` : '';
      doc.text(name + desc, 50, itemY, { width: 240 });
      
      const textHeight = doc.heightOfString(name + desc, { width: 240 });
      
      if (showQty) doc.text(item.quantity.toString(), 300, itemY, { width: 50, align: 'center' });
      doc.text(`INR ${parseFloat(item.unit_price).toFixed(2)}`, 360, itemY, { width: 80, align: 'right' });
      doc.text(`INR ${parseFloat(item.total).toFixed(2)}`, 450, itemY, { width: 95, align: 'right' });
      
      itemY += Math.max(20, textHeight + 5);
      doc.moveTo(40, itemY - 5).lineTo(555, itemY - 5).strokeColor('#f1f5f9').stroke();
    });

    // --- Totals ---
    const totalY = itemY + 20;
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000').text("Sub Total:", 350, totalY);
    doc.font('Helvetica').fontSize(10).text(`INR ${parseFloat(quotation.subtotal).toFixed(2)}`, 450, totalY, { width: 95, align: 'right' });
    
    doc.font('Helvetica-Bold').fontSize(10).text("Tax Amount:", 350, totalY + 15);
    doc.font('Helvetica').fontSize(10).text(`INR ${parseFloat(quotation.tax_amount || 0).toFixed(2)}`, 450, totalY + 15, { width: 95, align: 'right' });

    doc.rect(345, totalY + 35, 210, 25).fill('#f8fafc');
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#1e293b').text("Total Amount:", 350, totalY + 42);
    doc.fontSize(12).text(`INR ${parseFloat(quotation.total_amount).toFixed(2)}`, 450, totalY + 42, { width: 95, align: 'right' });

    // --- Footer Section ---
    const footerY = 650;
    
    // Signature (Bottom Right)
    const signatureX = 400;
    if (company.signature) {
      try {
        doc.image(path.join(uploadsPath, company.signature), signatureX, footerY, { height: 40 });
        doc.moveTo(signatureX, footerY + 45).lineTo(signatureX + 140, footerY + 45).strokeColor('#e2e8f0').stroke();
        doc.fillColor('#000000').fontSize(8).font('Helvetica-Bold').text("Authorized Signatory", signatureX, footerY + 50, { width: 140, align: 'center' });
      } catch (e) {
        doc.moveTo(signatureX, footerY + 45).lineTo(signatureX + 140, footerY + 45).strokeColor('#e2e8f0').stroke();
        doc.fillColor('#000000').fontSize(8).font('Helvetica-Bold').text("Authorized Signatory", signatureX, footerY + 50, { width: 140, align: 'center' });
      }
    } else {
      doc.moveTo(signatureX, footerY + 45).lineTo(signatureX + 140, footerY + 45).strokeColor('#e2e8f0').stroke();
      doc.fillColor('#000000').fontSize(8).font('Helvetica-Bold').text("Authorized Signatory", signatureX, footerY + 50, { width: 140, align: 'center' });
    }

    // Terms & Conditions (Very Bottom)
    if (quotation.terms || company.terms_conditions) {
        const termsY = 750;
        doc.moveTo(40, termsY - 5).lineTo(555, termsY - 5).strokeColor('#f1f5f9').lineWidth(0.5).stroke();
        doc.fillColor('#475569').fontSize(7).font('Helvetica-Bold').text("TERMS & CONDITIONS", 40, termsY);
        doc.fillColor('#64748b').font('Helvetica').fontSize(7).text(quotation.terms || company.terms_conditions, 40, termsY + 10, { width: 515, lineGap: 1 });
    }

    doc.end();
  });
};

module.exports = { generateQuotationPdf };
