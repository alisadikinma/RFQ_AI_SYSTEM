# PHASE 4: Cost Calculation Engine

## 🎯 OBJECTIVE
Implement cost estimation engine that calculates investment, manpower, and operational costs for RFQ based on matched historical models and predicted station configurations.

---

## 📋 CONTEXT

Project: RFQ AI System for EMS Manufacturing
Location: `D:\Projects\RFQ_AI_SYSTEM`

**Reference:** EMS_Test_Line_Reference_Guide.md Section 9 - Cost Model

---

## 🏗️ ARCHITECTURE

```
lib/
├── cost/
│   ├── index.ts              # Main export
│   ├── types.ts              # Cost types
│   ├── fixture-cost.ts       # Fixture amortization
│   ├── manpower-calc.ts      # MP estimation
│   ├── capacity-calc.ts      # UPH & bottleneck
│   ├── investment-calc.ts    # Total investment
│   └── cost-breakdown.ts     # Full cost model
```

---

## 📝 IMPLEMENTATION

### File 1: `lib/cost/types.ts`

```typescript
export interface StationCostInput {
  station_code: string;
  quantity: number;  // Number of parallel stations
  manpower: number;
}

export interface CostParameters {
  // Labor rates
  operator_hourly_rate_usd: number;    // Default: $3.50/hr (Asia)
  technician_hourly_rate_usd: number;  // Default: $5.00/hr
  
  // Overhead
  overhead_percent: number;            // Default: 15%
  energy_cost_per_station_usd: number; // Default: $50/month
  
  // Fixture
  fixture_lifespan_years: number;      // Default: 3
  fixture_maintenance_percent: number; // Default: 5% annual
  
  // Production
  working_hours_per_month: number;     // Default: 200
  working_days_per_month: number;      // Default: 25
  
  // Margin
  target_margin_percent: number;       // Default: 15%
}

export interface ManpowerEstimate {
  station_code: string;
  station_qty: number;
  operators_per_station: number;
  total_operators: number;
  shift_coverage: number;  // Multiplier for 2/3 shift
  total_headcount: number;
}

export interface CapacityEstimate {
  station_code: string;
  station_qty: number;
  uph_per_station: number;
  total_uph: number;
  cycle_time_sec: number;
  utilization_percent: number;
  is_bottleneck: boolean;
}

export interface FixtureCostEstimate {
  station_code: string;
  fixture_unit_cost_usd: number;
  quantity: number;
  total_fixture_cost_usd: number;
  amortized_per_unit_usd: number;
  expected_volume: number;
}

export interface InvestmentBreakdown {
  station_code: string;
  equipment_cost_usd: number;
  fixture_cost_usd: number;
  installation_cost_usd: number;
  total_per_station_usd: number;
  quantity: number;
  subtotal_usd: number;
  vendor_recommendation: string;
}

export interface CostBreakdown {
  // Per-unit costs
  material_cost_per_unit: number;
  process_cost_per_unit: number;
  labor_cost_per_unit: number;
  overhead_cost_per_unit: number;
  test_cost_per_unit: number;
  fixture_amortized_per_unit: number;
  
  // Fixed costs
  total_investment_usd: number;
  total_fixture_cost_usd: number;
  monthly_labor_cost_usd: number;
  monthly_overhead_usd: number;
  
  // Production metrics
  effective_uph: number;
  bottleneck_station: string;
  total_manpower: number;
  line_utilization_percent: number;
  
  // Final
  total_cost_per_unit: number;
  suggested_price_per_unit: number;
  margin_percent: number;
}

export interface RiskAssessment {
  risk_score: number;  // 0-5
  risk_factors: RiskFactor[];
  overall_level: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface RiskFactor {
  category: string;
  description: string;
  score: number;  // 0-5
  mitigation?: string;
}
```

### File 2: `lib/cost/fixture-cost.ts`

```typescript
import type { FixtureCostEstimate, StationCostInput } from './types';

/**
 * Reference fixture costs by station type
 * From EMS_Test_Line_Reference_Guide.md Section 4
 */
const FIXTURE_COSTS: Record<string, { base: number; max: number; vendor: string }> = {
  // Testing
  ICT: { base: 15000, max: 25000, vendor: 'CheckSum/Keysight' },
  FCT: { base: 10000, max: 20000, vendor: 'Custom/NI' },
  RFT: { base: 20000, max: 30000, vendor: 'R&S/Keysight' },
  RFT1: { base: 20000, max: 30000, vendor: 'R&S/Keysight' },
  RFT_2G4G: { base: 25000, max: 35000, vendor: 'R&S/Anritsu' },
  CAL: { base: 8000, max: 15000, vendor: 'Keysight' },
  MBT: { base: 5000, max: 10000, vendor: 'Local' },
  MMI: { base: 8000, max: 15000, vendor: 'Custom' },
  BLMMI: { base: 8000, max: 15000, vendor: 'Custom' },
  CURRENT: { base: 5000, max: 10000, vendor: 'Keysight/Chroma' },
  PCB_CURRENT: { base: 3000, max: 8000, vendor: 'Local' },
  
  // Inspection
  AOI: { base: 0, max: 0, vendor: 'N/A (equipment only)' },  // No fixture needed
  AXI: { base: 0, max: 0, vendor: 'N/A (equipment only)' },
  VISUAL: { base: 2000, max: 5000, vendor: 'Local' },
  FQC: { base: 3000, max: 8000, vendor: 'Local' },
  OQC: { base: 2000, max: 5000, vendor: 'Local' },
  
  // Assembly
  UNDERFILL: { base: 3000, max: 8000, vendor: 'GPD/Nordson' },
  T_GREASE: { base: 2000, max: 5000, vendor: 'Local' },
  SHIELD: { base: 2000, max: 5000, vendor: 'Local' },
  ROUTER: { base: 5000, max: 10000, vendor: 'LPKF/Cencorp' },
  
  // Programming
  OS_DOWNLOAD: { base: 3000, max: 8000, vendor: 'Segger/Local' },
  
  // Default
  DEFAULT: { base: 5000, max: 10000, vendor: 'TBD' },
};

/**
 * Calculate fixture cost with amortization
 */
export function calculateFixtureCost(
  station: StationCostInput,
  expectedVolume: number,
  complexityFactor: number = 1.0  // 1.0 = normal, 1.5 = complex
): FixtureCostEstimate {
  const config = FIXTURE_COSTS[station.station_code.toUpperCase()] || FIXTURE_COSTS.DEFAULT;
  
  // Adjust for complexity
  const unitCost = config.base + (config.max - config.base) * (complexityFactor - 1);
  const totalCost = unitCost * station.quantity;
  
  // Amortize over expected volume
  const amortizedPerUnit = expectedVolume > 0 ? totalCost / expectedVolume : totalCost;
  
  return {
    station_code: station.station_code,
    fixture_unit_cost_usd: Math.round(unitCost),
    quantity: station.quantity,
    total_fixture_cost_usd: Math.round(totalCost),
    amortized_per_unit_usd: Math.round(amortizedPerUnit * 100) / 100,
    expected_volume: expectedVolume,
  };
}

/**
 * Get vendor recommendation for station
 */
export function getVendorRecommendation(stationCode: string): string {
  const config = FIXTURE_COSTS[stationCode.toUpperCase()] || FIXTURE_COSTS.DEFAULT;
  return config.vendor;
}

/**
 * Calculate total fixture investment
 */
export function calculateTotalFixtureInvestment(
  stations: StationCostInput[],
  expectedVolume: number,
  complexityFactor: number = 1.0
): {
  estimates: FixtureCostEstimate[];
  totalCost: number;
  amortizedPerUnit: number;
} {
  const estimates = stations.map(s => 
    calculateFixtureCost(s, expectedVolume, complexityFactor)
  );
  
  const totalCost = estimates.reduce((sum, e) => sum + e.total_fixture_cost_usd, 0);
  const amortizedPerUnit = expectedVolume > 0 ? totalCost / expectedVolume : totalCost;
  
  return {
    estimates,
    totalCost: Math.round(totalCost),
    amortizedPerUnit: Math.round(amortizedPerUnit * 100) / 100,
  };
}
```

### File 3: `lib/cost/manpower-calc.ts`

```typescript
import type { ManpowerEstimate, StationCostInput } from './types';
import { supabase } from '../supabase/client';

/**
 * Get operator ratio from machines table or use default
 */
async function getOperatorRatio(stationCode: string): Promise<number> {
  const { data } = await supabase
    .from('machines')
    .select('operator_ratio')
    .eq('code', stationCode.toUpperCase())
    .maybeSingle();
  
  return data?.operator_ratio || 1.0;
}

/**
 * Default operator ratios by station type
 * From EMS_Test_Line_Reference_Guide.md Section 3.2
 */
const DEFAULT_RATIOS: Record<string, number> = {
  // Fully automated (1:3-5)
  ICT: 0.25,
  AOI: 0.25,
  AXI: 0.25,
  ROUTER: 0.5,
  
  // Semi-automated (1:1-2)
  RFT: 1.0,
  RFT1: 1.0,
  RFT_2G4G: 1.0,
  FCT: 1.0,
  CAL: 1.0,
  
  // Manual (1:1)
  MBT: 1.0,
  VISUAL: 1.0,
  FQC: 1.0,
  OQC: 1.0,
  MMI: 1.0,
  BLMMI: 1.0,
  CURRENT: 1.0,
  
  // Assembly
  UNDERFILL: 1.0,
  T_GREASE: 1.0,
  SHIELD: 1.0,
  OS_DOWNLOAD: 1.0,
  
  DEFAULT: 1.0,
};

/**
 * Calculate manpower for single station
 */
export async function calculateStationManpower(
  station: StationCostInput,
  shiftCount: number = 1  // 1, 2, or 3 shifts
): Promise<ManpowerEstimate> {
  const ratio = DEFAULT_RATIOS[station.station_code.toUpperCase()] || DEFAULT_RATIOS.DEFAULT;
  const operatorsPerStation = station.manpower || Math.ceil(ratio);
  const totalOperators = operatorsPerStation * station.quantity;
  
  // Shift coverage multiplier (account for days off, breaks)
  const shiftMultiplier = shiftCount === 1 ? 1.0 : shiftCount === 2 ? 2.2 : 3.5;
  
  return {
    station_code: station.station_code,
    station_qty: station.quantity,
    operators_per_station: operatorsPerStation,
    total_operators: totalOperators,
    shift_coverage: shiftMultiplier,
    total_headcount: Math.ceil(totalOperators * shiftMultiplier),
  };
}

/**
 * Calculate total manpower for all stations
 */
export async function calculateTotalManpower(
  stations: StationCostInput[],
  shiftCount: number = 1
): Promise<{
  estimates: ManpowerEstimate[];
  totalOperators: number;
  totalHeadcount: number;
  directLaborCostMonthly: number;
}> {
  const estimates: ManpowerEstimate[] = [];
  
  for (const station of stations) {
    const estimate = await calculateStationManpower(station, shiftCount);
    estimates.push(estimate);
  }
  
  const totalOperators = estimates.reduce((sum, e) => sum + e.total_operators, 0);
  const totalHeadcount = estimates.reduce((sum, e) => sum + e.total_headcount, 0);
  
  // Assume $3.50/hr, 200 hrs/month
  const directLaborCostMonthly = totalHeadcount * 3.5 * 200;
  
  return {
    estimates,
    totalOperators,
    totalHeadcount,
    directLaborCostMonthly: Math.round(directLaborCostMonthly),
  };
}
```

### File 4: `lib/cost/capacity-calc.ts`

```typescript
import type { CapacityEstimate, StationCostInput } from './types';
import { supabase } from '../supabase/client';

/**
 * Default cycle times by station (seconds)
 * From EMS_Test_Line_Reference_Guide.md Section 3.1
 */
const DEFAULT_CYCLE_TIMES: Record<string, number> = {
  OS_DOWNLOAD: 30,
  MBT: 24,
  CAL: 18,
  RFT: 40,
  RFT1: 40,
  RFT_2G4G: 60,
  MMI: 25,
  BLMMI: 25,
  CURRENT: 18,
  PCB_CURRENT: 15,
  ICT: 3,
  FCT: 60,
  VISUAL: 20,
  AOI: 15,
  AXI: 30,
  FQC: 30,
  OQC: 25,
  UNDERFILL: 30,
  T_GREASE: 15,
  SHIELD: 20,
  ROUTER: 12,
  DEFAULT: 30,
};

/**
 * Calculate capacity for single station
 */
export function calculateStationCapacity(
  station: StationCostInput,
  targetUPH: number
): CapacityEstimate {
  const cycleTime = DEFAULT_CYCLE_TIMES[station.station_code.toUpperCase()] || DEFAULT_CYCLE_TIMES.DEFAULT;
  const uphPerStation = Math.floor(3600 / cycleTime);
  const totalUPH = uphPerStation * station.quantity;
  
  // Utilization = how much of capacity is used
  const utilization = Math.min((targetUPH / totalUPH) * 100, 100);
  const isBottleneck = totalUPH < targetUPH;
  
  return {
    station_code: station.station_code,
    station_qty: station.quantity,
    uph_per_station: uphPerStation,
    total_uph: totalUPH,
    cycle_time_sec: cycleTime,
    utilization_percent: Math.round(utilization),
    is_bottleneck: isBottleneck,
  };
}

/**
 * Calculate line capacity and identify bottleneck
 */
export function calculateLineCapacity(
  stations: StationCostInput[],
  targetUPH: number
): {
  estimates: CapacityEstimate[];
  effectiveUPH: number;
  bottleneckStation: string;
  lineUtilization: number;
  recommendation: string;
} {
  const estimates = stations.map(s => calculateStationCapacity(s, targetUPH));
  
  // Line speed is limited by slowest station
  const bottleneck = estimates.reduce((min, e) => 
    e.total_uph < min.total_uph ? e : min
  );
  
  const effectiveUPH = bottleneck.total_uph;
  const lineUtilization = Math.round((effectiveUPH / targetUPH) * 100);
  
  // Generate recommendation
  let recommendation = '';
  if (effectiveUPH < targetUPH) {
    const additionalNeeded = Math.ceil(targetUPH / bottleneck.uph_per_station) - bottleneck.station_qty;
    recommendation = `Add ${additionalNeeded} more ${bottleneck.station_code} station(s) to meet target UPH`;
  } else if (lineUtilization < 70) {
    recommendation = 'Line is under-utilized. Consider reducing parallel stations or increasing target volume.';
  } else {
    recommendation = 'Line capacity is well-balanced.';
  }
  
  return {
    estimates,
    effectiveUPH,
    bottleneckStation: bottleneck.station_code,
    lineUtilization,
    recommendation,
  };
}

/**
 * Suggest station quantities to meet target UPH
 */
export function suggestStationQuantities(
  stationCodes: string[],
  targetUPH: number,
  maxParallel: number = 4
): Map<string, number> {
  const suggestions = new Map<string, number>();
  
  for (const code of stationCodes) {
    const cycleTime = DEFAULT_CYCLE_TIMES[code.toUpperCase()] || DEFAULT_CYCLE_TIMES.DEFAULT;
    const uphPerStation = Math.floor(3600 / cycleTime);
    const neededQty = Math.min(Math.ceil(targetUPH / uphPerStation), maxParallel);
    suggestions.set(code, neededQty);
  }
  
  return suggestions;
}
```

### File 5: `lib/cost/investment-calc.ts`

```typescript
import type { InvestmentBreakdown, StationCostInput } from './types';
import { getVendorRecommendation } from './fixture-cost';

/**
 * Equipment costs by station type (USD)
 */
const EQUIPMENT_COSTS: Record<string, number> = {
  ICT: 80000,
  FCT: 50000,
  RFT: 120000,
  RFT1: 120000,
  RFT_2G4G: 150000,
  CAL: 40000,
  MBT: 15000,
  MMI: 30000,
  BLMMI: 30000,
  CURRENT: 25000,
  PCB_CURRENT: 15000,
  AOI: 100000,
  AXI: 200000,
  VISUAL: 5000,
  FQC: 10000,
  OQC: 10000,
  UNDERFILL: 50000,
  T_GREASE: 20000,
  SHIELD: 15000,
  ROUTER: 80000,
  OS_DOWNLOAD: 10000,
  DEFAULT: 20000,
};

/**
 * Installation cost as percentage of equipment
 */
const INSTALLATION_PERCENT = 0.05;

/**
 * Calculate investment for single station
 */
export function calculateStationInvestment(
  station: StationCostInput,
  fixtureCost: number
): InvestmentBreakdown {
  const equipmentCost = EQUIPMENT_COSTS[station.station_code.toUpperCase()] || EQUIPMENT_COSTS.DEFAULT;
  const installationCost = Math.round(equipmentCost * INSTALLATION_PERCENT);
  const totalPerStation = equipmentCost + fixtureCost + installationCost;
  
  return {
    station_code: station.station_code,
    equipment_cost_usd: equipmentCost,
    fixture_cost_usd: fixtureCost,
    installation_cost_usd: installationCost,
    total_per_station_usd: totalPerStation,
    quantity: station.quantity,
    subtotal_usd: totalPerStation * station.quantity,
    vendor_recommendation: getVendorRecommendation(station.station_code),
  };
}

/**
 * Calculate total investment for all stations
 */
export function calculateTotalInvestment(
  stations: StationCostInput[],
  fixtureEstimates: Map<string, number>
): {
  breakdown: InvestmentBreakdown[];
  totalEquipment: number;
  totalFixture: number;
  totalInstallation: number;
  grandTotal: number;
} {
  const breakdown: InvestmentBreakdown[] = [];
  
  for (const station of stations) {
    const fixtureCost = fixtureEstimates.get(station.station_code) || 0;
    const inv = calculateStationInvestment(station, fixtureCost);
    breakdown.push(inv);
  }
  
  const totalEquipment = breakdown.reduce((sum, b) => sum + (b.equipment_cost_usd * b.quantity), 0);
  const totalFixture = breakdown.reduce((sum, b) => sum + (b.fixture_cost_usd * b.quantity), 0);
  const totalInstallation = breakdown.reduce((sum, b) => sum + (b.installation_cost_usd * b.quantity), 0);
  const grandTotal = totalEquipment + totalFixture + totalInstallation;
  
  return {
    breakdown,
    totalEquipment,
    totalFixture,
    totalInstallation,
    grandTotal,
  };
}
```

### File 6: `lib/cost/cost-breakdown.ts`

```typescript
import type { CostBreakdown, CostParameters, StationCostInput, RiskAssessment, RiskFactor } from './types';
import { calculateTotalFixtureInvestment } from './fixture-cost';
import { calculateTotalManpower } from './manpower-calc';
import { calculateLineCapacity } from './capacity-calc';
import { calculateTotalInvestment } from './investment-calc';

const DEFAULT_PARAMS: CostParameters = {
  operator_hourly_rate_usd: 3.5,
  technician_hourly_rate_usd: 5.0,
  overhead_percent: 15,
  energy_cost_per_station_usd: 50,
  fixture_lifespan_years: 3,
  fixture_maintenance_percent: 5,
  working_hours_per_month: 200,
  working_days_per_month: 25,
  target_margin_percent: 15,
};

/**
 * Calculate complete cost breakdown
 */
export async function calculateCostBreakdown(
  stations: StationCostInput[],
  targetUPH: number,
  targetVolumeMonthly: number,
  params: Partial<CostParameters> = {}
): Promise<CostBreakdown> {
  const p = { ...DEFAULT_PARAMS, ...params };
  
  // Calculate sub-components
  const fixture = calculateTotalFixtureInvestment(stations, targetVolumeMonthly * 12);
  const manpower = await calculateTotalManpower(stations, 1);
  const capacity = calculateLineCapacity(stations, targetUPH);
  
  const fixtureMap = new Map(fixture.estimates.map(e => [e.station_code, e.fixture_unit_cost_usd]));
  const investment = calculateTotalInvestment(stations, fixtureMap);
  
  // Per-unit calculations
  const workingHoursPerMonth = p.working_hours_per_month;
  const monthlyCapacity = capacity.effectiveUPH * workingHoursPerMonth;
  const actualMonthlyVolume = Math.min(targetVolumeMonthly, monthlyCapacity);
  
  // Labor cost per unit
  const laborCostPerUnit = actualMonthlyVolume > 0 
    ? manpower.directLaborCostMonthly / actualMonthlyVolume 
    : 0;
  
  // Overhead per unit
  const monthlyOverhead = stations.length * p.energy_cost_per_station_usd + 
    (investment.grandTotal * p.overhead_percent / 100 / 12);
  const overheadPerUnit = actualMonthlyVolume > 0 ? monthlyOverhead / actualMonthlyVolume : 0;
  
  // Equipment depreciation per unit (5-year straight line)
  const monthlyDepreciation = investment.totalEquipment / 60;
  const testCostPerUnit = actualMonthlyVolume > 0 ? monthlyDepreciation / actualMonthlyVolume : 0;
  
  // Total per-unit cost (excluding material & process - those come from reference model)
  const totalCostPerUnit = laborCostPerUnit + overheadPerUnit + testCostPerUnit + fixture.amortizedPerUnit;
  
  // Add margin
  const marginMultiplier = 1 + (p.target_margin_percent / 100);
  const suggestedPrice = totalCostPerUnit * marginMultiplier;
  
  return {
    material_cost_per_unit: 0,  // To be filled from reference model
    process_cost_per_unit: 0,   // To be filled from reference model
    labor_cost_per_unit: Math.round(laborCostPerUnit * 100) / 100,
    overhead_cost_per_unit: Math.round(overheadPerUnit * 100) / 100,
    test_cost_per_unit: Math.round(testCostPerUnit * 100) / 100,
    fixture_amortized_per_unit: fixture.amortizedPerUnit,
    
    total_investment_usd: investment.grandTotal,
    total_fixture_cost_usd: investment.totalFixture,
    monthly_labor_cost_usd: manpower.directLaborCostMonthly,
    monthly_overhead_usd: Math.round(monthlyOverhead),
    
    effective_uph: capacity.effectiveUPH,
    bottleneck_station: capacity.bottleneckStation,
    total_manpower: manpower.totalHeadcount,
    line_utilization_percent: capacity.lineUtilization,
    
    total_cost_per_unit: Math.round(totalCostPerUnit * 100) / 100,
    suggested_price_per_unit: Math.round(suggestedPrice * 100) / 100,
    margin_percent: p.target_margin_percent,
  };
}

/**
 * Assess risks for the RFQ
 */
export function assessRisks(
  stations: StationCostInput[],
  capacity: { lineUtilization: number; bottleneckStation: string },
  hasRF: boolean,
  hasBGA: boolean,
  hasFineP itch: boolean
): RiskAssessment {
  const factors: RiskFactor[] = [];
  
  // Capacity risk
  if (capacity.lineUtilization > 90) {
    factors.push({
      category: 'Capacity',
      description: 'Line utilization exceeds 90% - no buffer for yield loss',
      score: 4,
      mitigation: 'Add parallel stations or reduce target volume',
    });
  } else if (capacity.lineUtilization > 80) {
    factors.push({
      category: 'Capacity',
      description: 'High utilization (>80%) - limited flexibility',
      score: 2,
    });
  }
  
  // Test coverage risk
  const hasRFStation = stations.some(s => s.station_code.includes('RFT'));
  if (hasRF && !hasRFStation) {
    factors.push({
      category: 'Test Coverage',
      description: 'RF product without RF test station',
      score: 5,
      mitigation: 'Add RFT station - mandatory for RF products',
    });
  }
  
  // BGA risk
  const hasAXI = stations.some(s => s.station_code === 'AXI');
  if (hasBGA && !hasAXI) {
    factors.push({
      category: 'Quality',
      description: 'BGA present without X-ray inspection',
      score: 3,
      mitigation: 'Consider adding AXI for solder joint verification',
    });
  }
  
  // Fine pitch risk
  const hasAOI = stations.some(s => s.station_code === 'AOI');
  if (hasFineP itch && !hasAOI) {
    factors.push({
      category: 'Quality',
      description: 'Fine-pitch components without AOI',
      score: 3,
      mitigation: 'AOI recommended for fine-pitch QC',
    });
  }
  
  // NPI yield risk (new product)
  factors.push({
    category: 'NPI',
    description: 'New product introduction - expect lower initial yield',
    score: 2,
    mitigation: 'Plan for 85-90% FPY initially, improve over ramp',
  });
  
  // Calculate total
  const totalScore = factors.reduce((sum, f) => sum + f.score, 0);
  const avgScore = factors.length > 0 ? totalScore / factors.length : 0;
  const normalizedScore = Math.min(avgScore, 5);
  
  let overallLevel: 'low' | 'medium' | 'high' = 'low';
  if (normalizedScore >= 3.5) overallLevel = 'high';
  else if (normalizedScore >= 2) overallLevel = 'medium';
  
  const recommendations = factors
    .filter(f => f.mitigation)
    .map(f => f.mitigation!);
  
  return {
    risk_score: Math.round(normalizedScore * 10) / 10,
    risk_factors: factors,
    overall_level: overallLevel,
    recommendations,
  };
}
```

### File 7: `lib/cost/index.ts`

```typescript
export * from './types';
export { calculateFixtureCost, calculateTotalFixtureInvestment, getVendorRecommendation } from './fixture-cost';
export { calculateStationManpower, calculateTotalManpower } from './manpower-calc';
export { calculateStationCapacity, calculateLineCapacity, suggestStationQuantities } from './capacity-calc';
export { calculateStationInvestment, calculateTotalInvestment } from './investment-calc';
export { calculateCostBreakdown, assessRisks } from './cost-breakdown';
```

---

## ✅ ACCEPTANCE CRITERIA

- [ ] Fixture costs match reference guide ranges
- [ ] Manpower calculation correct for 1/2/3 shifts
- [ ] Bottleneck station correctly identified
- [ ] Line utilization calculation accurate
- [ ] Investment breakdown sums correctly
- [ ] Risk assessment covers all major factors
- [ ] Cost per unit reasonable for EMS industry

---

## 🧪 TEST SCENARIOS

```typescript
// Test: 8-station XIAOMI phone line
const stations = [
  { station_code: 'MBT', quantity: 2, manpower: 2 },
  { station_code: 'CAL', quantity: 1, manpower: 1 },
  { station_code: 'RFT1', quantity: 2, manpower: 2 },
  { station_code: 'MMI', quantity: 1, manpower: 1 },
  { station_code: 'CURRENT', quantity: 1, manpower: 1 },
  { station_code: 'SHIELD', quantity: 1, manpower: 1 },
  { station_code: 'VISUAL', quantity: 1, manpower: 1 },
  { station_code: 'FQC', quantity: 1, manpower: 1 },
];

const result = await calculateCostBreakdown(stations, 200, 10000);
// Expected: bottleneck = RFT1, total MP ~12, investment ~$400-500K
```

---

## 🚀 NEXT PHASE

After cost engine works, proceed to PHASE 5: Integration & Testing
