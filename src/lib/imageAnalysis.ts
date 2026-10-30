/**
 * Real image analysis using canvas pixel data.
 * Reads actual uploaded/captured photos and extracts visual quality metrics:
 * - Image clarity/sharpness (edge detection via luminance variance)
 * - Text region detection (high-contrast rectangular regions)
 * - Barcode detection (vertical line patterns in bottom regions)
 * - Color consistency (detect if colors match typical medicine packaging)
 * - Overall image quality (brightness, contrast, noise)
 *
 * This is NOT a fake/random generator — it reads real pixel data and produces
 * deterministic results from the actual image content.
 */

export interface ImageAnalysisResult {
  width: number;
  height: number;
  sharpness: number;        // 0-100, edge density
  brightness: number;       // 0-100, average luminance
  contrast: number;         // 0-100, luminance spread
  textRegionConfidence: number; // 0-100, likelihood text is readable
  barcodeRegionDetected: boolean;
  colorConsistency: number; // 0-100, how consistent colors are
  hasHologramLikePattern: boolean;
  noiseLevel: number;       // 0-100, lower is better
  edgeDensity: number;      // 0-100, more edges = more detail = clearer photo
  detectedRegions: DetectedRegion[];
  dominantColor: { r: number; g: number; b: number };
  colorVariance: number;
}

export interface DetectedRegion {
  x: number;      // percentage 0-100
  y: number;      // percentage 0-100
  width: number;  // percentage 0-100
  height: number; // percentage 0-100
  type: 'text' | 'barcode' | 'logo' | 'blank' | 'graphics';
  confidence: number; // 0-100
  sharpness: number;  // 0-100
  contrast: number;   // 0-100
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

function toCanvas(img: HTMLImageElement, maxSize: number = 512): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  let { width, height } = img;

  if (width > maxSize || height > maxSize) {
    const ratio = maxSize / Math.max(width, height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}

function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export async function analyzeImage(dataUrl: string): Promise<ImageAnalysisResult> {
  const img = await loadImage(dataUrl);
  const canvas = toCanvas(img, 512);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  // Calculate luminance map
  const lumMap = new Float32Array(width * height);
  let totalLum = 0;
  let totalR = 0, totalG = 0, totalB = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      const lum = getLuminance(r, g, b);
      lumMap[y * width + x] = lum;
      totalLum += lum;
      totalR += r;
      totalG += g;
      totalB += b;
    }
  }

  const pixelCount = width * height;
  const avgLum = totalLum / pixelCount;
  const dominantColor = {
    r: Math.round(totalR / pixelCount),
    g: Math.round(totalG / pixelCount),
    b: Math.round(totalB / pixelCount),
  };

  // Brightness: 0=black, 100=white
  const brightness = clamp((avgLum / 255) * 100, 0, 100);

  // Contrast: standard deviation of luminance
  let lumVariance = 0;
  for (let i = 0; i < pixelCount; i++) {
    lumVariance += Math.pow(lumMap[i] - avgLum, 2);
  }
  const lumStdDev = Math.sqrt(lumVariance / pixelCount);
  const contrast = clamp((lumStdDev / 64) * 100, 0, 100);

  // Edge detection using Sobel-like operator
  // Count pixels where luminance changes sharply with neighbors
  let edgeCount = 0;
  const edgeMap = new Uint8Array(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const left = lumMap[idx - 1];
      const right = lumMap[idx + 1];
      const top = lumMap[idx - width];
      const bottom = lumMap[idx + width];
      const gx = Math.abs(right - left);
      const gy = Math.abs(bottom - top);
      const gradient = gx + gy;
      if (gradient > 30) {
        edgeMap[idx] = 1;
        edgeCount++;
      }
    }
  }

  const edgeDensity = clamp((edgeCount / pixelCount) * 500, 0, 100);

  // Sharpness: higher edge density with good contrast = sharper image
  const sharpness = clamp((edgeDensity * 0.6 + contrast * 0.4), 0, 100);

  // Noise: measure high-frequency variations in flat regions
  let noiseSum = 0;
  let flatRegionCount = 0;
  for (let y = 2; y < height - 2; y += 2) {
    for (let x = 2; x < width - 2; x += 2) {
      const idx = y * width + x;
      const center = lumMap[idx];
      const neighbors = [
        lumMap[idx - 1], lumMap[idx + 1],
        lumMap[idx - width], lumMap[idx + width],
      ];
      const avg = neighbors.reduce((a, b) => a + b, 0) / 4;
      const localVar = neighbors.reduce((a, b) => a + Math.abs(b - avg), 0) / 4;
      if (Math.abs(center - avg) < 10) {
        noiseSum += localVar;
        flatRegionCount++;
      }
    }
  }
  const noiseLevel = flatRegionCount > 0
    ? clamp((noiseSum / flatRegionCount) * 3, 0, 100)
    : 50;

  // Color variance: how much colors deviate from dominant
  let colorVarSum = 0;
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const idx = (y * width + x) * 4;
      const dr = pixels[idx] - dominantColor.r;
      const dg = pixels[idx + 1] - dominantColor.g;
      const db = pixels[idx + 2] - dominantColor.b;
      colorVarSum += Math.sqrt(dr * dr + dg * dg + db * db);
    }
  }
  const colorVariance = colorVarSum / Math.ceil(pixelCount / 4);
  const colorConsistency = clamp(100 - (colorVariance / 2), 0, 100);

  // Detect regions by dividing image into a grid and analyzing each cell
  const gridCols = 6;
  const gridRows = 8;
  const cellW = width / gridCols;
  const cellH = height / gridRows;
  const detectedRegions: DetectedRegion[] = [];

  for (let gy = 0; gy < gridRows; gy++) {
    for (let gx = 0; gx < gridCols; gx++) {
      const startX = Math.round(gx * cellW);
      const startY = Math.round(gy * cellH);
      const endX = Math.round((gx + 1) * cellW);
      const endY = Math.round((gy + 1) * cellH);

      let cellEdgeCount = 0;
      let cellLumSum = 0;
      let cellPixelCount = 0;
      let verticalLinePattern = 0;
      let horizontalEdgePattern = 0;

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = y * width + x;
          cellEdgeCount += edgeMap[idx];
          cellLumSum += lumMap[idx];
          cellPixelCount++;

          // Detect vertical lines (barcode pattern): thin vertical edges
          if (x > startX && x < endX - 1) {
            const left = lumMap[idx - 1];
            const center = lumMap[idx];
            const right = lumMap[idx + 1];
            if (Math.abs(center - left) > 40 && Math.abs(center - right) > 40) {
              verticalLinePattern++;
            }
          }
          // Detect horizontal edges (text lines)
          if (y > startY && y < endY - 1) {
            const top = lumMap[idx - width];
            const center = lumMap[idx];
            const bottom = lumMap[idx + width];
            if (Math.abs(center - top) > 25 && Math.abs(center - bottom) > 25) {
              horizontalEdgePattern++;
            }
          }
        }
      }

      const cellEdgeDensity = cellPixelCount > 0 ? cellEdgeCount / cellPixelCount : 0;
      const cellAvgLum = cellPixelCount > 0 ? cellLumSum / cellPixelCount : 0;
      const cellContrast = cellPixelCount > 0
        ? Math.sqrt(
            Array.from({ length: cellPixelCount }, (_, i) => {
              const px = startX + (i % Math.max(1, endX - startX));
              const py = startY + Math.floor(i / Math.max(1, endX - startX));
              if (px < width && py < height) {
                return Math.pow(lumMap[py * width + px] - cellAvgLum, 2);
              }
              return 0;
            }).reduce((a, b) => a + b, 0) / cellPixelCount
          )
        : 0;

      const vLineRatio = cellPixelCount > 0 ? verticalLinePattern / cellPixelCount : 0;
      const hEdgeRatio = cellPixelCount > 0 ? horizontalEdgePattern / cellPixelCount : 0;

      let type: DetectedRegion['type'] = 'blank';
      let confidence = 0;

      if (vLineRatio > 0.08 && cellAvgLum > 100) {
        type = 'barcode';
        confidence = clamp(vLineRatio * 600, 0, 100);
      } else if (hEdgeRatio > 0.04 && cellEdgeDensity > 0.08) {
        type = 'text';
        confidence = clamp(hEdgeRatio * 400 + cellEdgeDensity * 100, 0, 100);
      } else if (cellEdgeDensity > 0.05 && cellAvgLum > 80) {
        type = 'graphics';
        confidence = clamp(cellEdgeDensity * 200, 0, 100);
      } else if (cellEdgeDensity > 0.03) {
        type = 'logo';
        confidence = clamp(cellEdgeDensity * 150, 0, 100);
      } else {
        type = 'blank';
        confidence = clamp(100 - cellEdgeDensity * 300, 0, 100);
      }

      detectedRegions.push({
        x: (gx / gridCols) * 100,
        y: (gy / gridRows) * 100,
        width: (1 / gridCols) * 100,
        height: (1 / gridRows) * 100,
        type,
        confidence,
        sharpness: clamp(cellEdgeDensity * 300, 0, 100),
        contrast: clamp((cellContrast / 64) * 100, 0, 100),
      });
    }
  }

  // Barcode detection: check bottom 30% of image for vertical line patterns
  const bottomRegions = detectedRegions.filter(r => r.y > 65);
  const barcodeRegions = bottomRegions.filter(r => r.type === 'barcode');
  const barcodeRegionDetected = barcodeRegions.length >= 2;

  // Hologram-like pattern: high color variance in specific regions with moderate brightness
  const midRegions = detectedRegions.filter(r => r.y > 20 && r.y < 60);
  const highVarianceCount = midRegions.filter(r => r.type === 'graphics' && r.confidence > 40).length;
  const hasHologramLikePattern = highVarianceCount >= 2 && colorVariance > 40;

  // Text region confidence: how many text regions detected with good confidence
  const textRegions = detectedRegions.filter(r => r.type === 'text');
  const avgTextConfidence = textRegions.length > 0
    ? textRegions.reduce((sum, r) => sum + r.confidence, 0) / textRegions.length
    : 0;
  const textRegionConfidence = clamp(
    (avgTextConfidence * 0.5) + (textRegions.length >= 3 ? 30 : textRegions.length * 10) + (sharpness > 50 ? 20 : 0),
    0,
    100,
  );

  return {
    width,
    height,
    sharpness,
    brightness,
    contrast,
    textRegionConfidence,
    barcodeRegionDetected,
    colorConsistency,
    hasHologramLikePattern,
    noiseLevel,
    edgeDensity,
    detectedRegions,
    dominantColor,
    colorVariance,
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * Compute trust score contribution from image analysis.
 * A clear, well-lit photo with detectable text and barcode regions
 * scores higher than a blurry, dark, or featureless image.
 */
export function computeImageTrustScore(result: ImageAnalysisResult): {
  packagingMatch: number;
  ocrConfidence: number;
  visualQuality: number;
  hasText: boolean;
  hasBarcode: boolean;
} {
  // Sharp, high-contrast images with good edge density indicate real packaging
  const visualQuality = clamp(
    result.sharpness * 0.3 +
    result.contrast * 0.2 +
    (100 - result.noiseLevel) * 0.2 +
    result.colorConsistency * 0.15 +
    result.edgeDensity * 0.15,
    0,
    100,
  );

  // If we can detect text regions, OCR confidence is higher
  const hasText = result.textRegionConfidence > 30;
  const ocrConfidence = clamp(
    result.textRegionConfidence * 0.5 +
    result.sharpness * 0.3 +
    result.contrast * 0.2,
    0,
    100,
  );

  // Packaging match: real packaging has consistent colors, clear text, barcode
  const hasBarcode = result.barcodeRegionDetected;
  const packagingMatch = clamp(
    visualQuality * 0.4 +
    result.textRegionConfidence * 0.25 +
    (hasBarcode ? 20 : 5) +
    result.colorConsistency * 0.1,
    0,
    100,
  );

  return {
    packagingMatch,
    ocrConfidence,
    visualQuality,
    hasText,
    hasBarcode,
  };
}
