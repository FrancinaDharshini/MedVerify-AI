export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';
export type ScanStatus = 'verified' | 'review' | 'high-risk' | 'processing' | 'failed';
export type AgentStatus = 'pending' | 'processing' | 'complete' | 'error';
export type Theme = 'light' | 'dark';
export type Page = 'landing' | 'dashboard' | 'scan' | 'processing' | 'result' | 'pharmacy' | 'assistant' | 'report' | 'history';

export interface AgentInfo {
  id: string;
  name: string;
  shortName: string;
  description: string;
  status: AgentStatus;
  icon: string;
  result?: string;
  duration?: number;
}

export interface TrustScoreBreakdown {
  packagingMatch: number;
  ocrConsistency: number;
  barcodeValidation: number;
  manufacturerMatch: number;
  batchValidation: number;
  regulatoryEvidence: number;
}

export interface EvidenceItem {
  id: string;
  label: string;
  status: 'pass' | 'warning' | 'fail' | 'info';
  detail: string;
  source: string;
  confidence: number;
}

export interface OCRResult {
  medicineName: string;
  manufacturer: string;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  mrp: string;
  composition: string;
  dosage: string;
  licenseNumber: string;
  barcode: string;
  warnings: string;
  confidence: number;
}

export interface BarcodeResult {
  code: string;
  type: 'EAN-13' | 'UPC-A' | 'QR' | 'Code128' | 'DataMatrix';
  isValid: boolean;
  matchesPackage: boolean;
  decodedInfo: string;
}

export interface RegulatoryRecord {
  source: string;
  status: 'registered' | 'unregistered' | 'unknown';
  registrationNumber: string;
  lastChecked: string;
  notes: string;
}

export interface RecallInfo {
  hasRecall: boolean;
  recallDate?: string;
  recallReason?: string;
  recallSource?: string;
}

export interface Ingredient {
  name: string;
  strength: string;
  type: 'active' | 'inactive';
  role: string;
}

export interface DrugInteraction {
  severity: 'mild' | 'moderate' | 'severe' | 'contraindicated';
  description: string;
  interactingSubstance: string;
  recommendation: string;
}

export interface HeatmapRegion {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  severity: 'normal' | 'suspicious' | 'anomaly';
  note: string;
}

export interface EvidenceNode {
  id: string;
  label: string;
  type: 'core' | 'source' | 'analysis' | 'risk';
  status: 'pass' | 'warning' | 'fail' | 'info';
  detail: string;
  evidence?: string[];
}

export interface EvidenceEdge {
  from: string;
  to: string;
  strength: number;
}

export interface MedicineScan {
  id: string;
  medicineName: string;
  genericName: string;
  manufacturer: string;
  batchNumber: string;
  manufacturingDate: string;
  expiryDate: string;
  mrp: string;
  composition: string;
  dosage: string;
  licenseNumber: string;
  barcode: string;
  qrCode: string;
  drugClass: string;
  uses: string;
  contraindications: string;
  sideEffects: string;
  storageRequirements: string;
  trustScore: number;
  trustScoreBreakdown: TrustScoreBreakdown;
  riskLevel: RiskLevel;
  status: ScanStatus;
  aiVerdict: string;
  aiExplanation: string;
  ocrResult: OCRResult;
  barcodeResult: BarcodeResult;
  regulatoryRecords: RegulatoryRecord[];
  recallInfo: RecallInfo;
  ingredients: Ingredient[];
  interactions: DrugInteraction[];
  evidence: EvidenceItem[];
  heatmapRegions: HeatmapRegion[];
  evidenceNodes: EvidenceNode[];
  evidenceEdges: EvidenceEdge[];
  agents: AgentInfo[];
  scanTimestamp: string;
  imageUrl?: string;
  isDemo: boolean;
  previousScanId?: string;
  changes?: ScanChange[];
}

export interface ScanChange {
  field: string;
  label: string;
  previousValue: string;
  currentValue: string;
  type: 'changed' | 'added' | 'removed';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: string[];
  isTyping?: boolean;
}

export interface DashboardStats {
  totalScans: number;
  verified: number;
  potentialRisks: number;
  medicinesTracked: number;
  scansTrend: number;
  verifiedTrend: number;
  riskTrend: number;
  trackedTrend: number;
}

export interface BulkScanItem {
  id: string;
  medicineName: string;
  batchNumber: string;
  manufacturer: string;
  trustScore: number;
  status: ScanStatus;
  timestamp: string;
}

export interface CommunityAlert {
  id: string;
  batchNumber: string;
  manufacturer: string;
  anomalyType: string;
  frequency: number;
  region: string;
  confidence: number;
  timestamp: string;
}

// ============================================================================
// New AnalysisResult type structure for the real OCR + API + matching pipeline
// ============================================================================

export interface AnalysisResult {
  id: string;
  uploadedImage: string | null;
  timestamp: string;
  ocrData: import('@/lib/ocr').OCRData;
  referenceData: import('@/lib/drugReference').ReferenceData;
  matchingEvidence: import('@/lib/matchingEngine').MatchingEvidence;
  score: import('@/lib/matchingEngine').ScreeningScore;
  barcodeScan: import('@/lib/barcodeDetection').BarcodeScanResult | null;
  warnings: string[];
  scanMethod: string;
}
