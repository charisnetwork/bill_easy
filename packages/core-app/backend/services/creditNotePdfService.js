const PDFDocument = require('pdfkit');
const path = require('path');

const generateCreditNotePdf = async (creditNote, company) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  let buffers = [];
  doc.on("data", buffers.push.bind(buffers));

  return new Promise((resolve) => {
    doc.on("end", () => {
      resolve(Buffer.concat(buffers));
    });

    const uploadsPath = path.join(__dirname, '../uploads');
    
    // Header
    if (company.logo) {
      try { doc.image(path.join(uploadsPath, company.logo), 40, 40, { height: 50 }); } catch (e) {}
    } else {
      doc.fontSize(20).fillColor('#10b981').text(company.name, 40, 40);
    }

    doc.fillColor('#e11d48').fontSize(14).font('Helvetica-Bold').text("CREDIT NOTE", 400, 40, { align: 'right' });
    doc.fillColor('#475569').fontSize(10).font('Helvetica').text(`CN #: ${creditNote.credit_note_number}`, 400, 60, { align: 'right' });
    doc.text(`Date: ${new Date(creditNote.date).toLocaleDateString()}`, 400, 75, { align: 'right' });

    doc.moveDown(4);

    // Original Invoice Info (GST Compliance)
    const top = 140;
    doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold').text("Bill To:", 40, top);
    doc.font('Helvetica').text(creditNote.Customer?.name || '', 40, top + 15);
    doc.fontSize(8).fillColor('#64748b').text(creditNote.Customer?.address || '', 40, top + 30);

    doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold').text("Original Invoice Details:", 350, top);
    doc.font('Helvetica').fontSize(9);
    doc.text(`Invoice #: ${creditNote.Invoice?.invoice_number}`, 350, top + 15);
    doc.text(`Date: ${new Date(creditNote.Invoice?.invoice_date).toLocaleDateString()}`, 350, top + 30);
    doc.text(`Reason: ${creditNote.reason}`, 350, top + 45);

    // Table
    const tableTop = 230;
    doc.rect(40, tableTop, 515, 20).fill('#fff1f2');
    doc.fillColor('#be123c').fontSize(8).font('Helvetica-Bold');
    doc.text("ITEM DESCRIPTION", 50, tableTop + 6);
    doc.text("QTY", 300, tableTop + 6, { width: 50, align: 'center' });
    doc.text("RATE", 360, tableTop + 6, { width: 80, align: 'right' });
    doc.text("TOTAL", 450, tableTop + 6, { width: 95, align: 'right' });

    let itemY = tableTop + 25;
    doc.font('Helvetica').fontSize(9).fillColor('#000000');
    creditNote.items.forEach(item => {
      doc.text(item.Product?.name || 'Item', 50, itemY);
      doc.text(item.quantity.toString(), 300, itemY, { width: 50, align: 'center' });
      doc.text(`INR ${parseFloat(item.unit_price).toFixed(2)}`, 360, itemY, { width: 80, align: 'right' });
      doc.text(`INR ${parseFloat(item.total).toFixed(2)}`, 450, itemY, { width: 95, align: 'right' });
      itemY += 25;
    });

    // Totals
    const totalY = itemY + 20;
    doc.font('Helvetica-Bold').text("TOTAL REFUND AMOUNT:", 350, totalY);
    doc.text(`INR ${parseFloat(creditNote.total_amount).toFixed(2)}`, 450, totalY, { width: 95, align: 'right' });

    doc.end();
  });
};

module.exports = { generateCreditNotePdf };
