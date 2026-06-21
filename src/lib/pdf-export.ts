import { jsPDF } from 'jspdf';

export function downloadInvoicePDF(invoice: any) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [79, 70, 229]; // Indigo (#4f46e5)
  const accentColor = [220, 38, 38]; // Red (#dc2626)
  const textColor = [31, 41, 55]; // Dark Gray (#1f2937)
  const mutedTextColor = [107, 114, 128]; // Muted Gray

  // Title Logo
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('VIDYA EDUCARE', 20, 25);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text('Academic Excellence Platform', 20, 30);

  // Invoice label
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(140, 15, 50, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TAX INVOICE', 151, 20.5);

  // Invoice Number & Date
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Invoice No: ${invoice.invoiceNumber}`, 140, 28);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Date: ${new Date(invoice.date).toLocaleDateString('en-IN')}`, 140, 34);

  // Horizontal separator line
  doc.setDrawColor(229, 231, 235);
  doc.line(20, 42, 190, 42);

  // Billed To & Service Provider
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.text('BILLED TO', 20, 50);
  doc.text('SERVICE PROVIDER', 120, 50);

  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(invoice.billingDetails?.name || 'Vidya EduCare Student', 20, 56);
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(invoice.billingDetails?.email || 'student@vidyaeducare.com', 20, 62);

  const companyName = invoice.companyName || 'Vidya EduCare Private Ltd.';
  const companyGstin = invoice.companyGstin || '27AACCV1234F1Z5';
  const companyAddress = invoice.companyAddress || 'Mumbai, Maharashtra, India';

  doc.setFont('Helvetica', 'bold');
  doc.text(companyName, 120, 56);
  doc.setFont('Helvetica', 'normal');
  doc.text(companyGstin.startsWith('GSTIN:') ? companyGstin : `GSTIN: ${companyGstin}`, 120, 62);
  if (companyAddress) {
    doc.text(companyAddress, 120, 68);
  }

  // Product description table headers
  doc.setFillColor(243, 244, 246);
  doc.rect(20, 75, 170, 8, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text('Description', 23, 80.5);
  doc.text('HSN/SAC', 110, 80.5);
  doc.text('Base Price', 170, 80.5, { align: 'right' });

  // Product Row
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(invoice.packageName || 'Mock Test Package', 23, 91);
  doc.text('Bilingual Mock Test Portal', 23, 96);
  doc.text(invoice.hsnSacCode || '999294', 110, 91);
  doc.text(`INR ${invoice.basePrice.toFixed(2)}`, 170, 91, { align: 'right' });

  // Border line below product row
  doc.line(20, 102, 190, 102);

  // Totals calculations table
  let currentY = 110;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Base Product Price:', 120, currentY);
  doc.text(`INR ${invoice.basePrice.toFixed(2)}`, 170, currentY, { align: 'right' });

  if (invoice.discountDetails && invoice.discountDetails.totalAmount > 0) {
    currentY += 6;
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text('Total Discount:', 120, currentY);
    doc.text(`-INR ${invoice.discountDetails.totalAmount.toFixed(2)}`, 170, currentY, { align: 'right' });
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  }

  currentY += 6;
  doc.line(120, currentY - 3, 190, currentY - 3);
  doc.setFont('Helvetica', 'bold');
  doc.text('Taxable Value (Total):', 120, currentY);
  doc.text(`INR ${invoice.taxableAmount.toFixed(2)}`, 170, currentY, { align: 'right' });

  currentY += 6;
  doc.setFont('Helvetica', 'normal');
  doc.text(`GST (${invoice.gstRate}%):`, 120, currentY);
  doc.text(`INR ${invoice.gstAmount.toFixed(2)}`, 170, currentY, { align: 'right' });

  currentY += 8;
  doc.line(120, currentY - 4, 190, currentY - 4);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('Final Total (Paid):', 120, currentY);
  doc.text(`INR ${invoice.finalPrice.toFixed(2)}`, 170, currentY, { align: 'right' });

  // Footer note
  doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('THANK YOU FOR CHOOSING VIDYA EDUCARE!', 105, 155, { align: 'center' });

  doc.save(`${invoice.invoiceNumber}.pdf`);
}
