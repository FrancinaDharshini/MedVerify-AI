/**
 * Real OCR module using Tesseract.js
 * Extracts text from medicine package images.
 */

export interface OCRData {
  medicineName: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  barcode: string;
  qrData: string;
  manufacturer: string;
  rawText: string;
  confidence: number;
}

const NOT_DETECTED = 'Not detected';

const dosageForms = [
  'tablet', 'tablets', 'capsule', 'capsules', 'syrup', 'suspension',
  'injection', 'ointment', 'cream', 'drops', 'spray', 'inhaler',
  'powder', 'granules', 'gel', 'solution', 'lotion', 'strip',
];

const commonMedicineKeywords = [
  'paracetamol', 'acetaminophen', 'ibuprofen', 'aspirin', 'azithromycin',
  'amoxicillin', 'metformin', 'omeprazole', 'cetirizine', 'losartan',
  'atorvastatin', 'pantoprazole', 'chlorpheniramine', 'phenylephrine',
  'caffeine', 'dolo', 'crocin', 'tylenol', 'advil', 'motrin',
  ' augmentin', 'clavulanic', 'ciprofloxacin', 'ofloxacin', 'ranitidine',
  'rabeprazole', 'escitalopram', 'alprazolam', 'diazepam', 'diclofenac',
  'naproxen', 'levocetirizine', 'montelukast', 'fexofenadine',
  'hydrochlorothiazide', 'amlodipine', 'telmisartan', 'rosuvastatin',
];

const manufacturerKeywords = [
  'pharma', 'pharmaceutical', 'pharmaceuticals', 'labs', 'laboratories',
  'healthcare', 'therapeutics', 'biosciences', 'remedies', 'drugs',
  'industries', 'medica', 'care', 'sciences', 'biotech',
];

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for OCR'));
    img.src = dataUrl;
  });
}

/**
 * Preprocess image for better OCR results:
 * - Resize while preserving aspect ratio
 * - Convert to grayscale
 * - Improve contrast
 * - Normalize brightness
 */
export async function preprocessImage(dataUrl: string): Promise<string> {
  const img = await loadImage(dataUrl);
  const maxSize = 1024;
  let { width, height } = img;

  if (width > maxSize || height > maxSize) {
    const ratio = maxSize / Math.max(width, height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  // Upscale small images for better OCR
  if (width < 400) {
    const ratio = 400 / width;
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  ctx.drawImage(img, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  // Grayscale conversion
  const grayValues = new Float32Array(width * height);
  for (let i = 0; i < pixels.length; i += 4) {
    const gray = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    grayValues[i / 4] = gray;
  }

  // Normalize brightness: shift so average is 128
  let avg = 0;
  for (let i = 0; i < grayValues.length; i++) avg += grayValues[i];
  avg /= grayValues.length;
  const brightnessShift = 128 - avg;

  // Improve contrast using simple linear stretch
  let min = 255, max = 0;
  for (let i = 0; i < grayValues.length; i++) {
    const v = grayValues[i] + brightnessShift;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = Math.max(1, max - min);
  const contrastFactor = 255 / range;

  for (let i = 0; i < pixels.length; i += 4) {
    let v = (grayValues[i / 4] + brightnessShift - min) * contrastFactor;
    v = Math.max(0, Math.min(255, v));
    // Sharpen: add slight edge enhancement by blending with neighbor difference
    pixels[i] = v;
    pixels[i + 1] = v;
    pixels[i + 2] = v;
    pixels[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/png');
}

/**
 * Run Tesseract.js OCR on the preprocessed image.
 */
export async function runOCR(processedImageDataUrl: string): Promise<{ text: string; confidence: number }> {
  const Tesseract = await import('tesseract.js');
  const worker = await Tesseract.createWorker('eng');

  try {
    const { data } = await worker.recognize(processedImageDataUrl);
    return {
      text: data.text || '',
      confidence: Math.round((data.confidence || 0)),
    };
  } finally {
    await worker.terminate();
  }
}

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 0;
  return 1 - levenshtein(a.toLowerCase(), b.toLowerCase()) / maxLen;
}

function findBestMatch(text: string, candidates: string[]): { value: string; score: number } | null {
  let best: { value: string; score: number } | null = null;
  for (const candidate of candidates) {
    const score = similarity(text, candidate);
    if (!best || score > best.score) {
      best = { value: candidate, score };
    }
  }
  return best;
}

function extractStrength(text: string): string {
  // Match patterns like "500mg", "500 mg", "10 mcg", "650MG", "5ML", "2.5 mg"
  const strengthRegex = /(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|mg\/ml|IU|MEQ|%\w*)/gi;
  const matches = text.match(strengthRegex);
  if (matches && matches.length > 0) {
    return matches[0].trim();
  }
  return NOT_DETECTED;
}

function extractBatchNumber(text: string): string {
  // Batch numbers are typically alphanumeric codes like "BN1234", "GSK2024A001", "LOT12345"
  const batchRegex = /\b(?:batch|bn|lot)[:\s]*([A-Z0-9]{4,15})\b/gi;
  const match = batchRegex.exec(text);
  if (match) return match[1].trim();

  // Try standalone alphanumeric codes that look like batch numbers
  const codeRegex = /\b([A-Z]{2,4}\d{3,6}[A-Z0-9]{0,4})\b/g;
  const codeMatch = codeRegex.exec(text);
  if (codeMatch) return codeMatch[1].trim();

  return NOT_DETECTED;
}

function extractDates(text: string): { manufacturingDate: string; expiryDate: string } {
  // Match date patterns: MM/YYYY, MM/DD/YYYY, DD/MM/YYYY, MMM YYYY, etc.
  const datePatterns = [
    /(?:exp|expiry|exp\.?\s*date)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
    /(?:exp|expiry|exp\.?\s*date)[:\s]*(\d{1,2}[\/\-]\d{4})/gi,
    /(?:exp|expiry|exp\.?\s*date)[:\s]*([A-Z]{3}\s+\d{4})/gi,
    /(?:mfg|mfg\.?\s*date|manufacturing)[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi,
    /(?:mfg|mfg\.?\s*date|manufacturing)[:\s]*(\d{1,2}[\/\-]\d{4})/gi,
  ];

  let expiryDate = NOT_DETECTED;
  let manufacturingDate = NOT_DETECTED;

  // Try labelled dates first
  const expMatch1 = text.match(datePatterns[0]) || text.match(datePatterns[1]) || text.match(datePatterns[2]);
  if (expMatch1) {
    const raw = expMatch1[0].replace(/^(?:exp|expiry|exp\.?\s*date)[:\s]*/i, '').trim();
    expiryDate = raw;
  }

  const mfgMatch = text.match(datePatterns[3]) || text.match(datePatterns[4]);
  if (mfgMatch) {
    const raw = mfgMatch[0].replace(/^(?:mfg|mfg\.?\s*date|manufacturing)[:\s]*/i, '').trim();
    manufacturingDate = raw;
  }

  // Try unlabelled date patterns (two dates on package, later one is usually expiry)
  if (expiryDate === NOT_DETECTED || manufacturingDate === NOT_DETECTED) {
    const allDates = text.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g) || [];
    if (allDates.length >= 2) {
      if (manufacturingDate === NOT_DETECTED) manufacturingDate = allDates[0] ?? NOT_DETECTED;
      if (expiryDate === NOT_DETECTED) expiryDate = allDates[allDates.length - 1] ?? NOT_DETECTED;
    } else if (allDates.length === 1) {
      if (expiryDate === NOT_DETECTED) expiryDate = allDates[0] ?? NOT_DETECTED;
    }
  }

  return { manufacturingDate, expiryDate };
}

function extractBarcode(text: string): string {
  // Look for digit sequences that look like barcodes (8, 12, or 13 digits)
  const barcodeRegex = /\b(\d{8})\b|\b(\d{12})\b|\b(\d{13})\b/g;
  const matches = text.match(barcodeRegex);
  if (matches && matches.length > 0) {
    return matches[0].trim();
  }
  return NOT_DETECTED;
}

function extractDosageForm(text: string): string {
  const lower = text.toLowerCase();
  for (const form of dosageForms) {
    if (lower.includes(form)) {
      return form.charAt(0).toUpperCase() + form.slice(1);
    }
  }
  return NOT_DETECTED;
}

function extractMedicineName(text: string): { name: string; genericName: string } {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
  const lowerText = text.toLowerCase();

  // Check for known generic/active ingredients
  let genericName = NOT_DETECTED;
  let bestGenericScore = 0;
  for (const keyword of commonMedicineKeywords) {
    if (lowerText.includes(keyword)) {
      const score = keyword.length; // Prefer longer matches
      if (score > bestGenericScore) {
        bestGenericScore = score;
        genericName = keyword.charAt(0).toUpperCase() + keyword.slice(1);
      }
    }
  }

  // Also try fuzzy matching for misspelled ingredients
  if (genericName === NOT_DETECTED) {
    const words = text.split(/[\s\n,]+/).filter(w => w.length > 4);
    for (const word of words) {
      const cleanWord = word.replace(/[^a-zA-Z]/g, '');
      if (cleanWord.length < 5) continue;
      const match = findBestMatch(cleanWord, commonMedicineKeywords);
      if (match && match.score > 0.8) {
        genericName = match.value.charAt(0).toUpperCase() + match.value.slice(1);
        break;
      }
    }
  }

  // Brand name: usually the first prominent line that's not a number or date
  let name = NOT_DETECTED;
  for (const line of lines) {
    const clean = line.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    if (clean.length < 3) continue;
    if (/^\d+$/.test(clean)) continue;
    if (/^(exp|mfg|batch|bn|lot)/i.test(clean)) continue;
    if (/\d{1,2}[\/\-]\d/.test(clean)) continue;
    // Skip lines that are just dosage forms
    if (dosageForms.includes(clean.toLowerCase())) continue;
    // This looks like a medicine name
    name = clean;
    break;
  }

  // If we found a generic name but no brand, use the generic as the name
  if (name === NOT_DETECTED && genericName !== NOT_DETECTED) {
    name = genericName;
  }

  return { name, genericName };
}

function extractManufacturer(text: string): string {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 3);
  const lowerText = text.toLowerCase();

  for (const keyword of manufacturerKeywords) {
    if (lowerText.includes(keyword)) {
      // Find the line containing the manufacturer keyword
      for (const line of lines) {
        if (line.toLowerCase().includes(keyword)) {
          return line.replace(/[^a-zA-Z0-9\s&.]/g, '').trim();
        }
      }
    }
  }

  return NOT_DETECTED;
}

export function parseOCRText(text: string, confidence: number): OCRData {
  const { name, genericName } = extractMedicineName(text);
  const strength = extractStrength(text);
  const dosageForm = extractDosageForm(text);
  const batchNumber = extractBatchNumber(text);
  const { manufacturingDate, expiryDate } = extractDates(text);
  const barcode = extractBarcode(text);
  const manufacturer = extractManufacturer(text);

  return {
    medicineName: name,
    genericName,
    strength,
    dosageForm,
    batchNumber,
    manufacturingDate,
    expiryDate,
    barcode,
    qrData: NOT_DETECTED, // QR data comes from separate barcode detection
    manufacturer,
    rawText: text,
    confidence,
  };
}

export const NOT_DETECTED_VALUE = NOT_DETECTED;
