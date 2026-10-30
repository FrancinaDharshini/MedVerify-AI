import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Page, MedicineScan, AnalysisResult } from '@/types';

interface AppContextValue {
  page: Page;
  navigate: (page: Page) => void;
  currentScan: MedicineScan | null;
  setCurrentScan: (scan: MedicineScan | null) => void;
  scanHistory: MedicineScan[];
  addToHistory: (scan: MedicineScan) => void;
  // New analysis system
  currentAnalysis: AnalysisResult | null;
  setCurrentAnalysis: (analysis: AnalysisResult | null) => void;
  analysisHistory: AnalysisResult[];
  addToAnalysisHistory: (analysis: AnalysisResult) => void;
  clearAnalysis: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<Page>('landing');
  const [currentScan, setCurrentScan] = useState<MedicineScan | null>(null);
  const [scanHistory, setScanHistory] = useState<MedicineScan[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);

  const navigate = useCallback((p: Page) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const addToHistory = useCallback((scan: MedicineScan) => {
    setScanHistory((prev) => [scan, ...prev].slice(0, 50));
  }, []);

  const addToAnalysisHistory = useCallback((analysis: AnalysisResult) => {
    setAnalysisHistory((prev) => [analysis, ...prev].slice(0, 50));
  }, []);

  const clearAnalysis = useCallback(() => {
    setCurrentAnalysis(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        page,
        navigate,
        currentScan,
        setCurrentScan,
        scanHistory,
        addToHistory,
        currentAnalysis,
        setCurrentAnalysis,
        analysisHistory,
        addToAnalysisHistory,
        clearAnalysis,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
