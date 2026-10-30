import { AnimatePresence, motion } from 'framer-motion';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppProvider, useApp } from '@/context/AppContext';
import { Navigation } from '@/components/Navigation';
import { LandingPage } from '@/components/landing/LandingPage';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ScanPage } from '@/components/scan/ScanPage';
import { ResultPage } from '@/components/result/ResultPage';
import { AssistantPage } from '@/components/assistant/AssistantPage';
import { PharmacyPage } from '@/components/pharmacy/PharmacyPage';

function AppContent() {
  const { page } = useApp();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
      <Navigation />
      <AnimatePresence mode="sync">
        <motion.div
          key={page}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {page === 'landing' && <LandingPage />}
          {page === 'dashboard' && <Dashboard />}
          {page === 'scan' && <ScanPage />}
          {page === 'result' && <ResultPage />}
          {page === 'assistant' && <AssistantPage />}
          {page === 'pharmacy' && <PharmacyPage />}
          {(page === 'processing' || page === 'report' || page === 'history') && <ScanPage />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
