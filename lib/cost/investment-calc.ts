import type { InvestmentBreakdown, StationCostInput } from './types';
import { getVendorRecommendation } from './fixture-cost';

/**
 * Equipment costs by station type (USD)
 */
const EQUIPMENT_COSTS: Record<string, number> = {
  ICT: 80000,
  FCT: 50000,
  RFT: 120000,
  RFT_2G4G: 150000,
  RFT_5G: 180000,
  CAL: 40000,
  MBT: 15000,
  MMI: 30000,
  BLMMI: 30000,
  SUBMMI: 25000,
  CURRENT: 25000,
  PCB_CURRENT: 15000,
  HV_TEST: 35000,
  WIFI_BT: 80000,
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
  CURING: 15000,
  BAKING: 20000,
  DEFAULT: 20000,
};

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
