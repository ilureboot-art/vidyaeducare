import { jsPDF } from 'jspdf';

/**
 * Exports text content to a clean, wrapped multi-page PDF document.
 * @param filename File name (without extension)
 * @param title Document title header
 * @param textSections Array of sections containing subtitle and text content
 */
export function exportToPdf(filename: string, title: string, textSections: { subtitle?: string; content: string }[]) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageHeight = 297;
  const margin = 20;
  const contentWidth = 170;
  let currentY = 20;

  // Render Title Logo Header
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(63, 81, 181); // Primary Color Indigo
  doc.text(title, margin, currentY);
  currentY += 10;

  // Add decorative underline
  doc.setDrawColor(63, 81, 181);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY - 6, margin + 50, currentY - 6);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(31, 41, 55); // Dark Gray

  for (const sec of textSections) {
    if (sec.subtitle) {
      // Subtitle page overflow check
      if (currentY + 12 > pageHeight - margin) {
        doc.addPage();
        currentY = 20;
      }
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(156, 39, 176); // Accent Color Purple
      doc.text(sec.subtitle, margin, currentY);
      currentY += 6;
    }

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(31, 41, 55); // Dark Gray
    
    // Split long content block into fits
    const splitLines = doc.splitTextToSize(sec.content, contentWidth);
    for (const line of splitLines) {
      if (currentY + 6 > pageHeight - margin) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(line, margin, currentY);
      currentY += 5;
    }
    currentY += 4; // margin padding between sections
  }

  doc.save(`${filename}.pdf`);
}

/**
 * Triggers a client-side download of a formatted Microsoft Word DOC file.
 * @param filename File name (without extension)
 * @param title Page header title
 * @param htmlContent HTML body content to render in Word
 */
export function exportToDoc(filename: string, title: string, htmlContent: string) {
  const header = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' 
          xmlns:w='urn:schemas-microsoft-com:office:word' 
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          padding: 20px;
        }
        h1 {
          color: #3f51b5;
          border-bottom: 2px solid #3f51b5;
          padding-bottom: 5px;
          margin-bottom: 20px;
        }
        h2 {
          color: #9c27b0;
          margin-top: 25px;
          margin-bottom: 10px;
        }
        p {
          margin-bottom: 15px;
        }
        ul {
          margin-left: 20px;
          margin-bottom: 15px;
        }
        li {
          margin-bottom: 5px;
        }
        .summary-box {
          background-color: #f3f4f6;
          border-left: 5px solid #3f51b5;
          padding: 15px;
          margin-top: 30px;
        }
      </style>
    </head>
    <body>
  `;
  const footer = "</body></html>";
  const sourceHTML = header + htmlContent + footer;

  const blob = new Blob(['\ufeff' + sourceHTML], {
    type: 'application/msword'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports text sections to a clean plain text file (.txt).
 * @param filename File name (without extension)
 * @param title Document title header
 * @param textSections Array of sections containing subtitle and text content
 */
export function exportToTxt(filename: string, title: string, textSections: { subtitle?: string; content: string }[]) {
  let text = `=========================================\n`;
  text += ` ${title.toUpperCase()} \n`;
  text += `=========================================\n\n`;

  for (const sec of textSections) {
    if (sec.subtitle) {
      text += `--- ${sec.subtitle.toUpperCase()} ---\n`;
    }
    text += `${sec.content}\n\n`;
  }

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
