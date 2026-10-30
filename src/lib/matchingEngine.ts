/**
 * Matching engine: compares OCR-extracted data against reference API data.
 * Produces evidence-based match results with confidence scores.
 */

import type { OCRData } from './ocr';
import type { ReferenceData, OpenFDAResult, RxNormResult } from './drugReference';
import { stringSimilarity } from './drugReference';

const NOT_DETECTED = 'Not detected';
const NOT_FOUND = 'Not found';

export type MatchStatus = 'matched' | 'partial' | 'not-matched' | 'unavailable';

export interface MatchEvidence {
  status: MatchStatus;
  confidence: number;
  explanation: string;
}

export interface MatchingEvidence {
  nameMatch: MatchEvidence;
  ingredientMatch: MatchEvidence;
  strengthMatch: MatchEvidence;
  dosageMatch: MatchEvidence;
  manufacturerMatch: MatchEvidence;
  identifierMatch: MatchEvidence;
}

export interface ScreeningScore {
  score: number;
  classification: string;
  weighting: { field: string; weight: number; confidence: number; available: boolean }[];
}

function determineMatchStatus(similarity: number): MatchStatus {
  if (similarity >= 0.85) return 'matched';
  if (similarity >= 0.6) return 'partial';
  return 'not-matched';
}

function matchName(ocr: OCRData, openFDA: OpenFDAResult | null, rxNorm: RxNormResult | null): MatchEvidence {
  if (ocr.medicineName === NOT_DETECTED) {
    return {
      status: 'unavailable',
      confidence: 0,
      explanation: 'Medicine name was not detected in the image via OCR.',
    };
  }

  if (!openFDA && !rxNorm) {
    return {
      status: 'unavailable',
      confidence: 0,
      explanation: 'No reference data available to compare medicine name.',
    };
  }

  let bestSimilarity = 0;
  let bestMatch = '';
  const ocrName = ocr.medicineName.toLowerCase();

  if (openFDA) {
    if (openFDA.brandName !== NOT_FOUND) {
      const sim = stringSimilarity(ocrName, openFDA.brandName.toLowerCase());
      if (sim > bestSimilarity) { bestSimilarity = sim; bestMatch = openFDA.brandName; }
    }
    if (openFDA.genericName !== NOT_FOUND) {
      const sim = stringSimilarity(ocrName, openFDA.genericName.toLowerCase());
      if (sim > bestSimilarity) { bestSimilarity = sim; bestMatch = openFDA.genericName; }
    }
  }

  if (rxNorm && rxNorm.name !== NOT_FOUND) {
    const sim = stringSimilarity(ocrName, rxNorm.name.toLowerCase());
    if (sim > bestSimilarity) { bestSimilarity = sim; bestMatch = rxNorm.name; }
  }

  const status = determineMatchStatus(bestSimilarity);
  return {
    status,
    confidence: Math.round(bestSimilarity * 100),
    explanation: `OCR detected "${ocr.medicineName}". Closest reference match: "${bestMatch}" (similarity: ${Math.round(bestSimilarity * 100)}%).`,
  };
}

function matchIngredient(ocr: OCRData, openFDA: OpenFDAResult | null, rxNorm: RxNormResult | null): MatchEvidence {
  if (ocr.genericName === NOT_DETECTED) {
    return {
      status: 'unavailable',
      confidence: 0,
      explanation: 'Active ingredient was not detected in the image via OCR.',
    };
  }

  if (!openFDA && !rxNorm) {
    return {
      status: 'unavailable',
      confidence: 0,
      explanation: 'No reference data available to compare active ingredient.',
    };
  }

  let bestSimilarity = 0;
  let bestMatch = '';
  const ocrIngredient = ocr.genericName.toLowerCase();

  if (openFDA) {
    if (openFDA.genericName !== NOT_FOUND) {
      const sim = stringSimilarity(ocrIngredient, openFDA.genericName.toLowerCase());
      if (sim > bestSimilarity) { bestSimilarity = sim; bestMatch = openFDA.genericName; }
    }
    for (const ai of openFDA.activeIngredients) {
      if (ai.name !== NOT_FOUND) {
        const sim = stringSimilarity(ocrIngredient, ai.name.toLowerCase());
        if (sim > bestSimilarity) { bestSimilarity = sim; bestMatch = ai.name; }
      }
    }
  }

  if (rxNorm && rxNorm.name !== NOT_FOUND) {
    const sim = stringSimilarity(ocrIngredient, rxNorm.name.toLowerCase());
    if (sim > bestSimilarity) { bestSimilarity = sim; bestMatch = rxNorm.name; }
  }

  const status = determineMatchStatus(bestSimilarity);
  return {
    status,
    confidence: Math.round(bestSimilarity * 100),
    explanation: `OCR detected active ingredient "${ocr.genericName}". Reference: "${bestMatch}" (similarity: ${Math.round(bestSimilarity * 100)}%).`,
  };
}

function matchStrength(ocr: OCRData, openFDA: OpenFDAResult | null): MatchEvidence {
  if (ocr.strength === NOT_DETECTED) {
    return {
      status: 'unavailable',
      confidence: 0,
      explanation: 'Strength was not detected in the image via OCR.',
    };
  }

  if (!openFDA || openFDA.activeIngredients.length === 0) {
    return {
      status: 'unavailable',
      confidence: 0,
      explanation: 'No reference strength data available to compare.',
    };
  }

  const ocrStrength = ocr.strength.toLowerCase().replace(/\s/g, '');
  let bestSimilarity = 0;
  let bestMatch = '';

  for (const ai of openFDA.activeIngredients) {
    if (ai.strength && ai.strength !== NOT_FOUND) {
      const refStrength = ai.strength.toLowerCase().replace(/\s/g, '');
      const sim = stringSimilarity(ocrStrength, refStrength);
      if (sim > bestSimilarity) { bestSimilarity = sim; bestMatch = ai.strength; }
    }
  }

  // Also check if the numeric value matches even if format differs
  if (bestSimilarity < 0.5) {
    const ocrNum = ocrStrength.match(/(\d+(?:\.\d+)?)/);
    for (const ai of openFDA.activeIngredients) {
      if (ai.strength && ai.strength !== NOT_FOUND) {
        const refNum = ai.strength.match(/(\d+(?:\.\d+)?)/);
        if (ocrNum && refNum && ocrNum[1] === refNum[1]) {
          bestSimilarity = 0.75;
          bestMatch = ai.strength;
          break;
        }
      }
    }
  }

  const status = determineMatchStatus(bestSimilarity);
  return {
    status,
    confidence: Math.round(bestSimilarity * 100),
    explanation: `OCR detected strength "${ocr.strength}". Reference: "${bestMatch}" (similarity: ${Math.round(bestSimilarity * 100)}%).`,
  };
}

function matchDosageForm(ocr: OCRData, openFDA: OpenFDAResult | null): MatchEvidence {
  if (ocr.dosageForm === NOT_DETECTED) {
    return {
      status: 'unavailable',
      confidence: 0,
      explanation: 'Dosage form was not detected in the image via OCR.',
    };
  }

  if (!openFDA || openFDA.dosageForm === NOT_FOUND) {
    return {
      status: 'unavailable',
      confidence: 0,
      explanation: 'No reference dosage form data available to compare.',
    };
  }

  const sim = stringSimilarity(ocr.dosageForm.toLowerCase(), openFDA.dosageForm.toLowerCase());
  const status = determineMatchStatus(sim);
  return {
    status,
    confidence: Math.round(sim * 100),
    explanation: `OCR detected dosage form "${ocr.dosageForm}". Reference: "${openFDA.dosageForm}" (similarity: ${Math.round(sim * 100)}%).`,
  };
}

function matchManufacturer(ocr: OCRData, openFDA: OpenFDAResult | null): MatchEvidence {
  if (ocr.manufacturer === NOT_DETECTED) {
    return {
      status: 'unavailable',
      confidence: 0,
      explanation: 'Manufacturer was not detected in the image via OCR.',
    };
  }

  if (!openFDA || openFDA.manufacturerName === NOT_FOUND) {
    return {
      status: 'unavailable',
      confidence: 0,
      explanation: 'No reference manufacturer data available to compare.',
    };
  }

  const sim = stringSimilarity(ocr.manufacturer.toLowerCase(), openFDA.manufacturerName.toLowerCase());
  const status = determineMatchStatus(sim);
  return {
    status,
    confidence: Math.round(sim * 100),
    explanation: `OCR detected manufacturer "${ocr.manufacturer}". Reference: "${openFDA.manufacturerName}" (similarity: ${Math.round(sim * 100)}%).`,
  };
}

function matchIdentifier(ocr: OCRData, openFDA: OpenFDAResult | null): MatchEvidence {
  if (ocr.barcode === NOT_DETECTED) {
    return {
      status: 'unavailable',
      confidence: 0,
      explanation: 'No barcode or NDC was detected in the image via OCR.',
    };
  }

  if (!openFDA || (openFDA.productNdc === NOT_FOUND && openFDA.packageNdc === NOT_FOUND)) {
    return {
      status: 'unavailable',
      confidence: 0,
      explanation: 'No reference identifier data available to compare.',
    };
  }

  const ocrBarcode = ocr.barcode.replace(/\D/g, '');
  let bestSimilarity = 0;

  if (openFDA.productNdc !== NOT_FOUND) {
    const refNdc = openFDA.productNdc.replace(/\D/g, '');
    if (ocrBarcode === refNdc) {
      bestSimilarity = 1.0;
    } else if (refNdc && ocrBarcode.includes(refNdc)) {
      bestSimilarity = 0.9;
    } else {
      bestSimilarity = stringSimilarity(ocrBarcode, refNdc);
    }
  }

  if (bestSimilarity < 0.5 && openFDA.packageNdc !== NOT_FOUND) {
    const refPkg = openFDA.packageNdc.replace(/\D/g, '');
    if (ocrBarcode === refPkg) {
      bestSimilarity = 1.0;
    } else if (refPkg && ocrBarcode.includes(refPkg)) {
      bestSimilarity = 0.9;
    } else {
      bestSimilarity = Math.max(bestSimilarity, stringSimilarity(ocrBarcode, refPkg));
    }
  }

  const status = bestSimilarity >= 0.85 ? 'matched' : bestSimilarity >= 0.5 ? 'partial' : 'not-matched';
  return {
    status,
    confidence: Math.round(bestSimilarity * 100),
    explanation: `OCR detected barcode/NDC "${ocr.barcode}". Reference NDC: "${openFDA.productNdc}" (similarity: ${Math.round(bestSimilarity * 100)}%).`,
  };
}

/**
 * Compute screening score from matching evidence.
 * Weights: name 30%, ingredient 20%, strength 15%, dosage 10%, manufacturer 10%, identifier 15%
 * Missing fields redistribute their weight proportionally.
 */
export function computeScreeningScore(evidence: MatchingEvidence): ScreeningScore {
  const fields = [
    { field: 'Medicine Name', weight: 0.30, confidence: evidence.nameMatch.confidence, available: evidence.nameMatch.status !== 'unavailable' },
    { field: 'Active Ingredient', weight: 0.20, confidence: evidence.ingredientMatch.confidence, available: evidence.ingredientMatch.status !== 'unavailable' },
    { field: 'Strength', weight: 0.15, confidence: evidence.strengthMatch.confidence, available: evidence.strengthMatch.status !== 'unavailable' },
    { field: 'Dosage Form', weight: 0.10, confidence: evidence.dosageMatch.confidence, available: evidence.dosageMatch.status !== 'unavailable' },
    { field: 'Manufacturer', weight: 0.10, confidence: evidence.manufacturerMatch.confidence, available: evidence.manufacturerMatch.status !== 'unavailable' },
    { field: 'Identifier', weight: 0.15, confidence: evidence.identifierMatch.confidence, available: evidence.identifierMatch.status !== 'unavailable' },
  ];

  // Redistribute weight from unavailable fields
  const availableFields = fields.filter(f => f.available);
  const unavailableWeight = fields.filter(f => !f.available).reduce((sum, f) => sum + f.weight, 0);
  const availableWeightTotal = availableFields.reduce((sum, f) => sum + f.weight, 0);

  let score = 0;
  for (const f of availableFields) {
    const redistributedWeight = availableWeightTotal > 0
      ? f.weight + (f.weight / availableWeightTotal) * unavailableWeight
      : f.weight;
    score += f.confidence * redistributedWeight;
  }

  score = Math.round(Math.min(100, Math.max(0, score)));

  let classification: string;
  if (score >= 85) classification = 'Strong Reference Match';
  else if (score >= 65) classification = 'Partial Reference Match';
  else if (score >= 40) classification = 'Low Reference Match';
  else classification = 'Potential Inconsistency';

  return { score, classification, weighting: fields };
}

export function runMatchingEngine(ocr: OCRData, reference: ReferenceData): MatchingEvidence {
  return {
    nameMatch: matchName(ocr, reference.openFDA, reference.rxNorm),
    ingredientMatch: matchIngredient(ocr, reference.openFDA, reference.rxNorm),
    strengthMatch: matchStrength(ocr, reference.openFDA),
    dosageMatch: matchDosageForm(ocr, reference.openFDA),
    manufacturerMatch: matchManufacturer(ocr, reference.openFDA),
    identifierMatch: matchIdentifier(ocr, reference.openFDA),
  };
}
