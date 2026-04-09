/**
 * Professional High-Fidelity Invoice PDF Service
 * Features: Clean header, two-column addresses, high-contrast table, professional footer
 */

const PDFDocument = require('pdfkit');
const path = require('path');

// Professional color scheme
const COLORS = {
  primary: '#1e3a5f',      // Dark blue for headers
  secondary: '#f97316',    // Orange for accent
  headerBg: '#1e3a5f',     // Dark blue table header
  headerText: '#ffffff',   // White text on header
  text: '#1f2937',         // Dark gray for body text
  textLight: '#6b7280',    // Light gray for secondary text
  border: '#d1d5db',       // Border color
  background: '#f9fafb'    // Light background
};

const generateInvoicePdf = async (invoice, company) => {
  // Create PDF with 20mm margins
  const doc = new PDFDocument({ 
    margin: 56.7, // 20mm in points (1mm = 2.83464567 points)
    size: 'A4',
    bufferPages: true
  });
  
  let buffers = [];
  doc.on("data", buffers.push.bind(buffers));
  
  return new Promise((resolve) => {
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    
    const pageWidth = doc.page.width - 113.4; // Width minus margins (20mm each side)
    const leftX = 56.7; // Left margin
    const rightX = doc.page.width - 56.7; // Right margin
    let currentY = 56.7; // Start at top margin
    
    // ============================================
    // HEADER SECTION
    // ============================================
    
    // Company Logo (Top-Left)
    if (company.logo) {
      try {
        const logoPath = company.logo.startsWith('http') 
          ? company.logo 
          : path.join(__dirname, '../uploads', company.logo);
        doc.image(logoPath, leftX, currentY, { height: 60 });
        currentY += 70;
      } catch (e) {
        // Fallback to text if image fails
        doc.fontSize(24).fillColor(COLORS.primary).font('Helvetica-Bold');
        doc.text(company.name.substring(0, 20), leftX, currentY);
        currentY += 30;
      }
    } else {
      // Company name as fallback
      doc.fontSize(24).fillColor(COLORS.primary).font('Helvetica-Bold');
      doc.text(company.name, leftX, currentY, { width: 250 });
      currentY += 35;
    }
    
    // Company Details (Top-Right)
    const headerRightY = 56.7;
    doc.fillColor(COLORS.primary).fontSize(11).font('Helvetica-Bold');
    doc.text(company.name, 300, headerRightY, { align: 'right', width: 250 });
    
    doc.fillColor(COLORS.textLight).fontSize(9).font('Helvetica');
    let addrY = headerRightY + 14;
    
    if (company.address) {
      doc.text(company.address, 300, addrY, { align: 'right', width: 250 });
      addrY += 11;
    }
    
    const cityStatePin = `${company.city || ''}${company.city && company.state ? ', ' : ''}${company.state || ''}${(company.city || company.state) && company.pincode ? ' - ' : ''}${company.pincode || ''}`;
    if (cityStatePin.trim()) {
      doc.text(cityStatePin, 300, addrY, { align: 'right', width: 250 });
      addrY += 11;
    }
    
    if (company.phone) {
      doc.text(`Mobile: ${company.phone}`, 300, addrY, { align: 'right', width: 250 });
      addrY += 11;
    }
    
    if (company.email) {
      doc.text(`Email: ${company.email}`, 300, addrY, { align: 'right', width: 250 });
      addrY += 11;
    }
    
    if (company.gst_number) {
      doc.fillColor(COLORS.primary).font('Helvetica-Bold');
      doc.text(`GSTIN: ${company.gst_number}`, 300, addrY, { align: 'right', width: 250 });
    }
    
    // INVOICE Title (Bold, centered/right)
    doc.fontSize(28).fillColor(COLORS.secondary).font('Helvetica-Bold');
    doc.text('INVOICE', leftX, headerRightY + 80, { width: pageWidth, align: 'center' });
    
    // Invoice Number & Date below title
    doc.fontSize(10).fillColor(COLORS.text).font('Helvetica');
    doc.text(`Invoice No: ${invoice.invoice_number}`, leftX, headerRightY + 115, { width: pageWidth, align: 'center' });
    doc.text(`Date: ${new Date(invoice.invoice_date).toLocaleDateString('en-IN')}`, leftX, headerRightY + 128, { width: pageWidth, align: 'center' });
    
    currentY = Math.max(currentY, headerRightY + 150);
    
    // ============================================
    // BILL TO / SHIP TO SECTION
    // ============================================
    
    const colWidth = (pageWidth - 20) / 2;
    const boxHeight = 100;
    
    // Draw border for Bill To
    doc.rect(leftX, currentY, colWidth, boxHeight).strokeColor(COLORS.border).lineWidth(1).stroke();
    
    // Bill To Header Background
    doc.rect(leftX, currentY, colWidth, 22).fillColor(COLORS.primary).fill();
    doc.fillColor(COLORS.headerText).fontSize(10).font('Helvetica-Bold');
    doc.text('BILL TO', leftX + 8, currentY + 6);
    
    // Bill To Content
    doc.fillColor(COLORS.text).fontSize(9).font('Helvetica-Bold');
    doc.text(invoice.Customer?.name || 'Cash Customer', leftX + 8, currentY + 28);
    
    doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(8);
    let billY = currentY + 42;
    
    if (invoice.Customer?.address) {
      doc.text(invoice.Customer.address, leftX + 8, billY, { width: colWidth - 16 });
      billY += 10;
    }
    
    const customerCity = `${invoice.Customer?.city || ''}${invoice.Customer?.city && invoice.Customer?.state ? ', ' : ''}${invoice.Customer?.state || ''}`;
    if (customerCity.trim()) {
      doc.text(customerCity, leftX + 8, billY);
      billY += 10;
    }
    
    if (invoice.Customer?.phone) {
      doc.text(`Mobile: ${invoice.Customer.phone}`, leftX + 8, billY);
      billY += 10;
    }
    
    if (invoice.Customer?.gst_number) {
      doc.fillColor(COLORS.primary).font('Helvetica-Bold');
      doc.text(`GSTIN: ${invoice.Customer.gst_number}`, leftX + 8, billY);
    }
    
    // Ship To (Right Column)
    const shipX = leftX + colWidth + 20;
    doc.rect(shipX, currentY, colWidth, boxHeight).strokeColor(COLORS.border).lineWidth(1).stroke();
    
    // Ship To Header Background
    doc.rect(shipX, currentY, colWidth, 22).fillColor(COLORS.primary).fill();
    doc.fillColor(COLORS.headerText).fontSize(10).font('Helvetica-Bold');
    doc.text('SHIP TO', shipX + 8, currentY + 6);
    
    // Ship To Content
    doc.fillColor(COLORS.text).fontSize(9).font('Helvetica-Bold');
    const shipName = invoice.industry_metadata?.shipping_name || invoice.Customer?.name;
    doc.text(shipName || 'Cash Customer', shipX + 8, currentY + 28);
    
    doc.fillColor(COLORS.textLight).font('Helvetica').fontSize(8);
    let shipY = currentY + 42;
    
    const shipAddress = invoice.industry_metadata?.shipping_address || invoice.Customer?.address;
    if (shipAddress) {
      doc.text(shipAddress, shipX + 8, shipY, { width: colWidth - 16 });
      shipY += 10;
    }
    
    const shipCity = `${invoice.industry_metadata?.shipping_city || invoice.Customer?.city || ''}${(invoice.industry_metadata?.shipping_city || invoice.Customer?.city) && (invoice.industry_metadata?.shipping_state || invoice.Customer?.state) ? ', ' : ''}${invoice.industry_metadata?.shipping_state || invoice.Customer?.state || ''}`;
    if (shipCity.trim()) {
      doc.text(shipCity, shipX + 8, shipY);
      shipY += 10;
    }
    
    if (invoice.Customer?.phone) {
      doc.text(`Mobile: ${invoice.Customer.phone}`, shipX + 8, shipY);
    }
    
    currentY += boxHeight + 20;
    
    // ============================================
    // ITEMIZED TABLE
    // ============================================
    
    const tableTop = currentY;
    const rowHeight = 22;
    const colWidths = {
      sno: 30,
      desc: pageWidth - 30 - 60 - 40 - 60 - 50 - 70, // Remaining width
      hsn: 60,
      qty: 40,
      rate: 60,
      gst: 50,
      amount: 70
    };
    
    // Table Header (High-contrast: Dark Blue with White Text)
    doc.rect(leftX, tableTop, pageWidth, rowHeight).fillColor(COLORS.headerBg).fill();
    doc.fillColor(COLORS.headerText).fontSize(9).font('Helvetica-Bold');
    
    let colX = leftX;
    doc.text('#', colX + 5, tableTop + 6, { width: colWidths.sno - 10, align: 'center' });
    colX += colWidths.sno;
    
    doc.text('Item Description', colX + 5, tableTop + 6);
    colX += colWidths.desc;
    
    doc.text('HSN', colX + 5, tableTop + 6, { width: colWidths.hsn - 10, align: 'center' });
    colX += colWidths.hsn;
    
    doc.text('QTY', colX + 5, tableTop + 6, { width: colWidths.qty - 10, align: 'center' });
    colX += colWidths.qty;
    
    doc.text('Rate', colX + 5, tableTop + 6, { width: colWidths.rate - 10, align: 'center' });
    colX += colWidths.rate;
    
    doc.text('GST%', colX + 5, tableTop + 6, { width: colWidths.gst - 10, align: 'center' });
    colX += colWidths.gst;
    
    doc.text('Amount', colX + 5, tableTop + 6, { width: colWidths.amount - 10, align: 'right' });
    
    // Draw vertical lines for header
    let lineX = leftX;
    doc.strokeColor(COLORS.headerText).lineWidth(0.5);
    [colWidths.sno, colWidths.desc, colWidths.hsn, colWidths.qty, colWidths.rate, colWidths.gst].forEach(w => {
      lineX += w;
      doc.moveTo(lineX, tableTop).lineTo(lineX, tableTop + rowHeight).stroke();
    });
    
    // Table Rows
    let rowY = tableTop + rowHeight;
    doc.fillColor(COLORS.text).fontSize(8).font('Helvetica');
    
    invoice.items?.forEach((item, index) => {
      // Alternating row background
      if (index % 2 === 1) {
        doc.rect(leftX, rowY, pageWidth, rowHeight).fillColor('#f9fafb').fill();
      }
      
      doc.fillColor(COLORS.text);
      
      // S.No
      colX = leftX;
      doc.text((index + 1).toString(), colX + 5, rowY + 6, { width: colWidths.sno - 10, align: 'center' });
      colX += colWidths.sno;
      
      // Item Description
      doc.font('Helvetica-Bold').text(item.Product?.name || '', colX + 5, rowY + 6, { width: colWidths.desc - 10 });
      if (item.description) {
        doc.font('Helvetica').fontSize(7).fillColor(COLORS.textLight);
        doc.text(item.description, colX + 5, rowY + 14, { width: colWidths.desc - 10 });
        doc.fillColor(COLORS.text).fontSize(8);
      }
      colX += colWidths.desc;
      
      // HSN
      doc.font('Helvetica').text(item.Product?.hsn_code || '-', colX + 5, rowY + 6, { width: colWidths.hsn - 10, align: 'center' });
      colX += colWidths.hsn;
      
      // QTY
      doc.text(item.quantity?.toString() || '0', colX + 5, rowY + 6, { width: colWidths.qty - 10, align: 'center' });
      colX += colWidths.qty;
      
      // Rate
      doc.text(`₹${parseFloat(item.unit_price).toLocaleString()}`, colX + 5, rowY + 6, { width: colWidths.rate - 10, align: 'right' });
      colX += colWidths.rate;
      
      // GST%
      doc.text(`${item.gst_rate || 0}%`, colX + 5, rowY + 6, { width: colWidths.gst - 10, align: 'center' });
      colX += colWidths.gst;
      
      // Amount
      doc.font('Helvetica-Bold').text(`₹${parseFloat(item.total).toLocaleString()}`, colX + 5, rowY + 6, { width: colWidths.amount - 10, align: 'right' });
      
      // Draw vertical lines
      lineX = leftX;
      doc.strokeColor(COLORS.border).lineWidth(0.5);
      [colWidths.sno, colWidths.desc, colWidths.hsn, colWidths.qty, colWidths.rate, colWidths.gst].forEach(w => {
        lineX += w;
        doc.moveTo(lineX, rowY).lineTo(lineX, rowY + rowHeight).stroke();
      });
      
      rowY += rowHeight;
    });
    
    // Draw outer box for table
    doc.rect(leftX, tableTop, pageWidth, rowY - tableTop).strokeColor(COLORS.border).lineWidth(1).stroke();
    doc.moveTo(leftX, tableTop + rowHeight).lineTo(leftX + pageWidth, tableTop + rowHeight).strokeColor(COLORS.headerBg).lineWidth(1).stroke();
    
    currentY = rowY + 20;
    
    // ============================================
    // CALCULATIONS SECTION (Right-Aligned)
    // ============================================
    
    const calcWidth = 200;
    const calcX = rightX - calcWidth;
    
    // Subtotal
    doc.fillColor(COLORS.text).fontSize(9).font('Helvetica');
    doc.text('Subtotal:', calcX, currentY);
    doc.text(`₹${parseFloat(invoice.subtotal || 0).toLocaleString()}`, calcX + 100, currentY, { width: 100, align: 'right' });
    currentY += 16;
    
    // Tax Breakdown (CGST/SGST)
    const totalGst = parseFloat(invoice.tax_amount || 0);
    if (totalGst > 0) {
      const cgst = totalGst / 2;
      const sgst = totalGst / 2;
      
      doc.text('CGST (9%):', calcX, currentY);
      doc.text(`₹${cgst.toFixed(2)}`, calcX + 100, currentY, { width: 100, align: 'right' });
      currentY += 14;
      
      doc.text('SGST (9%):', calcX, currentY);
      doc.text(`₹${sgst.toFixed(2)}`, calcX + 100, currentY, { width: 100, align: 'right' });
      currentY += 14;
      
      doc.text('Total Tax:', calcX, currentY);
      doc.text(`₹${totalGst.toFixed(2)}`, calcX + 100, currentY, { width: 100, align: 'right' });
      currentY += 16;
    }
    
    // Discount
    if (invoice.discount_amount > 0) {
      doc.fillColor('#dc2626');
      doc.text('Discount:', calcX, currentY);
      doc.text(`-₹${parseFloat(invoice.discount_amount).toFixed(2)}`, calcX + 100, currentY, { width: 100, align: 'right' });
      doc.fillColor(COLORS.text);
      currentY += 14;
    }
    
    // Separator line
    doc.moveTo(calcX, currentY).lineTo(rightX, currentY).strokeColor(COLORS.border).lineWidth(1).stroke();
    currentY += 10;
    
    // Grand Total (Highlighted)
    doc.rect(calcX - 5, currentY - 5, calcWidth + 10, 30).fillColor(COLORS.primary).fill();
    doc.fillColor(COLORS.headerText).fontSize(11).font('Helvetica-Bold');
    doc.text('Grand Total:', calcX, currentY + 3);
    doc.fontSize(14).text(`₹${parseFloat(invoice.total_amount || 0).toLocaleString()}`, calcX + 100, currentY, { width: 100, align: 'right' });
    
    currentY += 40;
    
    // Amount in words
    doc.fillColor(COLORS.textLight).fontSize(8).font('Helvetica');
    const amountInWords = numberToWords(parseFloat(invoice.total_amount || 0));
    doc.text(`Amount in Words: ${amountInWords}`, calcX, currentY, { width: calcWidth });
    
    // ============================================
    // FOOTER SECTION
    // ============================================
    
    const footerY = doc.page.height - 180; // Fixed position from bottom
    
    // Terms & Conditions (Bottom-Left)
    if (company.terms_conditions || invoice.terms) {
      doc.fillColor(COLORS.primary).fontSize(9).font('Helvetica-Bold');
      doc.text('TERMS & CONDITIONS', leftX, footerY);
      
      doc.fillColor(COLORS.textLight).fontSize(8).font('Helvetica');
      const terms = invoice.terms || company.terms_conditions;
      doc.text(terms, leftX, footerY + 14, { width: 300, lineGap: 2 });
    }
    
    // Banking Details (if available, below terms)
    let bankY = footerY + 60;
    if (company.bank_name) {
      doc.fillColor(COLORS.primary).fontSize(9).font('Helvetica-Bold');
      doc.text('BANK DETAILS', leftX, bankY);
      
      doc.fillColor(COLORS.text).fontSize(8).font('Helvetica');
      bankY += 14;
      doc.text(`Bank: ${company.bank_name}`, leftX, bankY);
      bankY += 12;
      doc.text(`Account: ${company.account_number || '-'}`, leftX, bankY);
      bankY += 12;
      doc.text(`IFSC: ${company.ifsc_code || '-'}`, leftX, bankY);
    }
    
    // Authorized Signatory (Bottom-Right)
    const signY = footerY + 20;
    const signWidth = 140;
    const signX = rightX - signWidth;
    
    // Signature Image
    if (company.signature) {
      try {
        const sigPath = company.signature.startsWith('http') 
          ? company.signature 
          : path.join(__dirname, '../uploads', company.signature);
        doc.image(sigPath, signX + 20, signY, { width: 100 });
      } catch (e) {
        // Silent fail
      }
    }
    
    // Signature Line
    doc.moveTo(signX, signY + 50).lineTo(signX + signWidth, signY + 50).strokeColor(COLORS.text).lineWidth(1).stroke();
    
    doc.fillColor(COLORS.text).fontSize(9).font('Helvetica-Bold');
    doc.text('Authorized Signatory', signX, signY + 55, { width: signWidth, align: 'center' });
    
    doc.fillColor(COLORS.textLight).fontSize(8).font('Helvetica');
    doc.text(`For ${company.name}`, signX, signY + 68, { width: signWidth, align: 'center' });
    
    doc.end();
  });
};

/**
 * Convert number to words (Indian format)
 */
function numberToWords(num) {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  function convertLessThanThousand(n) {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convertLessThanThousand(n % 100) : '');
  }
  
  if (num === 0) return 'Zero Rupees Only';
  
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = num % 1000;
  
  let result = '';
  if (crore > 0) result += convertLessThanThousand(crore) + ' Crore ';
  if (lakh > 0) result += convertLessThanThousand(lakh) + ' Lakh ';
  if (thousand > 0) result += convertLessThanThousand(thousand) + ' Thousand ';
  if (hundred > 0) result += convertLessThanThousand(hundred);
  
  // Handle paise
  const paise = Math.round((num % 1) * 100);
  if (paise > 0) {
    result += ' Rupees and ' + convertLessThanThousand(paise) + ' Paise';
  } else {
    result += ' Rupees';
  }
  
  return result + ' Only';
}

module.exports = { generateInvoicePdf };
