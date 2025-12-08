/**
 * Similarity Engine Type Definitions
 * Types for station matching, PCB/BOM comparison, and inference
 */

// Station Master (from database)
export interface StationMaster {
  id: string;
  code: string;
  name: string;
  description: string;
  category: 'Testing' | 'Assembly' | 'Inspection' | 'Programming';
  typical_cycle_time_sec: number | null;
  typical_uph: number | null;
  operator_ratio: number;
  triggers_if: string[];    // e.g., ['has_rf', 'has_wireless']
  required_for: string[];   // e.g., ['smartphone', 'iot']
  created_at: string;
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

// PCB Features for similarity calculation
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

// BOM Summary for similarity calculation
export interface BOMSummary {
  total_line_items: number;
  ic_count: number;
  passive_count: number;
  connector_count: number;
  mcu_part_numbers: string[];
  rf_module_parts: string[];
  sensor_parts: string[];
}

// Station Configuration from RFQ input
export interface StationConfig {
  board_type: string;
  station_code: string;       // Customer's term
  master_code?: string;       // Resolved standard code
  sequence: number;
  manpower?: number;
}

// Station Match Result
export interface StationMatch {
  customer_term: string;
  master_code: string;
  master_name: string;
  confidence: 'high' | 'medium' | 'low';
}

// Full Similarity Result for a model comparison
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

// Station Matching Result
export interface StationMatchResult {
  matched: StationMatch[];
  missing: string[];
  extra: string[];
  matchPercentage: number;
}

// Inference Result from PCB feature analysis
export interface InferenceResult {
  recommended_stations: StationMaster[];
  rules_applied: string[];
  warnings: string[];
}

// Full RFQ Analysis Result
export interface RFQAnalysisResult {
  similar_models: SimilarityResult[];
  top_match: SimilarityResult | null;
  inference: InferenceResult;
  optimal_sequence: string[];
  rfq_coverage: {
    stations_provided: number;
    stations_inferred: number;
    warnings_count: number;
  };
}

// PCB Feature Triggers (for inference engine)
export interface FeatureTriggers {
  has_rf: boolean;
  has_wireless: boolean;
  has_wifi: boolean;
  has_bluetooth: boolean;
  has_cellular: boolean;
  has_sensors: boolean;
  has_adc: boolean;
  has_display: boolean;
  has_touchscreen: boolean;
  has_backlight: boolean;
  has_battery: boolean;
  has_power_stage: boolean;
  has_high_voltage: boolean;
  has_bga: boolean;
  has_fine_pitch: boolean;
  has_mcu: boolean;
  has_firmware: boolean;
  is_pcba: boolean;
  is_panel: boolean;
  multi_cavity: boolean;
  is_subboard: boolean;
  high_volume: boolean;
}
