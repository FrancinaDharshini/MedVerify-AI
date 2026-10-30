import { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

export function Hero3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 150, damping: 30 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [15, -15]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-15, 15]), springConfig);

  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-full flex items-center justify-center perspective-1000"
      style={{ transform: `translateY(${scrollY * -0.15}px)` }}
    >
      {/* Central 3D medicine package */}
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative w-48 h-64 sm:w-56 sm:h-72"
      >
        {/* Front face */}
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-accent-700 shadow-2xl"
          style={{ transform: 'translateZ(20px)', boxShadow: '0 0 60px rgba(51,128,252,0.3)' }}
        >
          <div className="p-5 h-full flex flex-col justify-between text-white">
            <div>
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3">
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v6m0 0l3-3m-3 3L9 5" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="4" y="8" width="16" height="14" rx="2" />
                  <path d="M9 14h6M9 17h4" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="font-display font-bold text-lg leading-tight">Crocin Advance</h3>
              <p className="text-xs opacity-80 mt-1">Paracetamol 500mg</p>
            </div>
            <div className="space-y-1 text-[10px] font-mono opacity-70">
              <p>BATCH: GSK2024A0312</p>
              <p>EXP: 03/2027</p>
              <div className="flex gap-0.5 mt-2">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="w-0.5 h-4 bg-white/60" style={{ opacity: i % 3 === 0 ? 0.9 : 0.4 }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Back face */}
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent-700 to-primary-800"
          style={{ transform: 'translateZ(-20px) rotateY(180deg)' }}
        >
          <div className="p-5 h-full text-white/80 text-[10px] space-y-2">
            <p className="font-semibold text-white text-sm">Composition</p>
            <p>Paracetamol I.P. 500mg</p>
            <p className="font-semibold text-white text-sm mt-3">Dosage</p>
            <p>1-2 tablets every 4-6 hours</p>
            <p className="font-semibold text-white text-sm mt-3">Warnings</p>
            <p>Do not exceed recommended dose.</p>
          </div>
        </div>

        {/* Side faces */}
        <div className="absolute inset-y-0 -left-1 w-2 rounded-l-lg bg-primary-800" style={{ transform: 'rotateY(-90deg) translateZ(0px)' }} />
        <div className="absolute inset-y-0 -right-1 w-2 rounded-r-lg bg-primary-800" style={{ transform: 'rotateY(90deg) translateZ(0px)' }} />
        <div className="absolute -top-1 inset-x-0 h-2 rounded-t-lg bg-primary-800" style={{ transform: 'rotateX(90deg) translateZ(0px)' }} />
        <div className="absolute -bottom-1 inset-x-0 h-2 rounded-b-lg bg-primary-800" style={{ transform: 'rotateX(-90deg) translateZ(0px)' }} />
      </motion.div>

      {/* Floating evidence cards */}
      <FloatingCard
        className="absolute top-[15%] left-[8%]"
        delay={0.2}
        icon="eye"
        title="Vision Agent"
        text="Packaging analyzed"
        status="pass"
      />
      <FloatingCard
        className="absolute top-[20%] right-[6%]"
        delay={0.4}
        icon="scan"
        title="OCR Agent"
        text="12 fields extracted"
        status="pass"
      />
      <FloatingCard
        className="absolute bottom-[20%] left-[10%]"
        delay={0.6}
        icon="barcode"
        title="Barcode Valid"
        text="EAN-13 verified"
        status="pass"
      />
      <FloatingCard
        className="absolute bottom-[15%] right-[8%]"
        delay={0.8}
        icon="shield"
        title="FDA Registered"
        text="No recalls"
        status="pass"
      />
      <FloatingCard
        className="absolute top-[50%] left-[2%]"
        delay={1.0}
        icon="brain"
        title="AI Reasoning"
        text="Low risk: 91/100"
        status="pass"
      />
      <FloatingCard
        className="absolute top-[45%] right-[2%]"
        delay={1.2}
        icon="pill"
        title="Pharma DB"
        text="Paracetamol confirmed"
        status="pass"
      />

      {/* Particle dots */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary-400/40"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}
    </div>
  );
}

function FloatingCard({
  className,
  delay,
  icon,
  title,
  text,
  status,
}: {
  className: string;
  delay: number;
  icon: string;
  title: string;
  text: string;
  status: string;
}) {
  const icons: Record<string, React.ReactNode> = {
    eye: <EyeIcon />,
    scan: <ScanIcon />,
    barcode: <BarcodeIcon />,
    shield: <ShieldIcon />,
    brain: <BrainIcon />,
    pill: <PillIcon />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5 }}
      className={`hidden lg:flex items-center gap-3 glass-strong rounded-xl px-4 py-3 shadow-xl ${className}`}
      style={{ animation: `float 6s ease-in-out infinite ${delay}s` }}
    >
      <div className="w-8 h-8 rounded-lg bg-success-500/15 flex items-center justify-center text-success-500">
        {icons[icon]}
      </div>
      <div>
        <p className="text-xs font-semibold">{title}</p>
        <p className="text-[10px] text-neutral-500 dark:text-neutral-400">{text}</p>
      </div>
      <div className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
    </motion.div>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function ScanIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7V5a2 2 0 012-2h2m6 0h2a2 2 0 012 2v2m0 6v2a2 2 0 01-2 2h-2m-6 0H7a2 2 0 01-2-2v-2M7 12h10" strokeLinecap="round" />
    </svg>
  );
}
function BarcodeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 5v14M6 5v14M9 5v14M12 5v14M15 5v14M18 5v14M21 5v14" strokeLinecap="round" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function BrainIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2a3 3 0 00-3 3 3 3 0 00-3 3 3 3 0 001 5 3 3 0 005 2 3 3 0 005-2 3 3 0 001-5 3 3 0 00-3-3 3 3 0 00-3-3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PillIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.5 13.5L8 16a4 4 0 01-6-6l5-5a4 4 0 016 6l-2.5 2.5z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 8l8 8" strokeLinecap="round" />
    </svg>
  );
}
