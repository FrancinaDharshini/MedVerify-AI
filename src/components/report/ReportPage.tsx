import { motion } from 'framer-motion';
import {
  ArrowLeft, Download, FileText, QrCode, ShieldCheck,
  AlertTriangle, HeartPulse, Pill, Factory, Barcode, Calendar,
  BrainCircuit, Network, CheckCircle2, AlertCircle, XCircle,
  Clock, Package,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { TrustRing } from '@/components/ui/TrustRing';
import { ScoreBar } from '@/components/ui/ScoreBar';
import { StatusBadge, RiskBadge } from '@/components/ui/Badge';
import { EvidenceGraph } from '@/components/result/EvidenceGraph';
import type { MedicineScan } from '@/types';

export function ReportPage() {
  const { currentScan, navigate } = useApp();

  if (!currentScan) {
    navigate('scan');
    return null;
  }
  const scan = currentScan;

  const reportSections = [
    { num: 1, label: 'Medicine Identity', icon: Pill },
    { num: 2, label: 'Scan Images', icon: Package },
    { num: 3, label: 'OCR Results', icon: FileText },
    { num: 4, label: 'Barcode/QR Results', icon: Barcode },
    { num: 5, label: 'Manufacturer Verification', icon: Factory },
    { num: 6, label: 'Batch Verification', icon: ShieldCheck },
    { num: 7, label: 'Packaging Analysis', icon: AlertTriangle },
    { num: 8, label: 'Counterfeit Risk Assessment', icon: AlertTriangle },
    { num: 9, label: 'Trust Score', icon: ShieldCheck },
    { num: 10, label: 'Evidence Graph', icon: Network },
    { num: 11, label: 'Regulatory/Recall Info', icon: ShieldCheck },
    { num: 12, label: 'Drug Safety Info', icon: HeartPulse },
    { num: 13, label: 'AI Explanation', icon: BrainCircuit },
    { num: 14, label: 'Recommended Next Steps', icon: CheckCircle2 },
    { num: 15, label: 'Sources', icon: FileText },
  ];

  return (
    <div className="min-h-screen pt-20 pb-12 grid-bg">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button onClick={() => navigate('result')} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Results
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-6 h-6 text-primary-500" />
            <h1 className="font-display text-3xl font-bold">Verification Report</h1>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400">Complete AI verification report with all evidence and sources.</p>
        </motion.div>

        {/* Download buttons */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-wrap gap-3 mb-6">
          <Button icon={<Download className="w-4 h-4" />}>Download PDF</Button>
          <Button variant="secondary" icon={<Download className="w-4 h-4" />}>Export JSON</Button>
          <Button variant="secondary" icon={<Download className="w-4 h-4" />}>Export CSV</Button>
        </motion.div>

        {/* Report document */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="glass-strong rounded-2xl overflow-hidden shadow-xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-accent-600 p-8 text-white">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-6 h-6" />
                    <span className="font-display font-bold text-lg">FakeMed AI Verification Report</span>
                  </div>
                  <p className="text-white/70 text-sm font-mono">Report ID: {scan.id.toUpperCase()}</p>
                  <p className="text-white/70 text-sm font-mono">Generated: {new Date().toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-display font-bold">{scan.trustScore}</div>
                  <div className="text-xs text-white/70 font-mono">TRUST SCORE</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <StatusBadge status={scan.status} />
                <RiskBadge level={scan.riskLevel} />
                {scan.isDemo && <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-medium">Demo Data</span>}
              </div>
            </div>

            {/* Table of contents */}
            <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="font-semibold text-sm mb-3 text-neutral-400 uppercase tracking-wider">Report Sections</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {reportSections.map((s) => (
                  <div key={s.num} className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="w-5 h-5 rounded bg-primary-500/10 text-primary-500 text-[10px] font-mono flex items-center justify-center">{s.num}</span>
                    {s.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Section 1: Medicine Identity */}
            <ReportSection num={1} title="Medicine Identity" icon={Pill}>
              <div className="grid sm:grid-cols-2 gap-3">
                <ReportField label="Medicine Name" value={scan.medicineName} />
                <ReportField label="Generic Name" value={scan.genericName} />
                <ReportField label="Drug Class" value={scan.drugClass} />
                <ReportField label="Composition" value={scan.composition} />
                <ReportField label="Dosage" value={scan.dosage} />
                <ReportField label="Manufacturer" value={scan.manufacturer} />
              </div>
            </ReportSection>

            {/* Section 2: Scan Images */}
            <ReportSection num={2} title="Scan Images" icon={Package}>
              <div className="grid grid-cols-3 gap-3">
                {['Front', 'Back', 'Side'].map((side) => (
                  <div key={side} className="aspect-[3/4] rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                    <Package className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
                  </div>
                ))}
              </div>
            </ReportSection>

            {/* Section 3: OCR Results */}
            <ReportSection num={3} title="OCR Results" icon={FileText}>
              <div className="grid sm:grid-cols-2 gap-3">
                <ReportField label="OCR Confidence" value={`${scan.ocrResult.confidence}%`} />
                <ReportField label="Extracted Name" value={scan.ocrResult.medicineName} />
                <ReportField label="Extracted Batch" value={scan.ocrResult.batchNumber} />
                <ReportField label="Mfg Date" value={scan.ocrResult.manufacturingDate} />
                <ReportField label="Expiry Date" value={scan.ocrResult.expiryDate} />
                <ReportField label="MRP" value={scan.ocrResult.mrp} />
                <ReportField label="License" value={scan.ocrResult.licenseNumber} />
                <ReportField label="Warnings" value={scan.ocrResult.warnings} />
              </div>
            </ReportSection>

            {/* Section 4: Barcode/QR */}
            <ReportSection num={4} title="Barcode/QR Results" icon={Barcode}>
              <div className="grid sm:grid-cols-2 gap-3">
                <ReportField label="Barcode" value={scan.barcodeResult.code} />
                <ReportField label="Type" value={scan.barcodeResult.type} />
                <ReportField label="Valid Structure" value={scan.barcodeResult.isValid ? 'Yes' : 'No'} />
                <ReportField label="Matches Package" value={scan.barcodeResult.matchesPackage ? 'Yes' : 'No'} />
                <ReportField label="Decoded Info" value={scan.barcodeResult.decodedInfo} />
              </div>
            </ReportSection>

            {/* Section 5: Manufacturer */}
            <ReportSection num={5} title="Manufacturer Verification" icon={Factory}>
              <div className="space-y-2">
                {scan.regulatoryRecords.map((rec, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg glass">
                    <div>
                      <p className="text-sm font-medium">{rec.source}</p>
                      <p className="text-xs text-neutral-400">{rec.notes}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${rec.status === 'registered' ? 'bg-success-500/10 text-success-600 dark:text-success-400' : 'bg-danger-500/10 text-danger-600 dark:text-danger-400'}`}>
                      {rec.status}
                    </span>
                  </div>
                ))}
              </div>
            </ReportSection>

            {/* Section 6: Batch */}
            <ReportSection num={6} title="Batch Verification" icon={ShieldCheck}>
              <div className="grid sm:grid-cols-2 gap-3">
                <ReportField label="Batch Number" value={scan.batchNumber} />
                <ReportField label="Mfg Date" value={scan.manufacturingDate} />
                <ReportField label="Expiry Date" value={scan.expiryDate} />
                <ReportField label="License Number" value={scan.licenseNumber} />
              </div>
            </ReportSection>

            {/* Section 7: Packaging */}
            <ReportSection num={7} title="Packaging Analysis" icon={AlertTriangle}>
              <div className="space-y-2">
                {scan.heatmapRegions.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                    {r.severity === 'normal' ? <CheckCircle2 className="w-4 h-4 text-success-500 shrink-0" /> :
                     r.severity === 'suspicious' ? <AlertCircle className="w-4 h-4 text-warning-500 shrink-0" /> :
                     <XCircle className="w-4 h-4 text-danger-500 shrink-0" />}
                    <span className="text-sm font-medium w-32">{r.label}</span>
                    <span className="text-xs text-neutral-400 flex-1">{r.note}</span>
                  </div>
                ))}
              </div>
            </ReportSection>

            {/* Section 8: Counterfeit Risk */}
            <ReportSection num={8} title="Counterfeit Risk Assessment" icon={AlertTriangle}>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-3">{scan.aiVerdict}</p>
              <div className="space-y-2">
                {scan.evidence.map((e, i) => (
                  <div key={i} className="flex items-start gap-3">
                    {e.status === 'pass' ? <CheckCircle2 className="w-4 h-4 text-success-500 shrink-0 mt-0.5" /> :
                     e.status === 'warning' ? <AlertCircle className="w-4 h-4 text-warning-500 shrink-0 mt-0.5" /> :
                     <XCircle className="w-4 h-4 text-danger-500 shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      <span className="text-sm">{e.detail}</span>
                      <span className="text-xs text-neutral-400 ml-2">({e.confidence}% confidence)</span>
                    </div>
                  </div>
                ))}
              </div>
            </ReportSection>

            {/* Section 9: Trust Score */}
            <ReportSection num={9} title="Trust Score" icon={ShieldCheck}>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <TrustRing score={scan.trustScore} size={100} />
                <div className="flex-1 w-full space-y-2">
                  <ScoreBar label="Packaging Match" value={scan.trustScoreBreakdown.packagingMatch} delay={0} />
                  <ScoreBar label="OCR Consistency" value={scan.trustScoreBreakdown.ocrConsistency} delay={100} />
                  <ScoreBar label="Barcode Validation" value={scan.trustScoreBreakdown.barcodeValidation} delay={200} />
                  <ScoreBar label="Manufacturer Match" value={scan.trustScoreBreakdown.manufacturerMatch} delay={300} />
                  <ScoreBar label="Batch Validation" value={scan.trustScoreBreakdown.batchValidation} delay={400} />
                  <ScoreBar label="Regulatory Evidence" value={scan.trustScoreBreakdown.regulatoryEvidence} delay={500} />
                </div>
              </div>
            </ReportSection>

            {/* Section 10: Evidence Graph */}
            <ReportSection num={10} title="Evidence Graph" icon={Network}>
              <EvidenceGraph nodes={scan.evidenceNodes} edges={scan.evidenceEdges} />
            </ReportSection>

            {/* Section 11: Regulatory */}
            <ReportSection num={11} title="Regulatory/Recall Information" icon={ShieldCheck}>
              <div className="space-y-2">
                {scan.regulatoryRecords.map((rec, i) => (
                  <div key={i} className="p-3 rounded-lg glass">
                    <p className="text-sm font-medium">{rec.source}: <span className={rec.status === 'registered' ? 'text-success-500' : 'text-danger-500'}>{rec.status}</span></p>
                    <p className="text-xs text-neutral-400">{rec.registrationNumber}</p>
                  </div>
                ))}
                <div className={`p-3 rounded-lg ${scan.recallInfo.hasRecall ? 'bg-danger-500/10' : 'bg-success-500/10'}`}>
                  <p className="text-sm">{scan.recallInfo.hasRecall ? 'Active recall found' : 'No active recalls'}</p>
                </div>
              </div>
            </ReportSection>

            {/* Section 12: Drug Safety */}
            <ReportSection num={12} title="Drug Safety Information" icon={HeartPulse}>
              <div className="space-y-3">
                <ReportField label="Uses" value={scan.uses} />
                <ReportField label="Contraindications" value={scan.contraindications} />
                <ReportField label="Side Effects" value={scan.sideEffects} />
                <ReportField label="Storage" value={scan.storageRequirements} />
                {scan.interactions.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-neutral-400 mb-2">Interactions:</p>
                    {scan.interactions.map((int, i) => (
                      <div key={i} className="p-2 rounded-lg bg-warning-500/5 mb-1">
                        <p className="text-sm">{int.severity}: {int.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ReportSection>

            {/* Section 13: AI Explanation */}
            <ReportSection num={13} title="AI Explanation" icon={BrainCircuit}>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">{scan.aiExplanation}</p>
            </ReportSection>

            {/* Section 14: Next Steps */}
            <ReportSection num={14} title="Recommended Next Steps" icon={CheckCircle2}>
              <div className="space-y-2">
                {scan.riskLevel === 'low' ? [
                  'Medicine appears authentic. Safe to use as directed.',
                  'Store according to storage requirements.',
                  'Consult pharmacist if you have questions about interactions.',
                ] : scan.riskLevel === 'moderate' ? [
                  'Verify with a licensed pharmacist before consuming.',
                  'Contact the manufacturer directly to verify batch number.',
                  'Check for QR code or anti-counterfeit features.',
                  'If in doubt, do not consume and return to point of purchase.',
                ] : [
                  'Do NOT consume this medicine.',
                  'Report to regulatory authorities immediately.',
                  'Retain packaging as evidence.',
                  'Seek genuine replacement from a licensed pharmacy.',
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary-500/10 text-primary-500 text-xs font-mono flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">{step}</p>
                  </div>
                ))}
              </div>
            </ReportSection>

            {/* Section 15: Sources */}
            <ReportSection num={15} title="Sources" icon={FileText} last>
              <div className="space-y-1.5">
                {['FDA (US) — NDC Database', 'CDSCO (India) — Drug Registry', 'GS1 Barcode Standards', 'OpenFDA API', 'RxNorm — NIH', 'Pharmaceutical Knowledge Database', 'Vision Agent — CLIP/SigLIP Reference', 'OCR Agent — Tesseract/PaddleOCR', 'RAG Vector Database', 'LLM Reasoning — Open-source model'].map((src, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                    {src}
                  </div>
                ))}
              </div>
            </ReportSection>

            {/* QR code footer */}
            <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <QrCode className="w-4 h-4 text-neutral-400" />
                  <span className="text-xs text-neutral-400">Scan to verify this report</span>
                </div>
                <p className="text-xs text-neutral-400 font-mono">{scan.id}</p>
              </div>
              <div className="grid grid-cols-8 gap-0.5">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-sm ${Math.random() > 0.5 ? 'bg-neutral-800 dark:bg-neutral-200' : 'bg-transparent'}`} />
                ))}
              </div>
            </div>

            <div className="p-4 bg-neutral-50 dark:bg-neutral-900 text-center">
              <p className="text-xs text-neutral-400">
                FakeMed AI — AI-assisted medicine intelligence platform. This report does not replace a doctor or pharmacist. Not for medical advice.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ReportSection({ num, title, icon: Icon, children, last }: { num: number; title: string; icon: typeof Pill; children: React.ReactNode; last?: boolean }) {
  return (
    <div className={`p-6 ${!last ? 'border-b border-neutral-200 dark:border-neutral-800' : ''}`}>
      <div className="flex items-center gap-2 mb-4">
        <span className="w-7 h-7 rounded-lg bg-primary-500/10 text-primary-500 text-xs font-mono flex items-center justify-center">{num}</span>
        <Icon className="w-4 h-4 text-primary-500" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ReportField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-4 py-1">
      <span className="text-xs text-neutral-400 shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}
