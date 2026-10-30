/**
 * Real drug reference API integration.
 * Uses openFDA NDC API and RxNorm API — both free, no API key required.
 * Calls are proxied through a Supabase edge function to avoid CORS issues.
 */

import { supabase } from './supabase';

export interface OpenFDAResult {
  found: boolean;
  brandName: string;
  genericName: string;
  dosageForm: string;
  route: string;
  productNdc: string;
  packageNdc: string;
  activeIngredients: { name: string; strength: string }[];
  manufacturerName: string;
  manufacturerType: string;
  rxcui: string;
  splId: string;
  raw: Record<string, unknown>;
}

export interface RxNormResult {
  found: boolean;
  rxcui: string;
  name: string;
  synonym: string;
  score: number;
  raw: Record<string, unknown>;
}

export interface ReferenceData {
  openFDA: OpenFDAResult | null;
  rxNorm: RxNormResult | null;
  source: string;
  error: string | null;
}

const NOT_FOUND = 'Not found';

function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
      }
    }
  }
  return matrix[b.length][a.length];
}

export function stringSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 0;
  return 1 - levenshtein(a.toLowerCase(), b.toLowerCase()) / maxLen;
}

/**
 * Query openFDA NDC API through the edge function proxy.
 */
async function queryOpenFDA(searchTerm: string): Promise<OpenFDAResult | null> {
  try {
    const { data, error } = await supabase.functions.invoke('drug-reference', {
      body: { source: 'openfda', search: searchTerm },
    });

    if (error || !data || data.error) return null;

    const results = data.results;
    if (!results || !Array.isArray(results) || results.length === 0) return null;

    const first = results[0];
    const openfda = first.openfda || {};

    return {
      found: true,
      brandName: openfda.brand_name?.[0] || first.brand_name || NOT_FOUND,
      genericName: openfda.generic_name?.[0] || first.generic_name || NOT_FOUND,
      dosageForm: openfda.dosage_form?.[0] || first.dosage_form || NOT_FOUND,
      route: openfda.route?.[0] || NOT_FOUND,
      productNdc: openfda.product_ndc?.[0] || first.product_ndc || NOT_FOUND,
      packageNdc: openfda.package_ndc?.[0] || first.package_ndc?.[0] || NOT_FOUND,
      activeIngredients: (first.active_ingredients || []).map((ai: { name: string; strength: string }) => ({
        name: ai.name || NOT_FOUND,
        strength: ai.strength || NOT_FOUND,
      })),
      manufacturerName: openfda.manufacturer_name?.[0] || first.labeler_name || NOT_FOUND,
      manufacturerType: openfda.product_type?.[0] || NOT_FOUND,
      rxcui: openfda.rxcui?.[0] || NOT_FOUND,
      splId: openfda.spl_id?.[0] || NOT_FOUND,
      raw: first,
    };
  } catch {
    return null;
  }
}

/**
 * Query RxNorm approximate matching API through the edge function proxy.
 */
async function queryRxNorm(searchTerm: string): Promise<RxNormResult | null> {
  try {
    const { data, error } = await supabase.functions.invoke('drug-reference', {
      body: { source: 'rxnorm', search: searchTerm },
    });

    if (error || !data || data.error) return null;

    const candidates = data.candidates;
    if (!candidates || !Array.isArray(candidates) || candidates.length === 0) return null;

    // Find the best matching candidate
    let best: RxNormResult | null = null;
    for (const candidate of candidates) {
      const score = parseInt(candidate.score || '0');
      const result: RxNormResult = {
        found: true,
        rxcui: candidate.rxcui || NOT_FOUND,
        name: candidate.name || NOT_FOUND,
        synonym: candidate.synonym || '',
        score,
        raw: candidate,
      };
      if (!best || score > best.score) best = result;
    }

    return best;
  } catch {
    return null;
  }
}

/**
 * Fetch reference data from openFDA and RxNorm.
 * Uses OCR-extracted medicine name as the primary search term.
 */
export async function fetchReferenceData(
  medicineName: string,
  genericName: string,
  strength: string,
): Promise<ReferenceData> {
  // Build search terms from available OCR data
  const searchTerms: string[] = [];
  if (medicineName && medicineName !== 'Not detected') searchTerms.push(medicineName);
  if (genericName && genericName !== 'Not detected') {
    searchTerms.push(genericName);
    searchTerms.push(`${genericName} ${strength !== 'Not detected' ? strength : ''}`.trim());
  }

  let openFDAResult: OpenFDAResult | null = null;
  let rxNormResult: RxNormResult | null = null;

  // Try each search term until we get a result
  for (const term of searchTerms) {
    if (!term) continue;
    if (!openFDAResult) {
      openFDAResult = await queryOpenFDA(term);
    }
    if (!rxNormResult) {
      rxNormResult = await queryRxNorm(term);
    }
    if (openFDAResult && rxNormResult) break;
  }

  let source = 'None';
  let error: string | null = null;

  if (openFDAResult && rxNormResult) {
    source = 'openFDA + RxNorm';
  } else if (openFDAResult) {
    source = 'openFDA';
  } else if (rxNormResult) {
    source = 'RxNorm';
  }

  if (!openFDAResult && !rxNormResult) {
    error = 'No reliable reference match found in openFDA or RxNorm databases.';
  }

  return {
    openFDA: openFDAResult,
    rxNorm: rxNormResult,
    source,
    error,
  };
}

export { NOT_FOUND };
