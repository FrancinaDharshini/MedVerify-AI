import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Upload, Scan, X, ImageIcon, FileText, AlertCircle, CheckCircle2,
  Loader2, Camera, History as HistoryIcon, ArrowRight, Info,
  CameraOff, RotateCw, Check,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { analyzeMedicineImage, type AnalysisProgress } from '@/lib/analysisPipeline';
import type { AnalysisResult } from '@/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type CaptureMode = 'idle' | 'live' | 'captured';
type ImageSource = 'upload' | 'camera';

interface SelectedImage {
  dataUrl: string;
  previewUrl: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  source: ImageSource;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function isSecureContext(): boolean {
  if (typeof window !== 'undefined') {
    return window.isSecureContext;
  }
  return false;
}

function hasMediaDevices(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.mediaDevices && !!navigator.mediaDevices.getUserMedia;
}

// ─────────────────────────────────────────────────────────────────────────────
// Live Camera Component
// ─────────────────────────────────────────────────────────────────────────────

function LiveCamera({
  onCapture,
  onClose,
  onError,
}: {
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
  onError: (msg: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (!hasMediaDevices()) {
      onError('No camera was detected on this device. Please upload an image instead.');
      return;
    }
    if (!isSecureContext()) {
      onError('Camera access requires a secure context (HTTPS or localhost). Please upload an image instead.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('Permission') || msg.includes('NotAllowed') || msg.includes('denied')) {
        onError('Camera access was denied. Please allow camera permission in your browser settings or use Upload Image instead.');
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
        onError('No camera was detected on this device. Please upload an image instead.');
      } else {
        onError('Could not access the camera. Please use Upload Image instead.');
      }
    }
  }, [onError]);

  useEffect(() => {
    startCamera();
    return () => stopStream();
  }, [startCamera, stopStream]);

  const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    stopStream();
    onCapture(dataUrl);
  }, [onCapture, stopStream]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-neutral-900 aspect-[3/4] sm:aspect-[16/9]">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Frame guide overlay */}
      <div className="absolute inset-6 border-2 border-white/30 rounded-xl pointer-events-none">
        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-white rounded-tl-lg" />
        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-white rounded-tr-lg" />
        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-white rounded-bl-lg" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-white rounded-br-lg" />
      </div>
      <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 backdrop-blur">
        <div className="w-2 h-2 rounded-full bg-danger-500 animate-pulse" />
        <span className="text-xs font-mono text-white uppercase tracking-wider">Live Camera</span>
      </div>
      {/* Capture + Close buttons */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={capturePhoto}
            className="flex flex-col items-center gap-1 px-6 py-3 rounded-xl bg-white text-neutral-900 font-semibold text-sm hover:bg-neutral-100 transition-colors shadow-lg"
          >
            <Camera className="w-6 h-6" />
            Capture Photo
          </button>
          <button
            onClick={() => { stopStream(); onClose(); }}
            className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-white/20 backdrop-blur text-white font-medium text-sm hover:bg-white/30 transition-colors"
          >
            <X className="w-6 h-6" />
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main ScanPage
// ─────────────────────────────────────────────────────────────────────────────

export function ScanPage() {
  const { navigate, setCurrentAnalysis, addToAnalysisHistory, analysisHistory } = useApp();
  const [dragOver, setDragOver] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [captureMode, setCaptureMode] = useState<CaptureMode>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState<AnalysisProgress | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Selection / reset ──────────────────────────────────────────────────────

  const clearSelection = useCallback(() => {
    if (selectedImage) URL.revokeObjectURL(selectedImage.previewUrl);
    setSelectedImage(null);
    setError(null);
    setProgress(null);
  }, [selectedImage]);

  const exitCamera = useCallback(() => {
    setCaptureMode('idle');
    setCameraError(null);
  }, []);

  // ── File upload handling ───────────────────────────────────────────────────

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please upload a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`Image is too large (${formatFileSize(file.size)}). Maximum size is 10 MB.`);
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    try {
      const dataUrl = await fileToDataUrl(file);
      setSelectedImage({ dataUrl, previewUrl, fileName: file.name, fileSize: file.size, fileType: file.type, source: 'upload' });
      setCaptureMode('idle');
    } catch {
      setError('Could not read the image file. Please try again.');
      URL.revokeObjectURL(previewUrl);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }, [handleFile]);

  // ── Camera capture handling ────────────────────────────────────────────────

  const handleCameraCapture = useCallback((dataUrl: string) => {
    const blob = fetch(dataUrl).then((r) => r.blob());
    blob.then((b) => {
      const previewUrl = URL.createObjectURL(b);
      setSelectedImage({
        dataUrl,
        previewUrl,
        fileName: 'camera-capture.jpg',
        fileSize: b.size,
        fileType: 'image/jpeg',
        source: 'camera',
      });
      setCaptureMode('captured');
      setCameraError(null);
    });
  }, []);

  // ── Analysis ───────────────────────────────────────────────────────────────

  const handleAnalyze = useCallback(async () => {
    if (!selectedImage) return;
    setAnalyzing(true);
    setError(null);
    setProgress({ step: 'start', label: 'Starting analysis…', progress: 5 });

    try {
      const result: AnalysisResult = await analyzeMedicineImage(
        selectedImage.dataUrl,
        selectedImage.source,
        (p) => setProgress(p),
      );
      setCurrentAnalysis(result);
      addToAnalysisHistory(result);
      navigate('result');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed unexpectedly.';
      setError(`Analysis could not be completed: ${msg}`);
      setAnalyzing(false);
      setProgress(null);
    }
  }, [selectedImage, setCurrentAnalysis, addToAnalysisHistory, navigate]);

  const handleViewHistory = useCallback((analysis: AnalysisResult) => {
    setCurrentAnalysis(analysis);
    navigate('result');
  }, [setCurrentAnalysis, navigate]);

  const sourceLabel = selectedImage?.source === 'camera' ? 'Camera Capture' : 'Uploaded Image';

  return (
    <div className="min-h-screen pt-20 pb-12 bg-neutral-50 dark:bg-neutral-950">
      <div id="barcode-scanner-hidden" style={{ display: 'none' }} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2 text-neutral-900 dark:text-neutral-100">
            Check Your Medicine
          </h1>
          <p className="text-lg text-neutral-500 dark:text-neutral-400">
            Upload a photo or use your camera. The system will read the text, look it up in official drug databases, and compare the results.
          </p>
        </motion.div>

        {/* Main Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlassCard className="p-6 sm:p-8">
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              className="hidden"
              onChange={handleInputChange}
            />

            {/* IDLE STATE — no image, no camera, not analyzing */}
            {!selectedImage && !analyzing && captureMode === 'idle' && (
              <>
                {/* Drag-drop zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                  onClick={() => inputRef.current?.click()}
                  className={`relative aspect-[16/9] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                    dragOver
                      ? 'border-primary-500 bg-primary-500/10 scale-[1.01]'
                      : 'border-neutral-300 dark:border-neutral-700 hover:border-primary-500 hover:bg-primary-500/5'
                  }`}
                >
                  <motion.div
                    animate={{ y: dragOver ? -4 : 0 }}
                    className="flex flex-col items-center text-center px-6"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mb-4">
                      <Upload className="w-8 h-8 text-primary-500" />
                    </div>
                    <p className="text-xl font-semibold mb-1 text-neutral-900 dark:text-neutral-100">
                      Drag & drop your medicine photo here
                    </p>
                    <p className="text-base text-neutral-400 mb-4">
                      or click to browse from your device
                    </p>
                    <div className="flex items-center gap-2 text-sm text-neutral-400">
                      <ImageIcon className="w-4 h-4" />
                      JPG, PNG, or WEBP — up to 10 MB
                    </div>
                  </motion.div>
                </div>

                {/* Two main options */}
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <Button
                    fullWidth
                    size="lg"
                    icon={<Upload className="w-5 h-5" />}
                    onClick={() => inputRef.current?.click()}
                  >
                    Upload Image
                  </Button>
                  <Button
                    fullWidth
                    size="lg"
                    variant="secondary"
                    icon={<Camera className="w-5 h-5" />}
                    onClick={() => { setCameraError(null); setCaptureMode('live'); }}
                  >
                    Open Camera
                  </Button>
                </div>

                {/* Camera permission error */}
                {cameraError && (
                  <div className="mt-4 p-4 rounded-xl bg-warning-500/10 border border-warning-500/20 flex items-start gap-3">
                    <CameraOff className="w-5 h-5 text-warning-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{cameraError}</p>
                  </div>
                )}
              </>
            )}

            {/* LIVE CAMERA STATE */}
            {!selectedImage && !analyzing && captureMode === 'live' && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Camera className="w-5 h-5 text-primary-500" />
                  <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Camera Preview</h2>
                </div>
                <LiveCamera
                  onCapture={handleCameraCapture}
                  onClose={exitCamera}
                  onError={(msg) => { setCameraError(msg); setCaptureMode('idle'); }}
                />
                <p className="text-sm text-neutral-400 mt-3 text-center">
                  Position the medicine package inside the frame and tap "Capture Photo".
                </p>
              </div>
            )}

            {/* CAPTURED / SELECTED IMAGE PREVIEW */}
            {selectedImage && !analyzing && (
              <div>
                {/* Image preview */}
                <div className="relative rounded-2xl overflow-hidden mb-4 bg-neutral-900">
                  <img
                    src={selectedImage.previewUrl}
                    alt="Medicine to analyze"
                    className="w-full max-h-[400px] object-contain"
                  />
                  {/* Source badge */}
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur flex items-center gap-1.5">
                    {selectedImage.source === 'camera' ? (
                      <Camera className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-white" />
                    )}
                    <span className="text-xs font-medium text-white">{sourceLabel}</span>
                  </div>
                  <button
                    onClick={clearSelection}
                    className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/60 backdrop-blur flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                    aria-label="Remove image"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* File info */}
                <div className="flex items-center gap-3 p-4 rounded-xl bg-neutral-100 dark:bg-neutral-800/50 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-primary-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate text-neutral-900 dark:text-neutral-100">{selectedImage.fileName}</p>
                    <p className="text-xs text-neutral-400">
                      {formatFileSize(selectedImage.fileSize)} · {selectedImage.fileType} · {sourceLabel}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    fullWidth
                    size="xl"
                    icon={<Scan className="w-6 h-6" />}
                    onClick={handleAnalyze}
                  >
                    Analyze This Medicine
                  </Button>
                  {selectedImage.source === 'camera' ? (
                    <Button
                      size="xl"
                      variant="secondary"
                      icon={<RotateCw className="w-5 h-5" />}
                      onClick={() => { clearSelection(); setCaptureMode('live'); }}
                      className="px-6"
                    >
                      Retake
                    </Button>
                  ) : (
                    <Button
                      size="xl"
                      variant="ghost"
                      onClick={clearSelection}
                      className="px-6"
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* ANALYZING / PROGRESS STATE */}
            {analyzing && progress && (
              <div className="py-12">
                <div className="flex flex-col items-center text-center mb-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    className="w-20 h-20 rounded-full border-4 border-primary-500/20 border-t-primary-500 mb-6"
                  />
                  <p className="text-xl font-semibold mb-2 text-neutral-900 dark:text-neutral-100">{progress.label}</p>
                  <p className="text-sm text-neutral-400">This may take 10–30 seconds. Please keep this page open.</p>
                </div>

                <div className="max-w-md mx-auto">
                  <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                    <motion.div
                      className="h-full bg-primary-500 rounded-full"
                      animate={{ width: `${progress.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-neutral-400">
                    <span>{progress.step}</span>
                    <span>{progress.progress}%</span>
                  </div>
                </div>

                <div className="mt-8 space-y-2 max-w-md mx-auto">
                  {[
                    { key: 'preprocess', label: 'Image preprocessing' },
                    { key: 'ocr', label: 'OCR text extraction (Tesseract.js)' },
                    { key: 'barcode', label: 'Barcode & QR detection' },
                    { key: 'reference', label: 'openFDA + RxNorm lookup' },
                    { key: 'matching', label: 'Evidence matching engine' },
                    { key: 'finalize', label: 'Compiling report' },
                  ].map((step) => {
                    const stepProgress = progress.progress;
                    const thresholds: Record<string, number> = { preprocess: 10, ocr: 25, barcode: 45, reference: 60, matching: 80, finalize: 95 };
                    const threshold = thresholds[step.key];
                    const isDone = stepProgress > threshold;
                    const isActive = progress.step === step.key;
                    return (
                      <div key={step.key} className="flex items-center gap-3 text-sm">
                        {isDone ? (
                          <CheckCircle2 className="w-4 h-4 text-success-500 shrink-0" />
                        ) : isActive ? (
                          <Loader2 className="w-4 h-4 text-primary-500 animate-spin shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-neutral-300 dark:border-neutral-700 shrink-0" />
                        )}
                        <span className={isDone || isActive ? 'text-neutral-700 dark:text-neutral-300' : 'text-neutral-400'}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Error state */}
            {error && !analyzing && (
              <div className="mt-4 p-4 rounded-xl bg-danger-500/10 border border-danger-500/20 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-danger-500 shrink-0 mt-0.5" />
                <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Disclaimer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-6">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-accent-500/10 border border-accent-500/20">
            <Info className="w-5 h-5 text-accent-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 mb-1">
                Preliminary screening — not a definitive authentication
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                This tool provides a preliminary package-screening assessment based on image-derived text and publicly available reference data. It does not prove or disprove authenticity, and is not a substitute for professional medical or regulatory advice.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Analysis History */}
        {analysisHistory.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <HistoryIcon className="w-5 h-5 text-neutral-400" />
              <h2 className="font-semibold text-lg text-neutral-900 dark:text-neutral-100">Recent Analyses</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-500">
                {analysisHistory.length}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysisHistory.slice(0, 6).map((analysis) => (
                <motion.div key={analysis.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                  <GlassCard className="p-4 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleViewHistory(analysis)}>
                    <div className="flex items-start gap-3">
                      {analysis.uploadedImage ? (
                        <img src={analysis.uploadedImage} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                          <ImageIcon className="w-6 h-6 text-neutral-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate text-neutral-900 dark:text-neutral-100">
                          {analysis.ocrData.medicineName !== 'Not detected' ? analysis.ocrData.medicineName : 'Unknown medicine'}
                        </p>
                        <p className="text-xs text-neutral-400 truncate">
                          {new Date(analysis.timestamp).toLocaleDateString()} · {analysis.score.score}% match · {analysis.scanMethod === 'camera' ? 'Camera' : 'Upload'}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-primary-500 font-medium">
                          View result <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
