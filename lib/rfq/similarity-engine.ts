/**
 * Similarity Engine
 * Jaccard similarity calculation for finding similar historical models
 * based on station codes
 */

import { supabase } from '@/lib/supabase/client';
import type {
  SimilarModel,
  ModelDetail,
  ModelStationDetail,
  ModelSummary,
  CostEstimate,
  ComparisonStats,
} from './types';

// Constants for cost estimation
const LABOR_COST_PER_MP = 700; // USD per month per manpower
const WORKING_HOURS_PER_DAY = 20;
const WORKING_DAYS_PER_MONTH = 24;
const DEPRECIATION_MONTHS = 36; // 3 years

// Types for Supabase query results
interface ModelQueryResult {
  id: string;
  code: string;
  board_types: string[] | null;
  status: string;
  customer: { code: string; name: string } | { code: string; name: string }[] | null;
  stations: StationQueryResult[];
}

interface StationQueryResult {
  id: string;
  board_type: string;
  sequence: number;
  manpower: number;
  station: StationMasterResult | StationMasterResult[] | null;
}

interface StationMasterResult {
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  typical_uph: number | null;
  typical_cycle_time_sec: number | null;
  typical_investment: number | null;
}

/**
 * Calculate Jaccard similarity between two sets
 * J(A,B) = |A ∩ B| / |A ∪ B| × 100%
 */
function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 100;
  if (setA.size === 0 || setB.size === 0) return 0;

  const intersection = Array.from(setA).filter(x => setB.has(x));
  const union = new Set([...Array.from(setA), ...Array.from(setB)]);

  if (union.size === 0) return 0;
  return Math.round((intersection.length / union.size) * 100);
}

/**
 * Helper to extract customer from query result (handles array or object)
 */
function extractCustomer(customer: { code: string; name: string } | { code: string; name: string }[] | null): { code: string; name: string } {
  if (!customer) return { code: '', name: '' };
  if (Array.isArray(customer)) return customer[0] || { code: '', name: '' };
  return customer;
}

/**
 * Helper to extract station from query result (handles array or object)
 */
function extractStation(station: StationMasterResult | StationMasterResult[] | null): StationMasterResult | null {
  if (!station) return null;
  if (Array.isArray(station)) return station[0] || null;
  return station;
}

/**
 * Find similar models based on station codes using Jaccard similarity
 */
export async function findSimilarModels(
  requestedCodes: string[],
  limit: number = 3,
  minSimilarity: number = 70,
  customerId?: string
): Promise<{ results: SimilarModel[]; closestMatch?: { modelCode: string; similarity: number } }> {
  // Build query for models with their stations
  let query = supabase
    .from('models')
    .select(`
      id,
      code,
      board_types,
      status,
      customer:customers(code, name),
      stations:model_stations(
        id,
        board_type,
        sequence,
        manpower,
        station:station_master(code, name, description, category)
      )
    `)
    .eq('status', 'active');

  // Optionally filter by customer
  if (customerId) {
    query = query.eq('customer_id', customerId);
  }

  const { data: models, error } = await query;

  if (error) {
    console.error('Failed to fetch models:', error);
    throw new Error('Failed to fetch models for similarity search');
  }

  if (!models || models.length === 0) {
    return { results: [] };
  }

  const requestedSet = new Set(requestedCodes.map(c => c.toUpperCase()));
  const results: SimilarModel[] = [];
  let closestMatch: { modelCode: string; similarity: number } | undefined;

  for (const model of models as ModelQueryResult[]) {
    // Extract unique station codes from model
    const modelCodes = Array.from(new Set(
      model.stations
        .map(s => {
          const station = extractStation(s.station);
          return station?.code?.toUpperCase();
        })
        .filter((code): code is string => Boolean(code))
    ));

    if (modelCodes.length === 0) continue;

    const modelSet = new Set(modelCodes);

    // Calculate Jaccard similarity
    const similarity = jaccardSimilarity(requestedSet, modelSet);

    // Track closest match (even if below threshold)
    if (!closestMatch || similarity > closestMatch.similarity) {
      closestMatch = { modelCode: model.code, similarity };
    }

    // Only include if meets minimum similarity
    if (similarity >= minSimilarity) {
      const matched = Array.from(requestedSet).filter(c => modelSet.has(c));
      const extra = Array.from(modelSet).filter(c => !requestedSet.has(c));
      const missing = Array.from(requestedSet).filter(c => !modelSet.has(c));

      const customer = extractCustomer(model.customer);

      results.push({
        modelId: model.id,
        modelCode: model.code,
        customerCode: customer.code,
        customerName: customer.name,
        boardTypes: model.board_types || [],
        stationCodes: modelCodes,
        stationCount: modelCodes.length,
        totalManpower: model.stations.reduce((sum, s) => sum + (s.manpower || 1), 0),
        similarity,
        matchedStations: matched,
        extraStations: extra,
        missingStations: missing,
      });
    }
  }

  // Sort by similarity descending, take top N
  const sortedResults = results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return {
    results: sortedResults,
    closestMatch: sortedResults.length === 0 ? closestMatch : undefined,
  };
}

/**
 * Get detailed model information for comparison view
 */
export async function getModelDetails(
  modelId: string,
  requestedCodes: string[]
): Promise<ModelDetail> {
  const { data: model, error } = await supabase
    .from('models')
    .select(`
      id,
      code,
      board_types,
      status,
      customer:customers(code, name),
      stations:model_stations(
        id,
        board_type,
        sequence,
        manpower,
        station:station_master(
          code,
          name,
          description,
          category,
          typical_uph,
          typical_cycle_time_sec
        )
      )
    `)
    .eq('id', modelId)
    .single();

  if (error || !model) {
    console.error('Failed to fetch model:', error);
    throw new Error('Model not found');
  }

  const typedModel = model as ModelQueryResult;
  const requestedSet = new Set(requestedCodes.map(c => c.toUpperCase()));
  const customer = extractCustomer(typedModel.customer);

  // Process stations
  const stations: ModelStationDetail[] = [];
  for (const s of typedModel.stations) {
    const station = extractStation(s.station);
    if (!station) continue;

    stations.push({
      id: s.id,
      boardType: s.board_type || 'MAIN',
      sequence: s.sequence || 0,
      stationCode: station.code || '',
      stationName: station.name || '',
      description: station.description || '',
      category: station.category || undefined,
      manpower: s.manpower || 1,
      uph: station.typical_uph || null,
      cycleTime: station.typical_cycle_time_sec || null,
      investment: null,
      isMatched: requestedSet.has(station.code?.toUpperCase() || ''),
    });
  }

  // Sort by board type, then by sequence
  stations.sort((a, b) => {
    if (a.boardType !== b.boardType) {
      return a.boardType.localeCompare(b.boardType);
    }
    return a.sequence - b.sequence;
  });

  // Find bottleneck (station with lowest UPH)
  const stationsWithUPH = stations.filter(s => s.uph && s.uph > 0);
  const bottleneck = stationsWithUPH.length > 0
    ? stationsWithUPH.reduce((min, s) => (s.uph! < min.uph! ? s : min))
    : null;

  // Calculate summary
  const summary: ModelSummary = {
    totalStations: stations.length,
    totalManpower: stations.reduce((sum, s) => sum + s.manpower, 0),
    totalInvestment: stations.reduce((sum, s) => sum + (s.investment || 0), 0),
    bottleneckStation: bottleneck?.stationCode || '',
    bottleneckUPH: bottleneck?.uph || 0,
  };

  return {
    id: typedModel.id,
    code: typedModel.code,
    customer,
    boardTypes: typedModel.board_types || [],
    status: typedModel.status,
    stations,
    summary,
  };
}

/**
 * Calculate comparison statistics between request and model
 */
export function calculateComparison(
  requestedCodes: string[],
  modelStations: ModelStationDetail[]
): ComparisonStats {
  const requestedSet = new Set(requestedCodes.map(c => c.toUpperCase()));
  const modelCodes = new Set(
    modelStations.map(s => s.stationCode.toUpperCase())
  );

  const matched = Array.from(requestedSet).filter(c => modelCodes.has(c));
  const extra = Array.from(modelCodes).filter(c => !requestedSet.has(c));
  const missing = Array.from(requestedSet).filter(c => !modelCodes.has(c));

  const matchPercentage = requestedCodes.length > 0
    ? Math.round((matched.length / requestedCodes.length) * 100)
    : 0;

  return {
    matched,
    extra,
    missing,
    matchPercentage,
  };
}

/**
 * Estimate costs based on model details
 */
export function estimateCosts(model: ModelDetail): CostEstimate {
  const { summary, stations } = model;

  // Calculate equipment investment (sum of station investments or estimate)
  const equipmentInvestment = stations.reduce((sum, s) => {
    // Use actual investment if available, otherwise estimate based on category
    if (s.investment) return sum + s.investment;
    // Default estimate based on station type
    return sum + 10000; // $10K default per station
  }, 0);

  // Fixture cost estimate (typically 20-30% of equipment for new models)
  const fixturesCost = Math.round(equipmentInvestment * 0.25);

  // Total manpower
  const totalManpower = summary.totalManpower;

  // Monthly labor cost
  const monthlyLaborCost = totalManpower * LABOR_COST_PER_MP;

  // Line UPH (limited by bottleneck)
  const lineUPH = summary.bottleneckUPH || 30; // Default 30 UPH if unknown

  // Monthly capacity
  const monthlyCapacity = lineUPH * WORKING_HOURS_PER_DAY * WORKING_DAYS_PER_MONTH;

  // Cost per unit (labor + equipment depreciation)
  const monthlyDepreciation = equipmentInvestment / DEPRECIATION_MONTHS;
  const totalMonthlyCost = monthlyLaborCost + monthlyDepreciation;
  const costPerUnit = monthlyCapacity > 0
    ? Math.round((totalMonthlyCost / monthlyCapacity) * 100) / 100
    : 0;

  return {
    equipmentInvestment,
    fixturesCost,
    totalManpower,
    monthlyLaborCost,
    lineUPH,
    monthlyCapacity,
    costPerUnit,
  };
}

/**
 * Get full comparison result including model details and cost estimate
 */
export async function getComparisonResult(
  modelId: string,
  requestedCodes: string[]
): Promise<{
  model: ModelDetail;
  comparison: ComparisonStats;
  costEstimate: CostEstimate;
}> {
  const model = await getModelDetails(modelId, requestedCodes);
  const comparison = calculateComparison(requestedCodes, model.stations);
  const costEstimate = estimateCosts(model);

  return {
    model,
    comparison,
    costEstimate,
  };
}
