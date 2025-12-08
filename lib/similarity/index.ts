/**
 * Similarity Engine
 * Main module for RFQ model matching and station inference
 *
 * Architecture:
 * - Uses station_master table for standard station definitions
 * - Uses station_aliases table for customer-specific naming
 * - Uses triggers_if for intelligent station inference
 */

import { supabase } from '@/lib/supabase/client';
import { calculatePCBSimilarity, createEmptyPCBFeatures, calculatePCBComplexity } from './pcb-similarity';
import { calculateBOMSimilarity, createEmptyBOMSummary, calculateBOMComplexity } from './bom-similarity';
import { matchStations, normalizeStationCode } from './station-matcher';
import { inferMissingStations, getOptimalSequence, calculateRiskScore } from './inference-engine';
import { getMasterStations, resolveStationAliases, resolveStationAlias } from './db-queries';
import type {
  PCBFeatures,
  BOMSummary,
  StationConfig,
  SimilarityResult,
  StationMaster,
  RFQAnalysisResult,
} from './types';

// Re-export everything for convenience
export * from './types';
export {
  // PCB
  calculatePCBSimilarity,
  createEmptyPCBFeatures,
  calculatePCBComplexity,
  // BOM
  calculateBOMSimilarity,
  createEmptyBOMSummary,
  calculateBOMComplexity,
  // Station Matching
  matchStations,
  normalizeStationCode,
  // Inference
  inferMissingStations,
  getOptimalSequence,
  calculateRiskScore,
  // DB Queries
  getMasterStations,
  resolveStationAliases,
  resolveStationAlias,
};

// Similarity weights
const PCB_WEIGHT = 0.6;
const BOM_WEIGHT = 0.4;

/**
 * Find top N similar models for a new RFQ
 * This is the main entry point for model matching
 */
export async function findSimilarModels(
  rfqPCB: PCBFeatures,
  rfqBOM: BOMSummary,
  rfqStations: StationConfig[],
  customerId?: string,
  topN: number = 5
): Promise<SimilarityResult[]> {
  // Fetch all active models with features
  const { data: models, error } = await supabase
    .from('models')
    .select(`
      id,
      code,
      name,
      customer:customers(id, code, name),
      stations:model_stations(
        board_type,
        sequence,
        manpower,
        machine:station_master(id, code, name, category, typical_uph)
      ),
      pcb:pcb_features(*),
      bom:bom_data(*)
    `)
    .eq('status', 'active');

  if (error) throw error;
  if (!models || models.length === 0) return [];

  const results: SimilarityResult[] = [];

  for (const model of models) {
    // Get PCB features (first entry or create empty)
    const modelPCBArray = model.pcb as unknown as PCBFeatures[] | null;
    const modelPCB = modelPCBArray && modelPCBArray.length > 0
      ? modelPCBArray[0]
      : createEmptyPCBFeatures();

    // Get BOM data (first entry or create empty)
    const modelBOMArray = model.bom as unknown as BOMSummary[] | null;
    const modelBOM = modelBOMArray && modelBOMArray.length > 0
      ? modelBOMArray[0]
      : createEmptyBOMSummary();

    // Convert model stations to StationConfig format
    const modelStations: StationConfig[] = (model.stations as any[] || []).map((s: any) => ({
      board_type: s.board_type,
      station_code: s.machine?.code || '',
      master_code: s.machine?.code,
      sequence: s.sequence,
      manpower: s.manpower,
    })).filter(s => s.station_code);

    // Calculate similarities
    const pcbSim = calculatePCBSimilarity(rfqPCB, modelPCB);
    const bomSim = calculateBOMSimilarity(rfqBOM, modelBOM);
    const overallSim = (PCB_WEIGHT * pcbSim) + (BOM_WEIGHT * bomSim);

    // Match stations using aliases
    const stationMatch = await matchStations(
      rfqStations,
      modelStations,
      customerId
    );

    // Factor in station match to overall similarity
    const stationBonus = (stationMatch.matchPercentage / 100) * 0.1;
    const adjustedSimilarity = Math.min(1, overallSim + stationBonus);

    // Determine confidence level
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (adjustedSimilarity >= 0.85) confidence = 'high';
    else if (adjustedSimilarity >= 0.70) confidence = 'medium';

    const customer = model.customer as any;

    results.push({
      model_id: model.id,
      model_code: model.code,
      customer: customer?.name || customer?.code || 'Unknown',
      pcb_similarity: Math.round(pcbSim * 100) / 100,
      bom_similarity: Math.round(bomSim * 100) / 100,
      overall_similarity: Math.round(adjustedSimilarity * 100) / 100,
      matched_stations: stationMatch.matched,
      missing_stations: stationMatch.missing,
      extra_stations: stationMatch.extra,
      confidence,
    });
  }

  // Sort by overall similarity (descending) and return top N
  return results
    .sort((a, b) => b.overall_similarity - a.overall_similarity)
    .slice(0, topN);
}

/**
 * Full RFQ analysis: similarity matching + station inference
 * This provides a complete analysis for an RFQ request
 */
export async function analyzeRFQ(
  rfqPCB: PCBFeatures,
  rfqBOM: BOMSummary,
  rfqStations: StationConfig[],
  customerId?: string
): Promise<RFQAnalysisResult> {
  // Find similar models
  const similarModels = await findSimilarModels(
    rfqPCB,
    rfqBOM,
    rfqStations,
    customerId,
    5
  );

  // Infer missing stations based on PCB features
  const existingCodes = rfqStations.map(s => s.station_code);
  const inference = await inferMissingStations(rfqPCB, existingCodes);

  // Get optimal station sequence
  const optimalSequence = await getOptimalSequence();

  return {
    similar_models: similarModels,
    top_match: similarModels[0] || null,
    inference,
    optimal_sequence: optimalSequence,
    rfq_coverage: {
      stations_provided: rfqStations.length,
      stations_inferred: inference.recommended_stations.length,
      warnings_count: inference.warnings.length,
    },
  };
}

/**
 * Quick similarity check (PCB only, no DB lookups)
 * Useful for filtering before full analysis
 */
export function quickSimilarityCheck(
  pcb1: PCBFeatures,
  pcb2: PCBFeatures,
  threshold: number = 0.5
): boolean {
  const similarity = calculatePCBSimilarity(pcb1, pcb2);
  return similarity >= threshold;
}

/**
 * Get similarity score description for UI
 */
export function getSimilarityDescription(score: number): string {
  if (score >= 0.95) return 'Excellent match - nearly identical';
  if (score >= 0.85) return 'Very good match';
  if (score >= 0.70) return 'Good match with minor differences';
  if (score >= 0.50) return 'Moderate match';
  if (score >= 0.30) return 'Some similarities';
  return 'Low similarity';
}

/**
 * Get confidence level color for UI
 */
export function getConfidenceColor(confidence: 'high' | 'medium' | 'low'): string {
  switch (confidence) {
    case 'high': return 'text-green-600';
    case 'medium': return 'text-amber-600';
    case 'low': return 'text-red-600';
  }
}

/**
 * Calculate overall complexity score for an RFQ
 */
export function calculateOverallComplexity(
  pcb: PCBFeatures,
  bom: BOMSummary
): {
  score: number;
  level: 'simple' | 'medium' | 'complex';
  description: string;
} {
  const pcbComplexity = calculatePCBComplexity(pcb);
  const bomComplexity = calculateBOMComplexity(bom);
  const score = (pcbComplexity + bomComplexity) / 2;

  let level: 'simple' | 'medium' | 'complex' = 'simple';
  let description = 'Standard manufacturing process';

  if (score >= 0.7) {
    level = 'complex';
    description = 'Complex assembly requiring special processes';
  } else if (score >= 0.4) {
    level = 'medium';
    description = 'Moderate complexity with standard processes';
  }

  return {
    score: Math.round(score * 100) / 100,
    level,
    description,
  };
}
