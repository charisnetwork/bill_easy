const PDFDocument = require('pdfkit');
const path = require('path');

const generateInvoicePdf = async (invoice, company) => {
  // --- Customization Settings ---
  const customLabels = company.invoice_column_labels || {};
  const customToggles = company.invoice_column_toggles || {};
  const headerColor = company.invoice_header_color || '#1D70B8';
  const menuColor = company.invoice_menu_color || '#FFFFFF';
  const textSizeStr = company.invoice_text_size || '10pt';
  const baseSize = parseInt(textSizeStr) || 10;

  // Filter columns based on toggles
  const dynamicColumns = [
    { key: 'f1', label: customLabels.f1 || 'Item Description', show: customToggles.showF1 !== false },
    { key: 'f2', label: customLabels.f2 || 'HSN/SAC', show: customToggles.showF2 },
    { key: 'f3', label: customLabels.f3 || 'Batch', show: customToggles.showF3 },
    { key: 'f4', label: customLabels.f4 || 'Rate', show: customToggles.showF4 !== false },
    { key: 'f5', label: customLabels.f5 || 'GST', show: customToggles.showF5 !== false },
    { key: 'f6', label: customLabels.f6 || 'Discount', show: customToggles.showF6 }
  ].filter(col => col.show);

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
    
    // Header Background
    doc.rect(0, 0, 612, 130).fill('#f8fafc'); // Light background for header

    // Logo
    if (company.logo) {
      try {
        doc.image(path.join(uploadsPath, company.logo), 40, 40, { height: 50 });
      } catch (e) {
        doc.fontSize(baseSize + 12).fillColor(headerColor).font('Helvetica-Bold').text(company.name, 40, 40);
      }
    } else {
      doc.fontSize(baseSize + 12).fillColor(headerColor).font('Helvetica-Bold').text(company.name, 40, 40);
    }

    doc.fillColor('#475569').fontSize(baseSize + 4).font('Helvetica-Bold');
    doc.text("TAX INVOICE", 400, 40, { align: 'right' });
    
    // Align details strictly to the right
    doc.fillColor('#000000').fontSize(baseSize - 2).font('Helvetica');
    doc.text(company.address || '', 400, 60, { align: 'right' });
    doc.text(`${company.city || ''}, ${company.state || ''}`, 400, 72, { align: 'right' });
    doc.text(`Phone: ${company.phone || ''}`, 400, 84, { align: 'right' });
    if (company.gst_number) {
      doc.font('Helvetica-Bold').text(`GSTIN: ${company.gst_number}`, 400, 96, { align: 'right' });
    }

    // --- Invoice Body (Customer & Details) ---
    // Drastically reduce gap
    const detailsTop = 145; 
    
    doc.fillColor('#000000').fontSize(baseSize - 1).font('Helvetica-Bold').text("Customer Details:", 40, detailsTop);
    doc.font('Helvetica-Bold').fontSize(baseSize).text(invoice.Customer?.name || 'Cash Customer', 40, detailsTop + 15);
    doc.fontSize(baseSize - 2).fillColor('#64748b').font('Helvetica');
    doc.text(invoice.Customer?.address || '', 40, detailsTop + 28, { width: 200 });
    doc.text(`${invoice.Customer?.city || ''} ${invoice.Customer?.state || ''}`, 40, detailsTop + 40);
    doc.text(`Phone: ${invoice.Customer?.phone || ''}`, 40, detailsTop + 52);

    doc.fillColor('#000000').fontSize(baseSize - 1).font('Helvetica-Bold').text("Invoice Details:", 350, detailsTop);
    doc.font('Helvetica').fontSize(baseSize - 1);
    doc.text(`Invoice No: ${invoice.invoice_number}`, 350, detailsTop + 15);
    doc.text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString()}`, 350, detailsTop + 28);
    doc.text(`Status: ${invoice.payment_status?.toUpperCase() || 'UNPAID'}`, 350, detailsTop + 40);
    
    let extraY = detailsTop + 55;
    const allMetadata = { ...(invoice.extra_fields || {}), ...(invoice.industry_metadata || {}) };
    Object.entries(allMetadata).forEach(([key, value]) => {
      if (value) {
        const label = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        doc.text(`${label}: ${value}`, 350, extraY);
        extraY += 12;
      }
    });

    // --- Table ---
    // Pull table higher
    const tableTop = Math.max(215, extraY + 10);
    doc.rect(40, tableTop, 515, 20).fill(headerColor); 
    doc.fillColor('#FFFFFF').fontSize(baseSize - 2).font('Helvetica-Bold');
    
    doc.text("SN.", 45, tableTop + 6, { width: 25 });
    
    // Dynamic columns management
    const startX = 75;
    const availableWidth = 350;
    const colWidth = availableWidth / dynamicColumns.length;
    
    dynamicColumns.forEach((col, idx) => {
      doc.text(col.label.toUpperCase(), startX + (idx * colWidth), tableTop + 6, { width: colWidth, align: 'left' });
    });

    doc.text("QTY", 430, tableTop + 6, { width: 40, align: 'center' });
    doc.text("TOTAL", 480, tableTop + 6, { width: 70, align: 'right' });

    let itemY = tableTop + 25;
    doc.font('Helvetica').fontSize(baseSize - 1).fillColor('#000000');

    if (invoice.items && invoice.items.length) {
      invoice.items.forEach((item, index) => {
        const product = item.Product || {};
        
        doc.text((index + 1).toString(), 45, itemY, { width: 25 });
        
        dynamicColumns.forEach((col, idx) => {
          let val = '';
          if (col.key === 'f1') val = product.name || 'Item';
          else if (col.key === 'f2') val = product.hsn_code || '';
          else if (col.key === 'f4') val = parseFloat(item.unit_price).toFixed(2);
          else if (col.key === 'f5') val = `${item.tax_rate}%`;
          else if (col.key === 'f6') val = `${item.discount}%`;
          
          doc.text(val.toString(), startX + (idx * colWidth), itemY, { width: colWidth - 5 });
        });

        doc.text(item.quantity.toString(), 430, itemY, { width: 40, align: 'center' });
        doc.text(parseFloat(item.total).toFixed(2), 480, itemY, { width: 70, align: 'right' });
        
        const rowHeight = 20;
        itemY += rowHeight;
        doc.moveTo(40, itemY - 2).lineTo(555, itemY - 2).strokeColor('#f1f5f9').stroke();
      });
    }

    // --- Totals ---
    const totalY = itemY + 20;
    let currentY = totalY;

    doc.font('Helvetica-Bold').fontSize(baseSize - 1).fillColor('#000000').text("Sub Total:", 350, currentY);
    doc.font('Helvetica').text(`INR ${parseFloat(invoice.subtotal || 0).toFixed(2)}`, 450, currentY, { width: 95, align: 'right' });
    currentY += 15;

    doc.font('Helvetica-Bold').text("Tax Amount:", 350, currentY);
    doc.font('Helvetica').text(`INR ${parseFloat(invoice.tax_amount || 0).toFixed(2)}`, 450, currentY, { width: 95, align: 'right' });
    currentY += 15;

    doc.rect(345, currentY + 5, 210, 25).fill('#f8fafc');
    doc.font('Helvetica-Bold').fontSize(baseSize).fillColor('#1e293b').text("Final Amount:", 350, currentY + 12);
    doc.fontSize(baseSize + 2).text(`INR ${parseFloat(invoice.final_amount || invoice.total_amount).toFixed(2)}`, 450, currentY + 12, { width: 95, align: 'right' });
    
    // Footer sections (Banking, QR, Signature)
    const footerY = 620;
    let leftY = footerY;

    // Banking Info (Restored and moved to bottom left)
    if (company.bank_name) {
      doc.fillColor('#475569').fontSize(baseSize - 2).font('Helvetica-Bold').text("BANK DETAILS", 40, leftY);
      doc.fillColor('#000000').font('Helvetica').fontSize(baseSize - 2);
      doc.text(`Bank: ${company.bank_name}`, 40, leftY + 12);
      doc.text(`A/C: ${company.account_number}`, 40, leftY + 22);
      doc.text(`IFSC: ${company.ifsc_code}`, 40, leftY + 32);
      leftY += 55;
    }

    if (company.qr_code) {
      try {
        const qrSize = 50;
        doc.image(path.join(uploadsPath, company.qr_code), 40, leftY, { height: qrSize });
        leftY += qrSize + 10;
      } catch (e) {}
    }

    if (company.terms_conditions) {
        doc.fillColor('#475569').fontSize(baseSize - 3).font('Helvetica-Bold').text("TERMS & CONDITIONS", 40, leftY);
        doc.fillColor('#64748b').font('Helvetica').fontSize(baseSize - 3).text(company.terms_conditions, 40, leftY + 10, { width: 300, lineGap: 1 });
    }

    // Signature (Bottom Right Corner)
    const signatureX = 400;
    const signatureWidth = 140;
    const sigY = footerY + 20;
    
    doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold').text("Authorized Signatory", signatureX, sigY, { width: signatureWidth, align: 'center' });
    
    if (company.signature) {
      try {
        doc.image(path.join(uploadsPath, company.signature), signatureX + (signatureWidth - 80) / 2, sigY + 15, { height: 40 });
      } catch (e) {
        console.error("Signature image error:", e);
      }
    }
    
    const ownerName = company.Users?.[0]?.name || '';
    if (ownerName) {
      doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold').text(ownerName, signatureX, sigY + 60, { width: signatureWidth, align: 'center' });
    }

    doc.end();
  });
};

module.exports = { generateInvoicePdf };
