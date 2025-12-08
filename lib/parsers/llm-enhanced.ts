/**
 * LLM Enhanced Parser
 * Provides LLM fallback for complex or messy files
 */

import { parseBOMWithLLM } from '@/lib/llm/prompts/bom-parser';
import { extractPCBDimensionsWithLLM } from '@/lib/llm/prompts/pdf-extractor';
import { extractRawTextFromExcel } from './excel-parser';
import { extractRawTextFromPDF } from './pdf-parser';
import { isLLMAvailable } from '@/lib/llm/client';
import type { ParsedBOM, ParsedPCBInfo, BOMSummary, InferredFeatures, LLMParsedBOM } from './types';

/**
 * Enhanced BOM parsing with LLM fallback
 * Use when algorithmic parser has low confidence
 */
export async function parseExcelBOMWithLLM(
  buffer: Buffer,
  filename: string
): Promise<ParsedBOM> {
  if (!isLLMAvailable()) {
    throw new Error('LLM API not configured. Set OPENROUTER_API_KEY environment variable.');
  }

  const rawText = extractRawTextFromExcel(buffer);

  // Call LLM to parse BOM
  const llmResult = await parseBOMWithLLM(rawText);

  // Convert LLM result to ParsedBOM format
  const summary: BOMSummary = {
    total_line_items: llmResult.total_line_items,
    unique_parts: llmResult.total_line_items, // Approximate
    total_quantity: llmResult.ic_count + llmResult.passive_count + llmResult.connector_count,
    ic_count: llmResult.ic_count,
    passive_count: llmResult.passive_count,
    connector_count: llmResult.connector_count,
    mechanical_count: 0,
    mcu_parts: llmResult.mcu_part_numbers,
    rf_parts: llmResult.rf_module_parts,
    sensor_parts: llmResult.sensor_parts,
    power_parts: llmResult.power_ic_parts,
    smd_count: llmResult.inferred_features.estimated_component_count,
    through_hole_count: 0,
    bga_count: llmResult.inferred_features.has_bga ? 1 : 0,
    fine_pitch_count: 0,
  };

  return {
    filename,
    total_rows: llmResult.total_line_items,
    rows: [], // LLM doesn't return individual rows
    summary,
    raw_text: rawText,
    parse_method: 'llm',
    confidence: 0.85, // LLM generally provides high confidence
  };
}

/**
 * Enhanced PDF parsing with LLM fallback
 */
export async function parsePCBPdfWithLLM(
  buffer: Buffer,
  filename: string
): Promise<ParsedPCBInfo> {
  if (!isLLMAvailable()) {
    throw new Error('LLM API not configured. Set OPENROUTER_API_KEY environment variable.');
  }

  const rawText = await extractRawTextFromPDF(buffer);

  // Call LLM to extract dimensions
  const llmResult = await extractPCBDimensionsWithLLM(rawText);

  return {
    filename,
    dimensions: {
      length_mm: llmResult.length_mm,
      width_mm: llmResult.width_mm,
      layer_count: llmResult.layer_count,
      cavity_count: llmResult.cavity_count,
      thickness_mm: llmResult.thickness_mm,
    },
    extracted_text: rawText,
    parse_method: 'llm',
    confidence: 0.85,
    notes: llmResult.notes,
  };
}

/**
 * Get inferred features from LLM-parsed BOM
 */
export function getInferredFeaturesFromLLM(llmResult: LLMParsedBOM): InferredFeatures {
  return {
    has_rf: llmResult.inferred_features.has_rf,
    has_sensors: llmResult.inferred_features.has_sensors,
    has_power_stage: llmResult.inferred_features.has_power_stage,
    has_display_connector: llmResult.inferred_features.has_display_connector,
    has_battery_connector: llmResult.inferred_features.has_battery_connector,
    smt_component_count: llmResult.inferred_features.estimated_component_count,
    bga_count: llmResult.inferred_features.has_bga ? 1 : 0,
    fine_pitch_count: 0,
  };
}

/**
 * Merge algorithmic and LLM results for hybrid parsing
 */
export function mergeParseResults(
  algorithmic: ParsedBOM,
  llm: ParsedBOM
): ParsedBOM {
  // Prefer LLM summary data (usually more accurate categorization)
  // But keep algorithmic rows (more detailed)
  return {
    filename: algorithmic.filename,
    total_rows: Math.max(algorithmic.total_rows, llm.total_rows),
    rows: algorithmic.rows, // Keep detailed rows from algorithmic parsing
    summary: {
      // Merge summaries - prefer LLM for categorized counts
      total_line_items: Math.max(algorithmic.summary.total_line_items, llm.summary.total_line_items),
      unique_parts: algorithmic.summary.unique_parts, // Keep from algorithmic (more accurate)
      total_quantity: Math.max(algorithmic.summary.total_quantity, llm.summary.total_quantity),
      ic_count: llm.summary.ic_count || algorithmic.summary.ic_count,
      passive_count: llm.summary.passive_count || algorithmic.summary.passive_count,
      connector_count: llm.summary.connector_count || algorithmic.summary.connector_count,
      mechanical_count: algorithmic.summary.mechanical_count,
      // Prefer LLM for key parts identification
      mcu_parts: llm.summary.mcu_parts.length > 0 ? llm.summary.mcu_parts : algorithmic.summary.mcu_parts,
      rf_parts: llm.summary.rf_parts.length > 0 ? llm.summary.rf_parts : algorithmic.summary.rf_parts,
      sensor_parts: llm.summary.sensor_parts.length > 0 ? llm.summary.sensor_parts : algorithmic.summary.sensor_parts,
      power_parts: llm.summary.power_parts.length > 0 ? llm.summary.power_parts : algorithmic.summary.power_parts,
      smd_count: Math.max(algorithmic.summary.smd_count, llm.summary.smd_count),
      through_hole_count: algorithmic.summary.through_hole_count,
      bga_count: Math.max(algorithmic.summary.bga_count, llm.summary.bga_count),
      fine_pitch_count: algorithmic.summary.fine_pitch_count,
    },
    raw_text: algorithmic.raw_text,
    parse_method: 'hybrid',
    confidence: Math.max(algorithmic.confidence, llm.confidence),
  };
}

/**
 * Merge PCB parsing results
 */
export function mergePCBResults(
  algorithmic: ParsedPCBInfo,
  llm: ParsedPCBInfo
): ParsedPCBInfo {
  // Take non-null values, preferring LLM for missing algorithmic values
  return {
    filename: algorithmic.filename,
    dimensions: {
      length_mm: algorithmic.dimensions.length_mm ?? llm.dimensions.length_mm,
      width_mm: algorithmic.dimensions.width_mm ?? llm.dimensions.width_mm,
      layer_count: algorithmic.dimensions.layer_count ?? llm.dimensions.layer_count,
      cavity_count: algorithmic.dimensions.cavity_count ?? llm.dimensions.cavity_count,
      thickness_mm: algorithmic.dimensions.thickness_mm ?? llm.dimensions.thickness_mm,
    },
    extracted_text: algorithmic.extracted_text,
    parse_method: 'hybrid',
    confidence: Math.max(algorithmic.confidence, llm.confidence),
    notes: Array.from(new Set([...algorithmic.notes, ...llm.notes])),
  };
}

/**
 * Check if LLM enhancement is recommended
 */
export function shouldUseLLM(confidence: number, threshold: number = 0.6): boolean {
  return confidence < threshold && isLLMAvailable();
}
