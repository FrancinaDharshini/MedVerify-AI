import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Scan, FileText, ArrowLeft, Download, AlertCircle, CheckCircle2,
  XCircle, Info, Loader2, Database, Eye, GitCompare,
  AlertTriangle, ShieldCheck, Calendar, Barcode, Building2,
  Pill, Activity, FileCheck2, ChevronDown, ChevronUp, MessageSquare,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { generatePDF } from '@/lib/pdfGenerator';
import { buildPdfData } from '@/lib/pdfDataBuilder';
import type { AnalysisResult } from '@/types';
import type { MatchStatus } from '@/lib/matchingEngine';

function scoreColor(score: number): string {
  if (score >= 85) return 'text-success-600 dark:text-success-400';
  if (score >= 65) return 'text-warning-600 dark:text-warning-400';
  if (score >= 40) return 'text-warning-600 dark:text-warning-400';
  return 'text-danger-600 dark:text-danger-400';
}

function scoreBg(score: number): string {
  if (score >= 85) return 'bg-success-500';
  if (score >= 65) return 'bg-warning-500';
  if (score >= 40) return 'bg-warning-500';
  return 'bg-danger-500';
}

function statusIcon(status: MatchStatus) {
  if (status === 'matched') return <CheckCircle2 className="w-5 h-5 text-success-500 shrink-0" />;
  if (status === 'partial') return <AlertCircle className="w-5 h-5 text-warning-500 shrink-0" />;
  if (status === 'not-matched') return <XCircle className="w-5 h-5 text-danger-500 shrink-0" />;
  return <Info className="w-5 h-5 text-neutral-400 shrink-0" />;
}

function statusLabel(status: MatchStatus): string {
  if (status === 'matched') return 'Matched';
  if (status === 'partial') return 'Partial Match';
  if (status === 'not-matched') return 'Not Matched';
  return 'Unavailable';
}

function statusColor(status: MatchStatus): string {
  if (status === 'matched') return 'text-success-600 dark:text-success-400';
  if (status === 'partial') return 'text-warning-600 dark:text-warning-400';
  if (status === 'not-matched') return 'text-danger-600 dark:text-danger-400';
  return 'text-neutral-400';
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const isNotFound = value === 'Not detected' || value === 'Not found' || value === '' || value === 'N/A';
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
      <span className="text-sm text-neutral-500 dark:text-neutral-400 shrink-0">{label}</span>
      <span className={`text-sm ${mono ? 'font-mono' : 'font-medium'} ${isNotFound ? 'text-neutral-400 italic' : 'text-neutral-900 dark:text-neutral-100'} sm:text-right`}>
        {isNotFound ? 'Not detected' : value}
      </span>
    </div>
  );
}

function MatchCard({ label, status, confidence, explanation, delay }: {
  label: string;
  status: MatchStatus;
  confidence: number;
  explanation: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-4 rounded-xl glass border border-neutral-200 dark:border-neutral-800"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {statusIcon(status)}
          <span className="font-medium text-sm text-neutral-900 dark:text-neutral-100">{label}</span>
        </div>
        <span className={`text-xs font-bold ${statusColor(status)}`}>
          {statusLabel(status)} · {confidence}%
        </span>
      </div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{explanation}</p>
    </motion.div>
  );
}

export function ResultPage() {
  const { currentAnalysis, navigate } = useApp();
  const [showRawText, setShowRawText] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const handleBack = useCallback(() => navigate('scan'), [navigate]);
  const handleScanAnother = useCallback(() => {
    navigate('scan');
  }, [navigate]);

  const handleDownloadPDF = useCallback(() => {
    if (!currentAnalysis) return;
    setGeneratingPDF(true);
    setPdfError(null);
    try {
      generatePDF(buildPdfData(currentAnalysis));
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'The PDF report could not be generated.');
    } finally {
      setGeneratingPDF(false);
    }
  }, [currentAnalysis]);

  if (!currentAnalysis) {
    return (
      <div className="min-h-screen pt-20 pb-12 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2 text-neutral-900 dark:text-neutral-100">No analysis to display</h1>
          <p className="text-neutral-400 mb-6">Upload a medicine image to see the screening results here.</p>
          <Button onClick={handleBack} icon={<Scan className="w-5 h-5" />}>Go to Upload Page</Button>
        </div>
      </div>
    );
  }

  const a = currentAnalysis;
  const ocr = a.ocrData;
  const ref = a.referenceData;
  const match = a.matchingEvidence;
  const score = a.score;

  return (
    <div className="min-h-screen pt-20 pb-12 bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <button onClick={handleBack} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Upload
        </button>

        {/* Score Banner */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <GlassCard className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Score Ring */}
              <div className="relative w-32 h-32 shrink-0">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="10" className="text-neutral-200 dark:text-neutral-800" />
                  <motion.circle
                    cx="60" cy="60" r="52" fill="none" strokeWidth="10"
                    strokeLinecap="round"
                    stroke="currentColor"
                    className={scoreColor(score.score)}
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - score.score / 100) }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-3xl font-bold ${scoreColor(score.score)}`}>{score.score}</span>
                  <span className="text-xs text-neutral-400">out of 100</span>
                </div>
              </div>

              {/* Score Details */}
              <div className="flex-1 text-center sm:text-left">
                <p className="text-sm text-neutral-400 uppercase tracking-wide mb-1">Reference Match Score</p>
                <h1 className={`font-display text-2xl font-bold mb-2 ${scoreColor(score.score)}`}>
                  {score.classification}
                </h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md">
                  This score reflects how closely the text extracted from your image matches official reference data from {ref.source !== 'None' ? ref.source : 'drug databases'}.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Uploaded Image + Analysis Summary */}
        <div className="grid lg:grid-cols-2 gap-4 mb-6">
          {/* Uploaded Image */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Eye className="w-5 h-5 text-primary-500" />
                <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Medicine Image</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  a.scanMethod === 'camera'
                    ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                    : 'bg-accent-500/10 text-accent-600 dark:text-accent-400'
                }`}>
                  Source: {a.scanMethod === 'camera' ? 'Camera Capture' : 'Uploaded Image'}
                </span>
              </div>
              {a.uploadedImage ? (
                <div className="rounded-xl overflow-hidden bg-neutral-900">
                  <img src={a.uploadedImage} alt="Uploaded medicine" className="w-full max-h-80 object-contain" />
                </div>
              ) : (
                <div className="aspect-video rounded-xl bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center">
                  <FileText className="w-12 h-12 text-neutral-400" />
                </div>
              )}
              <div className="mt-3 flex items-center gap-2 text-xs text-neutral-400">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(a.timestamp).toLocaleString()}
              </div>
            </GlassCard>
          </motion.div>

          {/* Analysis Summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileCheck2 className="w-5 h-5 text-primary-500" />
                <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Analysis Summary</h2>
              </div>
              <div className="space-y-1">
                <InfoRow label="Detected Name" value={ocr.medicineName} />
                <InfoRow label="Active Ingredient" value={ocr.genericName} />
                <InfoRow label="Strength" value={ocr.strength} />
                <InfoRow label="Dosage Form" value={ocr.dosageForm} />
                <InfoRow label="Manufacturer" value={ocr.manufacturer} />
                <InfoRow label="Batch Number" value={ocr.batchNumber} mono />
                <InfoRow label="Expiry Date" value={ocr.expiryDate} />
                <InfoRow label="OCR Confidence" value={`${ocr.confidence}%`} />
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Evidence Matching Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-6">
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <GitCompare className="w-5 h-5 text-primary-500" />
              <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Evidence Matching Breakdown</h2>
            </div>
            <p className="text-sm text-neutral-400 mb-4">
              Each field detected from your image is compared against the reference database. The overall score is a weighted average of these matches.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <MatchCard label="Medicine Name" status={match.nameMatch.status} confidence={match.nameMatch.confidence} explanation={match.nameMatch.explanation} delay={0.25} />
              <MatchCard label="Active Ingredient" status={match.ingredientMatch.status} confidence={match.ingredientMatch.confidence} explanation={match.ingredientMatch.explanation} delay={0.3} />
              <MatchCard label="Strength" status={match.strengthMatch.status} confidence={match.strengthMatch.confidence} explanation={match.strengthMatch.explanation} delay={0.35} />
              <MatchCard label="Dosage Form" status={match.dosageMatch.status} confidence={match.dosageMatch.confidence} explanation={match.dosageMatch.explanation} delay={0.4} />
              <MatchCard label="Manufacturer" status={match.manufacturerMatch.status} confidence={match.manufacturerMatch.confidence} explanation={match.manufacturerMatch.explanation} delay={0.45} />
              <MatchCard label="Identifier (NDC/Barcode)" status={match.identifierMatch.status} confidence={match.identifierMatch.confidence} explanation={match.identifierMatch.explanation} delay={0.5} />
            </div>
          </GlassCard>
        </motion.div>

        {/* Reference Database Results */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-6">
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-5 h-5 text-primary-500" />
              <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Reference Database Results</h2>
              {ref.source !== 'None' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 font-medium">
                  {ref.source}
                </span>
              )}
            </div>

            {ref.openFDA && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-success-500" /> openFDA NDC Registry
                </h3>
                <div className="space-y-1">
                  <InfoRow label="Brand Name" value={ref.openFDA.brandName} />
                  <InfoRow label="Generic Name" value={ref.openFDA.genericName} />
                  <InfoRow label="Dosage Form" value={ref.openFDA.dosageForm} />
                  <InfoRow label="Manufacturer" value={ref.openFDA.manufacturerName} />
                  <InfoRow label="Product NDC" value={ref.openFDA.productNdc} mono />
                  {ref.openFDA.rxcui !== 'Not found' && <InfoRow label="RxCUI" value={ref.openFDA.rxcui} mono />}
                  {ref.openFDA.activeIngredients.length > 0 && (
                    <InfoRow label="Active Ingredients" value={ref.openFDA.activeIngredients.map(ai => `${ai.name} (${ai.strength})`).join(', ')} />
                  )}
                </div>
              </div>
            )}

            {ref.rxNorm && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary-500" /> RxNorm
                </h3>
                <div className="space-y-1">
                  <InfoRow label="RxNorm Name" value={ref.rxNorm.name} />
                  <InfoRow label="RxCUI" value={ref.rxNorm.rxcui} mono />
                  <InfoRow label="Match Score" value={`${ref.rxNorm.score}`} />
                </div>
              </div>
            )}

            {!ref.openFDA && !ref.rxNorm && (
              <div className="p-4 rounded-xl bg-warning-500/10 border border-warning-500/20 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning-500 shrink-0 mt-0.5" />
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {ref.error || 'No matching records were found in the openFDA or RxNorm databases for the text extracted from this image.'}
                </p>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Barcode / QR Detection */}
        {a.barcodeScan && (a.barcodeScan.barcode.detected || a.barcodeScan.qr.detected) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-6">
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Barcode className="w-5 h-5 text-primary-500" />
                <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Barcode & QR Detection</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">Barcode</h3>
                  {a.barcodeScan.barcode.detected ? (
                    <div className="space-y-1">
                      <InfoRow label="Detected" value="Yes" />
                      <InfoRow label="Format" value={a.barcodeScan.barcode.format} />
                      <InfoRow label="Code" value={a.barcodeScan.barcode.text} mono />
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-400 italic">No barcode detected in the image.</p>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">QR Code</h3>
                  {a.barcodeScan.qr.detected ? (
                    <div className="space-y-1">
                      <InfoRow label="Detected" value="Yes" />
                      <InfoRow label="Content" value={a.barcodeScan.qr.text} mono />
                    </div>
                  ) : (
                    <p className="text-sm text-neutral-400 italic">No QR code detected in the image.</p>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Raw OCR Text (collapsible) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mb-6">
          <GlassCard className="p-6">
            <button
              onClick={() => setShowRawText(!showRawText)}
              className="flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-500" />
                <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Raw OCR Text</h2>
              </div>
              {showRawText ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
            </button>
            {showRawText && (
              <div className="mt-4">
                {ocr.rawText.trim() ? (
                  <pre className="text-xs font-mono whitespace-pre-wrap p-4 rounded-xl bg-neutral-100 dark:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300 max-h-80 overflow-y-auto">
                    {ocr.rawText}
                  </pre>
                ) : (
                  <p className="text-sm text-neutral-400 italic">No text was extracted from the image. The photo may be too blurry or not contain readable text.</p>
                )}
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Warnings */}
        {a.warnings.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-6">
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-warning-500" />
                <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">Warnings & Notes</h2>
              </div>
              <div className="space-y-2">
                {a.warnings.map((warning, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-warning-500/10">
                    <AlertCircle className="w-4 h-4 text-warning-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{warning}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Disclaimer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="mb-6">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
            <Info className="w-5 h-5 text-neutral-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Preliminary Screening Disclaimer
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                This report provides a preliminary medicine-package screening based on image-derived information and publicly available reference data (openFDA, RxNorm). It does not constitute definitive authentication, medical advice, or regulatory certification. Always consult a licensed pharmacist or healthcare professional before consuming any medication.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="secondary"
            icon={generatingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            onClick={handleDownloadPDF}
            disabled={generatingPDF}
            fullWidth
          >
            {generatingPDF ? 'Generating PDF…' : 'Download PDF Report'}
          </Button>
          <Button variant="secondary" icon={<MessageSquare className="w-4 h-4" />} onClick={() => navigate('assistant')} fullWidth>
            Ask Voice Assistant
          </Button>
          <Button icon={<Scan className="w-4 h-4" />} onClick={handleScanAnother} fullWidth>
            Scan Another Medicine
          </Button>
        </div>
        {pdfError && (
          <p role="alert" className="mt-3 text-sm text-danger-600 dark:text-danger-400">
            {pdfError}
          </p>
        )}
      </div>
    </div>
  );
}
