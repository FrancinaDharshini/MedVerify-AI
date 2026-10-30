import { motion } from 'framer-motion';
import {
  Scan, Upload, TrendingUp, TrendingDown, ShieldCheck, AlertTriangle,
  Package, Activity, ArrowRight, Clock, BarChart3, Map,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/Badge';
import { dashboardStats, recentScans } from '@/data/mockData';
import type { MedicineScan } from '@/types';

export function Dashboard() {
  const { navigate, setCurrentScan } = useApp();

  const stats = [
    { label: 'Total Scans', value: dashboardStats.totalScans.toLocaleString(), trend: dashboardStats.scansTrend, icon: Activity, color: 'primary' },
    { label: 'Verified', value: dashboardStats.verified.toLocaleString(), trend: dashboardStats.verifiedTrend, icon: ShieldCheck, color: 'success' },
    { label: 'Potential Risks', value: dashboardStats.potentialRisks.toLocaleString(), trend: dashboardStats.riskTrend, icon: AlertTriangle, color: 'warning' },
    { label: 'Medicines Tracked', value: dashboardStats.medicinesTracked.toLocaleString(), trend: dashboardStats.trackedTrend, icon: Package, color: 'accent' },
  ];

  const openScan = (scan: MedicineScan) => {
    setCurrentScan(scan);
    navigate('result');
  };

  return (
    <div className="min-h-screen pt-20 pb-12 grid-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">Know your medicine. <span className="text-gradient">Verify before you trust.</span></h1>
          <p className="text-neutral-500 dark:text-neutral-400">AI-powered medicine intelligence dashboard</p>
        </motion.div>

        {/* Action buttons */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row gap-3 mb-8">
          <Button size="lg" icon={<Scan className="w-5 h-5" />} onClick={() => navigate('scan')}>
            Scan Medicine
          </Button>
          <Button size="lg" variant="secondary" icon={<Upload className="w-5 h-5" />} onClick={() => navigate('scan')}>
            Upload Package
          </Button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}>
              <GlassCard className="p-5" hover>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center`}>
                    <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${stat.trend > 0 ? 'text-success-500' : 'text-danger-500'}`}>
                    {stat.trend > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {Math.abs(stat.trend)}%
                  </div>
                </div>
                <p className="text-2xl font-display font-bold">{stat.value}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{stat.label}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Main visual: Medicine Intelligence Map */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-8">
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Map className="w-5 h-5 text-primary-500" />
              <h2 className="font-semibold">Interactive Medicine Intelligence Map</h2>
            </div>
            <IntelligenceMap onScanClick={openScan} />
          </GlassCard>
        </motion.div>

        {/* Recent Scans */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-500" />
              <h2 className="font-semibold">Recent Scans</h2>
            </div>
            <button className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <GlassCard className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    <th className="text-left p-4 font-medium">Medicine</th>
                    <th className="text-left p-4 font-medium hidden sm:table-cell">Status</th>
                    <th className="text-left p-4 font-medium">Trust Score</th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">Date</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentScans.map((scan, i) => (
                    <motion.tr
                      key={scan.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 + i * 0.05 }}
                      className="border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 cursor-pointer transition-colors"
                      onClick={() => openScan(scan)}
                    >
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-sm">{scan.medicineName}</p>
                          <p className="text-xs text-neutral-400">{scan.manufacturer}</p>
                        </div>
                      </td>
                      <td className="p-4 hidden sm:table-cell"><StatusBadge status={scan.status} /></td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                scan.trustScore >= 75 ? 'bg-success-500' : scan.trustScore >= 50 ? 'bg-warning-500' : 'bg-danger-500'
                              }`}
                              style={{ width: `${scan.trustScore}%` }}
                            />
                          </div>
                          <span className="text-sm font-mono font-semibold">{scan.trustScore}</span>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell text-sm text-neutral-500 dark:text-neutral-400">
                        {new Date(scan.scanTimestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-4 text-right">
                        <ArrowRight className="w-4 h-4 text-neutral-400 inline" />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </motion.div>

        {/* Analytics mini cards */}
        <div className="grid md:grid-cols-2 gap-4 mt-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-primary-500" />
                <h3 className="font-semibold">Risk Distribution</h3>
              </div>
              <RiskDistribution />
            </GlassCard>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <GlassCard className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-accent-500" />
                <h3 className="font-semibold">Scan Activity (7 days)</h3>
              </div>
              <ScanActivity />
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function IntelligenceMap({ onScanClick }: { onScanClick: (scan: MedicineScan) => void }) {
  const nodes = [
    { id: 'center', label: 'FakeMed AI', x: 50, y: 50, isCore: true },
    { id: 'vision', label: 'Vision', x: 20, y: 20 },
    { id: 'ocr', label: 'OCR', x: 80, y: 20 },
    { id: 'barcode', label: 'Barcode', x: 15, y: 50 },
    { id: 'pharma', label: 'Pharma DB', x: 85, y: 50 },
    { id: 'regulatory', label: 'Regulatory', x: 20, y: 80 },
    { id: 'safety', label: 'Safety', x: 80, y: 80 },
    { id: 'counterfeit', label: 'Counterfeit', x: 50, y: 15 },
    { id: 'llm', label: 'LLM', x: 50, y: 85 },
  ];

  return (
    <div className="relative h-72 sm:h-80 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 overflow-hidden">
      <svg className="absolute inset-0 w-full h-full">
        {nodes.filter(n => !n.isCore).map((node) => (
          <line
            key={node.id}
            x1="50%"
            y1="50%"
            x2={`${node.x}%`}
            y2={`${node.y}%`}
            stroke="rgba(51,128,252,0.15)"
            strokeWidth="1"
            strokeDasharray="4 4"
          >
            <animate attributeName="stroke-dashoffset" from="0" to="-16" dur="2s" repeatCount="indefinite" />
          </line>
        ))}
      </svg>
      {nodes.map((node) => (
        <motion.div
          key={node.id}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 + nodes.indexOf(node) * 0.05 }}
          className={`absolute -translate-x-1/2 -translate-y-1/2 ${node.isCore ? 'z-10' : ''}`}
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
        >
          <div
            className={`rounded-xl flex items-center justify-center font-medium text-xs ${
              node.isCore
                ? 'w-20 h-20 bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-xl shadow-primary-500/30 glow-primary'
                : 'w-14 h-14 glass-strong'
            }`}
            style={node.isCore ? {} : { animation: 'float 4s ease-in-out infinite' }}
          >
            {node.label}
          </div>
        </motion.div>
      ))}
      {recentScans.slice(0, 3).map((scan, i) => (
        <motion.button
          key={scan.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 + i * 0.2 }}
          onClick={() => onScanClick(scan)}
          className="absolute bottom-3 left-3 glass-strong rounded-lg px-3 py-2 text-xs hover:shadow-lg transition-all flex items-center gap-2"
        >
          <div className={`w-2 h-2 rounded-full ${scan.status === 'verified' ? 'bg-success-500' : scan.status === 'review' ? 'bg-warning-500' : 'bg-danger-500'}`} />
          {scan.medicineName}
        </motion.button>
      ))}
    </div>
  );
}

function RiskDistribution() {
  const data = [
    { label: 'Low Risk', value: 80, color: 'bg-success-500' },
    { label: 'Moderate', value: 12, color: 'bg-warning-500' },
    { label: 'High Risk', value: 5, color: 'bg-danger-500' },
    { label: 'Critical', value: 3, color: 'bg-danger-700' },
  ];
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-neutral-600 dark:text-neutral-400">{d.label}</span>
            <span className="font-mono font-semibold">{d.value}%</span>
          </div>
          <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${d.color}`}
              initial={{ width: 0 }}
              animate={{ width: `${d.value}%` }}
              transition={{ duration: 1, delay: i * 0.1 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ScanActivity() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const values = [45, 62, 38, 78, 52, 88, 65];
  return (
    <div className="flex items-end justify-between h-32 gap-2">
      {days.map((day, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <div className="w-full flex-1 flex items-end">
            <motion.div
              className="w-full rounded-t-lg bg-gradient-to-t from-primary-600 to-accent-500"
              initial={{ height: 0 }}
              animate={{ height: `${values[i]}%` }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              style={{ minHeight: '4px' }}
            />
          </div>
          <span className="text-xs text-neutral-400">{day}</span>
        </div>
      ))}
    </div>
  );
}
