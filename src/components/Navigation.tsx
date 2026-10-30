import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, LayoutDashboard, MessageSquare, Package, Shield, Sun, Moon, Menu, X, ShieldCheck } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useApp } from '@/context/AppContext';
import type { Page } from '@/types';

const navItems: { page: Page; label: string; icon: typeof Scan }[] = [
  { page: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { page: 'scan', label: 'Check Medicine', icon: Scan },
  { page: 'pharmacy', label: 'Pharmacy', icon: Package },
  { page: 'assistant', label: 'Ask AI', icon: MessageSquare },
];

export function Navigation() {
  const { theme, toggleTheme } = useTheme();
  const { page, navigate } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const go = (p: Page) => {
    navigate(p);
    setMobileOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'glass-strong shadow-sm' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => go('landing')} className="flex items-center gap-2.5 group">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/30 group-hover:shadow-primary-500/50 transition-shadow">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -inset-1 rounded-xl bg-primary-500/20 blur-md -z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display font-bold text-lg tracking-tight">FakeMed<span className="text-primary-500"> AI</span></span>
                <span className="text-[10px] text-neutral-400 font-mono tracking-wider uppercase">Medicine Intelligence</span>
              </div>
            </button>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.page}
                  onClick={() => go(item.page)}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    page === item.page
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                  {page === item.page && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-lg bg-primary-500/10 -z-10"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="w-9 h-9 rounded-lg glass flex items-center justify-center hover:shadow-md transition-all"
                aria-label="Toggle theme"
              >
                <AnimatePresence mode="wait">
                  {theme === 'dark' ? (
                    <motion.div key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                      <Sun className="w-4 h-4 text-warning-400" />
                    </motion.div>
                  ) : (
                    <motion.div key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                      <Moon className="w-4 h-4 text-primary-600" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
              <button
                onClick={() => go('scan')}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium shadow-lg shadow-primary-500/25 transition-all"
              >
                <Scan className="w-4 h-4" />
                Check a Medicine
              </button>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden w-9 h-9 rounded-lg glass flex items-center justify-center"
              >
                {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 left-0 right-0 z-40 glass-strong border-t border-neutral-200 dark:border-neutral-800 md:hidden"
          >
            <nav className="flex flex-col p-4 gap-1">
              {navItems.map((item) => (
                <button
                  key={item.page}
                  onClick={() => go(item.page)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    page === item.page
                      ? 'bg-primary-500/10 text-primary-600 dark:text-primary-400'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </button>
              ))}
              <button
                onClick={() => go('scan')}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary-600 text-white text-sm font-medium mt-2"
              >
                <Scan className="w-4 h-4" />
                Check a Medicine
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
