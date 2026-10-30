/**
 * Shared helper: builds PDFAnalysisData from an AnalysisResult.
 * Used by both ResultPage and the Voice Assistant to ensure the same PDF output.
 */

import type { AnalysisResult } from '@/types';
import type { PDFAnalysisData } from '@/lib/pdfGenerator';

export function buildPdfData(analysis: AnalysisResult): PDFAnalysisData {
  return {
    analysisId: analysis.id,
    timestamp: analysis.timestamp,
    imageDataUrl: analysis.uploadedImage,
    ocrData: {
      medicineName: analysis.ocrData.medicineName,
      genericName: analysis.ocrData.genericName,
      strength: analysis.ocrData.strength,
      dosageForm: analysis.ocrData.dosageForm,
      manufacturer: analysis.ocrData.manufacturer,
      batchNumber: analysis.ocrData.batchNumber,
      expiryDate: analysis.ocrData.expiryDate,
      barcode: analysis.ocrData.barcode,
      qrData: analysis.ocrData.qrData,
      confidence: analysis.ocrData.confidence,
      rawText: analysis.ocrData.rawText,
    },
    referenceData: {
      source: analysis.referenceData.source,
      brandName: analysis.referenceData.openFDA?.brandName || 'Not found',
      genericName: analysis.referenceData.openFDA?.genericName || 'Not found',
      manufacturer: analysis.referenceData.openFDA?.manufacturerName || 'Not found',
      ndc: analysis.referenceData.openFDA?.productNdc || 'Not found',
      rxcui: analysis.referenceData.rxNorm?.rxcui || analysis.referenceData.openFDA?.rxcui || 'Not found',
      dosageForm: analysis.referenceData.openFDA?.dosageForm || 'Not found',
    },
    matchingEvidence: {
      nameMatch: { status: analysis.matchingEvidence.nameMatch.status, confidence: analysis.matchingEvidence.nameMatch.confidence },
      ingredientMatch: { status: analysis.matchingEvidence.ingredientMatch.status, confidence: analysis.matchingEvidence.ingredientMatch.confidence },
      strengthMatch: { status: analysis.matchingEvidence.strengthMatch.status, confidence: analysis.matchingEvidence.strengthMatch.confidence },
      dosageMatch: { status: analysis.matchingEvidence.dosageMatch.status, confidence: analysis.matchingEvidence.dosageMatch.confidence },
      manufacturerMatch: { status: analysis.matchingEvidence.manufacturerMatch.status, confidence: analysis.matchingEvidence.manufacturerMatch.confidence },
      identifierMatch: { status: analysis.matchingEvidence.identifierMatch.status, confidence: analysis.matchingEvidence.identifierMatch.confidence },
    },
    score: analysis.score.score,
    classification: analysis.score.classification,
    source: analysis.scanMethod === 'camera' ? 'Camera Capture' : 'Uploaded Image',
  };
}
