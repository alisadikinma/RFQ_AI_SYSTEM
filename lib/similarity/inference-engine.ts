/**
 * Station Inference Engine
 * Recommends missing stations based on PCB features using triggers_if from station_master
 */

import { getInferredStations, getMasterStations } from './db-queries';
import type { PCBFeatures, InferenceResult, StationMaster, FeatureTriggers } from './types';

/**
 * Convert PCB features to trigger flags for database lookup
 */
export function featuresToTriggers(features: PCBFeatures): FeatureTriggers {
  return {
    has_rf: features.has_rf,
    has_wireless: features.has_rf,
    has_wifi: features.has_rf,
    has_bluetooth: features.has_rf,
    has_cellular: features.has_rf,
    has_sensors: features.has_sensors,
    has_adc: features.has_sensors,
    has_display: features.has_display_connector,
    has_touchscreen: features.has_display_connector,
    has_backlight: features.has_display_connector,
    has_battery: features.has_battery_connector,
    has_power_stage: features.has_power_stage,
    has_high_voltage: features.has_power_stage,
    has_bga: features.bga_count > 0,
    has_fine_pitch: features.fine_pitch_count > 5,
    has_mcu: features.smt_component_count > 50,
    has_firmware: features.smt_component_count > 50,
    is_pcba: true,
    is_panel: features.cavity_count > 1,
    multi_cavity: features.cavity_count > 1,
    is_subboard: false,
    high_volume: false,
  };
}

/**
 * Infer missing stations based on PCB features
 * Uses station_master.triggers_if from database
 */
export async function inferMissingStations(
  features: PCBFeatures,
  existingStationCodes: string[]
): Promise<InferenceResult> {
  const triggers = featuresToTriggers(features);
  const existing = new Set(existingStationCodes.map(s => s.toUpperCase()));

  // Get stations from DB that match triggers
  const inferredStations = await getInferredStations(triggers);

  // Filter out already existing stations
  const recommended: StationMaster[] = [];
  const rulesApplied: string[] = [];

  for (const station of inferredStations) {
    if (!existing.has(station.code)) {
      recommended.push(station);

      // Build rule explanation
      const matchedTriggers = (station.triggers_if || []).filter(t => {
        const key = t as keyof FeatureTriggers;
        return triggers[key];
      });

      rulesApplied.push(
        `${station.code}: Triggered by [${matchedTriggers.join(', ')}] → ${station.description}`
      );
    }
  }

  // Generate warnings for critical missing stations
  const warnings: string[] = [];

  // BGA without X-ray inspection
  if (features.bga_count > 0 && !existing.has('AXI') && !recommended.find(s => s.code === 'AXI')) {
    warnings.push('BGA present but no AXI station - X-ray inspection recommended for solder joint quality');
  }

  // Many fine-pitch without AOI
  if (features.fine_pitch_count > 5 && !existing.has('AOI') && !recommended.find(s => s.code === 'AOI')) {
    warnings.push('Many fine-pitch components but no AOI - automated optical inspection strongly recommended');
  }

  // Multi-cavity without router
  if (features.cavity_count > 1 && !existing.has('ROUTER') && !recommended.find(s => s.code === 'ROUTER')) {
    warnings.push('Multi-cavity panel but no ROUTER station - depaneling required before testing');
  }

  // RF without proper testing
  if (features.has_rf && !existing.has('RFT') && !existing.has('CAL') && !recommended.find(s => s.code === 'RFT')) {
    warnings.push('RF functionality detected but no RFT/CAL stations - RF testing and calibration required');
  }

  // Display without backlight/MMI test
  if (features.has_display_connector && !existing.has('BLMMI') && !recommended.find(s => s.code === 'BLMMI')) {
    warnings.push('Display connector present but no backlight/MMI test - display testing recommended');
  }

  // Battery without power test
  if (features.has_battery_connector && !existing.has('POWER_TEST') && !existing.has('CAL')) {
    warnings.push('Battery connector present - ensure power/charging tests are included');
  }

  // High component count without FQC
  if (features.smt_component_count > 100 && !existing.has('FQC')) {
    warnings.push('High component count but no FQC - final quality control recommended');
  }

  return {
    recommended_stations: recommended,
    rules_applied: rulesApplied,
    warnings,
  };
}

/**
 * Get optimal station sequence based on EMS best practices
 * Returns station codes in recommended order
 */
export async function getOptimalSequence(): Promise<string[]> {
  const stations = await getMasterStations();

  // Define category order (process flow)
  const categoryOrder: Record<string, number> = {
    'Programming': 1,      // First: program firmware
    'Inspection': 2,       // Then: inspect assembly
    'Testing': 3,          // Then: functional testing
    'Assembly': 4,         // Finally: packaging/assembly
  };

  // Sort by category order, then by typical_uph (faster first within category)
  return stations
    .sort((a, b) => {
      const catA = categoryOrder[a.category] ?? 99;
      const catB = categoryOrder[b.category] ?? 99;
      if (catA !== catB) return catA - catB;
      return (b.typical_uph || 0) - (a.typical_uph || 0);
    })
    .map(s => s.code);
}

/**
 * Suggest station order optimization for given stations
 */
export async function suggestStationOrder(
  stationCodes: string[]
): Promise<{
  suggestedOrder: string[];
  reorderingNeeded: boolean;
  suggestions: string[];
}> {
  const optimalSequence = await getOptimalSequence();
  const suggestions: string[] = [];

  // Create position map for optimal sequence
  const optimalPosition = new Map<string, number>();
  optimalSequence.forEach((code, index) => {
    optimalPosition.set(code, index);
  });

  // Sort input stations according to optimal sequence
  const suggestedOrder = [...stationCodes].sort((a, b) => {
    const posA = optimalPosition.get(a.toUpperCase()) ?? 999;
    const posB = optimalPosition.get(b.toUpperCase()) ?? 999;
    return posA - posB;
  });

  // Check if reordering is needed
  const reorderingNeeded = JSON.stringify(stationCodes.map(s => s.toUpperCase())) !==
    JSON.stringify(suggestedOrder.map(s => s.toUpperCase()));

  if (reorderingNeeded) {
    // Identify specific out-of-order stations
    for (let i = 0; i < stationCodes.length; i++) {
      const current = stationCodes[i].toUpperCase();
      const suggested = suggestedOrder[i].toUpperCase();
      if (current !== suggested) {
        suggestions.push(`Consider moving ${current} - currently at position ${i + 1}, optimal at position ${suggestedOrder.findIndex(s => s.toUpperCase() === current) + 1}`);
      }
    }
  }

  return { suggestedOrder, reorderingNeeded, suggestions };
}

/**
 * Calculate risk score based on station coverage and PCB complexity
 */
export function calculateRiskScore(
  features: PCBFeatures,
  stationCodes: string[],
  inference: InferenceResult
): {
  score: number;
  level: 'low' | 'medium' | 'high';
  factors: string[];
} {
  let score = 0;
  const factors: string[] = [];

  // Add risk for missing recommended stations
  if (inference.recommended_stations.length > 0) {
    score += Math.min(inference.recommended_stations.length * 10, 30);
    factors.push(`${inference.recommended_stations.length} recommended stations missing`);
  }

  // Add risk for warnings
  if (inference.warnings.length > 0) {
    score += Math.min(inference.warnings.length * 15, 30);
    factors.push(`${inference.warnings.length} process warnings`);
  }

  // Add risk for complex PCB features
  if (features.bga_count > 0) {
    score += 10;
    factors.push('BGA components increase complexity');
  }

  if (features.fine_pitch_count > 10) {
    score += 10;
    factors.push('High fine-pitch count increases defect risk');
  }

  if (features.has_rf) {
    score += 5;
    factors.push('RF functionality requires careful testing');
  }

  // Reduce risk for comprehensive coverage
  if (stationCodes.length >= 8) {
    score -= 10;
    factors.push('Good station coverage');
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  // Determine risk level
  let level: 'low' | 'medium' | 'high' = 'low';
  if (score >= 50) level = 'high';
  else if (score >= 25) level = 'medium';

  return { score, level, factors };
}

/**
 * Get description of inference result for UI display
 */
export function describeInference(inference: InferenceResult): string {
  if (inference.recommended_stations.length === 0 && inference.warnings.length === 0) {
    return 'Station coverage looks complete';
  }

  const parts: string[] = [];

  if (inference.recommended_stations.length > 0) {
    parts.push(`${inference.recommended_stations.length} additional station(s) recommended`);
  }

  if (inference.warnings.length > 0) {
    parts.push(`${inference.warnings.length} process warning(s)`);
  }

  return parts.join(', ');
}
