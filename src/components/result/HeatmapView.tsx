import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, AlertCircle, Scan, MapPin } from 'lucide-react';
import type { HeatmapRegion } from '@/types';

interface HeatmapViewProps {
  regions: HeatmapRegion[];
}

const severityConfig: Record<string, {
  overlay: string;
  border: string;
  glow: string;
  label: string;
  icon: typeof CheckCircle2;
  dot: string;
  text: string;
}> = {
  normal: {
    overlay: 'bg-success-500/15',
    border: 'border-success-500/50',
    glow: '',
    label: 'Normal',
    icon: CheckCircle2,
    dot: 'bg-success-500',
    text: 'text-success-600 dark:text-success-400',
  },
  suspicious: {
    overlay: 'bg-warning-500/20',
    border: 'border-warning-500/60',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    label: 'Suspicious',
    icon: AlertCircle,
    dot: 'bg-warning-500',
    text: 'text-warning-600 dark:text-warning-400',
  },
  anomaly: {
    overlay: 'bg-danger-500/25',
    border: 'border-danger-500/70',
    glow: 'shadow-[0_0_25px_rgba(239,68,68,0.4)]',
    label: 'Anomaly',
    icon: AlertTriangle,
    dot: 'bg-danger-500',
    text: 'text-danger-600 dark:text-danger-400',
  },
};

export function HeatmapView({ regions }: HeatmapViewProps) {
  const [hovered, setHovered] = useState<HeatmapRegion | null>(null);
  const [selected, setSelected] = useState<HeatmapRegion | null>(null);

  const activeRegion = hovered || selected;
  const anomalyCount = regions.filter(r => r.severity === 'anomaly').length;
  const suspiciousCount = regions.filter(r => r.severity === 'suspicious').length;

  return (
    <div>
      {/* Summary banner */}
      <div className={`flex items-center gap-3 p-3 rounded-xl mb-4 ${
        anomalyCount > 0 ? 'bg-danger-500/10 border border-danger-500/30' :
        suspiciousCount > 0 ? 'bg-warning-500/10 border border-warning-500/30' :
        'bg-success-500/10 border border-success-500/30'
      }`}>
        {anomalyCount > 0 ? <AlertTriangle className="w-5 h-5 text-danger-500 shrink-0" /> :
         suspiciousCount > 0 ? <AlertCircle className="w-5 h-5 text-warning-500 shrink-0" /> :
         <CheckCircle2 className="w-5 h-5 text-success-500 shrink-0" />}
        <p className="text-sm font-medium">
          {anomalyCount > 0 ? `${anomalyCount} anomal${anomalyCount > 1 ? 'ies' : 'y'} detected` :
           suspiciousCount > 0 ? `${suspiciousCount} suspicious area${suspiciousCount > 1 ? 's' : ''} found` :
           'No anomalies detected — packaging looks normal'}
        </p>
      </div>

      {/* Main heatmap area */}
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-4 border border-neutral-200 dark:border-neutral-700">
        {/* Realistic medicine package mockup */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-neutral-800 dark:to-neutral-850">
          {/* Package body — looks like a real medicine box */}
          <div className="absolute inset-4 rounded-lg shadow-xl overflow-hidden bg-white dark:bg-neutral-100">
            {/* Top brand strip */}
            <div className="h-12 bg-gradient-to-r from-primary-700 to-primary-600 flex items-center px-3 gap-2">
              <div className="w-8 h-8 rounded-md bg-white/25 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 2v6m0 0l3-3m-3 3L9 5" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="4" y="8" width="16" height="14" rx="2" />
                </svg>
              </div>
              <div>
                <div className="h-2.5 w-20 rounded bg-white/70" />
                <div className="h-1.5 w-14 rounded bg-white/40 mt-1" />
              </div>
              <div className="ml-auto h-2 w-10 rounded bg-white/30" />
            </div>

            {/* Medicine name area */}
            <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-300">
              <div className="h-3 w-3/4 rounded bg-neutral-800 dark:bg-neutral-700" />
              <div className="h-2 w-1/2 rounded bg-neutral-400 dark:bg-neutral-500 mt-1.5" />
            </div>

            {/* Content area with text lines */}
            <div className="px-3 py-2 space-y-1.5">
              <div className="flex gap-2 items-center">
                <div className="h-1.5 w-16 rounded bg-neutral-300 dark:bg-neutral-400" />
                <div className="h-2 w-24 rounded bg-neutral-700 dark:bg-neutral-600" />
              </div>
              <div className="flex gap-2 items-center">
                <div className="h-1.5 w-12 rounded bg-neutral-300 dark:bg-neutral-400" />
                <div className="h-2 w-20 rounded bg-neutral-700 dark:bg-neutral-600" />
              </div>
              <div className="flex gap-2 items-center">
                <div className="h-1.5 w-14 rounded bg-neutral-300 dark:bg-neutral-400" />
                <div className="h-2 w-28 rounded bg-neutral-700 dark:bg-neutral-600" />
              </div>
            </div>

            {/* Batch & expiry row */}
            <div className="px-3 py-1.5 flex gap-3 border-t border-neutral-200 dark:border-neutral-300">
              <div className="flex-1">
                <div className="h-1.5 w-10 rounded bg-neutral-300 dark:bg-neutral-400 mb-1" />
                <div className="h-2 w-16 rounded bg-neutral-700 dark:bg-neutral-600" />
              </div>
              <div className="flex-1">
                <div className="h-1.5 w-8 rounded bg-neutral-300 dark:bg-neutral-400 mb-1" />
                <div className="h-2 w-14 rounded bg-neutral-700 dark:bg-neutral-600" />
              </div>
            </div>

            {/* Barcode strip at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-white dark:bg-neutral-50 flex items-center px-3 gap-1 border-t border-neutral-200 dark:border-neutral-300">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-neutral-900 dark:bg-neutral-800"
                  style={{
                    width: i % 4 === 0 ? '2px' : i % 3 === 0 ? '1px' : '1.5px',
                    height: i % 5 === 0 ? '28px' : '24px',
                    opacity: i % 7 === 0 ? 0.3 : i % 3 === 0 ? 0.9 : 0.7,
                  }}
                />
              ))}
              <div className="ml-auto h-1.5 w-12 rounded bg-neutral-300 dark:bg-neutral-400" />
            </div>

            {/* QR code area top-right */}
            <div className="absolute top-14 right-3 w-12 h-12 rounded-md bg-neutral-900 dark:bg-neutral-800 p-1">
              <div className="grid grid-cols-5 gap-px h-full">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div key={i} className={`rounded-sm ${[0,1,2,5,6,10,11,15,16,20,21,22,4,9,14,19,24].includes(i) ? 'bg-white' : 'bg-neutral-900 dark:bg-neutral-800'}`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Heatmap overlay regions */}
        {regions.map((region, i) => {
          const cfg = severityConfig[region.severity];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={region.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              onMouseEnter={() => setHovered(region)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setSelected(selected?.id === region.id ? null : region)}
              className={`absolute rounded-lg border-2 ${cfg.overlay} ${cfg.border} ${cfg.glow} cursor-pointer transition-all hover:scale-105 hover:z-10`}
              style={{
                left: `${region.x}%`,
                top: `${region.y}%`,
                width: `${region.width}%`,
                height: `${region.height}%`,
              }}
            >
              {region.severity === 'anomaly' && (
                <div className="absolute inset-0 rounded-lg animate-pulse" style={{ boxShadow: '0 0 20px rgba(239,68,68,0.3)' }} />
              )}
              {/* Label tag on the region */}
              <div className={`absolute -top-5 left-0 flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${cfg.text} bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm whitespace-nowrap`}>
                <Icon className="w-2.5 h-2.5" />
                {region.label}
              </div>
            </motion.div>
          );
        })}

        {/* Animated scan line effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary-500/60 to-transparent"
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* HUD label */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 glass-strong rounded-md px-2 py-1">
          <Scan className="w-3 h-3 text-primary-500" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-600 dark:text-neutral-300">AI Visual Analysis</span>
        </div>

        {/* Detail tooltip */}
        <AnimatePresence>
          {activeRegion && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-2 left-2 right-2 glass-strong rounded-xl p-3.5"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-primary-500" />
                  <span className="font-semibold text-sm">{activeRegion.label}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${severityConfig[activeRegion.severity].overlay} ${severityConfig[activeRegion.severity].border} border ${severityConfig[activeRegion.severity].text}`}>
                  {severityConfig[activeRegion.severity].label}
                </span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300">{activeRegion.note}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-3 rounded-lg glass">
        <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Legend:</span>
        {Object.entries(severityConfig).map(([key, val]) => {
          const Icon = val.icon;
          return (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-4 h-4 rounded border-2 ${val.overlay} ${val.border}`} />
              <Icon className={`w-3.5 h-3.5 ${val.text}`} />
              <span className="text-xs text-neutral-600 dark:text-neutral-400">{val.label}</span>
            </div>
          );
        })}
        <div className="ml-auto text-xs text-neutral-400">Tap a region for details</div>
      </div>

      {/* Region list with severity indicators */}
      <div className="space-y-2">
        {regions.map((region, i) => {
          const cfg = severityConfig[region.severity];
          const Icon = cfg.icon;
          return (
            <motion.div
              key={region.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelected(selected?.id === region.id ? null : region)}
              className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                selected?.id === region.id ? 'glass-strong ring-1 ring-primary-500/30' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/30'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg ${cfg.overlay} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${cfg.text}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium">{region.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${cfg.overlay} ${cfg.text} font-medium`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{region.note}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
