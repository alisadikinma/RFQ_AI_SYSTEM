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
  RFT_2G4G: { base: 25000, max: 35000, vendor: 'R&S/Anritsu' },
  RFT_5G: { base: 30000, max: 45000, vendor: 'R&S/Keysight' },
  CAL: { base: 8000, max: 15000, vendor: 'Keysight' },
  MBT: { base: 5000, max: 10000, vendor: 'Local' },
  MMI: { base: 8000, max: 15000, vendor: 'Custom' },
  BLMMI: { base: 8000, max: 15000, vendor: 'Custom' },
  SUBMMI: { base: 6000, max: 12000, vendor: 'Custom' },
  CURRENT: { base: 5000, max: 10000, vendor: 'Keysight/Chroma' },
  PCB_CURRENT: { base: 3000, max: 8000, vendor: 'Local' },
  HV_TEST: { base: 8000, max: 15000, vendor: 'Chroma' },
  WIFI_BT: { base: 15000, max: 25000, vendor: 'LitePoint' },

  // Inspection
  AOI: { base: 0, max: 0, vendor: 'N/A (equipment only)' },
  AXI: { base: 0, max: 0, vendor: 'N/A (equipment only)' },
  VISUAL: { base: 2000, max: 5000, vendor: 'Local' },
  FQC: { base: 3000, max: 8000, vendor: 'Local' },
  OQC: { base: 2000, max: 5000, vendor: 'Local' },

  // Assembly
  UNDERFILL: { base: 3000, max: 8000, vendor: 'GPD/Nordson' },
  T_GREASE: { base: 2000, max: 5000, vendor: 'Local' },
  SHIELD: { base: 2000, max: 5000, vendor: 'Local' },
  ROUTER: { base: 5000, max: 10000, vendor: 'LPKF/Cencorp' },
  CURING: { base: 1000, max: 3000, vendor: 'Local' },
  BAKING: { base: 1000, max: 3000, vendor: 'Local' },

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
  complexityFactor: number = 1.0
): FixtureCostEstimate {
  const code = station.station_code.toUpperCase();
  const config = FIXTURE_COSTS[code] || FIXTURE_COSTS.DEFAULT;

  const unitCost = config.base + (config.max - config.base) * (complexityFactor - 1);
  const totalCost = unitCost * station.quantity;
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
