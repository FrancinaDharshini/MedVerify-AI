import { motion } from 'framer-motion';
import { Fingerprint, ShieldCheck, Clock, Barcode, Factory, Calendar, Pill } from 'lucide-react';
import type { MedicineScan } from '@/types';

export function MedicinePassport({ scan }: { scan: MedicineScan }) {
  return (
    <motion.div
      initial={{ opacity: 0, rotateY: -15 }}
      animate={{ opacity: 1, rotateY: 0 }}
      transition={{ duration: 0.6 }}
      className="relative max-w-md mx-auto perspective-1000"
    >
      <div className="relative preserve-3d rounded-2xl overflow-hidden glass-strong shadow-2xl" style={{ background: 'linear-gradient(135deg, rgba(51,128,252,0.05), rgba(0,176,232,0.05))' }}>
        {/* Holographic header */}
        <div className="relative h-32 bg-gradient-to-r from-primary-600 via-accent-600 to-primary-700 overflow-hidden">
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)' }} />
          <motion.div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
          <div className="relative p-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Fingerprint className="w-5 h-5 text-white" />
                <span className="text-white font-display font-bold text-lg">Digital Medicine Passport</span>
              </div>
              <p className="text-white/70 text-xs font-mono">ID: {scan.id.toUpperCase()}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-display font-bold text-white">{scan.trustScore}</div>
              <div className="text-xs text-white/70 font-mono">TRUST SCORE</div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
            <div>
              <h3 className="font-display font-bold text-lg">{scan.medicineName}</h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{scan.genericName}</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              scan.riskLevel === 'low' ? 'bg-success-500/10 text-success-600 dark:text-success-400' :
              scan.riskLevel === 'moderate' ? 'bg-warning-500/10 text-warning-600 dark:text-warning-400' :
              'bg-danger-500/10 text-danger-600 dark:text-danger-400'
            }`}>
              {scan.riskLevel === 'low' ? 'Verified' : scan.riskLevel === 'moderate' ? 'Review Required' : 'High Risk'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <PassportField icon={Factory} label="Manufacturer" value={scan.manufacturer} />
            <PassportField icon={Barcode} label="Barcode" value={scan.barcode} />
            <PassportField icon={Calendar} label="Mfg Date" value={scan.manufacturingDate} />
            <PassportField icon={Calendar} label="Expiry" value={scan.expiryDate} />
            <PassportField icon={Pill} label="Batch" value={scan.batchNumber} />
            <PassportField icon={ShieldCheck} label="License" value={scan.licenseNumber} />
          </div>

          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
            <div className="flex items-center gap-2 text-xs text-neutral-400 mb-2">
              <Clock className="w-3.5 h-3.5" />
              Scan Timestamp
            </div>
            <p className="text-sm font-mono">{new Date(scan.scanTimestamp).toLocaleString()}</p>
          </div>

          <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">AI Confidence</span>
              <span className="font-mono font-semibold">{scan.trustScore}%</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${scan.trustScore >= 75 ? 'bg-success-500' : scan.trustScore >= 50 ? 'bg-warning-500' : 'bg-danger-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${scan.trustScore}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>

          {/* QR-like pattern */}
          <div className="flex justify-center pt-2">
            <div className="grid grid-cols-8 gap-0.5">
              {Array.from({ length: 64 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-sm ${Math.random() > 0.5 ? 'bg-neutral-800 dark:bg-neutral-200' : 'bg-transparent'}`}
                />
              ))}
            </div>
          </div>
          <p className="text-center text-xs text-neutral-400">Scan to verify authenticity</p>
        </div>
      </div>
    </motion.div>
  );
}

function PassportField({ icon: Icon, label, value }: { icon: typeof Factory; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-1">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </div>
      <p className="font-medium text-sm truncate">{value}</p>
    </div>
  );
}
