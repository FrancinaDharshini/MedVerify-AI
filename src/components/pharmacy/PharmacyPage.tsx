import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Upload, Scan, Download, AlertTriangle, ShieldCheck,
  TrendingUp, BarChart3, Search, FileText, Factory, Loader2,
  CheckCircle2, XCircle, Eye,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusBadge } from '@/components/ui/Badge';
import { bulkScanItems, communityAlerts, pharmacyAnalytics } from '@/data/mockData';

type PharmacyTab = 'bulk' | 'analytics' | 'alerts' | 'export';

export function PharmacyPage() {
  const { navigate, setCurrentScan } = useApp();
  const [tab, setTab] = useState<PharmacyTab>('bulk');
  const [scanning, setScanning] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const tabs: { id: PharmacyTab; label: string; icon: typeof Package }[] = [
    { id: 'bulk', label: 'Bulk Scanner', icon: Scan },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'export', label: 'Export', icon: Download },
  ];

  const startBulkScan = (count: number) => {
    setScanning(true);
    setScanCount(0);
    const interval = setInterval(() => {
      setScanCount((prev) => {
        if (prev >= count) {
          clearInterval(interval);
          setScanning(false);
          return count;
        }
        return prev + 1;
      });
    }, 200);
  };

  const filteredItems = bulkScanItems.filter(item =>
    item.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-20 pb-12 grid-bg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-6 h-6 text-primary-500" />
            <h1 className="font-display text-3xl font-bold">Pharmacy Mode</h1>
          </div>
          <p className="text-neutral-500 dark:text-neutral-400">Bulk verification, analytics, suspicious batch dashboard, and export reports.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Scanned', value: pharmacyAnalytics.totalScanned.toLocaleString(), icon: Package, color: 'primary' },
            { label: 'Verified', value: pharmacyAnalytics.verified.toLocaleString(), icon: ShieldCheck, color: 'success' },
            { label: 'Flagged', value: pharmacyAnalytics.flagged.toLocaleString(), icon: AlertTriangle, color: 'warning' },
            { label: 'Counterfeits', value: pharmacyAnalytics.counterfeits.toLocaleString(), icon: XCircle, color: 'danger' },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <GlassCard className="p-5" hover>
                <div className={`w-10 h-10 rounded-xl bg-${stat.color}-500/10 flex items-center justify-center mb-3`}>
                  <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
                </div>
                <p className="text-2xl font-display font-bold">{stat.value}</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{stat.label}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar mb-4 glass rounded-xl p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                tab === t.id ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
            {tab === 'bulk' && (
              <div className="space-y-4">
                <GlassCard className="p-6">
                  <h3 className="font-semibold mb-4">Bulk Verification Scanner</h3>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {[10, 50, 100].map((n) => (
                      <Button key={n} variant={scanning ? 'secondary' : 'primary'} onClick={() => startBulkScan(n)} disabled={scanning}>
                        {scanning && scanCount < n ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
                        Scan {n} Packages
                      </Button>
                    ))}
                    <Button variant="secondary" icon={<Upload className="w-4 h-4" />}>Upload CSV</Button>
                  </div>
                  {scanning && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-neutral-500">Scanning... {scanCount} packages</span>
                        <span className="font-mono">{Math.round((scanCount / (scanCount > 50 ? 100 : scanCount > 10 ? 50 : 10)) * 100)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                        <div className="h-full bg-primary-500 transition-all" style={{ width: `${(scanCount / (scanCount > 50 ? 100 : scanCount > 10 ? 50 : 10)) * 100}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by medicine, batch, or manufacturer..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl glass border border-neutral-200 dark:border-neutral-800 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                          <th className="text-left p-3 font-medium">Medicine</th>
                          <th className="text-left p-3 font-medium hidden sm:table-cell">Batch</th>
                          <th className="text-left p-3 font-medium hidden md:table-cell">Manufacturer</th>
                          <th className="text-left p-3 font-medium">Trust</th>
                          <th className="text-left p-3 font-medium">Status</th>
                          <th className="p-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredItems.map((item, i) => (
                          <motion.tr
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03 }}
                            className="border-b border-neutral-100 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 cursor-pointer transition-colors"
                          >
                            <td className="p-3 text-sm font-medium">{item.medicineName}</td>
                            <td className="p-3 text-sm text-neutral-400 hidden sm:table-cell font-mono">{item.batchNumber}</td>
                            <td className="p-3 text-sm text-neutral-400 hidden md:table-cell">{item.manufacturer}</td>
                            <td className="p-3">
                              <span className={`text-sm font-mono font-semibold ${item.trustScore >= 75 ? 'text-success-500' : item.trustScore >= 50 ? 'text-warning-500' : 'text-danger-500'}`}>
                                {item.trustScore}
                              </span>
                            </td>
                            <td className="p-3"><StatusBadge status={item.status} /></td>
                            <td className="p-3 text-right">
                              <Eye className="w-4 h-4 text-neutral-400 inline" />
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </GlassCard>
              </div>
            )}

            {tab === 'analytics' && (
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <GlassCard className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary-500" /> Risk Distribution</h3>
                    <div className="space-y-3">
                      {pharmacyAnalytics.riskDistribution.map((d, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-neutral-600 dark:text-neutral-400">{d.level}</span>
                            <span className="font-mono font-semibold">{d.count.toLocaleString()}</span>
                          </div>
                          <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                            <motion.div className="h-full rounded-full" style={{ backgroundColor: d.color }} initial={{ width: 0 }} animate={{ width: `${(d.count / pharmacyAnalytics.totalScanned) * 100}%` }} transition={{ duration: 1, delay: i * 0.1 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                  <GlassCard className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2"><Factory className="w-4 h-4 text-primary-500" /> Top Manufacturers</h3>
                    <div className="space-y-3">
                      {pharmacyAnalytics.topManufacturers.map((m, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{m.name}</p>
                            <p className="text-xs text-neutral-400">{m.scans.toLocaleString()} scans</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-mono font-semibold text-success-500">{m.avgTrust}</p>
                            <p className="text-xs text-neutral-400">avg trust</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </div>
                <GlassCard className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary-500" /> Verification Trends</h3>
                  <div className="flex items-end justify-between h-40 gap-2">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'].map((month, i) => {
                      const verified = 800 + i * 120 + Math.random() * 200;
                      const flagged = 100 + i * 15 + Math.random() * 50;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full flex-1 flex flex-col justify-end gap-0.5">
                            <motion.div className="w-full rounded-t bg-success-500/70" initial={{ height: 0 }} animate={{ height: `${verified / 15}px` }} transition={{ delay: i * 0.05 }} />
                            <motion.div className="w-full bg-danger-500/70" initial={{ height: 0 }} animate={{ height: `${flagged / 15}px` }} transition={{ delay: i * 0.05 + 0.3 }} />
                          </div>
                          <span className="text-[10px] text-neutral-400">{month}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-4 mt-3 justify-center">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-success-500/70" /><span className="text-xs text-neutral-400">Verified</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-danger-500/70" /><span className="text-xs text-neutral-400">Flagged</span></div>
                  </div>
                </GlassCard>
              </div>
            )}

            {tab === 'alerts' && (
              <div className="space-y-4">
                <GlassCard className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-danger-500" />
                    <h3 className="font-semibold">Community Intelligence — Emerging Anomaly Patterns</h3>
                  </div>
                  <div className="space-y-3">
                    {communityAlerts.map((alert, i) => (
                      <motion.div key={alert.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="p-4 rounded-lg bg-danger-500/5 border border-danger-500/20">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-medium text-sm">{alert.anomalyType}</p>
                            <p className="text-xs text-neutral-400 mt-0.5">Batch: {alert.batchNumber} — {alert.manufacturer}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-danger-500">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span className="text-sm font-semibold">{alert.confidence}%</span>
                            </div>
                            <p className="text-xs text-neutral-400">confidence</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                          <span>{alert.frequency} reports</span>
                          <span>Region: {alert.region}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <p className="text-xs text-neutral-400 mt-4 text-center">No personal information is exposed. Only region-level statistics are shown.</p>
                </GlassCard>
              </div>
            )}

            {tab === 'export' && (
              <div className="space-y-4">
                <GlassCard className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-primary-500" /> Export Reports</h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {[
                      { format: 'PDF', desc: 'Full verification report with all evidence', icon: FileText },
                      { format: 'CSV', desc: 'Bulk scan data for spreadsheet analysis', icon: BarChart3 },
                      { format: 'JSON', desc: 'Machine-readable API response format', icon: Package },
                    ].map((opt, i) => (
                      <div key={i} className="p-4 rounded-xl glass hover:shadow-lg transition-all cursor-pointer">
                        <opt.icon className="w-8 h-8 text-primary-500 mb-3" />
                        <p className="font-semibold text-sm mb-1">{opt.format}</p>
                        <p className="text-xs text-neutral-400">{opt.desc}</p>
                        <Button size="sm" variant="secondary" className="mt-3" icon={<Download className="w-3.5 h-3.5" />}>Download</Button>
                      </div>
                    ))}
                  </div>
                </GlassCard>
                <GlassCard className="p-6">
                  <h3 className="font-semibold mb-4">Verification History Export</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Export all verification records with timestamps, trust scores, and evidence summaries.</p>
                  <Button icon={<Download className="w-4 h-4" />} onClick={() => navigate('report')}>Generate Full Report</Button>
                </GlassCard>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
