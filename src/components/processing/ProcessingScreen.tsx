import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, ScanText, Barcode, Pill, ShieldCheck, AlertTriangle,
  HeartPulse, Truck, Search, BrainCircuit, FileText,
  CheckCircle2, Loader2, Clock,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { agentDefinitions } from '@/data/mockData';
import { GlassCard } from '@/components/ui/GlassCard';
import type { AgentInfo, AgentStatus } from '@/types';

const iconMap: Record<string, typeof Eye> = {
  Eye, ScanText, Barcode, Pill, ShieldCheck, AlertTriangle,
  HeartPulse, Truck, Search, BrainCircuit, FileText,
};

const fallbackResults: Record<string, string> = {
  vision: 'Packaging layout analyzed.',
  ocr: 'Text fields extracted.',
  barcode: 'Barcode decoded.',
  pharma: 'Medicine identified.',
  regulatory: 'Regulatory check complete.',
  counterfeit: 'Counterfeit probability assessed.',
  safety: 'Safety check complete.',
  supply: 'Supply chain verified.',
  fraud: 'Fraud patterns checked.',
  llm: 'Cross-evidence reasoning complete.',
  report: 'Verification report generated.',
};

export function ProcessingScreen() {
  const { navigate, currentScan } = useApp();
  const [agents, setAgents] = useState<AgentInfo[]>(() =>
    agentDefinitions.map((a) => ({ ...a, status: 'pending' as AgentStatus }))
  );
  const [currentAgentIndex, setCurrentAgentIndex] = useState(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (!currentScan) {
      navigate('scan');
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];
    timersRef.current = timers;

    agentDefinitions.forEach((_, i) => {
      const delay = 300 + i * 600;
      const timer = setTimeout(() => {
        setCurrentAgentIndex(i);
        setAgents((prev) => prev.map((a, idx) => {
          if (idx === i) return { ...a, status: 'processing' };
          return a;
        }));

        const resultTimer = setTimeout(() => {
          setAgents((prev) => prev.map((a, idx) => {
            if (idx === i) {
              const scanAgent = currentScan?.agents.find(sa => sa.id === a.id);
              return {
                ...a,
                status: 'complete',
                result: scanAgent?.result || fallbackResults[a.id] || 'Complete',
                duration: scanAgent?.duration || Math.round(200 + Math.random() * 1800),
              };
            }
            return a;
          }));

          if (i === agentDefinitions.length - 1) {
            const navTimer = setTimeout(() => navigate('result'), 1000);
            timers.push(navTimer);
          }
        }, 500 + Math.random() * 800);
        timers.push(resultTimer);
      }, delay);
      timers.push(timer);
    });

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [currentScan, navigate]);

  const completedCount = agents.filter(a => a.status === 'complete').length;
  const progress = (completedCount / agents.length) * 100;

  return (
    <div className="min-h-screen pt-20 pb-12 grid-bg flex items-center justify-center">
      <div className="max-w-3xl w-full px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-4 text-xs font-mono text-primary-500">
            <BrainCircuit className="w-3.5 h-3.5 animate-pulse" />
            AI Agent Pipeline Active
          </div>
          <h1 className="font-display text-3xl font-bold mb-2">Analyzing Medicine</h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            {currentScan?.medicineName} — {completedCount} of {agents.length} agents complete
          </p>
        </motion.div>

        {/* Progress bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-8">
          <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary-500 via-accent-500 to-primary-600"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-neutral-400 font-mono">
            <span>{Math.round(progress)}% Complete</span>
            <span>{completedCount}/{agents.length} Agents</span>
          </div>
        </motion.div>

        {/* Agent list */}
        <div className="space-y-2">
          {agents.map((agent, i) => {
            const Icon = iconMap[agent.icon] || Eye;
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div
                  className={`glass-card p-4 flex items-center gap-4 transition-all ${
                    agent.status === 'processing' ? 'ring-2 ring-primary-500/50 shadow-lg shadow-primary-500/10' :
                    agent.status === 'complete' ? '' : 'opacity-50'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    agent.status === 'complete' ? 'bg-success-500/10' :
                    agent.status === 'processing' ? 'bg-primary-500/10' : 'bg-neutral-500/10'
                  }`}>
                    {agent.status === 'complete' ? (
                      <CheckCircle2 className="w-5 h-5 text-success-500" />
                    ) : agent.status === 'processing' ? (
                      <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                    ) : (
                      <Icon className="w-5 h-5 text-neutral-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`font-medium text-sm ${agent.status === 'pending' ? 'text-neutral-400' : ''}`}>
                        {agent.name}
                      </p>
                      <AnimatePresence>
                        {agent.duration && (
                          <motion.span
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-xs text-neutral-400 font-mono flex items-center gap-1"
                          >
                            <Clock className="w-3 h-3" />
                            {(agent.duration / 1000).toFixed(1)}s
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    <AnimatePresence>
                      {agent.result && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 truncate"
                        >
                          {agent.result}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="text-xs font-mono uppercase tracking-wider shrink-0">
                    {agent.status === 'complete' && <span className="text-success-500">✓ Complete</span>}
                    {agent.status === 'processing' && <span className="text-primary-500">● Processing</span>}
                    {agent.status === 'pending' && <span className="text-neutral-400">○ Pending</span>}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Pipeline visualization */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8">
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BrainCircuit className="w-4 h-4 text-primary-500" />
              <span className="text-sm font-semibold">AI Pipeline</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Image', 'Vision', 'OCR', 'Barcode', 'Pharma DB', 'Regulatory', 'Risk Engine', 'Safety', 'RAG', 'LLM', 'Report'].map((step, i) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0.3 }}
                  animate={{
                    opacity: i <= currentAgentIndex ? 1 : 0.3,
                    scale: i === currentAgentIndex ? 1.05 : 1,
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono ${
                    i < currentAgentIndex ? 'bg-success-500/10 text-success-600 dark:text-success-400' :
                    i === currentAgentIndex ? 'bg-primary-500/20 text-primary-600 dark:text-primary-400' :
                    'glass text-neutral-400'
                  }`}
                >
                  {step}
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
