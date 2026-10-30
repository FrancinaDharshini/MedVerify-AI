/**
 * Barcode and QR code detection using html5-qrcode.
 * Scans the uploaded image for barcodes and QR codes.
 */

export interface BarcodeResult {
  detected: boolean;
  format: string;
  text: string;
  error: string | null;
}

export interface QRResult {
  detected: boolean;
  text: string;
  error: string | null;
}

export interface BarcodeScanResult {
  barcode: BarcodeResult;
  qr: QRResult;
}

/**
 * Detect barcode/QR from an image using html5-qrcode's scanFile API.
 */
export async function detectBarcodeAndQR(imageDataUrl: string): Promise<BarcodeScanResult> {
  const barcode: BarcodeResult = { detected: false, format: '', text: '', error: null };
  const qr: QRResult = { detected: false, text: '', error: null };

  try {
    const { Html5Qrcode } = await import('html5-qrcode');

    // Create a blob from the data URL to pass to scanFile
    const response = await fetch(imageDataUrl);
    const blob = await response.blob();
    const file = new File([blob], 'medicine.jpg', { type: blob.type });

    try {
      const scanner = new Html5Qrcode('barcode-scanner-hidden');
      const result = await scanner.scanFile(file, false);

      if (result && typeof result === 'string') {
        // Determine if it's a QR code or barcode based on the decoded format
        // Html5Qrcode doesn't directly tell us the format, but QR codes typically
        // contain URLs or structured data, while barcodes are numeric
        if (/^\d+$/.test(result) && result.length >= 8 && result.length <= 14) {
          barcode.detected = true;
          barcode.text = result;
          barcode.format = result.length === 13 ? 'EAN-13' : result.length === 12 ? 'UPC-A' : 'Code128';
        } else {
          qr.detected = true;
          qr.text = result;
        }
      }

      // scanFile doesn't have a stop method, but we should clean up
      // The Html5Qrcode instance for scanFile doesn't need stopping
    } catch {
      // scanFile throws if no code is found — this is expected
      barcode.error = null;
      qr.error = null;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Barcode scanning failed';
    barcode.error = msg;
    qr.error = msg;
  }

  return { barcode, qr };
}
