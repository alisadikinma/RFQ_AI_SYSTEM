/**
 * BOM Analyzer
 * Categorizes components and extracts key parts from parsed BOM data
 */

import type { ParsedBOMRow, BOMSummary, InferredFeatures } from './types';

// Component pattern matching
const PATTERNS = {
  // Microcontrollers and processors
  mcu: /STM32|ESP32|NRF52|PIC\d|ATMEGA|ATTINY|RP2040|CORTEX|ATSAM|LPC|IMXRT|MSP430|SNAPDRAGON|MEDIATEK|MT\d{4}|QUALCOMM|QCA|RTL87|REALTEK|BCM\d{4}|BROADCOM/i,

  // RF and wireless
  rf: /WIFI|BT|BLUETOOTH|NRF24|SX127|CC1101|LoRa|4G|LTE|GSM|GPRS|RF|ANT|2\.4G|5G|WLAN|BLE|ZIGBEE|NFC|RFID|ESP32|ESP8266|BCM43|RTL8|QCA9|MT76/i,

  // Sensors
  sensor: /BME\d|BMP\d|MPU\d|LSM\d|ICM\d|SHT\d|AHT\d|HDC\d|ACCEL|GYRO|COMPASS|MEMS|IMU|TEMP|HUMID|PRESSURE|LIGHT|PIR|TOF|LIS\d|ADX|BMA\d|STK\d|OPT\d|APDS|TSL\d|VCNL/i,

  // Power management
  power: /TPS|LM317|LM78|AMS1117|MP1584|MP2307|LDO|DCDC|BUCK|BOOST|PMIC|REG|PWR|BATT|CHARGER|BQ\d|RT\d{4}|SY\d{4}|AP\d{4}|AOZ|NCP\d|LP\d{4}|MIC\d{4}/i,

  // Generic ICs
  ic: /IC|CHIP|U\d|QFN|QFP|BGA|SOP|SSOP|TSSOP|SOIC|DIP|LQFP|WLCSP|LGA|VFBGA/i,

  // Passive components
  resistor: /^R\d|RES|OHM|\dR\d|\dK|\dM|RESISTOR|CHIP.?RES|SMD.?RES/i,
  capacitor: /^C\d|CAP|UF|NF|PF|MLCC|CAPACITOR|ELEC|TANT|CER/i,
  inductor: /^L\d|IND|UH|NH|INDUCTOR|FERRITE|CHOKE|BEAD/i,

  // Connectors
  connector: /CONN|USB|HDMI|FPC|FFC|JST|MOLEX|HEADER|PIN|JACK|SOCKET|SIM|SD|MICRO|TYPE-C|BATTERY|DF\d|ZIF|FH\d|XH|PH|SH|GH/i,

  // Display
  display: /LCD|OLED|TFT|DISPLAY|SCREEN|PANEL|ILI\d|ST7\d|SSD1\d|GC9|HX8/i,

  // Package types
  bga: /BGA|CSP|WLCSP|FBGA|VFBGA|LFBGA|UBGA|CABGA/i,
  fine_pitch: /0\.4MM|0\.5MM|0402|0201|01005|FINE|QFN.*0\.5|QFP.*0\.5/i,
  through_hole: /DIP|PTH|TH|THROUGH|HOLE|RADIAL|AXIAL/i,
};

/**
 * Analyze BOM rows and generate summary statistics
 */
export function analyzeBOM(rows: ParsedBOMRow[]): BOMSummary {
  const summary: BOMSummary = {
    total_line_items: rows.length,
    unique_parts: new Set(rows.map(r => r.part_number)).size,
    total_quantity: rows.reduce((sum, r) => sum + r.quantity, 0),
    ic_count: 0,
    passive_count: 0,
    connector_count: 0,
    mechanical_count: 0,
    mcu_parts: [],
    rf_parts: [],
    sensor_parts: [],
    power_parts: [],
    smd_count: 0,
    through_hole_count: 0,
    bga_count: 0,
    fine_pitch_count: 0,
  };

  for (const row of rows) {
    const text = `${row.part_number} ${row.description} ${row.package_type || ''}`;

    // Categorize by component type
    if (PATTERNS.mcu.test(text)) {
      summary.ic_count += row.quantity;
      summary.mcu_parts.push(row.part_number);
    } else if (PATTERNS.rf.test(text)) {
      summary.ic_count += row.quantity;
      summary.rf_parts.push(row.part_number);
    } else if (PATTERNS.sensor.test(text)) {
      summary.ic_count += row.quantity;
      summary.sensor_parts.push(row.part_number);
    } else if (PATTERNS.power.test(text)) {
      summary.ic_count += row.quantity;
      summary.power_parts.push(row.part_number);
    } else if (PATTERNS.ic.test(text)) {
      summary.ic_count += row.quantity;
    } else if (
      PATTERNS.resistor.test(text) ||
      PATTERNS.capacitor.test(text) ||
      PATTERNS.inductor.test(text)
    ) {
      summary.passive_count += row.quantity;
    } else if (PATTERNS.connector.test(text)) {
      summary.connector_count += row.quantity;
    } else {
      summary.mechanical_count += row.quantity;
    }

    // Package analysis
    if (PATTERNS.bga.test(text)) {
      summary.bga_count += row.quantity;
    }
    if (PATTERNS.fine_pitch.test(text)) {
      summary.fine_pitch_count += row.quantity;
    }
    if (PATTERNS.through_hole.test(text)) {
      summary.through_hole_count += row.quantity;
    } else {
      summary.smd_count += row.quantity;
    }
  }

  // Deduplicate key part arrays
  summary.mcu_parts = Array.from(new Set(summary.mcu_parts));
  summary.rf_parts = Array.from(new Set(summary.rf_parts));
  summary.sensor_parts = Array.from(new Set(summary.sensor_parts));
  summary.power_parts = Array.from(new Set(summary.power_parts));

  return summary;
}

/**
 * Infer PCB features from BOM summary
 */
export function inferPCBFeatures(summary: BOMSummary): InferredFeatures {
  // Check for display connector presence in connector count
  const hasDisplayLikely = summary.connector_count > 5;
  const hasBatteryLikely = summary.connector_count > 3;

  return {
    has_rf: summary.rf_parts.length > 0,
    has_sensors: summary.sensor_parts.length > 0,
    has_power_stage: summary.power_parts.length > 2,
    has_display_connector: hasDisplayLikely,
    has_battery_connector: hasBatteryLikely,
    smt_component_count: summary.smd_count,
    bga_count: summary.bga_count,
    fine_pitch_count: summary.fine_pitch_count,
  };
}

/**
 * Get component category for a single part
 */
export function categorizeComponent(
  partNumber: string,
  description: string,
  packageType?: string
): 'mcu' | 'rf' | 'sensor' | 'power' | 'ic' | 'passive' | 'connector' | 'mechanical' {
  const text = `${partNumber} ${description} ${packageType || ''}`;

  if (PATTERNS.mcu.test(text)) return 'mcu';
  if (PATTERNS.rf.test(text)) return 'rf';
  if (PATTERNS.sensor.test(text)) return 'sensor';
  if (PATTERNS.power.test(text)) return 'power';
  if (PATTERNS.ic.test(text)) return 'ic';
  if (PATTERNS.resistor.test(text) || PATTERNS.capacitor.test(text) || PATTERNS.inductor.test(text)) {
    return 'passive';
  }
  if (PATTERNS.connector.test(text)) return 'connector';
  return 'mechanical';
}

/**
 * Check if part is likely a BGA package
 */
export function isBGAPackage(partNumber: string, description: string, packageType?: string): boolean {
  const text = `${partNumber} ${description} ${packageType || ''}`;
  return PATTERNS.bga.test(text);
}

/**
 * Check if part is likely fine pitch
 */
export function isFinePitch(partNumber: string, description: string, packageType?: string): boolean {
  const text = `${partNumber} ${description} ${packageType || ''}`;
  return PATTERNS.fine_pitch.test(text);
}

/**
 * Create empty BOM summary with default values
 */
export function createEmptyBOMSummary(): BOMSummary {
  return {
    total_line_items: 0,
    unique_parts: 0,
    total_quantity: 0,
    ic_count: 0,
    passive_count: 0,
    connector_count: 0,
    mechanical_count: 0,
    mcu_parts: [],
    rf_parts: [],
    sensor_parts: [],
    power_parts: [],
    smd_count: 0,
    through_hole_count: 0,
    bga_count: 0,
    fine_pitch_count: 0,
  };
}
