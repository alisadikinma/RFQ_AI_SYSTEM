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
  const capacity = await calculateLineCapacity(stations, targetUPH);

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

  // Total per-unit cost
  const totalCostPerUnit = laborCostPerUnit + overheadPerUnit + testCostPerUnit + fixture.amortizedPerUnit;

  // Add margin
  const marginMultiplier = 1 + (p.target_margin_percent / 100);
  const suggestedPrice = totalCostPerUnit * marginMultiplier;

  return {
    material_cost_per_unit: 0,
    process_cost_per_unit: 0,
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
  hasFinePitch: boolean
): RiskAssessment {
  const factors: RiskFactor[] = [];

  // Capacity risk
  if (capacity.lineUtilization > 90) {
    factors.push({
      category: 'Capacity',
      description: 'Line utilization >90% - no buffer for yield loss',
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
  const stationCodes = stations.map(s => s.station_code.toUpperCase());
  const hasRFStation = stationCodes.some(c => c.includes('RFT'));
  if (hasRF && !hasRFStation) {
    factors.push({
      category: 'Test Coverage',
      description: 'RF product without RF test station',
      score: 5,
      mitigation: 'Add RFT station - mandatory for RF products',
    });
  }

  // BGA risk
  const hasAXI = stationCodes.includes('AXI');
  if (hasBGA && !hasAXI) {
    factors.push({
      category: 'Quality',
      description: 'BGA present without X-ray inspection',
      score: 3,
      mitigation: 'Consider adding AXI for solder joint verification',
    });
  }

  // Fine pitch risk
  const hasAOI = stationCodes.includes('AOI');
  if (hasFinePitch && !hasAOI) {
    factors.push({
      category: 'Quality',
      description: 'Fine-pitch components without AOI',
      score: 3,
      mitigation: 'AOI recommended for fine-pitch QC',
    });
  }

  // NPI yield risk
  factors.push({
    category: 'NPI',
    description: 'New product - expect lower initial yield',
    score: 2,
    mitigation: 'Plan for 85-90% FPY initially',
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
