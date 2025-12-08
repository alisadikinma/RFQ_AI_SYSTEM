/**
 * PCB Similarity Calculator
 * Computes similarity score between PCB features using weighted Euclidean distance
 */

import type { PCBFeatures } from './types';

// Feature weights for similarity calculation
const WEIGHTS = {
  // Dimensions (most important for process compatibility)
  dimensions: 0.25,
  layer_count: 0.10,
  cavity_count: 0.08,

  // Component complexity
  smt_component_count: 0.12,
  bga_count: 0.10,
  fine_pitch_count: 0.08,

  // Boolean features (for process requirements)
  has_rf: 0.07,
  has_power_stage: 0.05,
  has_sensors: 0.05,
  has_display_connector: 0.05,
  has_battery_connector: 0.05,
};

/**
 * Calculate similarity between two PCB feature sets
 * Returns a value between 0 (completely different) and 1 (identical)
 */
export function calculatePCBSimilarity(
  pcb1: PCBFeatures,
  pcb2: PCBFeatures
): number {
  let totalWeight = 0;
  let weightedScore = 0;

  // 1. Dimension similarity (area-based)
  const area1 = pcb1.length_mm * pcb1.width_mm;
  const area2 = pcb2.length_mm * pcb2.width_mm;
  const areaSim = 1 - Math.abs(area1 - area2) / Math.max(area1, area2, 1);
  weightedScore += WEIGHTS.dimensions * Math.max(0, areaSim);
  totalWeight += WEIGHTS.dimensions;

  // 2. Layer count similarity
  const layerSim = 1 - Math.abs(pcb1.layer_count - pcb2.layer_count) / Math.max(pcb1.layer_count, pcb2.layer_count, 1);
  weightedScore += WEIGHTS.layer_count * Math.max(0, layerSim);
  totalWeight += WEIGHTS.layer_count;

  // 3. Cavity count similarity
  const cavitySim = pcb1.cavity_count === pcb2.cavity_count ? 1 :
    1 - Math.abs(pcb1.cavity_count - pcb2.cavity_count) / Math.max(pcb1.cavity_count, pcb2.cavity_count, 1);
  weightedScore += WEIGHTS.cavity_count * Math.max(0, cavitySim);
  totalWeight += WEIGHTS.cavity_count;

  // 4. SMT component count similarity (log scale for large differences)
  const smtSim = calculateCountSimilarity(pcb1.smt_component_count, pcb2.smt_component_count);
  weightedScore += WEIGHTS.smt_component_count * smtSim;
  totalWeight += WEIGHTS.smt_component_count;

  // 5. BGA count similarity
  const bgaSim = calculateCountSimilarity(pcb1.bga_count, pcb2.bga_count);
  weightedScore += WEIGHTS.bga_count * bgaSim;
  totalWeight += WEIGHTS.bga_count;

  // 6. Fine pitch count similarity
  const finePitchSim = calculateCountSimilarity(pcb1.fine_pitch_count, pcb2.fine_pitch_count);
  weightedScore += WEIGHTS.fine_pitch_count * finePitchSim;
  totalWeight += WEIGHTS.fine_pitch_count;

  // 7. Boolean features (exact match = 1, mismatch = 0)
  const booleanFeatures: (keyof PCBFeatures)[] = [
    'has_rf',
    'has_power_stage',
    'has_sensors',
    'has_display_connector',
    'has_battery_connector',
  ];

  for (const feature of booleanFeatures) {
    const key = feature as keyof typeof WEIGHTS;
    if (WEIGHTS[key]) {
      const match = pcb1[feature] === pcb2[feature] ? 1 : 0;
      weightedScore += WEIGHTS[key] * match;
      totalWeight += WEIGHTS[key];
    }
  }

  // Normalize to 0-1 range
  return totalWeight > 0 ? weightedScore / totalWeight : 0;
}

/**
 * Calculate similarity between two count values using log scale
 * This handles large differences in component counts more gracefully
 */
function calculateCountSimilarity(count1: number, count2: number): number {
  if (count1 === 0 && count2 === 0) return 1;
  if (count1 === 0 || count2 === 0) return 0.5; // One has, one doesn't

  const log1 = Math.log(count1 + 1);
  const log2 = Math.log(count2 + 1);
  const maxLog = Math.max(log1, log2);

  return 1 - Math.abs(log1 - log2) / maxLog;
}

/**
 * Calculate dimensional similarity only (for quick filtering)
 */
export function calculateDimensionSimilarity(
  pcb1: Pick<PCBFeatures, 'length_mm' | 'width_mm'>,
  pcb2: Pick<PCBFeatures, 'length_mm' | 'width_mm'>
): number {
  const area1 = pcb1.length_mm * pcb1.width_mm;
  const area2 = pcb2.length_mm * pcb2.width_mm;

  if (area1 === 0 && area2 === 0) return 1;
  if (area1 === 0 || area2 === 0) return 0;

  return 1 - Math.abs(area1 - area2) / Math.max(area1, area2);
}

/**
 * Calculate complexity score for a PCB (for risk assessment)
 */
export function calculatePCBComplexity(pcb: PCBFeatures): number {
  let score = 0;

  // Layer count contribution (more layers = more complex)
  score += Math.min(pcb.layer_count / 10, 1) * 0.2;

  // Component count contribution
  score += Math.min(pcb.smt_component_count / 500, 1) * 0.2;

  // BGA contribution (significant complexity)
  score += Math.min(pcb.bga_count / 10, 1) * 0.2;

  // Fine pitch contribution
  score += Math.min(pcb.fine_pitch_count / 50, 1) * 0.15;

  // Feature flags contribution
  const features = [
    pcb.has_rf,
    pcb.has_power_stage,
    pcb.has_sensors,
    pcb.has_display_connector,
    pcb.has_battery_connector,
  ];
  const featureCount = features.filter(Boolean).length;
  score += (featureCount / features.length) * 0.25;

  return Math.min(score, 1);
}

/**
 * Get a description of PCB similarity for UI display
 */
export function describePCBSimilarity(similarity: number): string {
  if (similarity >= 0.9) return 'Nearly identical PCB design';
  if (similarity >= 0.8) return 'Very similar PCB characteristics';
  if (similarity >= 0.7) return 'Similar PCB with minor differences';
  if (similarity >= 0.5) return 'Moderately similar PCB';
  if (similarity >= 0.3) return 'Some PCB similarities';
  return 'Different PCB design';
}

/**
 * Create empty PCB features object with defaults
 */
export function createEmptyPCBFeatures(): PCBFeatures {
  return {
    length_mm: 0,
    width_mm: 0,
    layer_count: 2,
    cavity_count: 1,
    side_count: 2,
    smt_component_count: 0,
    bga_count: 0,
    fine_pitch_count: 0,
    has_rf: false,
    has_power_stage: false,
    has_sensors: false,
    has_display_connector: false,
    has_battery_connector: false,
  };
}
