/**
 * PDF generation using jsPDF.
 * Generates a real downloadable PDF with the current analysis data.
 */

import jsPDF from 'jspdf';

export interface PDFAnalysisData {
  analysisId: string;
  timestamp: string;
  imageDataUrl: string | null;
  ocrData: {
    medicineName: string;
    genericName: string;
    strength: string;
    dosageForm: string;
    manufacturer: string;
    batchNumber: string;
    expiryDate: string;
    barcode: string;
    qrData: string;
    confidence: number;
    rawText: string;
  };
  referenceData: {
    source: string;
    brandName: string;
    genericName: string;
    manufacturer: string;
    ndc: string;
    rxcui: string;
    dosageForm: string;
  };
  matchingEvidence: {
    nameMatch: { status: string; confidence: number };
    ingredientMatch: { status: string; confidence: number };
    strengthMatch: { status: string; confidence: number };
    dosageMatch: { status: string; confidence: number };
    manufacturerMatch: { status: string; confidence: number };
    identifierMatch: { status: string; confidence: number };
  };
  score: number;
  classification: string;
  source: string;
}

const COLORS = {
  primary: [30, 64, 175] as [number, number, number],
  dark: [17, 24, 39] as [number, number, number],
  gray: [107, 114, 128] as [number, number, number],
  light: [243, 244, 246] as [number, number, number],
  success: [22, 163, 74] as [number, number, number],
  warning: [217, 119, 6] as [number, number, number],
  danger: [220, 38, 38] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
};

function statusText(status: string): string {
  if (status === 'matched') return 'Matched';
  if (status === 'partial') return 'Partial';
  if (status === 'not-matched') return 'Not matched';
  if (status === 'unavailable') return 'Unavailable';
  return status;
}

function statusColor(status: string): [number, number, number] {
  if (status === 'matched') return COLORS.success;
  if (status === 'partial') return COLORS.warning;
  if (status === 'not-matched') return COLORS.danger;
  return COLORS.gray;
}

export function generatePDF(data: PDFAnalysisData): void {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Helper to check and add page breaks
  const checkPageBreak = (needed: number) => {
    if (y + needed > pageHeight - margin - 10) {
      pdf.addPage();
      y = margin;
      addPageNumber();
    }
  };

  const addPageNumber = () => {
    const pageCount = pdf.getNumberOfPages();
    const currentPage = pdf.getCurrentPageInfo().pageNumber;
    pdf.setFontSize(8);
    pdf.setTextColor(...COLORS.gray);
    pdf.text(`FakeMed AI Report — Page ${currentPage} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  };

  // === HEADER ===
  pdf.setFillColor(...COLORS.primary);
  pdf.rect(0, 0, pageWidth, 30, 'F');
  pdf.setTextColor(...COLORS.white);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('FAKEMED AI', margin, 18);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Medicine Package Screening Report', margin, 25);
  y = 42;

  // === ANALYSIS ID & DATE ===
  pdf.setTextColor(...COLORS.dark);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Analysis ID: ${data.analysisId}`, margin, y);
  y += 4;
  pdf.text(`Source: ${data.source}`, margin, y);
  pdf.text(`Date/Time: ${new Date(data.timestamp).toLocaleString()}`, pageWidth - margin, y, { align: 'right' });
  y += 6;

  // Divider
  pdf.setDrawColor(...COLORS.light);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 10;

  // === UPLOADED IMAGE ===
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Uploaded Medicine Image:', margin, y);
  y += 5;

  if (data.imageDataUrl) {
    try {
      const imgType = data.imageDataUrl.includes('image/png') ? 'PNG' : 'JPEG';
      const imgWidth = 70;
      const imgHeight = 52;
      checkPageBreak(imgHeight + 5);
      pdf.addImage(data.imageDataUrl, imgType, margin, y, imgWidth, imgHeight, undefined, 'FAST');
      y += imgHeight + 8;
    } catch {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...COLORS.gray);
      pdf.text('[Image could not be embedded in PDF]', margin, y);
      y += 10;
    }
  } else {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...COLORS.gray);
    pdf.text('[No image uploaded]', margin, y);
    y += 10;
  }

  // === DETECTED MEDICINE INFO ===
  checkPageBreak(50);
  pdf.setTextColor(...COLORS.dark);
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Detected Medicine Information', margin, y);
  y += 8;

  const ocrFields = [
    { label: 'Detected Name:', value: data.ocrData.medicineName },
    { label: 'Generic / Active Ingredient:', value: data.ocrData.genericName },
    { label: 'Strength:', value: data.ocrData.strength },
    { label: 'Dosage Form:', value: data.ocrData.dosageForm },
    { label: 'Manufacturer:', value: data.ocrData.manufacturer },
    { label: 'Batch Number:', value: data.ocrData.batchNumber },
    { label: 'Expiry Date:', value: data.ocrData.expiryDate },
    { label: 'Barcode:', value: data.ocrData.barcode },
    { label: 'QR Data:', value: data.ocrData.qrData },
    { label: 'OCR Confidence:', value: `${data.ocrData.confidence}%` },
  ];

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  for (const field of ocrFields) {
    checkPageBreak(6);
    pdf.setTextColor(...COLORS.gray);
    pdf.text(field.label, margin, y);
    pdf.setTextColor(...COLORS.dark);
    pdf.text(field.value, margin + 55, y);
    y += 5.5;
  }
  y += 5;

  // === REFERENCE DATABASE ===
  checkPageBreak(35);
  pdf.setDrawColor(...COLORS.light);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.dark);
  pdf.text('Reference Database', margin, y);
  y += 8;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  const refFields = [
    { label: 'Source:', value: data.referenceData.source },
    { label: 'Reference Product:', value: data.referenceData.brandName },
    { label: 'Reference Generic:', value: data.referenceData.genericName },
    { label: 'Reference Manufacturer:', value: data.referenceData.manufacturer },
    { label: 'NDC:', value: data.referenceData.ndc },
    { label: 'RxCUI:', value: data.referenceData.rxcui },
    { label: 'Reference Dosage Form:', value: data.referenceData.dosageForm },
  ];

  for (const field of refFields) {
    checkPageBreak(6);
    pdf.setTextColor(...COLORS.gray);
    pdf.text(field.label, margin, y);
    pdf.setTextColor(...COLORS.dark);
    pdf.text(field.value, margin + 55, y);
    y += 5.5;
  }
  y += 5;

  // === EVIDENCE MATCHING ===
  checkPageBreak(45);
  pdf.setDrawColor(...COLORS.light);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 8;

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.dark);
  pdf.text('Evidence Matching', margin, y);
  y += 8;

  const matchFields = [
    { label: 'Medicine Name:', evidence: data.matchingEvidence.nameMatch },
    { label: 'Active Ingredient:', evidence: data.matchingEvidence.ingredientMatch },
    { label: 'Strength:', evidence: data.matchingEvidence.strengthMatch },
    { label: 'Dosage Form:', evidence: data.matchingEvidence.dosageMatch },
    { label: 'Manufacturer:', evidence: data.matchingEvidence.manufacturerMatch },
    { label: 'Identifier:', evidence: data.matchingEvidence.identifierMatch },
  ];

  pdf.setFontSize(9);
  for (const field of matchFields) {
    checkPageBreak(6);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...COLORS.gray);
    pdf.text(field.label, margin, y);

    const status = statusText(field.evidence.status);
    const color = statusColor(field.evidence.status);
    pdf.setTextColor(...color);
    pdf.setFont('helvetica', 'bold');
    pdf.text(status, margin + 55, y);

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...COLORS.gray);
    pdf.text(`(${field.evidence.confidence}%)`, margin + 85, y);
    y += 5.5;
  }
  y += 5;

  // === SCORE ===
  checkPageBreak(30);
  pdf.setDrawColor(...COLORS.light);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 10;

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...COLORS.dark);
  pdf.text('REFERENCE MATCH SCORE:', margin, y);
  pdf.setFontSize(18);
  const scoreColor = data.score >= 85 ? COLORS.success : data.score >= 65 ? COLORS.warning : data.score >= 40 ? COLORS.danger : COLORS.danger;
  pdf.setTextColor(...scoreColor);
  pdf.text(`${data.score}%`, margin + 80, y);
  y += 10;

  pdf.setFontSize(11);
  pdf.setTextColor(...COLORS.dark);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Screening Classification: ${data.classification}`, margin, y);
  y += 12;

  // === DISCLAIMER ===
  checkPageBreak(30);
  pdf.setFillColor(...COLORS.light);
  pdf.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...COLORS.dark);
  const disclaimer = 'This report provides preliminary medicine-package screening based on image-derived information and publicly available reference data. It does not constitute definitive authentication, medical advice, or regulatory certification.';
  const splitDisclaimer = pdf.splitTextToSize(disclaimer, contentWidth - 10);
  pdf.text(splitDisclaimer, margin + 5, y + 8);
  y += 26;

  // === GENERATED TIMESTAMP ===
  pdf.setFontSize(8);
  pdf.setTextColor(...COLORS.gray);
  pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, y);

  // Add page numbers to all pages
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(...COLORS.gray);
    pdf.text(`FakeMed AI Report — Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  // Download
  pdf.save(`FakeMedAI_Report_${data.analysisId}.pdf`);
}
