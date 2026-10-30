import { motion } from 'framer-motion';
import {
  Scan, Upload, Eye, ScanText, Barcode, Pill, ShieldCheck, AlertTriangle,
  HeartPulse, Truck, Search, BrainCircuit, FileText, Package, MessageSquare,
  Fingerprint, Network, GitCompare, MapPin, Layers, ArrowRight, CheckCircle2,
  AlertCircle, XCircle, Sparkles, Activity, Globe, Lock,
} from 'lucide-react';
import { Hero3D } from './Hero3D';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';

const agents = [
  { icon: Eye, name: 'Vision Agent', desc: 'Analyzes packaging, detects logo, typography, layout anomalies' },
  { icon: ScanText, name: 'OCR Agent', desc: 'Extracts text: name, manufacturer, batch, dates, composition' },
  { icon: Barcode, name: 'Barcode/QR Agent', desc: 'Decodes barcode/QR, validates structure, cross-references' },
  { icon: Pill, name: 'Pharmaceutical Knowledge Agent', desc: 'Retrieves drug info from trusted databases' },
  { icon: ShieldCheck, name: 'Regulatory Agent', desc: 'Checks FDA, EMA, CDSCO registration and recalls' },
  { icon: AlertTriangle, name: 'Counterfeit Detection Agent', desc: 'Computes counterfeit probability from all signals' },
  { icon: HeartPulse, name: 'Drug Safety Agent', desc: 'Analyzes interactions, contraindications, duplicates' },
  { icon: Truck, name: 'Supply Chain Agent', desc: 'Verifies manufacturer, distributor, batch traceability' },
  { icon: Search, name: 'Fraud Intelligence Agent', desc: 'Detects patterns across scans, suspicious batches' },
  { icon: BrainCircuit, name: 'LLM Reasoning Agent', desc: 'Multimodal reasoning across all evidence with RAG' },
  { icon: FileText, name: 'Report Agent', desc: 'Generates understandable verification report' },
];

const pipeline = [
  { label: 'Image', icon: Scan },
  { label: 'Quality Check', icon: Activity },
  { label: 'OCR', icon: ScanText },
  { label: 'Barcode/QR', icon: Barcode },
  { label: 'Structured Data', icon: Layers },
  { label: 'Database Lookup', icon: Pill },
  { label: 'Vector Search', icon: Search },
  { label: 'Multi-Agent Analysis', icon: BrainCircuit },
  { label: 'Risk Engine', icon: AlertTriangle },
  { label: 'Safety Engine', icon: HeartPulse },
  { label: 'RAG + LLM', icon: Sparkles },
  { label: 'Explainable Result', icon: FileText },
];

const uniqueFeatures = [
  { icon: Fingerprint, title: 'Digital Medicine Passport', desc: 'Every verified medicine receives a futuristic animated passport with identity, batch, verification history, and AI confidence.' },
  { icon: ShieldCheck, title: 'Explainable Trust Score', desc: 'Animated radial breakdown: packaging match, OCR consistency, barcode validation, manufacturer match, batch, regulatory evidence.' },
  { icon: Network, title: 'AI Evidence Graph', desc: 'Interactive graph connecting manufacturer, batch, barcode, ingredients, regulatory records, and AI analysis nodes.' },
  { icon: GitCompare, title: 'What Changed?', desc: 'Compare scans of the same medicine. Detect packaging, batch, MRP, expiry, and barcode changes with visual diff.' },
  { icon: Layers, title: 'Medicine Twin', desc: 'A 3D digital representation of the scanned medicine with packaging characteristics and verification evidence.' },
  { icon: MapPin, title: 'Counterfeit Heatmap', desc: 'Visual AI heatmap highlighting suspicious regions: logo, typography, seal, batch, barcode, expiry.' },
  { icon: Scan, title: 'Smart Scan HUD', desc: 'Live detection interface: package detected, text detected, barcode detected — evidence sufficient for analysis.' },
  { icon: Package, title: 'Pharmacy Mode', desc: 'Batch scanning, bulk verification, CSV upload, suspicious batch dashboard, analytics, and export reports.' },
];

const aiExplanation = [
  { icon: CheckCircle2, text: 'Barcode structure matches', type: 'pass' },
  { icon: CheckCircle2, text: 'Manufacturer information appears consistent', type: 'pass' },
  { icon: AlertCircle, text: 'Batch information could not be independently verified', type: 'warning' },
  { icon: AlertCircle, text: 'Packaging typography differs from reference samples', type: 'warning' },
  { icon: AlertCircle, text: 'Expiry information has low OCR confidence', type: 'warning' },
];

export function LandingPage() {
  const { navigate } = useApp();

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center grid-bg pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-neutral-50 dark:to-neutral-950 pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-6 text-xs font-mono text-primary-600 dark:text-primary-400">
                <Sparkles className="w-3.5 h-3.5" />
                AI-Powered Medicine Intelligence Platform
              </div>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-4">
                FakeMed <span className="text-gradient">AI</span>
              </h1>
              <p className="text-xl sm:text-2xl text-neutral-600 dark:text-neutral-300 font-medium mb-3">
                AI-powered medicine intelligence.
              </p>
              <p className="text-lg text-neutral-500 dark:text-neutral-400 mb-8 max-w-lg mx-auto lg:mx-0">
                Verify. Understand. Protect. An AI agentic medicine verification ecosystem — not just a barcode scanner.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Button size="lg" icon={<Scan className="w-5 h-5" />} onClick={() => navigate('scan')}>
                  Scan Medicine
                </Button>
                <Button size="lg" variant="secondary" icon={<Upload className="w-5 h-5" />} onClick={() => navigate('dashboard')}>
                  Upload Package
                </Button>
              </div>
              <div className="flex items-center gap-6 mt-8 justify-center lg:justify-start text-sm text-neutral-500 dark:text-neutral-400">
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-success-500" />11 AI Agents</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary-500" />RAG Architecture</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-accent-500" />Multi-modal</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="h-[500px] relative"
            >
              <Hero3D />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader tag="The Problem" title="Counterfeit medicines are a global crisis" subtitle="Millions of fake medicines enter the supply chain every year. Patients can't tell the difference — until it's too late." />
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {[
              { stat: '1 in 10', label: 'medicines in low-income countries is substandard or falsified', icon: AlertCircle },
              { stat: '$200B+', label: 'annual market for counterfeit pharmaceuticals worldwide', icon: Globe },
              { stat: '250K+', label: 'deaths linked to fake medicines annually', icon: AlertTriangle },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}>
                <GlassCard className="p-8 text-center" hover>
                  <item.icon className="w-10 h-10 mx-auto mb-4 text-danger-500" />
                  <p className="text-4xl font-display font-bold text-danger-500 mb-2">{item.stat}</p>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{item.label}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 relative grid-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader tag="The Solution" title="An AI evidence chain, not a single scan" subtitle="FakeMed AI combines computer vision, OCR, barcode verification, pharmaceutical knowledge, regulatory data, RAG, and multi-agent LLM reasoning into one explainable platform." />
          <div className="grid md:grid-cols-2 gap-6 mt-12">
            {[
              { icon: Scan, title: 'Multi-Input Verification', desc: 'Scan with camera, upload images, scan barcode/QR, enter batch manually, upload prescriptions or invoices. The AI combines all available evidence.' },
              { icon: BrainCircuit, title: 'Multi-Agent Architecture', desc: '11 specialized AI agents work together: Vision, OCR, Barcode, Pharma Knowledge, Regulatory, Counterfeit Detection, Safety, Supply Chain, Fraud Intel, LLM Reasoning, and Report.' },
              { icon: Sparkles, title: 'RAG + LLM Reasoning', desc: 'Retrieval-augmented generation prioritizes trusted evidence over hallucination. The LLM explains why a medicine received its risk score.' },
              { icon: ShieldCheck, title: 'Explainable Results', desc: 'Never claims absolute authenticity. Presents AI-assisted risk assessment with confidence scores, source attribution, and recommended next steps.' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <GlassCard className="p-6 flex gap-4" hover>
                  <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-6 h-6 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{item.desc}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How AI Works — Pipeline */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader tag="How AI Works" title="The verification pipeline" subtitle="From image to explainable result — every step is transparent and auditable." />
          <div className="mt-12 overflow-x-auto no-scrollbar">
            <div className="flex gap-3 min-w-max pb-4">
              {pipeline.map((step, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3">
                  <GlassCard className="p-4 text-center min-w-[130px]">
                    <step.icon className="w-6 h-6 mx-auto mb-2 text-primary-500" />
                    <p className="text-xs font-medium">{step.label}</p>
                  </GlassCard>
                  {i < pipeline.length - 1 && <ArrowRight className="w-4 h-4 text-neutral-400 shrink-0" />}
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Agent Architecture */}
      <section className="py-24 relative grid-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader tag="Multi-Agent Architecture" title="11 specialized AI agents" subtitle="Each agent is modular and independently replaceable. They work together to build a complete evidence chain." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
            {agents.map((agent, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 3) * 0.1 }}>
                <GlassCard className="p-5 flex gap-4" hover>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500/15 to-accent-500/15 flex items-center justify-center shrink-0">
                    <agent.icon className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{agent.name}</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{agent.desc}</p>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Unique Features Grid */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader tag="Unique Features" title="Beyond a simple scanner" subtitle="Features that make FakeMed AI a medicine intelligence ecosystem." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
            {uniqueFeatures.map((feat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 4) * 0.1 }}>
                <GlassCard className="p-6 h-full" hover>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/15 to-accent-500/15 flex items-center justify-center mb-4">
                    <feat.icon className="w-6 h-6 text-primary-500" />
                  </div>
                  <h3 className="font-semibold mb-2">{feat.title}</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">{feat.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Explanation Mode Preview */}
      <section className="py-24 relative grid-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader tag="AI Explanation Mode" title="Explainable, not just a verdict" subtitle="Instead of 'Medicine is fake,' FakeMed AI shows exactly which signals increased or reduced risk." />
          <div className="grid md:grid-cols-2 gap-8 mt-12 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <GlassCard className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BrainCircuit className="w-5 h-5 text-primary-500" />
                  <span className="font-semibold text-sm font-mono uppercase tracking-wider">AI Assessment</span>
                </div>
                <p className="text-lg font-medium mb-4 text-warning-600 dark:text-warning-400">Potential authenticity concern detected.</p>
                <div className="space-y-2.5">
                  {aiExplanation.map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="flex items-start gap-3">
                      <item.icon className={`w-5 h-5 shrink-0 mt-0.5 ${item.type === 'pass' ? 'text-success-500' : 'text-warning-500'}`} />
                      <span className="text-sm text-neutral-600 dark:text-neutral-300">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <p className="text-sm font-semibold">Overall assessment: <span className="text-warning-600 dark:text-warning-400">MODERATE RISK</span></p>
                </div>
              </GlassCard>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-4">
              {[
                { icon: Network, title: 'Evidence Graph', desc: 'Interactive nodes connect every piece of evidence to the medicine. Click any node to see what the AI found.' },
                { icon: Fingerprint, title: 'Digital Passport', desc: 'Every verified medicine gets an animated passport card with identity, batch, verification history, and AI confidence.' },
                { icon: MessageSquare, title: 'MediLens AI Assistant', desc: 'Ask questions about your scanned medicine. Get answers with citations from retrieved evidence — never fabricated.' },
              ].map((item, i) => (
                <GlassCard key={i} className="p-5 flex gap-4" hover>
                  <div className="w-10 h-10 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-primary-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.desc}</p>
                  </div>
                </GlassCard>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Security & Privacy */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader tag="Security & Privacy" title="Built with trust and safety" subtitle="Secure authentication, encrypted storage, no API keys in frontend, privacy-conscious scan history, and user data deletion." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
            {[
              { icon: Lock, title: 'Encrypted Storage', desc: 'All scan data encrypted at rest and in transit' },
              { icon: ShieldCheck, title: 'Rate Limited', desc: 'Input validation, file type checks, image size limits' },
              { icon: Activity, title: 'Audit Logs', desc: 'Every action logged for accountability' },
              { icon: Globe, title: 'No Keys Exposed', desc: 'API keys never in frontend. Server-side only.' },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <GlassCard className="p-5" hover>
                  <item.icon className="w-8 h-8 text-primary-500 mb-3" />
                  <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.desc}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact / CTA */}
      <section className="py-24 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
            <h2 className="font-display text-4xl sm:text-5xl font-bold mb-4">
              Know your medicine. <span className="text-gradient">Verify before you trust.</span>
            </h2>
            <p className="text-lg text-neutral-500 dark:text-neutral-400 mb-8 max-w-2xl mx-auto">
              FakeMed AI creates an AI-powered evidence chain connecting vision, OCR, barcode, pharmaceutical knowledge, regulatory data, supply-chain data, RAG, multi-agent AI, and LLM reasoning into one explainable platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" icon={<Scan className="w-5 h-5" />} onClick={() => navigate('scan')}>
                Try Demo Mode
              </Button>
              <Button size="lg" variant="secondary" icon={<LayoutDashboardIcon />} onClick={() => navigate('dashboard')}>
                View Dashboard
              </Button>
            </div>
            <p className="text-xs text-neutral-400 mt-4">Demo mode works without API keys. No real medicines are analyzed.</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold">FakeMed AI</span>
            </div>
            <p className="text-xs text-neutral-400 text-center">
              AI-assisted medicine intelligence platform. This system is an informational safety assistant and does not replace a doctor or pharmacist. Not for medical advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHeader({ tag, title, subtitle }: { tag: string; title: string; subtitle: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center max-w-2xl mx-auto">
      <span className="text-xs font-mono uppercase tracking-widest text-primary-500 font-semibold">{tag}</span>
      <h2 className="font-display text-3xl sm:text-4xl font-bold mt-2 mb-3">{title}</h2>
      <p className="text-neutral-500 dark:text-neutral-400">{subtitle}</p>
    </motion.div>
  );
}

function LayoutDashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}
