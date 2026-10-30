import { supabase } from './supabase';
import type { MedicineScan, EvidenceItem, AgentInfo, DashboardStats, BulkScanItem, CommunityAlert } from '@/types';
import { demoScans, agentDefinitions, dashboardStats as mockStats, pharmacyAnalytics as mockAnalytics } from '@/data/mockData';

// ============================================================
// Types matching DB rows
// ============================================================
interface ScanRow {
  id: string;
  medicine_name: string | null;
  generic_name: string | null;
  manufacturer: string | null;
  batch_number: string | null;
  manufacturing_date: string | null;
  expiry_date: string | null;
  mrp: string | null;
  composition: string | null;
  dosage: string | null;
  license_number: string | null;
  barcode: string | null;
  qr_code: string | null;
  drug_class: string | null;
  uses: string | null;
  contraindications: string | null;
  side_effects: string | null;
  storage_requirements: string | null;
  trust_score: number;
  trust_packaging_match: number;
  trust_ocr_consistency: number;
  trust_barcode_validation: number;
  trust_manufacturer_match: number;
  trust_batch_validation: number;
  trust_regulatory_evidence: number;
  risk_level: string;
  status: string;
  ai_verdict: string | null;
  ai_explanation: string | null;
  ocr_confidence: number;
  barcode_valid: boolean;
  barcode_matches: boolean;
  barcode_type: string | null;
  barcode_decoded: string | null;
  has_recall: boolean;
  is_demo: boolean;
  scan_method: string | null;
  image_url: string | null;
  previous_scan_id: string | null;
  scan_timestamp: string;
}

interface EvidenceRow {
  id: string;
  scan_id: string;
  label: string;
  status: string;
  detail: string | null;
  source: string | null;
  confidence: number;
}

interface AgentRow {
  id: string;
  scan_id: string;
  agent_id: string;
  agent_name: string;
  status: string;
  result: string | null;
  duration_ms: number | null;
}

interface AlertRow {
  id: string;
  batch_number: string | null;
  manufacturer: string | null;
  anomaly_type: string;
  frequency: number;
  region: string | null;
  confidence: number;
  is_active: boolean;
  created_at: string;
}

// ============================================================
// Converters: DB rows -> app types
// ============================================================
function scanRowToScan(
  scan: ScanRow,
  evidence: EvidenceRow[],
  agents: AgentRow[],
): MedicineScan {
  const evidenceItems: EvidenceItem[] = evidence.map((e) => ({
    id: e.id,
    label: e.label,
    status: e.status as EvidenceItem['status'],
    detail: e.detail || '',
    source: e.source || '',
    confidence: e.confidence,
  }));

  const agentInfos: AgentInfo[] = agentDefinitions.map((def) => {
    const dbAgent = agents.find((a) => a.agent_id === def.id);
    return {
      ...def,
      status: dbAgent ? (dbAgent.status as AgentInfo['status']) : 'pending',
      result: dbAgent?.result || undefined,
      duration: dbAgent?.duration_ms || undefined,
    };
  });

  const riskLevel = scan.risk_level as MedicineScan['riskLevel'];
  const scanStatus = scan.status as MedicineScan['status'];

  return {
    id: scan.id,
    medicineName: scan.medicine_name || 'Unknown Medicine',
    genericName: scan.generic_name || '',
    manufacturer: scan.manufacturer || 'Unknown',
    batchNumber: scan.batch_number || 'N/A',
    manufacturingDate: scan.manufacturing_date || '',
    expiryDate: scan.expiry_date || '',
    mrp: scan.mrp || '',
    composition: scan.composition || '',
    dosage: scan.dosage || '',
    licenseNumber: scan.license_number || '',
    barcode: scan.barcode || '',
    qrCode: scan.qr_code || '',
    drugClass: scan.drug_class || '',
    uses: scan.uses || '',
    contraindications: scan.contraindications || '',
    sideEffects: scan.side_effects || '',
    storageRequirements: scan.storage_requirements || '',
    trustScore: scan.trust_score,
    trustScoreBreakdown: {
      packagingMatch: scan.trust_packaging_match,
      ocrConsistency: scan.trust_ocr_consistency,
      barcodeValidation: scan.trust_barcode_validation,
      manufacturerMatch: scan.trust_manufacturer_match,
      batchValidation: scan.trust_batch_validation,
      regulatoryEvidence: scan.trust_regulatory_evidence,
    },
    riskLevel,
    status: scanStatus,
    aiVerdict: scan.ai_verdict || '',
    aiExplanation: scan.ai_explanation || '',
    ocrResult: {
      medicineName: scan.medicine_name || '',
      manufacturer: scan.manufacturer || '',
      batchNumber: scan.batch_number || '',
      manufacturingDate: scan.manufacturing_date || '',
      expiryDate: scan.expiry_date || '',
      mrp: scan.mrp || '',
      composition: scan.composition || '',
      dosage: scan.dosage || '',
      licenseNumber: scan.license_number || '',
      barcode: scan.barcode || '',
      warnings: '',
      confidence: scan.ocr_confidence,
    },
    barcodeResult: {
      code: scan.barcode || '',
      type: (scan.barcode_type as MedicineScan['barcodeResult']['type']) || 'EAN-13',
      isValid: scan.barcode_valid,
      matchesPackage: scan.barcode_matches,
      decodedInfo: scan.barcode_decoded || '',
    },
    regulatoryRecords: [],
    recallInfo: { hasRecall: scan.has_recall },
    ingredients: [],
    interactions: [],
    evidence: evidenceItems,
    heatmapRegions: [],
    evidenceNodes: [],
    evidenceEdges: [],
    agents: agentInfos,
    scanTimestamp: scan.scan_timestamp,
    imageUrl: scan.image_url || undefined,
    isDemo: scan.is_demo,
    previousScanId: scan.previous_scan_id || undefined,
  };
}

// ============================================================
// Data access functions
// ============================================================

export async function fetchDashboardStats(): Promise<DashboardStats> {
  try {
    const { count: total } = await supabase.from('scans').select('*', { count: 'exact', head: true });
    const { count: verified } = await supabase.from('scans').select('*', { count: 'exact', head: true }).eq('status', 'verified');
    const { count: risks } = await supabase.from('scans').select('*', { count: 'exact', head: true }).in('status', ['review', 'high-risk']);
    const { count: tracked } = await supabase.from('medicines').select('*', { count: 'exact', head: true });

    return {
      totalScans: total || mockStats.totalScans,
      verified: verified || mockStats.verified,
      potentialRisks: risks || mockStats.potentialRisks,
      medicinesTracked: tracked || mockStats.medicinesTracked,
      scansTrend: mockStats.scansTrend,
      verifiedTrend: mockStats.verifiedTrend,
      riskTrend: mockStats.riskTrend,
      trackedTrend: mockStats.trackedTrend,
    };
  } catch {
    return mockStats;
  }
}

export async function fetchRecentScans(limit: number = 10): Promise<MedicineScan[]> {
  try {
    const { data: scans, error } = await supabase
      .from('scans')
      .select('*')
      .order('scan_timestamp', { ascending: false })
      .limit(limit);

    if (error || !scans || scans.length === 0) {
      return demoScans;
    }

    const scanIds = scans.map((s) => s.id);
    const [{ data: evidence }, { data: agents }] = await Promise.all([
      supabase.from('scan_evidence').select('*').in('scan_id', scanIds),
      supabase.from('scan_agents').select('*').in('scan_id', scanIds),
    ]);

    return scans.map((scan) =>
      scanRowToScan(
        scan as ScanRow,
        (evidence || []).filter((e) => e.scan_id === scan.id) as EvidenceRow[],
        (agents || []).filter((a) => a.scan_id === scan.id) as AgentRow[],
      ),
    );
  } catch {
    return demoScans;
  }
}

export async function fetchScanById(id: string): Promise<MedicineScan | null> {
  try {
    const { data: scan, error } = await supabase
      .from('scans')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !scan) return null;

    const { data: evidence } = await supabase
      .from('scan_evidence')
      .select('*')
      .eq('scan_id', id);

    const { data: agents } = await supabase
      .from('scan_agents')
      .select('*')
      .eq('scan_id', id);

    return scanRowToScan(
      scan as ScanRow,
      (evidence || []) as EvidenceRow[],
      (agents || []) as AgentRow[],
    );
  } catch {
    return null;
  }
}

export async function fetchScanHistoryByBarcode(barcode: string): Promise<MedicineScan[]> {
  try {
    const { data: scans } = await supabase
      .from('scans')
      .select('*')
      .eq('barcode', barcode)
      .order('scan_timestamp', { ascending: false })
      .limit(10);

    if (!scans || scans.length === 0) return [];

    const scanIds = scans.map((s) => s.id);
    const [{ data: evidence }, { data: agents }] = await Promise.all([
      supabase.from('scan_evidence').select('*').in('scan_id', scanIds),
      supabase.from('scan_agents').select('*').in('scan_id', scanIds),
    ]);

    return scans.map((scan) =>
      scanRowToScan(
        scan as ScanRow,
        (evidence || []).filter((e) => e.scan_id === scan.id) as EvidenceRow[],
        (agents || []).filter((a) => a.scan_id === scan.id) as AgentRow[],
      ),
    );
  } catch {
    return [];
  }
}

export async function fetchScanHistoryByBatch(batch: string): Promise<MedicineScan[]> {
  try {
    const { data: scans } = await supabase
      .from('scans')
      .select('*')
      .eq('batch_number', batch)
      .order('scan_timestamp', { ascending: false })
      .limit(10);

    if (!scans || scans.length === 0) return [];

    const scanIds = scans.map((s) => s.id);
    const [{ data: evidence }, { data: agents }] = await Promise.all([
      supabase.from('scan_evidence').select('*').in('scan_id', scanIds),
      supabase.from('scan_agents').select('*').in('scan_id', scanIds),
    ]);

    return scans.map((scan) =>
      scanRowToScan(
        scan as ScanRow,
        (evidence || []).filter((e) => e.scan_id === scan.id) as EvidenceRow[],
        (agents || []).filter((a) => a.scan_id === scan.id) as AgentRow[],
      ),
    );
  } catch {
    return [];
  }
}

export async function saveScan(
  scan: MedicineScan,
  scanMethod: string = 'demo',
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('scans')
      .insert({
        medicine_name: scan.medicineName,
        generic_name: scan.genericName,
        manufacturer: scan.manufacturer,
        batch_number: scan.batchNumber,
        manufacturing_date: scan.manufacturingDate,
        expiry_date: scan.expiryDate,
        mrp: scan.mrp,
        composition: scan.composition,
        dosage: scan.dosage,
        license_number: scan.licenseNumber,
        barcode: scan.barcode,
        qr_code: scan.qrCode,
        drug_class: scan.drugClass,
        uses: scan.uses,
        contraindications: scan.contraindications,
        side_effects: scan.sideEffects,
        storage_requirements: scan.storageRequirements,
        trust_score: scan.trustScore,
        trust_packaging_match: scan.trustScoreBreakdown.packagingMatch,
        trust_ocr_consistency: scan.trustScoreBreakdown.ocrConsistency,
        trust_barcode_validation: scan.trustScoreBreakdown.barcodeValidation,
        trust_manufacturer_match: scan.trustScoreBreakdown.manufacturerMatch,
        trust_batch_validation: scan.trustScoreBreakdown.batchValidation,
        trust_regulatory_evidence: scan.trustScoreBreakdown.regulatoryEvidence,
        risk_level: scan.riskLevel,
        status: scan.status,
        ai_verdict: scan.aiVerdict,
        ai_explanation: scan.aiExplanation,
        ocr_confidence: scan.ocrResult.confidence,
        barcode_valid: scan.barcodeResult.isValid,
        barcode_matches: scan.barcodeResult.matchesPackage,
        barcode_type: scan.barcodeResult.type,
        barcode_decoded: scan.barcodeResult.decodedInfo,
        has_recall: scan.recallInfo.hasRecall,
        is_demo: scan.isDemo,
        scan_method: scanMethod,
      })
      .select('id')
      .maybeSingle();

    if (error || !data) return null;

    const scanId = data.id;

    // Save evidence items
    if (scan.evidence.length > 0) {
      await supabase.from('scan_evidence').insert(
        scan.evidence.map((e) => ({
          scan_id: scanId,
          label: e.label,
          status: e.status,
          detail: e.detail,
          source: e.source,
          confidence: e.confidence,
        })),
      );
    }

    // Save agent records
    await supabase.from('scan_agents').insert(
      scan.agents.map((a) => ({
        scan_id: scanId,
        agent_id: a.id,
        agent_name: a.name,
        status: a.status,
        result: a.result || null,
        duration_ms: a.duration || null,
      })),
    );

    return scanId;
  } catch {
    return null;
  }
}

export async function fetchBulkScanItems(limit: number = 50): Promise<BulkScanItem[]> {
  try {
    const { data, error } = await supabase
      .from('scans')
      .select('id, medicine_name, batch_number, manufacturer, trust_score, status, scan_timestamp')
      .order('scan_timestamp', { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) {
      return mockAnalytics ? [] : [];
    }

    return data.map((row) => ({
      id: row.id,
      medicineName: row.medicine_name || 'Unknown',
      batchNumber: row.batch_number || 'N/A',
      manufacturer: row.manufacturer || 'Unknown',
      trustScore: row.trust_score,
      status: row.status as BulkScanItem['status'],
      timestamp: row.scan_timestamp,
    }));
  } catch {
    return [];
  }
}

export async function fetchCommunityAlerts(): Promise<CommunityAlert[]> {
  try {
    const { data, error } = await supabase
      .from('community_alerts')
      .select('*')
      .eq('is_active', true)
      .order('frequency', { ascending: false });

    if (error || !data || data.length === 0) return [];

    return data.map((row: AlertRow) => ({
      id: row.id,
      batchNumber: row.batch_number || '',
      manufacturer: row.manufacturer || '',
      anomalyType: row.anomaly_type,
      frequency: row.frequency,
      region: row.region || '',
      confidence: row.confidence,
      timestamp: row.created_at,
    }));
  } catch {
    return [];
  }
}

export async function fetchPharmacyAnalytics() {
  try {
    const { count: total } = await supabase.from('scans').select('*', { count: 'exact', head: true });
    const { count: verified } = await supabase.from('scans').select('*', { count: 'exact', head: true }).eq('status', 'verified');
    const { count: flagged } = await supabase.from('scans').select('*', { count: 'exact', head: true }).eq('status', 'review');
    const { count: counterfeits } = await supabase.from('scans').select('*', { count: 'exact', head: true }).eq('status', 'high-risk');

    const { data: avgData } = await supabase
      .from('scans')
      .select('trust_score');

    const avgTrust = avgData && avgData.length > 0
      ? Math.round(avgData.reduce((sum, r) => sum + (r.trust_score || 0), 0) / avgData.length)
      : mockAnalytics.avgTrustScore;

    return {
      totalScanned: total || mockAnalytics.totalScanned,
      verified: verified || mockAnalytics.verified,
      flagged: flagged || mockAnalytics.flagged,
      counterfeits: counterfeits || mockAnalytics.counterfeits,
      avgTrustScore: avgTrust,
      topManufacturers: mockAnalytics.topManufacturers,
      riskDistribution: mockAnalytics.riskDistribution,
    };
  } catch {
    return mockAnalytics;
  }
}

export async function saveChatMessage(
  scanId: string | null,
  role: 'user' | 'assistant',
  content: string,
  sources?: string[],
): Promise<void> {
  try {
    await supabase.from('chat_messages').insert({
      scan_id: scanId,
      role,
      content,
      sources: sources ? sources.join(', ') : null,
    });
  } catch {
    // silently fail - chat history is non-critical
  }
}

export async function fetchChatHistory(scanId: string | null): Promise<{ role: 'user' | 'assistant'; content: string; sources?: string[] }[]> {
  try {
    let query = supabase.from('chat_messages').select('*').order('created_at', { ascending: true }).limit(50);
    if (scanId) {
      query = query.eq('scan_id', scanId);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data.map((row) => ({
      role: row.role as 'user' | 'assistant',
      content: row.content,
      sources: row.sources ? row.sources.split(', ') : undefined,
    }));
  } catch {
    return [];
  }
}
