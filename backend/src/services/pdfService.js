/**
 * pdfService.js — Generates a branded prescription PDF using pdf-lib.
 */
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

async function generatePrescriptionPdf({ patient, doctor, diagnosis, medicines, advice, date }) {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const brand = rgb(0.02, 0.47, 0.44); // teal
  const dark = rgb(0.12, 0.15, 0.2);
  let y = 800;

  const draw = (text, x, size, f = font, color = dark) => {
    page.drawText(text, { x, y, size, font: f, color });
  };

  draw('AI Healthcare Agent', 40, 22, bold, brand);
  draw('Prescription', 40, 12, font, dark);
  y -= 10;
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 1, color: brand });
  y -= 30;

  draw(`Doctor: Dr. ${doctor.full_name}  (${doctor.specialization})`, 40, 12, bold);
  y -= 18;
  draw(`Patient: ${patient.full_name}`, 40, 12, bold);
  y -= 18;
  draw(`Date: ${date}`, 40, 11);
  y -= 30;

  draw('Diagnosis', 40, 13, bold, brand);
  y -= 16;
  draw(diagnosis || '—', 40, 11);
  y -= 30;

  draw('Medicines', 40, 13, bold, brand);
  y -= 20;
  draw('Name', 40, 10, bold);
  draw('Dose', 220, 10, bold);
  draw('Frequency', 340, 10, bold);
  draw('Duration', 460, 10, bold);
  y -= 14;
  page.drawLine({ start: { x: 40, y }, end: { x: 555, y }, thickness: 0.5, color: rgb(0.7, 0.7, 0.7) });
  y -= 16;

  if ((medicines || []).length === 0) {
    draw('No medicines suggested.', 40, 10);
    y -= 18;
  } else {
    (medicines || []).forEach((m) => {
      draw(m.name || '-', 40, 10);
      draw(m.dose || '-', 220, 10);
      draw(m.frequency || '-', 340, 10);
      draw(m.duration || '-', 460, 10);
      y -= 18;
    });
  }

  y -= 20;
  draw('Advice', 40, 13, bold, brand);
  y -= 16;
  draw(advice || '—', 40, 11);

  y -= 50;
  page.drawLine({ start: { x: 40, y }, end: { x: 200, y }, thickness: 0.7, color: dark });
  draw('Doctor Signature', 40, 9);

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

module.exports = { generatePrescriptionPdf };
