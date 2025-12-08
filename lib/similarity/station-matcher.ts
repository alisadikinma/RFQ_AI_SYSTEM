/**
 * Station Matcher
 * Matches RFQ stations against reference models using station_aliases table
 */

import { resolveStationAlias, resolveStationAliases } from './db-queries';
import type { StationConfig, StationMatch, StationMatchResult } from './types';

/**
 * Match RFQ stations against reference model stations using station_aliases
 * Returns matched stations, missing stations, and extra stations
 */
export async function matchStations(
  rfqStations: StationConfig[],
  referenceStations: StationConfig[],
  customerId?: string
): Promise<StationMatchResult> {
  // Collect all unique station terms
  const allTerms = Array.from(new Set([
    ...rfqStations.map(s => s.station_code),
    ...referenceStations.map(s => s.station_code),
  ]));

  // Batch resolve all aliases
  const aliasMap = await resolveStationAliases(allTerms, customerId);

  // Convert RFQ stations to master codes
  const rfqMasterCodes = new Set<string>();
  const matched: StationMatch[] = [];

  for (const station of rfqStations) {
    const alias = aliasMap.get(station.station_code);
    if (alias?.master) {
      rfqMasterCodes.add(alias.master.code);
      matched.push({
        customer_term: station.station_code,
        master_code: alias.master.code,
        master_name: alias.master.name,
        confidence: alias.confidence,
      });
    } else {
      // Unknown station - keep as-is with low confidence
      const normalizedCode = station.station_code.toUpperCase().trim();
      rfqMasterCodes.add(normalizedCode);
      matched.push({
        customer_term: station.station_code,
        master_code: normalizedCode,
        master_name: station.station_code,
        confidence: 'low',
      });
    }
  }

  // Convert reference stations to master codes
  const refMasterCodes = new Set<string>();
  for (const station of referenceStations) {
    const alias = aliasMap.get(station.station_code);
    refMasterCodes.add(alias?.master?.code || station.station_code.toUpperCase().trim());
  }

  // Calculate differences
  const missing = Array.from(refMasterCodes).filter(code => !rfqMasterCodes.has(code));
  const extra = Array.from(rfqMasterCodes).filter(code => !refMasterCodes.has(code));

  // Calculate match percentage
  const matchPercentage = refMasterCodes.size > 0
    ? Math.round(((refMasterCodes.size - missing.length) / refMasterCodes.size) * 100)
    : 100;

  return { matched, missing, extra, matchPercentage };
}

/**
 * Normalize a single station term to standard code
 * Uses database lookup instead of hardcoded mappings
 */
export async function normalizeStationCode(
  customerTerm: string,
  customerId?: string
): Promise<StationMatch> {
  const alias = await resolveStationAlias(customerTerm, customerId);

  if (alias?.master) {
    return {
      customer_term: customerTerm,
      master_code: alias.master.code,
      master_name: alias.master.name,
      confidence: alias.confidence,
    };
  }

  return {
    customer_term: customerTerm,
    master_code: customerTerm.toUpperCase().trim(),
    master_name: customerTerm,
    confidence: 'low',
  };
}

/**
 * Compare two station sequences and calculate similarity
 * Takes into account both station presence and ordering
 */
export async function compareStationSequences(
  sequence1: StationConfig[],
  sequence2: StationConfig[],
  customerId?: string
): Promise<{
  presenceSimilarity: number;
  sequenceSimilarity: number;
  overallSimilarity: number;
}> {
  // Get match result
  const matchResult = await matchStations(sequence1, sequence2, customerId);

  // Presence similarity (Jaccard index)
  const seq1Codes = new Set(matchResult.matched.map(m => m.master_code));
  const seq2Set = new Set([
    ...sequence2.map(s => s.station_code.toUpperCase()),
    ...matchResult.missing,
  ].filter(Boolean));

  const intersection = Array.from(seq1Codes).filter(c => seq2Set.has(c)).length;
  const union = new Set([...Array.from(seq1Codes), ...Array.from(seq2Set)]).size;
  const presenceSimilarity = union > 0 ? intersection / union : 1;

  // Sequence similarity (order correlation)
  // Simple approach: check how many stations are in the same relative order
  let sequenceSimilarity = 1;
  if (matchResult.matched.length >= 2 && sequence2.length >= 2) {
    const matchedInOrder = matchResult.matched.filter((m, i) => {
      if (i === 0) return true;
      const prevMatch = matchResult.matched[i - 1];
      const seq2Index1 = sequence2.findIndex(s =>
        s.station_code.toUpperCase() === prevMatch.master_code
      );
      const seq2Index2 = sequence2.findIndex(s =>
        s.station_code.toUpperCase() === m.master_code
      );
      return seq2Index1 < seq2Index2;
    });
    sequenceSimilarity = matchedInOrder.length / matchResult.matched.length;
  }

  // Overall: presence is more important than sequence
  const overallSimilarity = presenceSimilarity * 0.7 + sequenceSimilarity * 0.3;

  return { presenceSimilarity, sequenceSimilarity, overallSimilarity };
}

/**
 * Find common stations between two lists
 */
export async function findCommonStations(
  stations1: StationConfig[],
  stations2: StationConfig[],
  customerId?: string
): Promise<StationMatch[]> {
  const allTerms = [
    ...stations1.map(s => s.station_code),
    ...stations2.map(s => s.station_code),
  ];

  const aliasMap = await resolveStationAliases(allTerms, customerId);

  const codes1 = new Set(
    stations1.map(s => {
      const alias = aliasMap.get(s.station_code);
      return alias?.master?.code || s.station_code.toUpperCase();
    })
  );

  const codes2 = new Set(
    stations2.map(s => {
      const alias = aliasMap.get(s.station_code);
      return alias?.master?.code || s.station_code.toUpperCase();
    })
  );

  const common: StationMatch[] = [];

  for (const station of stations1) {
    const alias = aliasMap.get(station.station_code);
    const code = alias?.master?.code || station.station_code.toUpperCase();

    if (codes2.has(code)) {
      common.push({
        customer_term: station.station_code,
        master_code: code,
        master_name: alias?.master?.name || station.station_code,
        confidence: alias?.confidence || 'low',
      });
    }
  }

  return common;
}

/**
 * Get a description of station match quality
 */
export function describeStationMatch(matchPercentage: number): string {
  if (matchPercentage >= 95) return 'Excellent station coverage';
  if (matchPercentage >= 85) return 'Very good station match';
  if (matchPercentage >= 70) return 'Good station match with gaps';
  if (matchPercentage >= 50) return 'Partial station match';
  if (matchPercentage >= 25) return 'Limited station overlap';
  return 'Minimal station match';
}
