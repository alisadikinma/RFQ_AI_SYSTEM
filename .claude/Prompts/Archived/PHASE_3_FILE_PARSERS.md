# PHASE 3: File Parsers (Excel & PDF) - Core Files Only

## ⚠️ NOTE
**4 task terakhir sudah dipindahkan ke PHASE_3A_COMPLETE_PARSERS.md:**
- ~~Create LLM enhanced parser (lib/parsers/llm-enhanced.ts)~~
- ~~Create main export (lib/parsers/index.ts)~~
- ~~Create API route (app/api/parse/route.ts)~~
- ~~Run build and verify no errors~~

**Jalankan PHASE_3A setelah PHASE_3 selesai.**

---

## 🎯 OBJECTIVE
Create core file parsers (4 files only). LLM enhancement di PHASE_3A.

---

## 📦 DEPENDENCIES

```bash
npm install xlsx pdf-parse
npm install -D @types/pdf-parse
```

---

## 📝 IMPLEMENTATION

### File 1: `lib/parsers/types.ts`

```typescript
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
  ic_count: number;
  passive_count: number;
  connector_count: number;
  mechanical_count: number;
  mcu_parts: string[];
  rf_parts: string[];
  sensor_parts: string[];
  power_parts: string[];
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
  confidence: number;
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

// Additional types for station parsing
export interface ParsedStationList {
  stations: string[];
  board_type: 'TOP' | 'BOT' | 'BOTH' | null;
  warnings?: string[];
}

export interface ParsedPCBSpecs {
  board_length_mm: number | null;
  board_width_mm: number | null;
  layer_count: number | null;
  cavity_count: number | null;
  is_double_sided: boolean;
}

export interface ParseConfidence {
  confidence: number;
  parse_method: 'algorithmic' | 'llm' | 'hybrid';
  warnings?: string[];
}
```

---

### File 2: `lib/parsers/excel-parser.ts`

```typescript
import * as XLSX from 'xlsx';
import type { ParsedBOM, ParsedBOMRow, BOMSummary } from './types';
import { analyzeBOM } from './bom-analyzer';

const COLUMN_MAPPINGS = {
  item_no: ['item', 'no', 'line', '#', 'seq', 'item no', 'line no'],
  part_number: ['part', 'pn', 'part number', 'part no', 'mpn', 'mfr part', 'component'],
  description: ['description', 'desc', 'part description', 'component name', 'name'],
  quantity: ['qty', 'quantity', 'qy', 'amount', 'count'],
  package_type: ['package', 'footprint', 'case', 'pkg', 'size'],
  manufacturer: ['mfr', 'manufacturer', 'vendor', 'make', 'brand'],
  reference_designator: ['ref', 'designator', 'ref des', 'reference', 'location'],
};

export async function parseExcelBOM(
  buffer: Buffer | ArrayBuffer,
  filename: string
): Promise<ParsedBOM> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  
  let sheetName = workbook.SheetNames.find(
    name => name.toLowerCase().includes('bom')
  ) || workbook.SheetNames[0];
  
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  
  if (jsonData.length < 2) {
    throw new Error('BOM file appears to be empty');
  }
  
  const headerRowIndex = findHeaderRow(jsonData);
  const headers = jsonData[headerRowIndex].map(h => String(h || '').toLowerCase().trim());
  const columnMap = mapColumns(headers);
  
  const foundColumns = Object.values(columnMap).filter(v => v !== undefined).length;
  const confidence = foundColumns >= 3 ? 0.9 : foundColumns >= 2 ? 0.7 : 0.4;
  
  const rows: ParsedBOMRow[] = [];
  let rawText = '';
  
  for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length === 0) continue;
    
    const partNumber = getColumnValue(row, columnMap.part_number);
    if (!partNumber) continue;
    
    const parsedRow: ParsedBOMRow = {
      item_no: parseInt(getColumnValue(row, columnMap.item_no)) || i - headerRowIndex,
      part_number: partNumber,
      description: getColumnValue(row, columnMap.description),
      quantity: parseInt(getColumnValue(row, columnMap.quantity)) || 1,
      package_type: getColumnValue(row, columnMap.package_type),
      manufacturer: getColumnValue(row, columnMap.manufacturer),
      reference_designator: getColumnValue(row, columnMap.reference_designator),
    };
    
    rows.push(parsedRow);
    rawText += `${parsedRow.part_number} ${parsedRow.description} ${parsedRow.package_type || ''}\n`;
  }
  
  const summary = analyzeBOM(rows);
  
  return {
    filename,
    total_rows: rows.length,
    rows,
    summary,
    raw_text: rawText,
    parse_method: 'algorithmic',
    confidence,
  };
}

function findHeaderRow(data: any[][]): number {
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const row = data[i];
    if (!row) continue;
    
    const rowText = row.map(c => String(c || '').toLowerCase()).join(' ');
    const headerKeywords = ['part', 'qty', 'description', 'quantity', 'component'];
    const matches = headerKeywords.filter(kw => rowText.includes(kw));
    
    if (matches.length >= 2) return i;
  }
  return 0;
}

function mapColumns(headers: string[]): Record<string, number | undefined> {
  const map: Record<string, number | undefined> = {};
  
  for (const [field, variations] of Object.entries(COLUMN_MAPPINGS)) {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      if (variations.some(v => header.includes(v))) {
        map[field] = i;
        break;
      }
    }
  }
  
  return map;
}

function getColumnValue(row: any[], index: number | undefined): string {
  if (index === undefined || index < 0 || index >= row.length) return '';
  return String(row[index] || '').trim();
}

export function extractRawTextFromExcel(buffer: Buffer | ArrayBuffer): string {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  let rawText = '';
  
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const text = XLSX.utils.sheet_to_csv(sheet);
    rawText += `=== Sheet: ${sheetName} ===\n${text}\n\n`;
  }
  
  return rawText;
}

// Station list parser (for RFQ)
export async function parseExcelStationList(
  buffer: Buffer | ArrayBuffer
): Promise<{ stations: string[]; board_type: string | null; confidence: number }> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  
  const stations: string[] = [];
  let board_type: string | null = null;
  
  // Look for station-related keywords
  for (const row of jsonData) {
    for (const cell of row) {
      const cellStr = String(cell || '').toUpperCase().trim();
      
      // Common station patterns
      if (cellStr.match(/^(RFT|MMI|VISUAL|CAL|ICT|FCT|AOI|MBT|OS_DOWNLOAD|CURRENT|PCB_CURRENT|UNDERFILL|T_GREASE|SHIELDING|ROUTER|PACKING|LABEL|BARCODE)/)) {
        if (!stations.includes(cellStr)) {
          stations.push(cellStr);
        }
      }
      
      // Board type detection
      if (cellStr === 'TOP' || cellStr === 'BOT' || cellStr === 'BOTH') {
        board_type = cellStr;
      }
    }
  }
  
  return {
    stations,
    board_type,
    confidence: stations.length > 0 ? 0.8 : 0.3
  };
}
```

---

### File 3: `lib/parsers/bom-analyzer.ts`

```typescript
import type { ParsedBOMRow, BOMSummary, InferredFeatures } from './types';

const PATTERNS = {
  mcu: /STM32|ESP32|NRF52|PIC\d|ATMEGA|ATTINY|RP2040|CORTEX|ATSAM|LPC|IMXRT|MSP430|SNAPDRAGON|MEDIATEK|MT\d{4}/i,
  rf: /WIFI|BT|BLUETOOTH|NRF24|SX127|CC1101|LoRa|4G|LTE|GSM|GPRS|RF|ANT|2\.4G|5G|WLAN|BLE|ZIGBEE|NFC/i,
  sensor: /BME\d|BMP\d|MPU\d|LSM\d|ICM\d|SHT\d|AHT\d|HDC\d|ACCEL|GYRO|COMPASS|MEMS|IMU|TEMP|HUMID|PRESSURE|LIGHT|PIR|TOF/i,
  power: /TPS|LM317|LM78|AMS1117|MP1584|MP2307|LDO|DCDC|BUCK|BOOST|PMIC|REG|PWR|BATT|CHARGER|BQ\d/i,
  ic: /IC|CHIP|U\d|QFN|QFP|BGA|SOP|SSOP|TSSOP|SOIC|DIP|LQFP/i,
  resistor: /^R\d|RES|OHM|\dR\d|\dK|\dM|RESISTOR/i,
  capacitor: /^C\d|CAP|UF|NF|PF|MLCC|CAPACITOR|ELEC/i,
  inductor: /^L\d|IND|UH|NH|INDUCTOR|FERRITE|CHOKE/i,
  connector: /CONN|USB|HDMI|FPC|FFC|JST|MOLEX|HEADER|PIN|JACK|SOCKET|SIM|SD|MICRO|TYPE-C|BATTERY/i,
  display: /LCD|OLED|TFT|DISPLAY|SCREEN|PANEL|ILI|ST7|SSD1/i,
  bga: /BGA|CSP|WLCSP|FBGA|VFBGA|LFBGA/i,
  fine_pitch: /0\.4MM|0\.5MM|0402|0201|01005|FINE/i,
  through_hole: /DIP|PTH|TH|THROUGH|HOLE|RADIAL|AXIAL/i,
};

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
    } else if (PATTERNS.resistor.test(text) || PATTERNS.capacitor.test(text) || PATTERNS.inductor.test(text)) {
      summary.passive_count += row.quantity;
    } else if (PATTERNS.connector.test(text)) {
      summary.connector_count += row.quantity;
    } else {
      summary.mechanical_count += row.quantity;
    }
    
    if (PATTERNS.bga.test(text)) summary.bga_count += row.quantity;
    if (PATTERNS.fine_pitch.test(text)) summary.fine_pitch_count += row.quantity;
    if (PATTERNS.through_hole.test(text)) {
      summary.through_hole_count += row.quantity;
    } else {
      summary.smd_count += row.quantity;
    }
  }
  
  summary.mcu_parts = [...new Set(summary.mcu_parts)];
  summary.rf_parts = [...new Set(summary.rf_parts)];
  summary.sensor_parts = [...new Set(summary.sensor_parts)];
  summary.power_parts = [...new Set(summary.power_parts)];
  
  return summary;
}

export function inferPCBFeatures(summary: BOMSummary): InferredFeatures {
  return {
    has_rf: summary.rf_parts.length > 0,
    has_sensors: summary.sensor_parts.length > 0,
    has_power_stage: summary.power_parts.length > 0,
    has_display_connector: summary.connector_count > 0,
    has_battery_connector: summary.connector_count > 0,
    smt_component_count: summary.smd_count,
    bga_count: summary.bga_count,
    fine_pitch_count: summary.fine_pitch_count,
  };
}
```

---

### File 4: `lib/parsers/pdf-parser.ts`

```typescript
import pdf from 'pdf-parse';
import type { ParsedPCBInfo, PCBDimensions } from './types';

export async function parsePCBPdf(
  buffer: Buffer,
  filename: string
): Promise<ParsedPCBInfo> {
  const data = await pdf(buffer);
  const text = data.text;
  
  const dimensions = extractDimensions(text);
  const layers = extractLayerCount(text);
  const cavity = extractCavityCount(text);
  
  let confidence = 0.3;
  if (dimensions.length_mm && dimensions.width_mm) confidence += 0.3;
  if (layers) confidence += 0.2;
  if (cavity) confidence += 0.2;
  
  return {
    filename,
    dimensions: {
      length_mm: dimensions.length_mm,
      width_mm: dimensions.width_mm,
      layer_count: layers,
      cavity_count: cavity,
      thickness_mm: null,
    },
    extracted_text: text,
    parse_method: 'algorithmic',
    confidence,
    notes: [],
  };
}

function extractDimensions(text: string): { length_mm: number | null; width_mm: number | null } {
  const pattern1 = /(\d+\.?\d*)\s*(?:mm)?\s*[x×X]\s*(\d+\.?\d*)\s*mm/i;
  const match1 = text.match(pattern1);
  if (match1) {
    const [, l, w] = match1;
    return {
      length_mm: Math.max(parseFloat(l), parseFloat(w)),
      width_mm: Math.min(parseFloat(l), parseFloat(w)),
    };
  }
  
  const lengthPattern = /(?:length|L)\s*[:=]?\s*(\d+\.?\d*)\s*mm/i;
  const widthPattern = /(?:width|W)\s*[:=]?\s*(\d+\.?\d*)\s*mm/i;
  const lengthMatch = text.match(lengthPattern);
  const widthMatch = text.match(widthPattern);
  
  if (lengthMatch && widthMatch) {
    return {
      length_mm: parseFloat(lengthMatch[1]),
      width_mm: parseFloat(widthMatch[1]),
    };
  }
  
  return { length_mm: null, width_mm: null };
}

function extractLayerCount(text: string): number | null {
  const pattern = /(\d+)\s*[-]?\s*layer/i;
  const match = text.match(pattern);
  return match ? parseInt(match[1]) : null;
}

function extractCavityCount(text: string): number | null {
  const pattern1 = /(\d+)\s*[-]?\s*up/i;
  const match1 = text.match(pattern1);
  if (match1) return parseInt(match1[1]);
  
  const pattern2 = /panel\s*(\d+)\s*[x×X]\s*(\d+)/i;
  const match2 = text.match(pattern2);
  if (match2) return parseInt(match2[1]) * parseInt(match2[2]);
  
  return null;
}

export function extractRawTextFromPDF(buffer: Buffer): Promise<string> {
  return pdf(buffer).then(data => data.text);
}

// Alias for compatibility
export async function extractPCBFromPDF(buffer: Buffer): Promise<ParsedPCBInfo> {
  return parsePCBPdf(buffer, 'uploaded.pdf');
}

export async function parsePDFText(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text;
}
```

---

## ➡️ NEXT STEP

Setelah 4 file di atas selesai, jalankan **PHASE_3A_COMPLETE_PARSERS.md** untuk:
- `lib/parsers/llm-enhanced.ts`
- `lib/parsers/index.ts`
- `app/api/parse/route.ts`
- Build verification

---

## ✅ ACCEPTANCE CRITERIA (PHASE 3)

- [ ] Install dependencies: `npm install xlsx pdf-parse`
- [ ] Create `lib/parsers/types.ts`
- [ ] Create `lib/parsers/excel-parser.ts`
- [ ] Create `lib/parsers/bom-analyzer.ts`
- [ ] Create `lib/parsers/pdf-parser.ts`

## 🧪 QUICK TEST

```typescript
// Test excel parser
import { parseExcelBOM } from '@/lib/parsers/excel-parser';

const buffer = fs.readFileSync('test.xlsx');
const result = await parseExcelBOM(buffer, 'test.xlsx');
console.log(result.summary);
```
