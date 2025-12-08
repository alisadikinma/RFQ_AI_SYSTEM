# PHASE 2: Similarity Engine Implementation

## 🎯 OBJECTIVE
Implement the 3-tower similarity engine that matches new RFQ requests against historical models using PCB geometry, BOM semantics, and station configuration.

---

## 📋 CONTEXT

Project: RFQ AI System for EMS Manufacturing
Location: `D:\Projects\RFQ_AI_SYSTEM`

**Similarity Formula:**
```
Score_total = (0.6 × sim_PCB) + (0.4 × sim_BOM)
```

**Thresholds:**
- ≥0.85 → Strong match → reuse full station plan
- 0.70–0.85 → Moderate → adjust based on differences  
- <0.70 → Weak → follow inference rules

---

## 🏗️ ARCHITECTURE

```
lib/
├── similarity/
│   ├── index.ts              # Main export
│   ├── pcb-similarity.ts     # PCB geometry matching
│   ├── bom-similarity.ts     # BOM semantic matching
│   ├── station-matcher.ts    # Station configuration matching
│   ├── inference-engine.ts   # Missing station inference
│   └── types.ts              # Type definitions
```

---

## 📝 IMPLEMENTATION

### File 1: `lib/similarity/types.ts`

```typescript
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
  power_ic_parts: string[];
}

export interface StationConfig {
  board_type: string;
  station_code: string;
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
  matched_stations: string[];
  missing_stations: string[];
  extra_stations: string[];
  confidence: 'high' | 'medium' | 'low';
}

export interface InferenceResult {
  recommended_stations: StationConfig[];
  inference_rules_applied: string[];
  warnings: string[];
}
```

### File 2: `lib/similarity/pcb-similarity.ts`

```typescript
import { PCBFeatures } from './types';

/**
 * Calculate PCB geometry similarity using weighted Euclidean distance
 * normalized to 0-1 range
 */
export function calculatePCBSimilarity(
  source: PCBFeatures,
  target: PCBFeatures
): number {
  // Feature weights based on importance for EMS matching
  const weights = {
    area: 0.20,           // Board size is critical
    layer_count: 0.15,    // Complexity indicator
    cavity_count: 0.10,   // Panel design
    component_count: 0.15,
    bga_count: 0.10,
    has_rf: 0.15,         // RF requires specific test stations
    has_sensors: 0.10,
    has_power: 0.05,
  };

  // Normalize numeric values
  const sourceArea = source.length_mm * source.width_mm;
  const targetArea = target.length_mm * target.width_mm;
  
  // Calculate individual similarities
  const areaSim = 1 - Math.min(Math.abs(sourceArea - targetArea) / Math.max(sourceArea, targetArea), 1);
  const layerSim = 1 - Math.abs(source.layer_count - target.layer_count) / 10;
  const cavitySim = source.cavity_count === target.cavity_count ? 1 : 0.5;
  const componentSim = 1 - Math.min(
    Math.abs(source.smt_component_count - target.smt_component_count) / 
    Math.max(source.smt_component_count, target.smt_component_count, 1),
    1
  );
  const bgaSim = 1 - Math.min(Math.abs(source.bga_count - target.bga_count) / Math.max(source.bga_count, target.bga_count, 1), 1);
  const rfSim = source.has_rf === target.has_rf ? 1 : 0;
  const sensorSim = source.has_sensors === target.has_sensors ? 1 : 0;
  const powerSim = source.has_power_stage === target.has_power_stage ? 1 : 0;

  // Weighted sum
  const similarity = 
    weights.area * areaSim +
    weights.layer_count * Math.max(layerSim, 0) +
    weights.cavity_count * cavitySim +
    weights.component_count * componentSim +
    weights.bga_count * bgaSim +
    weights.has_rf * rfSim +
    weights.has_sensors * sensorSim +
    weights.has_power * powerSim;

  return Math.round(similarity * 100) / 100;
}

/**
 * Batch compare source PCB against multiple targets
 * Returns sorted by similarity descending
 */
export function findSimilarPCBs(
  source: PCBFeatures,
  targets: Array<{ id: string; features: PCBFeatures }>
): Array<{ id: string; similarity: number }> {
  return targets
    .map(target => ({
      id: target.id,
      similarity: calculatePCBSimilarity(source, target.features)
    }))
    .sort((a, b) => b.similarity - a.similarity);
}
```

### File 3: `lib/similarity/bom-similarity.ts`

```typescript
import { BOMSummary } from './types';

/**
 * Calculate BOM similarity using Jaccard similarity for part categories
 * and component count ratios
 */
export function calculateBOMSimilarity(
  source: BOMSummary,
  target: BOMSummary
): number {
  const weights = {
    ic_ratio: 0.25,
    passive_ratio: 0.10,
    connector_ratio: 0.15,
    mcu_match: 0.20,
    rf_match: 0.15,
    sensor_match: 0.15,
  };

  // Count-based similarity
  const icRatio = ratioSimilarity(source.ic_count, target.ic_count);
  const passiveRatio = ratioSimilarity(source.passive_count, target.passive_count);
  const connectorRatio = ratioSimilarity(source.connector_count, target.connector_count);

  // Part number matching (Jaccard similarity)
  const mcuMatch = jaccardSimilarity(source.mcu_part_numbers, target.mcu_part_numbers);
  const rfMatch = jaccardSimilarity(source.rf_module_parts, target.rf_module_parts);
  const sensorMatch = jaccardSimilarity(source.sensor_parts, target.sensor_parts);

  const similarity =
    weights.ic_ratio * icRatio +
    weights.passive_ratio * passiveRatio +
    weights.connector_ratio * connectorRatio +
    weights.mcu_match * mcuMatch +
    weights.rf_match * rfMatch +
    weights.sensor_match * sensorMatch;

  return Math.round(similarity * 100) / 100;
}

function ratioSimilarity(a: number, b: number): number {
  if (a === 0 && b === 0) return 1;
  return 1 - Math.abs(a - b) / Math.max(a, b);
}

function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  
  const setA = new Set(a.map(s => s.toUpperCase()));
  const setB = new Set(b.map(s => s.toUpperCase()));
  
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  
  return intersection / union;
}

/**
 * Extract key component categories from raw BOM text
 */
export function extractBOMFeatures(bomText: string): Partial<BOMSummary> {
  const lines = bomText.split('\n');
  
  const mcuPatterns = /STM32|ESP32|NRF52|PIC|ATMEGA|ARM|CORTEX/gi;
  const rfPatterns = /WIFI|BT|BLUETOOTH|NRF|SX127|CC1101|LoRa|4G|LTE|GSM/gi;
  const sensorPatterns = /BME|BMP|MPU|LSM|ICM|SHT|AHT|ACCEL|GYRO|TEMP/gi;
  
  const mcu_part_numbers: string[] = [];
  const rf_module_parts: string[] = [];
  const sensor_parts: string[] = [];
  
  lines.forEach(line => {
    const mcuMatch = line.match(mcuPatterns);
    const rfMatch = line.match(rfPatterns);
    const sensorMatch = line.match(sensorPatterns);
    
    if (mcuMatch) mcu_part_numbers.push(...mcuMatch);
    if (rfMatch) rf_module_parts.push(...rfMatch);
    if (sensorMatch) sensor_parts.push(...sensorMatch);
  });
  
  return {
    mcu_part_numbers: [...new Set(mcu_part_numbers)],
    rf_module_parts: [...new Set(rf_module_parts)],
    sensor_parts: [...new Set(sensor_parts)],
  };
}
```

### File 4: `lib/similarity/station-matcher.ts`

```typescript
import { StationConfig } from './types';

/**
 * Compare station configurations between RFQ and reference model
 */
export function matchStations(
  rfqStations: StationConfig[],
  referenceStations: StationConfig[]
): {
  matched: string[];
  missing: string[];
  extra: string[];
  matchPercentage: number;
} {
  const rfqCodes = new Set(rfqStations.map(s => s.station_code.toUpperCase()));
  const refCodes = new Set(referenceStations.map(s => s.station_code.toUpperCase()));
  
  const matched = [...rfqCodes].filter(code => refCodes.has(code));
  const missing = [...refCodes].filter(code => !rfqCodes.has(code));
  const extra = [...rfqCodes].filter(code => !refCodes.has(code));
  
  const matchPercentage = refCodes.size > 0 
    ? Math.round((matched.length / refCodes.size) * 100) 
    : 0;
  
  return { matched, missing, extra, matchPercentage };
}

/**
 * Map customer-specific station names to standard codes
 */
export function normalizeStationCode(customerTerm: string): {
  standardCode: string;
  confidence: 'high' | 'medium' | 'low';
} {
  const term = customerTerm.toUpperCase().trim();
  
  const mappings: Record<string, { codes: string[]; standard: string }> = {
    'RFT': { codes: ['RF TEST', 'SIGNAL TEST', 'RF VERIFY', 'RADIO TEST', 'WIRELESS'], standard: 'RFT' },
    'CURRENT': { codes: ['CURRENT TEST', 'POWER LOAD', 'LOAD TEST', 'ELECTRICAL'], standard: 'CURRENT' },
    'OS_DOWNLOAD': { codes: ['OS DOWNLOAD', 'FW DOWNLOAD', 'FIRMWARE', 'FLASH', 'PROGRAM', 'SW DOWNLOAD'], standard: 'OS_DOWNLOAD' },
    'VISUAL': { codes: ['VISUAL', 'INSPECTION', 'QC CHECK', 'APPEARANCE'], standard: 'VISUAL' },
    'CAL': { codes: ['CAL', 'CALIBRATION', 'TRIM', 'ALIGNMENT'], standard: 'CAL' },
    'MMI': { codes: ['MMI', 'HMI', 'UI TEST', 'TOUCH TEST', 'DISPLAY TEST'], standard: 'MMI' },
    'MBT': { codes: ['MBT', 'BENCH', 'REWORK', 'REPAIR', 'DEBUG'], standard: 'MBT' },
    'T_GREASE': { codes: ['GREASE', 'THERMAL', 'TIM', 'PASTE'], standard: 'T_GREASE' },
    'SHIELD': { codes: ['SHIELD', 'SHIELDING', 'EMI', 'RF COVER'], standard: 'SHIELD' },
  };
  
  // Exact match first
  for (const [standard, { codes }] of Object.entries(mappings)) {
    if (codes.includes(term) || term === standard) {
      return { standardCode: standard, confidence: 'high' };
    }
  }
  
  // Partial match
  for (const [standard, { codes }] of Object.entries(mappings)) {
    if (codes.some(code => term.includes(code) || code.includes(term))) {
      return { standardCode: standard, confidence: 'medium' };
    }
  }
  
  // Unknown - return as-is
  return { standardCode: term, confidence: 'low' };
}
```

### File 5: `lib/similarity/inference-engine.ts`

```typescript
import { PCBFeatures, StationConfig, InferenceResult } from './types';

/**
 * Inference rules based on EMS_Test_Line_Reference_Guide.md Section 7.2
 */
const INFERENCE_RULES = [
  {
    name: 'RF_RULE',
    condition: (f: PCBFeatures) => f.has_rf,
    stations: ['RFT', 'CAL', 'SHIELD'],
    reason: 'Product has RF/wireless components',
  },
  {
    name: 'MCU_RULE', 
    condition: (f: PCBFeatures) => f.smt_component_count > 50, // Likely has MCU
    stations: ['OS_DOWNLOAD', 'MBT', 'ICT'],
    reason: 'Product likely has MCU requiring firmware',
  },
  {
    name: 'SENSOR_RULE',
    condition: (f: PCBFeatures) => f.has_sensors,
    stations: ['CAL'],
    reason: 'Product has sensors requiring calibration',
  },
  {
    name: 'POWER_RULE',
    condition: (f: PCBFeatures) => f.has_power_stage,
    stations: ['CURRENT', 'T_GREASE'],
    reason: 'Product has power stage (>5W dissipation expected)',
  },
  {
    name: 'BGA_RULE',
    condition: (f: PCBFeatures) => f.bga_count > 0,
    stations: ['AXI', 'UNDERFILL'],
    reason: 'Product has BGA/CSP packages',
  },
  {
    name: 'DISPLAY_RULE',
    condition: (f: PCBFeatures) => f.has_display_connector,
    stations: ['MMI', 'VISUAL'],
    reason: 'Product has display interface',
  },
  {
    name: 'BATTERY_RULE',
    condition: (f: PCBFeatures) => f.has_battery_connector,
    stations: ['CURRENT'],
    reason: 'Product is battery-powered',
  },
  {
    name: 'MULTICAVITY_RULE',
    condition: (f: PCBFeatures) => f.cavity_count > 1,
    stations: ['ROUTER'],
    reason: 'Multi-cavity panel requires router/depaneling',
  },
];

/**
 * Infer missing stations based on PCB features
 */
export function inferMissingStations(
  features: PCBFeatures,
  existingStations: string[]
): InferenceResult {
  const existing = new Set(existingStations.map(s => s.toUpperCase()));
  const recommended: StationConfig[] = [];
  const rulesApplied: string[] = [];
  const warnings: string[] = [];
  
  let sequence = existingStations.length + 1;
  
  for (const rule of INFERENCE_RULES) {
    if (rule.condition(features)) {
      for (const station of rule.stations) {
        if (!existing.has(station)) {
          recommended.push({
            board_type: 'Inferred',
            station_code: station,
            sequence: sequence++,
            manpower: 1,
          });
          existing.add(station);
          rulesApplied.push(`${rule.name}: ${rule.reason} → Added ${station}`);
        }
      }
    }
  }
  
  // Add warnings for potential issues
  if (features.fine_pitch_count > 5 && !existing.has('AOI')) {
    warnings.push('High fine-pitch component count but no AOI station - consider adding');
  }
  
  if (features.bga_count > 0 && !existing.has('AXI')) {
    warnings.push('BGA present but no AXI station - solder joint inspection recommended');
  }
  
  return {
    recommended_stations: recommended,
    inference_rules_applied: rulesApplied,
    warnings,
  };
}

/**
 * Get default station sequence based on EMS best practices
 */
export function getDefaultStationOrder(): string[] {
  return [
    // Early detection
    'ICT', 'AOI', 'AXI',
    // Programming
    'OS_DOWNLOAD',
    // Functional
    'MBT', 'FCT',
    // Calibration
    'CAL',
    // RF (after calibration)
    'RFT', 'RFT_2G4G',
    // Interface
    'MMI', 'BLMMI',
    // Power
    'CURRENT', 'PCB_CURRENT',
    // Assembly (after all electrical tests)
    'UNDERFILL', 'T_GREASE', 'SHIELD',
    // Router (after assembly, before final test)
    'ROUTER',
    // Final QC
    'VISUAL', 'FQC', 'OQC',
    // Packing
    'LABEL', 'PACKING',
  ];
}
```

### File 6: `lib/similarity/index.ts`

```typescript
import { supabase } from '../supabase/client';
import { calculatePCBSimilarity } from './pcb-similarity';
import { calculateBOMSimilarity } from './bom-similarity';
import { matchStations, normalizeStationCode } from './station-matcher';
import { inferMissingStations } from './inference-engine';
import type { PCBFeatures, BOMSummary, StationConfig, SimilarityResult } from './types';

export * from './types';
export { normalizeStationCode, inferMissingStations };

const PCB_WEIGHT = 0.6;
const BOM_WEIGHT = 0.4;

/**
 * Find top N similar models for a new RFQ
 */
export async function findSimilarModels(
  rfqPCB: PCBFeatures,
  rfqBOM: BOMSummary,
  rfqStations: StationConfig[],
  topN: number = 5
): Promise<SimilarityResult[]> {
  // Fetch all active models with their features
  const { data: models, error } = await supabase
    .from('models')
    .select(`
      id,
      code,
      customer:customers(code),
      stations:model_stations(
        board_type,
        machine:machines(code)
      ),
      pcb:pcb_features(*),
      bom:bom_data(*)
    `)
    .eq('status', 'active');

  if (error) throw error;
  if (!models || models.length === 0) return [];

  const results: SimilarityResult[] = [];

  for (const model of models) {
    // Skip if no PCB features
    if (!model.pcb || model.pcb.length === 0) continue;

    const modelPCB = model.pcb[0] as unknown as PCBFeatures;
    const modelBOM = (model.bom?.[0] || {}) as unknown as BOMSummary;
    const modelStations = model.stations.map((s: any) => ({
      board_type: s.board_type,
      station_code: s.machine?.code || '',
      sequence: 0,
    }));

    // Calculate similarities
    const pcbSim = calculatePCBSimilarity(rfqPCB, modelPCB);
    const bomSim = calculateBOMSimilarity(rfqBOM, modelBOM);
    const overallSim = (PCB_WEIGHT * pcbSim) + (BOM_WEIGHT * bomSim);

    // Match stations
    const stationMatch = matchStations(rfqStations, modelStations);

    // Determine confidence
    let confidence: 'high' | 'medium' | 'low' = 'low';
    if (overallSim >= 0.85) confidence = 'high';
    else if (overallSim >= 0.70) confidence = 'medium';

    results.push({
      model_id: model.id,
      model_code: model.code,
      customer: (model.customer as any)?.code || 'Unknown',
      pcb_similarity: pcbSim,
      bom_similarity: bomSim,
      overall_similarity: overallSim,
      matched_stations: stationMatch.matched,
      missing_stations: stationMatch.missing,
      extra_stations: stationMatch.extra,
      confidence,
    });
  }

  // Sort by overall similarity descending
  return results
    .sort((a, b) => b.overall_similarity - a.overall_similarity)
    .slice(0, topN);
}

/**
 * Calculate and cache similarity between two specific models
 */
export async function calculateAndCacheSimilarity(
  sourceModelId: string,
  targetModelId: string
): Promise<number> {
  // Check cache first
  const { data: cached } = await supabase
    .from('similarity_cache')
    .select('overall_similarity')
    .eq('source_model_id', sourceModelId)
    .eq('target_model_id', targetModelId)
    .maybeSingle();

  if (cached) return cached.overall_similarity;

  // Fetch both models' features
  const { data: models } = await supabase
    .from('models')
    .select(`
      id,
      pcb:pcb_features(*),
      bom:bom_data(*)
    `)
    .in('id', [sourceModelId, targetModelId]);

  if (!models || models.length !== 2) return 0;

  const source = models.find(m => m.id === sourceModelId);
  const target = models.find(m => m.id === targetModelId);

  if (!source?.pcb?.[0] || !target?.pcb?.[0]) return 0;

  const pcbSim = calculatePCBSimilarity(
    source.pcb[0] as unknown as PCBFeatures,
    target.pcb[0] as unknown as PCBFeatures
  );
  
  const bomSim = calculateBOMSimilarity(
    (source.bom?.[0] || {}) as unknown as BOMSummary,
    (target.bom?.[0] || {}) as unknown as BOMSummary
  );

  const overall = (PCB_WEIGHT * pcbSim) + (BOM_WEIGHT * bomSim);

  // Cache the result
  await supabase.from('similarity_cache').upsert({
    source_model_id: sourceModelId,
    target_model_id: targetModelId,
    pcb_similarity: pcbSim,
    bom_similarity: bomSim,
    overall_similarity: overall,
    pcb_weight: PCB_WEIGHT,
    bom_weight: BOM_WEIGHT,
  });

  return overall;
}
```

---

## ✅ ACCEPTANCE CRITERIA

- [ ] PCB similarity calculates correctly (test with mock data)
- [ ] BOM similarity handles empty/partial data gracefully
- [ ] Station mapping normalizes customer terms to standard codes
- [ ] Inference engine applies all rules from reference guide
- [ ] `findSimilarModels()` returns sorted results
- [ ] Similarity cache prevents redundant calculations
- [ ] All functions have proper TypeScript types
- [ ] Unit tests pass for edge cases

---

## 🧪 TEST CASES

```typescript
// Test PCB similarity
const pcb1 = { length_mm: 100, width_mm: 50, layer_count: 4, cavity_count: 2, ... };
const pcb2 = { length_mm: 98, width_mm: 52, layer_count: 4, cavity_count: 2, ... };
// Expected: similarity > 0.90 (very similar)

// Test inference
const features = { has_rf: true, has_sensors: true, bga_count: 2, cavity_count: 4 };
const existing = ['MBT', 'CAL'];
const result = inferMissingStations(features, existing);
// Expected: RFT, SHIELD, AXI, UNDERFILL, ROUTER added

// Test station mapping
const mapped = normalizeStationCode('Signal Verify Test');
// Expected: { standardCode: 'RFT', confidence: 'medium' }
```

---

## 🚀 NEXT PHASE

After similarity engine works, proceed to PHASE 3: File Parsers (Excel BOM, PDF drawings)
