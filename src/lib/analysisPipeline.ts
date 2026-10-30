/**
 * Analysis orchestration pipeline.
 * Runs OCR → barcode detection → reference API lookup → matching engine → screening score.
 * Every step uses real data from the uploaded image. No hardcoded results.
 */

import type { OCRData } from './ocr';
import type { ReferenceData } from './drugReference';
import type { MatchingEvidence, ScreeningScore } from './matchingEngine';
import type { BarcodeScanResult } from './barcodeDetection';
import type { AnalysisResult } from '@/types';

import { preprocessImage, runOCR, parseOCRText } from './ocr';
import { fetchReferenceData } from './drugReference';
import { runMatchingEngine, computeScreeningScore } from './matchingEngine';
import { detectBarcodeAndQR } from './barcodeDetection';

export interface AnalysisProgress {
  step: string;
  label: string;
  progress: number;
}

export type ProgressCallback = (progress: AnalysisProgress) => void;

function generateId(): string {
  return `analysis-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

function buildWarnings(
  ocr: OCRData,
  reference: ReferenceData,
  barcodeScan: BarcodeScanResult | null,
): string[] {
  const warnings: string[] = [];

  if (ocr.confidence < 50) {
    warnings.push(
      `OCR confidence is low (${ocr.confidence}%). Text extraction may be incomplete — results may be less reliable.`,
    );
  }

  if (ocr.medicineName === 'Not detected') {
    warnings.push('Medicine name could not be detected from the image. Try uploading a clearer photo with the medicine name visible.');
  }

  if (reference.error) {
    warnings.push(reference.error);
  }

  if (barcodeScan && !barcodeScan.barcode.detected && !barcodeScan.qr.detected) {
    warnings.push('No barcode or QR code was detected in the image. Identifier matching may be unavailable.');
  }

  return warnings;
}

/**
 * Run the full analysis pipeline on an uploaded medicine image.
 * Every result is derived from the actual image data.
 */
export async function analyzeMedicineImage(
  imageDataUrl: string,
  scanMethod: string,
  onProgress?: ProgressCallback,
): Promise<AnalysisResult> {
  // Step 1: Preprocess image for OCR
  onProgress?.({ step: 'preprocess', label: 'Preparing image for text extraction…', progress: 10 });
  let processedImage: string;
  try {
    processedImage = await preprocessImage(imageDataUrl);
  } catch {
    processedImage = imageDataUrl;
  }

  // Step 2: Run OCR
  onProgress?.({ step: 'ocr', label: 'Reading text from the medicine package…', progress: 25 });
  let ocrText = '';
  let ocrConfidence = 0;
  try {
    const ocrResult = await runOCR(processedImage);
    ocrText = ocrResult.text;
    ocrConfidence = ocrResult.confidence;
  } catch {
    ocrText = '';
    ocrConfidence = 0;
  }

  const ocrData: OCRData = parseOCRText(ocrText, ocrConfidence);

  // Step 3: Barcode/QR detection
  onProgress?.({ step: 'barcode', label: 'Scanning for barcodes and QR codes…', progress: 45 });
  let barcodeScan: BarcodeScanResult | null = null;
  try {
    barcodeScan = await detectBarcodeAndQR(imageDataUrl);
    // Merge barcode detection into OCR data if OCR didn't find one
    if (ocrData.barcode === 'Not detected' && barcodeScan.barcode.detected) {
      ocrData.barcode = barcodeScan.barcode.text;
    }
    if (ocrData.qrData === 'Not detected' && barcodeScan.qr.detected) {
      ocrData.qrData = barcodeScan.qr.text;
    }
  } catch {
    barcodeScan = null;
  }

  // Step 4: Fetch reference data from openFDA + RxNorm
  onProgress?.({ step: 'reference', label: 'Looking up medicine in openFDA and RxNorm databases…', progress: 60 });
  let referenceData: ReferenceData;
  try {
    referenceData = await fetchReferenceData(
      ocrData.medicineName,
      ocrData.genericName,
      ocrData.strength,
    );
  } catch {
    referenceData = {
      openFDA: null,
      rxNorm: null,
      source: 'None',
      error: 'Reference database lookup failed. Check your internet connection and try again.',
    };
  }

  // Step 5: Run matching engine
  onProgress?.({ step: 'matching', label: 'Comparing detected text with reference data…', progress: 80 });
  let matchingEvidence: MatchingEvidence;
  let score: ScreeningScore;
  try {
    matchingEvidence = runMatchingEngine(ocrData, referenceData);
    score = computeScreeningScore(matchingEvidence);
  } catch {
    matchingEvidence = {
      nameMatch: { status: 'unavailable', confidence: 0, explanation: 'Matching engine error.' },
      ingredientMatch: { status: 'unavailable', confidence: 0, explanation: 'Matching engine error.' },
      strengthMatch: { status: 'unavailable', confidence: 0, explanation: 'Matching engine error.' },
      dosageMatch: { status: 'unavailable', confidence: 0, explanation: 'Matching engine error.' },
      manufacturerMatch: { status: 'unavailable', confidence: 0, explanation: 'Matching engine error.' },
      identifierMatch: { status: 'unavailable', confidence: 0, explanation: 'Matching engine error.' },
    };
    score = { score: 0, classification: 'Analysis Error', weighting: [] };
  }

  // Step 6: Build warnings
  onProgress?.({ step: 'finalize', label: 'Compiling screening report…', progress: 95 });
  const warnings = buildWarnings(ocrData, referenceData, barcodeScan);

  const result: AnalysisResult = {
    id: generateId(),
    uploadedImage: imageDataUrl,
    timestamp: new Date().toISOString(),
    ocrData,
    referenceData,
    matchingEvidence,
    score,
    barcodeScan,
    warnings,
    scanMethod,
  };

  onProgress?.({ step: 'done', label: 'Analysis complete.', progress: 100 });
  return result;
}
