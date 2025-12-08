/**
 * BOM Similarity Calculator
 * Computes similarity score between BOM summaries using component analysis
 */

import type { BOMSummary } from './types';

// Feature weights for BOM similarity
const WEIGHTS = {
  total_line_items: 0.15,
  ic_count: 0.20,
  passive_count: 0.10,
  connector_count: 0.15,
  mcu_similarity: 0.15,
  rf_module_similarity: 0.15,
  sensor_similarity: 0.10,
};

/**
 * Calculate similarity between two BOM summaries
 * Returns a value between 0 (completely different) and 1 (identical)
 */
export function calculateBOMSimilarity(
  bom1: BOMSummary,
  bom2: BOMSummary
): number {
  let totalWeight = 0;
  let weightedScore = 0;

  // 1. Total line items similarity
  const lineItemsSim = calculateCountSimilarity(bom1.total_line_items, bom2.total_line_items);
  weightedScore += WEIGHTS.total_line_items * lineItemsSim;
  totalWeight += WEIGHTS.total_line_items;

  // 2. IC count similarity
  const icSim = calculateCountSimilarity(bom1.ic_count, bom2.ic_count);
  weightedScore += WEIGHTS.ic_count * icSim;
  totalWeight += WEIGHTS.ic_count;

  // 3. Passive count similarity
  const passiveSim = calculateCountSimilarity(bom1.passive_count, bom2.passive_count);
  weightedScore += WEIGHTS.passive_count * passiveSim;
  totalWeight += WEIGHTS.passive_count;

  // 4. Connector count similarity
  const connectorSim = calculateCountSimilarity(bom1.connector_count, bom2.connector_count);
  weightedScore += WEIGHTS.connector_count * connectorSim;
  totalWeight += WEIGHTS.connector_count;

  // 5. MCU part similarity (check if any MCU parts overlap)
  const mcuSim = calculateArraySimilarity(
    bom1.mcu_part_numbers || [],
    bom2.mcu_part_numbers || []
  );
  weightedScore += WEIGHTS.mcu_similarity * mcuSim;
  totalWeight += WEIGHTS.mcu_similarity;

  // 6. RF module similarity
  const rfSim = calculateArraySimilarity(
    bom1.rf_module_parts || [],
    bom2.rf_module_parts || []
  );
  weightedScore += WEIGHTS.rf_module_similarity * rfSim;
  totalWeight += WEIGHTS.rf_module_similarity;

  // 7. Sensor parts similarity
  const sensorSim = calculateArraySimilarity(
    bom1.sensor_parts || [],
    bom2.sensor_parts || []
  );
  weightedScore += WEIGHTS.sensor_similarity * sensorSim;
  totalWeight += WEIGHTS.sensor_similarity;

  return totalWeight > 0 ? weightedScore / totalWeight : 0;
}

/**
 * Calculate similarity between two count values using log scale
 */
function calculateCountSimilarity(count1: number, count2: number): number {
  if (count1 === 0 && count2 === 0) return 1;
  if (count1 === 0 || count2 === 0) return 0.3;

  const log1 = Math.log(count1 + 1);
  const log2 = Math.log(count2 + 1);
  const maxLog = Math.max(log1, log2);

  return 1 - Math.abs(log1 - log2) / maxLog;
}

/**
 * Calculate Jaccard similarity between two arrays of part numbers
 */
function calculateArraySimilarity(arr1: string[], arr2: string[]): number {
  // Both empty = similar (no special parts needed)
  if (arr1.length === 0 && arr2.length === 0) return 0.8;

  // One empty, one not = some penalty but not complete mismatch
  if (arr1.length === 0 || arr2.length === 0) return 0.3;

  // Normalize part numbers for comparison
  const set1 = new Set(arr1.map(normalizePartNumber));
  const set2 = new Set(arr2.map(normalizePartNumber));

  // Calculate Jaccard index
  const intersection = new Set(Array.from(set1).filter(x => set2.has(x)));
  const union = new Set([...Array.from(set1), ...Array.from(set2)]);

  if (union.size === 0) return 1;

  return intersection.size / union.size;
}

/**
 * Normalize a part number for comparison
 * Removes common prefixes, suffixes, and standardizes format
 */
function normalizePartNumber(partNumber: string): string {
  return partNumber
    .toUpperCase()
    .replace(/[-_\s]/g, '')
    .replace(/^(IC|U|R|C|L|D|Q|J|CN|FPC)\d*/i, '') // Remove component designators
    .trim();
}

/**
 * Extract key component families from a BOM for quick comparison
 */
export function extractComponentFamilies(bom: BOMSummary): string[] {
  const families = new Set<string>();

  // Extract MCU families
  for (const part of bom.mcu_part_numbers || []) {
    const family = extractFamily(part);
    if (family) families.add(`MCU:${family}`);
  }

  // Extract RF module families
  for (const part of bom.rf_module_parts || []) {
    const family = extractFamily(part);
    if (family) families.add(`RF:${family}`);
  }

  // Extract sensor families
  for (const part of bom.sensor_parts || []) {
    const family = extractFamily(part);
    if (family) families.add(`SENSOR:${family}`);
  }

  return Array.from(families);
}

/**
 * Extract component family from part number
 */
function extractFamily(partNumber: string): string | null {
  // Common MCU families
  const mcuPatterns = [
    /STM32[A-Z]\d/i,
    /ESP32/i,
    /nRF5/i,
    /ATmega/i,
    /PIC\d{2}/i,
    /MSP430/i,
    /LPC\d{4}/i,
  ];

  for (const pattern of mcuPatterns) {
    const match = partNumber.match(pattern);
    if (match) return match[0].toUpperCase();
  }

  // Return first 6 chars as generic family
  const clean = partNumber.replace(/[-_\s]/g, '').toUpperCase();
  return clean.length >= 4 ? clean.substring(0, 6) : null;
}

/**
 * Calculate BOM complexity score (for risk assessment)
 */
export function calculateBOMComplexity(bom: BOMSummary): number {
  let score = 0;

  // Line items contribution
  score += Math.min(bom.total_line_items / 200, 1) * 0.25;

  // IC count contribution
  score += Math.min(bom.ic_count / 50, 1) * 0.25;

  // Special parts contribution
  const specialParts =
    (bom.mcu_part_numbers?.length || 0) +
    (bom.rf_module_parts?.length || 0) +
    (bom.sensor_parts?.length || 0);
  score += Math.min(specialParts / 10, 1) * 0.25;

  // Connector count (complexity indicator)
  score += Math.min(bom.connector_count / 20, 1) * 0.25;

  return Math.min(score, 1);
}

/**
 * Get a description of BOM similarity for UI display
 */
export function describeBOMSimilarity(similarity: number): string {
  if (similarity >= 0.9) return 'Nearly identical BOM structure';
  if (similarity >= 0.8) return 'Very similar component mix';
  if (similarity >= 0.7) return 'Similar BOM with some differences';
  if (similarity >= 0.5) return 'Moderately similar BOM';
  if (similarity >= 0.3) return 'Some component similarities';
  return 'Different component requirements';
}

/**
 * Create empty BOM summary with defaults
 */
export function createEmptyBOMSummary(): BOMSummary {
  return {
    total_line_items: 0,
    ic_count: 0,
    passive_count: 0,
    connector_count: 0,
    mcu_part_numbers: [],
    rf_module_parts: [],
    sensor_parts: [],
  };
}
