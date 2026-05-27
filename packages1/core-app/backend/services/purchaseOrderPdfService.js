const PDFDocument = require('pdfkit');
const path = require('path');

const generatePurchaseOrderPdf = async (po, company) => {
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
    doc.text("PURCHASE ORDER", 400, 40, { align: 'right' });
    
    doc.fillColor('#000000').fontSize(12).text(company.name, 400, 55, { align: 'right' });
    doc.fontSize(8).fillColor('#64748b');
    doc.text(company.address || '', 400, 70, { align: 'right' });
    doc.text(`${company.city || ''}, ${company.state || ''}`, 400, 80, { align: 'right' });
    doc.text(`Phone: ${company.phone || ''}`, 400, 90, { align: 'right' });
    if (company.gst_number) doc.text(`GSTIN: ${company.gst_number}`, 400, 100, { align: 'right' });

    doc.moveDown(4);

    // --- PO Info ---
    const top = 140;
    doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold').text("Vendor Details:", 40, top);
    doc.font('Helvetica').text(po.Supplier?.name || 'Vendor', 40, top + 15);
    doc.fontSize(8).fillColor('#64748b');
    doc.text(po.Supplier?.address || '', 40, top + 30);
    doc.text(`${po.Supplier?.city || ''}, ${po.Supplier?.state || ''}`, 40, top + 40);
    doc.text(`Phone: ${po.Supplier?.phone || ''}`, 40, top + 50);

    doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold').text("Order Details:", 350, top);
    doc.font('Helvetica').fontSize(9);
    doc.text(`PO No: ${po.po_number}`, 350, top + 15);
    doc.text(`Date: ${new Date(po.po_date).toLocaleDateString()}`, 350, top + 30);
    if (po.expected_date) {
      doc.text(`Expected By: ${new Date(po.expected_date).toLocaleDateString()}`, 350, top + 45);
    }
    doc.text(`Status: ${po.status.toUpperCase()}`, 350, top + 60);

    doc.moveDown(4);

    // --- Table ---
    const tableTop = 230;
    doc.rect(40, tableTop, 515, 20).fill('#f8fafc');
    doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold');
    doc.text("ITEM DESCRIPTION", 50, tableTop + 6);
    doc.text("QTY", 280, tableTop + 6, { width: 50, align: 'center' });
    doc.text("RATE", 340, tableTop + 6, { width: 60, align: 'right' });
    doc.text("TAX", 410, tableTop + 6, { width: 40, align: 'right' });
    doc.text("TOTAL", 460, tableTop + 6, { width: 85, align: 'right' });

    let itemY = tableTop + 25;
    doc.font('Helvetica').fontSize(9).fillColor('#000000');

    po.items?.forEach((item, i) => {
      const name = item.Product?.name || 'Item';
      doc.text(name, 50, itemY, { width: 220 });
      
      const textHeight = doc.heightOfString(name, { width: 220 });
      
      doc.text(parseFloat(item.quantity || 0).toString(), 280, itemY, { width: 50, align: 'center' });
      doc.text(parseFloat(item.unit_price || 0).toFixed(2), 340, itemY, { width: 60, align: 'right' });
      doc.text(`${parseFloat(item.tax_rate || 0)}%`, 410, itemY, { width: 40, align: 'right' });
      doc.text(parseFloat(item.total || 0).toFixed(2), 460, itemY, { width: 85, align: 'right' });
      
      itemY += Math.max(20, textHeight + 5);
      doc.moveTo(40, itemY - 5).lineTo(555, itemY - 5).strokeColor('#f1f5f9').stroke();
    });

    // --- Totals ---
    const totalY = itemY + 20;
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000').text("Sub Total:", 350, totalY);
    doc.font('Helvetica').fontSize(10).text(parseFloat(po.subtotal || 0).toFixed(2), 450, totalY, { width: 95, align: 'right' });
    
    doc.font('Helvetica-Bold').fontSize(10).text("Tax Amount:", 350, totalY + 15);
    doc.font('Helvetica').fontSize(10).text(parseFloat(po.tax_amount || 0).toFixed(2), 450, totalY + 15, { width: 95, align: 'right' });

    doc.rect(345, totalY + 35, 210, 25).fill('#f8fafc');
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#1e293b').text("Grand Total:", 350, totalY + 42);
    doc.fontSize(12).text(parseFloat(po.total_amount || 0).toFixed(2), 450, totalY + 42, { width: 95, align: 'right' });

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

    // Notes
    if (po.notes) {
        const notesY = 750;
        doc.moveTo(40, notesY - 5).lineTo(555, notesY - 5).strokeColor('#f1f5f9').lineWidth(0.5).stroke();
        doc.fillColor('#475569').fontSize(7).font('Helvetica-Bold').text("NOTES", 40, notesY);
        doc.fillColor('#64748b').font('Helvetica').fontSize(7).text(po.notes, 40, notesY + 10, { width: 515, lineGap: 1 });
    }

    doc.end();
  });
};

module.exports = { generatePurchaseOrderPdf };