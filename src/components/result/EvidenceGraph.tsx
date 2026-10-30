import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { EvidenceNode, EvidenceEdge } from '@/types';

interface EvidenceGraphProps {
  nodes: EvidenceNode[];
  edges: EvidenceEdge[];
}

const statusColors: Record<string, { bg: string; border: string; text: string }> = {
  pass: { bg: 'bg-success-500/10', border: 'border-success-500/30', text: 'text-success-600 dark:text-success-400' },
  warning: { bg: 'bg-warning-500/10', border: 'border-warning-500/30', text: 'text-warning-600 dark:text-warning-400' },
  fail: { bg: 'bg-danger-500/10', border: 'border-danger-500/30', text: 'text-danger-600 dark:text-danger-400' },
  info: { bg: 'bg-primary-500/10', border: 'border-primary-500/30', text: 'text-primary-600 dark:text-primary-400' },
};

export function EvidenceGraph({ nodes, edges }: EvidenceGraphProps) {
  const [selected, setSelected] = useState<EvidenceNode | null>(null);

  const positions: Record<string, { x: number; y: number }> = {
    medicine: { x: 50, y: 50 },
    manufacturer: { x: 15, y: 20 },
    batch: { x: 85, y: 20 },
    barcode: { x: 15, y: 50 },
    ingredients: { x: 85, y: 50 },
    regulatory: { x: 15, y: 80 },
    packaging: { x: 50, y: 15 },
    ocr: { x: 50, y: 85 },
    risk: { x: 85, y: 80 },
  };

  return (
    <div className="relative h-[400px] rounded-xl bg-neutral-50 dark:bg-neutral-900/50 overflow-hidden">
      {/* Edges */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {edges.map((edge, i) => {
          const from = positions[edge.from];
          const to = positions[edge.to];
          if (!from || !to) return null;
          const color = edge.strength >= 0.75 ? 'rgba(16,185,129,0.3)' : edge.strength >= 0.4 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)';
          return (
            <line
              key={i}
              x1={`${from.x}%`}
              y1={`${from.y}%`}
              x2={`${to.x}%`}
              y2={`${to.y}%`}
              stroke={color}
              strokeWidth={Math.max(1, edge.strength * 4)}
              strokeDasharray="6 4"
            >
              <animate attributeName="stroke-dashoffset" from="0" to="-20" dur="2s" repeatCount="indefinite" />
            </line>
          );
        })}
      </svg>

      {/* Nodes */}
      {nodes.map((node, i) => {
        const pos = positions[node.id];
        if (!pos) return null;
        const colors = statusColors[node.status] || statusColors.info;
        const isCore = node.type === 'core';
        const isRisk = node.type === 'risk';

        return (
          <motion.button
            key={node.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => setSelected(node)}
            className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border ${colors.border} ${colors.bg} ${colors.text} transition-all hover:scale-110 hover:shadow-lg ${
              isCore ? 'w-24 h-24 z-10' : isRisk ? 'w-20 h-20 z-10' : 'w-16 h-16'
            } flex flex-col items-center justify-center p-2 text-center`}
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <span className={`font-medium ${isCore ? 'text-xs' : 'text-[10px]'} leading-tight`}>{node.label}</span>
          </motion.button>
        );
      })}

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-3 left-3 right-3 glass-strong rounded-xl p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className={`text-xs font-mono uppercase tracking-wider ${statusColors[selected.status]?.text}`}>{selected.type}</span>
                <h4 className="font-semibold">{selected.label}</h4>
              </div>
              <button onClick={() => setSelected(null)} className="text-neutral-400 hover:text-neutral-600 text-sm">✕</button>
            </div>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2">{selected.detail}</p>
            {selected.evidence && (
              <div className="space-y-1">
                <p className="text-xs font-mono text-neutral-400 uppercase">Evidence:</p>
                {selected.evidence.map((e, i) => (
                  <p key={i} className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-primary-500" />
                    {e}
                  </p>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="absolute top-3 left-3 text-xs text-neutral-400">Click any node to see evidence</p>
    </div>
  );
}
