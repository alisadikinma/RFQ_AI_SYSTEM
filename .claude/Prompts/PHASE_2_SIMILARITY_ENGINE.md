# PHASE 2: Similarity Engine (UPDATED)

## 🎯 OBJECTIVE
Implement similarity engine that uses `station_master` and `station_aliases` tables for intelligent station matching.

---

## 📋 KEY CHANGES

| Before | After |
|--------|-------|
| Hardcoded station mappings | Use `station_aliases` table |
| `machines` table | Use `station_master` table |
| Manual inference rules | Use `triggers_if` from station_master |

---

## 🏗️ ARCHITECTURE

```
lib/
├── similarity/
│   ├── index.ts              # Main export
│   ├── types.ts              # Type definitions  
│   ├── pcb-similarity.ts     # PCB geometry matching
│   ├── bom-similarity.ts     # BOM semantic matching
│   ├── station-matcher.ts    # ⭐ UPDATED: Uses station_aliases
│   ├── inference-engine.ts   # ⭐ UPDATED: Uses station_master.triggers_if
│   └── db-queries.ts         # ⭐ NEW: Database query helpers
```

---

## 📝 IMPLEMENTATION

### File 1: `lib/similarity/types.ts`

```typescript
// Station Master (from database)
export interface StationMaster {
  id: string;
  code: string;
  name: string;
  description: string;
  category: 'Testing' | 'Assembly' | 'Inspection' | 'Programming';
  typical_cycle_time_sec: number;
  typical_uph: number;
  operator_ratio: number;
  triggers_if: string[];    // e.g., ['has_rf', 'has_wireless']
  required_for: string[];   // e.g., ['smartphone', 'iot']
}

// Station Alias (customer-specific naming)
export interface StationAlias {
  id: string;
  alias_name: string;
  master_station_id: string;
  customer_id: string | null;
  confidence: 'high' | 'medium' | 'low';
  master?: StationMaster;    // Joined data
}

export interface PCBFeatures {
  length_mm: number;
  width_mm: number;
  layer_count: number;
  cavity_count: number;
  side_count: number;
  smt_component_count: number;
  bga_count: number;
  fine_pitch_count: number;
  has_rf: boolean;
  has_power_stage: boolean;
  has_sensors: boolean;
  has_display_connector: boolean;
  has_battery_connector: boolean;
}

export interface BOMSummary {
  total_line_items: number;
  ic_count: number;
  passive_count: number;
  connector_count: number;
  mcu_part_numbers: string[];
  rf_module_parts: string[];
  sensor_parts: string[];
}

export interface StationConfig {
  board_type: string;
  station_code: string;       // Customer's term
  master_code?: string;       // Resolved standard code
  sequence: number;
  manpower?: number;
}

export interface SimilarityResult {
  model_id: string;
  model_code: string;
  customer: string;
  pcb_similarity: number;
  bom_similarity: number;
  overall_similarity: number;
  matched_stations: StationMatch[];
  missing_stations: string[];
  extra_stations: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface StationMatch {
  customer_term: string;
  master_code: string;
  master_name: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface InferenceResult {
  recommended_stations: StationMaster[];
  rules_applied: string[];
  warnings: string[];
}
```

### File 2: `lib/similarity/db-queries.ts` (NEW)

```typescript
import { supabase } from '@/lib/supabase/client';
import type { StationMaster, StationAlias } from './types';

/**
 * Get all master stations
 */
export async function getMasterStations(): Promise<StationMaster[]> {
  const { data, error } = await supabase
    .from('station_master')
    .select('*')
    .order('category', { ascending: true });
  
  if (error) throw error;
  return data || [];
}

/**
 * Resolve customer station name to master station using aliases
 * Checks customer-specific aliases first, then global aliases
 */
export async function resolveStationAlias(
  customerTerm: string,
  customerId?: string
): Promise<StationAlias | null> {
  // 1. Try customer-specific alias first
  if (customerId) {
    const { data: customerAlias } = await supabase
      .from('station_aliases')
      .select(`
        *,
        master:station_master(*)
      `)
      .eq('alias_name', customerTerm)
      .eq('customer_id', customerId)
      .maybeSingle();
    
    if (customerAlias) return customerAlias;
  }
  
  // 2. Try global alias (customer_id is null)
  const { data: globalAlias } = await supabase
    .from('station_aliases')
    .select(`
      *,
      master:station_master(*)
    `)
    .eq('alias_name', customerTerm)
    .is('customer_id', null)
    .maybeSingle();
  
  if (globalAlias) return globalAlias;
  
  // 3. Try partial match (case-insensitive)
  const { data: partialMatch } = await supabase
    .from('station_aliases')
    .select(`
      *,
      master:station_master(*)
    `)
    .ilike('alias_name', `%${customerTerm}%`)
    .limit(1)
    .maybeSingle();
  
  return partialMatch;
}

/**
 * Batch resolve multiple station names
 */
export async function resolveStationAliases(
  terms: string[],
  customerId?: string
): Promise<Map<string, StationAlias>> {
  const result = new Map<string, StationAlias>();
  
  // Fetch all aliases for this customer + global
  const { data: aliases } = await supabase
    .from('station_aliases')
    .select(`
      *,
      master:station_master(*)
    `)
    .or(customerId 
      ? `customer_id.eq.${customerId},customer_id.is.null`
      : 'customer_id.is.null'
    );
  
  if (!aliases) return result;
  
  // Create lookup map
  const aliasMap = new Map<string, StationAlias>();
  for (const alias of aliases) {
    const key = alias.alias_name.toLowerCase();
    // Prefer customer-specific over global
    if (!aliasMap.has(key) || alias.customer_id) {
      aliasMap.set(key, alias);
    }
  }
  
  // Match terms
  for (const term of terms) {
    const alias = aliasMap.get(term.toLowerCase());
    if (alias) {
      result.set(term, alias);
    }
  }
  
  return result;
}

/**
 * Get stations that should be inferred based on PCB features
 */
export async function getInferredStations(
  features: Record<string, boolean>
): Promise<StationMaster[]> {
  // Get all stations with triggers
  const { data: stations } = await supabase
    .from('station_master')
    .select('*')
    .not('triggers_if', 'eq', '{}');
  
  if (!stations) return [];
  
  // Filter stations where any trigger matches
  return stations.filter(station => {
    const triggers = station.triggers_if || [];
    return triggers.some(trigger => features[trigger] === true);
  });
}
```

### File 3: `lib/similarity/station-matcher.ts` (UPDATED)

```typescript
import { resolveStationAliases } from './db-queries';
import type { StationConfig, StationMatch } from './types';

/**
 * Match RFQ stations against reference model using station_aliases
 */
export async function matchStations(
  rfqStations: StationConfig[],
  referenceStations: StationConfig[],
  customerId?: string
): Promise<{
  matched: StationMatch[];
  missing: string[];
  extra: string[];
  matchPercentage: number;
}> {
  // Resolve all customer terms to master codes
  const allTerms = [
    ...rfqStations.map(s => s.station_code),
    ...referenceStations.map(s => s.station_code)
  ];
  
  const aliasMap = await resolveStationAliases(allTerms, customerId);
  
  // Convert to master codes
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
        confidence: alias.confidence as 'high' | 'medium' | 'low',
      });
    } else {
      // Unknown station - keep as-is
      rfqMasterCodes.add(station.station_code.toUpperCase());
      matched.push({
        customer_term: station.station_code,
        master_code: station.station_code.toUpperCase(),
        master_name: station.station_code,
        confidence: 'low',
      });
    }
  }
  
  // Get reference master codes
  const refMasterCodes = new Set<string>();
  for (const station of referenceStations) {
    const alias = aliasMap.get(station.station_code);
    refMasterCodes.add(alias?.master?.code || station.station_code.toUpperCase());
  }
  
  // Calculate differences
  const missing = [...refMasterCodes].filter(code => !rfqMasterCodes.has(code));
  const extra = [...rfqMasterCodes].filter(code => !refMasterCodes.has(code));
  
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
  const { resolveStationAlias } = await import('./db-queries');
  const alias = await resolveStationAlias(customerTerm, customerId);
  
  if (alias?.master) {
    return {
      customer_term: customerTerm,
      master_code: alias.master.code,
      master_name: alias.master.name,
      confidence: alias.confidence as 'high' | 'medium' | 'low',
    };
  }
  
  return {
    customer_term: customerTerm,
    master_code: customerTerm.toUpperCase(),
    master_name: customerTerm,
    confidence: 'low',
  };
}
```

### File 4: `lib/similarity/inference-engine.ts` (UPDATED)

```typescript
import { getInferredStations, getMasterStations } from './db-queries';
import type { PCBFeatures, InferenceResult, StationMaster } from './types';

/**
 * Convert PCB features to trigger flags
 */
function featuresToTriggers(features: PCBFeatures): Record<string, boolean> {
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
  
  // Filter out already existing
  const recommended: StationMaster[] = [];
  const rulesApplied: string[] = [];
  
  for (const station of inferredStations) {
    if (!existing.has(station.code)) {
      recommended.push(station);
      
      // Build rule explanation
      const matchedTriggers = station.triggers_if.filter(t => triggers[t]);
      rulesApplied.push(
        `${station.code}: Triggered by [${matchedTriggers.join(', ')}] → ${station.description}`
      );
    }
  }
  
  // Generate warnings
  const warnings: string[] = [];
  
  if (features.bga_count > 0 && !existing.has('AXI') && !recommended.find(s => s.code === 'AXI')) {
    warnings.push('BGA present but no AXI station - X-ray inspection recommended');
  }
  
  if (features.fine_pitch_count > 5 && !existing.has('AOI') && !recommended.find(s => s.code === 'AOI')) {
    warnings.push('Many fine-pitch components but no AOI - automated inspection recommended');
  }
  
  if (features.cavity_count > 1 && !existing.has('ROUTER') && !recommended.find(s => s.code === 'ROUTER')) {
    warnings.push('Multi-cavity panel but no ROUTER - depaneling required');
  }
  
  return {
    recommended_stations: recommended,
    rules_applied: rulesApplied,
    warnings,
  };
}

/**
 * Get optimal station sequence based on EMS best practices
 */
export async function getOptimalSequence(): Promise<string[]> {
  const stations = await getMasterStations();
  
  // Define category order
  const categoryOrder = ['Inspection', 'Programming', 'Testing', 'Assembly'];
  
  // Sort by category, then by typical_uph (faster first)
  return stations
    .sort((a, b) => {
      const catDiff = categoryOrder.indexOf(a.category) - categoryOrder.indexOf(b.category);
      if (catDiff !== 0) return catDiff;
      return (b.typical_uph || 0) - (a.typical_uph || 0);
    })
    .map(s => s.code);
}
```

### File 5: `lib/similarity/index.ts` (UPDATED)

```typescript
import { supabase } from '@/lib/supabase/client';
import { calculatePCBSimilarity } from './pcb-similarity';
import { calculateBOMSimilarity } from './bom-similarity';
import { matchStations, normalizeStationCode } from './station-matcher';
import { inferMissingStations, getOptimalSequence } from './inference-engine';
import { getMasterStations, resolveStationAliases } from './db-queries';
import type { 
  PCBFeatures, 
  BOMSummary, 
  StationConfig, 
  SimilarityResult,
  StationMaster 
} from './types';

export * from './types';
export { 
  normalizeStationCode, 
  inferMissingStations,
  getMasterStations,
  resolveStationAliases,
  getOptimalSequence,
};

const PCB_WEIGHT = 0.6;
const BOM_WEIGHT = 0.4;

/**
 * Find top N similar models for a new RFQ
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
      customer:customers(id, code, name),
      stations:model_stations(
        board_type,
        sequence,
        machine:station_master(id, code, name, category)
      ),
      pcb:pcb_features(*),
      bom:bom_data(*)
    `)
    .eq('status', 'active');

  if (error) throw error;
  if (!models || models.length === 0) return [];

  const results: SimilarityResult[] = [];

  for (const model of models) {
    if (!model.pcb || model.pcb.length === 0) continue;

    const modelPCB = model.pcb[0] as unknown as PCBFeatures;
    const modelBOM = (model.bom?.[0] || {}) as unknown as BOMSummary;
    
    // Convert model stations to StationConfig format
    const modelStations: StationConfig[] = model.stations.map((s: any) => ({
      board_type: s.board_type,
      station_code: s.machine?.code || '',
      sequence: s.sequence,
    }));

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

    // Determine confidence
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (overallSim >= 0.85) confidence = 'high';
    else if (overallSim >= 0.70) confidence = 'medium';

    results.push({
      model_id: model.id,
      model_code: model.code,
      customer: (model.customer as any)?.name || 'Unknown',
      pcb_similarity: Math.round(pcbSim * 100) / 100,
      bom_similarity: Math.round(bomSim * 100) / 100,
      overall_similarity: Math.round(overallSim * 100) / 100,
      matched_stations: stationMatch.matched,
      missing_stations: stationMatch.missing,
      extra_stations: stationMatch.extra,
      confidence,
    });
  }

  return results
    .sort((a, b) => b.overall_similarity - a.overall_similarity)
    .slice(0, topN);
}

/**
 * Full RFQ analysis: similarity + inference
 */
export async function analyzeRFQ(
  rfqPCB: PCBFeatures,
  rfqBOM: BOMSummary,
  rfqStations: StationConfig[],
  customerId?: string
) {
  // Find similar models
  const similarModels = await findSimilarModels(
    rfqPCB, 
    rfqBOM, 
    rfqStations, 
    customerId, 
    5
  );

  // Infer missing stations
  const existingCodes = rfqStations.map(s => s.station_code);
  const inference = await inferMissingStations(rfqPCB, existingCodes);

  // Get optimal sequence
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
    }
  };
}
```

---

## ✅ ACCEPTANCE CRITERIA

- [ ] `resolveStationAlias()` finds customer-specific aliases first
- [ ] `matchStations()` uses database aliases, not hardcoded mappings
- [ ] `inferMissingStations()` uses `triggers_if` from station_master
- [ ] `findSimilarModels()` joins with station_master correctly
- [ ] Unknown stations flagged with `confidence: 'low'`
- [ ] All 257 aliases in database are recognized

---

## 🧪 TEST CASES

```typescript
// Test alias resolution
const alias = await resolveStationAlias('RFT1', 'customer-uuid');
// Expected: { master_code: 'RFT', confidence: 'high' }

// Test batch resolution  
const map = await resolveStationAliases(['MBT', 'Thermal_Gress', 'Unknown_Station']);
// Expected: MBT → MBT, Thermal_Gress → T_GREASE, Unknown_Station → not found

// Test inference with triggers
const features = { has_rf: true, bga_count: 2, cavity_count: 4 };
const result = await inferMissingStations(features, ['MBT']);
// Expected: RFT, CAL, SHIELD, AXI, UNDERFILL, ROUTER recommended

// Test full analysis
const analysis = await analyzeRFQ(pcbFeatures, bomSummary, stations, customerId);
// Expected: similar_models[], inference, optimal_sequence
```

---

## 🔗 DATABASE DEPENDENCIES

This phase requires:
- `station_master` table with 38 stations ✅
- `station_aliases` table with 257 mappings ✅
- `customers` table with 15 customers ✅
