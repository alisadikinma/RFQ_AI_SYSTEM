/**
 * File Parser Type Definitions
 * Types for BOM parsing, PDF parsing, and feature inference
 */

export interface ParsedBOMRow {
  item_no: number;
  part_number: string;
  description: string;
  quantity: number;
  package_type?: string;
  manufacturer?: string;
  reference_designator?: string;
}

export interface BOMSummary {
  total_line_items: number;
  unique_parts: number;
  total_quantity: number;

  // Categorized counts
  ic_count: number;
  passive_count: number;
  connector_count: number;
  mechanical_count: number;

  // Key components detected
  mcu_parts: string[];
  rf_parts: string[];
  sensor_parts: string[];
  power_parts: string[];

  // Package analysis
  smd_count: number;
  through_hole_count: number;
  bga_count: number;
  fine_pitch_count: number;
}

export interface ParsedBOM {
  filename: string;
  total_rows: number;
  rows: ParsedBOMRow[];
  summary: BOMSummary;
  raw_text: string;
  parse_method: 'algorithmic' | 'llm' | 'hybrid';
  confidence: number; // 0-1
}

export interface PCBDimensions {
  length_mm: number | null;
  width_mm: number | null;
  layer_count: number | null;
  cavity_count: number | null;
  thickness_mm: number | null;
}

export interface ParsedPCBInfo {
  filename: string;
  dimensions: PCBDimensions;
  extracted_text: string;
  parse_method: 'algorithmic' | 'llm' | 'hybrid';
  confidence: number;
  notes: string[];
}

export interface InferredFeatures {
  has_rf: boolean;
  has_sensors: boolean;
  has_power_stage: boolean;
  has_display_connector: boolean;
  has_battery_connector: boolean;
  smt_component_count: number;
  bga_count: number;
  fine_pitch_count: number;
}

export interface FileParseResult {
  success: boolean;
  error?: string;
  bom?: ParsedBOM;
  pcb?: ParsedPCBInfo;
  inferred_features?: InferredFeatures;
}

// LLM Parser types
export interface LLMParsedBOM {
  total_line_items: number;
  ic_count: number;
  passive_count: number;
  connector_count: number;
  mcu_part_numbers: string[];
  rf_module_parts: string[];
  sensor_parts: string[];
  power_ic_parts: string[];
  inferred_features: {
    has_rf: boolean;
    has_sensors: boolean;
    has_power_stage: boolean;
    has_display_connector: boolean;
    has_battery_connector: boolean;
    has_bga: boolean;
    estimated_component_count: number;
  };
}

export interface LLMParsedPCB {
  length_mm: number | null;
  width_mm: number | null;
  layer_count: number | null;
  cavity_count: number | null;
  thickness_mm: number | null;
  notes: string[];
}

// Column mapping configuration
export interface ColumnMapping {
  item_no: string[];
  part_number: string[];
  description: string[];
  quantity: string[];
  package_type: string[];
  manufacturer: string[];
  reference_designator: string[];
}
