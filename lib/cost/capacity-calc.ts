import type { CapacityEstimate, StationCostInput } from './types';
import { supabase } from '@/lib/supabase/client';

/**
 * Get cycle time from station_master table
 */
async function getCycleTimeFromDB(stationCode: string): Promise<number | null> {
  const { data } = await supabase
    .from('station_master')
    .select('typical_cycle_time_sec')
    .eq('code', stationCode.toUpperCase())
    .maybeSingle();

  return data?.typical_cycle_time_sec || null;
}

/**
 * Default cycle times by station (seconds)
 * From EMS_Test_Line_Reference_Guide.md Section 3.1
 */
const DEFAULT_CYCLE_TIMES: Record<string, number> = {
  OS_DOWNLOAD: 30,
  MBT: 24,
  CAL: 18,
  RFT: 40,
  RFT_2G4G: 60,
  RFT_5G: 45,
  MMI: 25,
  BLMMI: 25,
  SUBMMI: 20,
  CURRENT: 18,
  PCB_CURRENT: 15,
  HV_TEST: 20,
  WIFI_BT: 35,
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
  CURING: 60,
  BAKING: 60,
  DEFAULT: 30,
};

/**
 * Calculate capacity for single station
 */
export async function calculateStationCapacity(
  station: StationCostInput,
  targetUPH: number
): Promise<CapacityEstimate> {
  // Try DB first, fallback to default
  const dbCycleTime = await getCycleTimeFromDB(station.station_code);
  const cycleTime = dbCycleTime ?? DEFAULT_CYCLE_TIMES[station.station_code.toUpperCase()] ?? DEFAULT_CYCLE_TIMES.DEFAULT;

  const uphPerStation = Math.floor(3600 / cycleTime);
  const totalUPH = uphPerStation * station.quantity;
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
export async function calculateLineCapacity(
  stations: StationCostInput[],
  targetUPH: number
): Promise<{
  estimates: CapacityEstimate[];
  effectiveUPH: number;
  bottleneckStation: string;
  lineUtilization: number;
  recommendation: string;
}> {
  const estimates: CapacityEstimate[] = [];

  for (const station of stations) {
    const estimate = await calculateStationCapacity(station, targetUPH);
    estimates.push(estimate);
  }

  // Line speed limited by slowest station
  const bottleneck = estimates.reduce((min, e) =>
    e.total_uph < min.total_uph ? e : min
  );

  const effectiveUPH = bottleneck.total_uph;
  const lineUtilization = Math.round((effectiveUPH / targetUPH) * 100);

  let recommendation = '';
  if (effectiveUPH < targetUPH) {
    const additionalNeeded = Math.ceil(targetUPH / bottleneck.uph_per_station) - bottleneck.station_qty;
    recommendation = `Add ${additionalNeeded} more ${bottleneck.station_code} station(s) to meet target UPH`;
  } else if (lineUtilization < 70) {
    recommendation = 'Line under-utilized. Consider reducing parallel stations.';
  } else {
    recommendation = 'Line capacity well-balanced.';
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
