import type { ManpowerEstimate, StationCostInput } from './types';
import { supabase } from '@/lib/supabase/client';

/**
 * Get operator ratio from station_master table
 */
async function getOperatorRatioFromDB(stationCode: string): Promise<number | null> {
  const { data } = await supabase
    .from('station_master')
    .select('operator_ratio')
    .eq('code', stationCode.toUpperCase())
    .maybeSingle();

  return data?.operator_ratio || null;
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
  RFT_2G4G: 1.0,
  RFT_5G: 1.0,
  FCT: 1.0,
  CAL: 1.0,
  WIFI_BT: 1.0,

  // Manual (1:1)
  MBT: 1.0,
  VISUAL: 1.0,
  FQC: 1.0,
  OQC: 1.0,
  MMI: 1.0,
  BLMMI: 1.0,
  SUBMMI: 1.0,
  CURRENT: 1.0,
  PCB_CURRENT: 1.0,
  HV_TEST: 1.0,

  // Assembly
  UNDERFILL: 1.0,
  T_GREASE: 1.0,
  SHIELD: 1.0,
  OS_DOWNLOAD: 0.5,
  CURING: 0.5,
  BAKING: 0.5,

  DEFAULT: 1.0,
};

/**
 * Calculate manpower for single station
 */
export async function calculateStationManpower(
  station: StationCostInput,
  shiftCount: number = 1
): Promise<ManpowerEstimate> {
  // Try DB first, fallback to default
  const dbRatio = await getOperatorRatioFromDB(station.station_code);
  const ratio = dbRatio ?? DEFAULT_RATIOS[station.station_code.toUpperCase()] ?? DEFAULT_RATIOS.DEFAULT;

  const operatorsPerStation = station.manpower || Math.ceil(ratio);
  const totalOperators = operatorsPerStation * station.quantity;

  // Shift coverage multiplier
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

  // $3.50/hr, 200 hrs/month
  const directLaborCostMonthly = totalHeadcount * 3.5 * 200;

  return {
    estimates,
    totalOperators,
    totalHeadcount,
    directLaborCostMonthly: Math.round(directLaborCostMonthly),
  };
}
