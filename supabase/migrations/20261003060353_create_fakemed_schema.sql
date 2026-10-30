/*
# FakeMed AI — Core Database Schema

## Overview
Creates the full database schema for the FakeMed AI medicine intelligence platform.
This is a single-tenant app (no sign-in) so all policies use `TO anon, authenticated`
with `USING (true)` because the data is intentionally public/shared.

## Tables Created
1. `medicines` — Known medicine reference data (generic name, class, ingredients, etc.)
2. `manufacturers` — Verified pharmaceutical manufacturers
3. `scans` — Each scan/verification attempt by a user
4. `scan_evidence` — Individual evidence items from each AI agent for a scan
5. `scan_agents` — Agent execution status records for each scan
6. `community_alerts` — Aggregated anonymous anomaly patterns from community scans
7. `scan_stats` — Aggregated daily statistics for dashboard

## Security
- RLS enabled on all tables
- All tables allow anon + authenticated CRUD (single-tenant, intentionally public)
- No user_id columns (no auth)
*/

-- ============================================================
-- 1. MANUFACTURERS
-- ============================================================
CREATE TABLE IF NOT EXISTS manufacturers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  country text,
  fda_registered boolean DEFAULT false,
  fda_number text,
  cdsco_registered boolean DEFAULT false,
  cdsco_number text,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE manufacturers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_manufacturers_sel" ON manufacturers;
CREATE POLICY "anon_crud_manufacturers_sel" ON manufacturers FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_manufacturers_ins" ON manufacturers;
CREATE POLICY "anon_crud_manufacturers_ins" ON manufacturers FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_manufacturers_upd" ON manufacturers;
CREATE POLICY "anon_crud_manufacturers_upd" ON manufacturers FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_manufacturers_del" ON manufacturers;
CREATE POLICY "anon_crud_manufacturers_del" ON manufacturers FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 2. MEDICINES — Reference database of known medicines
-- ============================================================
CREATE TABLE IF NOT EXISTS medicines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  generic_name text,
  manufacturer_id uuid REFERENCES manufacturers(id) ON DELETE SET NULL,
  drug_class text,
  composition text,
  dosage text,
  uses text,
  contraindications text,
  side_effects text,
  storage_requirements text,
  barcode text,
  license_number text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_medicines_sel" ON medicines;
CREATE POLICY "anon_crud_medicines_sel" ON medicines FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_medicines_ins" ON medicines;
CREATE POLICY "anon_crud_medicines_ins" ON medicines FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_medicines_upd" ON medicines;
CREATE POLICY "anon_crud_medicines_upd" ON medicines FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_medicines_del" ON medicines;
CREATE POLICY "anon_crud_medicines_del" ON medicines FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 3. SCANS — Each verification attempt
-- ============================================================
CREATE TABLE IF NOT EXISTS scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_name text,
  generic_name text,
  manufacturer text,
  batch_number text,
  manufacturing_date text,
  expiry_date text,
  mrp text,
  composition text,
  dosage text,
  license_number text,
  barcode text,
  qr_code text,
  drug_class text,
  uses text,
  contraindications text,
  side_effects text,
  storage_requirements text,
  trust_score integer DEFAULT 0,
  trust_packaging_match integer DEFAULT 0,
  trust_ocr_consistency integer DEFAULT 0,
  trust_barcode_validation integer DEFAULT 0,
  trust_manufacturer_match integer DEFAULT 0,
  trust_batch_validation integer DEFAULT 0,
  trust_regulatory_evidence integer DEFAULT 0,
  risk_level text DEFAULT 'low',
  status text DEFAULT 'processing',
  ai_verdict text,
  ai_explanation text,
  ocr_confidence integer DEFAULT 0,
  barcode_valid boolean DEFAULT false,
  barcode_matches boolean DEFAULT false,
  barcode_type text,
  barcode_decoded text,
  has_recall boolean DEFAULT false,
  is_demo boolean DEFAULT false,
  scan_method text,
  image_url text,
  previous_scan_id uuid REFERENCES scans(id) ON DELETE SET NULL,
  scan_timestamp timestamptz DEFAULT now()
);

ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_scans_sel" ON scans;
CREATE POLICY "anon_crud_scans_sel" ON scans FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_scans_ins" ON scans;
CREATE POLICY "anon_crud_scans_ins" ON scans FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_scans_upd" ON scans;
CREATE POLICY "anon_crud_scans_upd" ON scans FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_scans_del" ON scans;
CREATE POLICY "anon_crud_scans_del" ON scans FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_scans_timestamp ON scans(scan_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_scans_barcode ON scans(barcode);
CREATE INDEX IF NOT EXISTS idx_scans_batch ON scans(batch_number);
CREATE INDEX IF NOT EXISTS idx_scans_status ON scans(status);
CREATE INDEX IF NOT EXISTS idx_scans_manufacturer ON scans(manufacturer);

-- ============================================================
-- 4. SCAN_EVIDENCE — Individual evidence items per scan
-- ============================================================
CREATE TABLE IF NOT EXISTS scan_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  label text NOT NULL,
  status text NOT NULL DEFAULT 'info',
  detail text,
  source text,
  confidence integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scan_evidence ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_evidence_sel" ON scan_evidence;
CREATE POLICY "anon_crud_evidence_sel" ON scan_evidence FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_evidence_ins" ON scan_evidence;
CREATE POLICY "anon_crud_evidence_ins" ON scan_evidence FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_evidence_upd" ON scan_evidence;
CREATE POLICY "anon_crud_evidence_upd" ON scan_evidence FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_evidence_del" ON scan_evidence;
CREATE POLICY "anon_crud_evidence_del" ON scan_evidence FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_evidence_scan_id ON scan_evidence(scan_id);

-- ============================================================
-- 5. SCAN_AGENTS — Agent execution records per scan
-- ============================================================
CREATE TABLE IF NOT EXISTS scan_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  agent_id text NOT NULL,
  agent_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  result text,
  duration_ms integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scan_agents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_agents_sel" ON scan_agents;
CREATE POLICY "anon_crud_agents_sel" ON scan_agents FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_agents_ins" ON scan_agents;
CREATE POLICY "anon_crud_agents_ins" ON scan_agents FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_agents_upd" ON scan_agents;
CREATE POLICY "anon_crud_agents_upd" ON scan_agents FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_agents_del" ON scan_agents;
CREATE POLICY "anon_crud_agents_del" ON scan_agents FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_agents_scan_id ON scan_agents(scan_id);

-- ============================================================
-- 6. COMMUNITY_ALERTS — Aggregated anonymous anomaly patterns
-- ============================================================
CREATE TABLE IF NOT EXISTS community_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_number text,
  manufacturer text,
  anomaly_type text NOT NULL,
  frequency integer DEFAULT 1,
  region text,
  confidence integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE community_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_alerts_sel" ON community_alerts;
CREATE POLICY "anon_crud_alerts_sel" ON community_alerts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_alerts_ins" ON community_alerts;
CREATE POLICY "anon_crud_alerts_ins" ON community_alerts FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_alerts_upd" ON community_alerts;
CREATE POLICY "anon_crud_alerts_upd" ON community_alerts FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_alerts_del" ON community_alerts;
CREATE POLICY "anon_crud_alerts_del" ON community_alerts FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_alerts_active ON community_alerts(is_active) WHERE is_active = true;

-- ============================================================
-- 7. CHAT_HISTORY — MediLens AI conversation history
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id uuid REFERENCES scans(id) ON DELETE SET NULL,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL,
  sources text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_chat_sel" ON chat_messages;
CREATE POLICY "anon_crud_chat_sel" ON chat_messages FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_chat_ins" ON chat_messages;
CREATE POLICY "anon_crud_chat_ins" ON chat_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_chat_upd" ON chat_messages;
CREATE POLICY "anon_crud_chat_upd" ON chat_messages FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_chat_del" ON chat_messages;
CREATE POLICY "anon_crud_chat_del" ON chat_messages FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_chat_scan_id ON chat_messages(scan_id);
CREATE INDEX IF NOT EXISTS idx_chat_created ON chat_messages(created_at DESC);
