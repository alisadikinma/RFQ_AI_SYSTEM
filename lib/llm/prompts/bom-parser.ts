/**
 * BOM Parser LLM Prompts
 * Prompts for extracting BOM information using LLM
 */

import { callLLMJSON } from '../client';
import type { LLMParsedBOM } from '@/lib/parsers/types';

const SYSTEM_PROMPT = `You are an expert electronics manufacturing engineer analyzing Bill of Materials (BOM) data.
Your task is to extract and categorize component information from raw BOM text.

You must analyze the BOM and return a JSON object with the following structure:
{
  "total_line_items": number,
  "ic_count": number,
  "passive_count": number,
  "connector_count": number,
  "mcu_part_numbers": string[],
  "rf_module_parts": string[],
  "sensor_parts": string[],
  "power_ic_parts": string[],
  "inferred_features": {
    "has_rf": boolean,
    "has_sensors": boolean,
    "has_power_stage": boolean,
    "has_display_connector": boolean,
    "has_battery_connector": boolean,
    "has_bga": boolean,
    "estimated_component_count": number
  }
}

Component categorization guidelines:
- MCU: STM32, ESP32, nRF52, PIC, ATmega, Snapdragon, MediaTek, etc.
- RF: WiFi, Bluetooth, LoRa, 4G/LTE, NFC, antenna modules
- Sensors: BME/BMP (temp/humidity), MPU/ICM (IMU), accelerometers, gyroscopes
- Power ICs: TPS, LM317, LDO, DCDC, PMIC, battery chargers (BQ series)
- Passives: Resistors, capacitors, inductors
- Connectors: USB, FPC/FFC, JST, Molex, battery connectors

Inference guidelines:
- has_rf: True if WiFi, Bluetooth, cellular, or RF modules detected
- has_sensors: True if IMU, temperature, humidity, or other sensors found
- has_power_stage: True if DCDC, high-power LDO, or PMIC detected
- has_display_connector: True if FPC for display, LCD driver, or display IC found
- has_battery_connector: True if battery connector, charger IC, or fuel gauge found
- has_bga: True if BGA, CSP, or WLCSP packages mentioned

Always return valid JSON. Be thorough but precise.`;

/**
 * Parse BOM text using LLM
 */
export async function parseBOMWithLLM(rawText: string): Promise<LLMParsedBOM> {
  // Truncate if too long (keep under token limit)
  const maxLength = 15000;
  const truncatedText = rawText.length > maxLength
    ? rawText.substring(0, maxLength) + '\n... (truncated)'
    : rawText;

  const userPrompt = `Analyze this BOM data and extract component information:

\`\`\`
${truncatedText}
\`\`\`

Return a JSON object with counts, key part numbers, and inferred features.`;

  const result = await callLLMJSON<LLMParsedBOM>(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    { temperature: 0.1, max_tokens: 2048 }
  );

  // Validate and provide defaults
  return {
    total_line_items: result.total_line_items || 0,
    ic_count: result.ic_count || 0,
    passive_count: result.passive_count || 0,
    connector_count: result.connector_count || 0,
    mcu_part_numbers: result.mcu_part_numbers || [],
    rf_module_parts: result.rf_module_parts || [],
    sensor_parts: result.sensor_parts || [],
    power_ic_parts: result.power_ic_parts || [],
    inferred_features: {
      has_rf: result.inferred_features?.has_rf || false,
      has_sensors: result.inferred_features?.has_sensors || false,
      has_power_stage: result.inferred_features?.has_power_stage || false,
      has_display_connector: result.inferred_features?.has_display_connector || false,
      has_battery_connector: result.inferred_features?.has_battery_connector || false,
      has_bga: result.inferred_features?.has_bga || false,
      estimated_component_count: result.inferred_features?.estimated_component_count || 0,
    },
  };
}

/**
 * Identify component category using LLM
 */
export async function identifyComponentCategory(
  partNumber: string,
  description: string
): Promise<string> {
  const prompt = `Categorize this electronic component:
Part Number: ${partNumber}
Description: ${description}

Return ONE of: mcu, rf, sensor, power, passive, connector, mechanical, unknown`;

  const result = await callLLMJSON<{ category: string }>(
    [
      { role: 'system', content: 'You are an electronics component classifier. Return JSON with "category" field.' },
      { role: 'user', content: prompt },
    ],
    { temperature: 0, max_tokens: 50 }
  );

  return result.category || 'unknown';
}
