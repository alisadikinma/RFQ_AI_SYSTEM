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
