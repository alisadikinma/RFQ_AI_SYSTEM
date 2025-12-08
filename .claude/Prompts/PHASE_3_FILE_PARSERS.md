# PHASE 3: File Parsers (Excel BOM & PDF)

## 🎯 OBJECTIVE
Implement file parsing for Excel BOM files and PDF drawings to extract PCB features and component data for similarity matching.

---

## 📋 CONTEXT

Project: RFQ AI System for EMS Manufacturing
Location: `D:\Projects\RFQ_AI_SYSTEM`

**Input File Types:**
1. **Excel (.xlsx, .xls)** - BOM files with component lists
2. **PDF** - PCB drawings with dimensions, gerber previews

---

## 🏗️ ARCHITECTURE

```
lib/
├── parsers/
│   ├── index.ts           # Main export
│   ├── excel-parser.ts    # BOM Excel parsing
│   ├── pdf-parser.ts      # PDF dimension extraction
│   ├── bom-analyzer.ts    # Component categorization
│   └── types.ts           # Parser types
```

---

## 📦 DEPENDENCIES

Add to `package.json`:
```json
{
  "dependencies": {
    "xlsx": "^0.18.5",
    "pdf-parse": "^1.1.1"
  },
  "devDependencies": {
    "@types/pdf-parse": "^1.1.1"
  }
}
```

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

export interface ParsedBOM {
  filename: string;
  total_rows: number;
  rows: ParsedBOMRow[];
  summary: BOMSummaryExtracted;
  raw_text: string;
}

export interface BOMSummaryExtracted {
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

export interface ParsedPCBInfo {
  filename: string;
  dimensions?: {
    length_mm: number;
    width_mm: number;
  };
  layer_count?: number;
  cavity_count?: number;
  extracted_text: string;
}

export interface FileParseResult {
  success: boolean;
  error?: string;
  bom?: ParsedBOM;
  pcb?: ParsedPCBInfo;
}
```

### File 2: `lib/parsers/excel-parser.ts`

```typescript
import * as XLSX from 'xlsx';
import type { ParsedBOM, ParsedBOMRow } from './types';
import { analyzeBOM } from './bom-analyzer';

/**
 * Common BOM column header variations
 */
const COLUMN_MAPPINGS = {
  item_no: ['item', 'no', 'line', '#', 'seq', 'item no', 'line no'],
  part_number: ['part', 'pn', 'part number', 'part no', 'mpn', 'mfr part', 'component'],
  description: ['description', 'desc', 'part description', 'component name'],
  quantity: ['qty', 'quantity', 'qy', 'amount', 'count'],
  package_type: ['package', 'footprint', 'case', 'pkg', 'size'],
  manufacturer: ['mfr', 'manufacturer', 'vendor', 'make', 'brand'],
  reference_designator: ['ref', 'designator', 'ref des', 'reference', 'location'],
};

/**
 * Parse Excel file buffer to BOM data
 */
export async function parseExcelBOM(
  buffer: Buffer | ArrayBuffer,
  filename: string
): Promise<ParsedBOM> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  
  // Get first sheet (or sheet named 'BOM')
  let sheetName = workbook.SheetNames.find(
    name => name.toLowerCase().includes('bom')
  ) || workbook.SheetNames[0];
  
  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  
  if (jsonData.length < 2) {
    throw new Error('BOM file appears to be empty');
  }
  
  // Find header row (usually first or second row)
  const headerRowIndex = findHeaderRow(jsonData);
  const headers = jsonData[headerRowIndex].map(h => String(h || '').toLowerCase().trim());
  
  // Map columns
  const columnMap = mapColumns(headers);
  
  // Parse data rows
  const rows: ParsedBOMRow[] = [];
  let rawText = '';
  
  for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length === 0) continue;
    
    const partNumber = getColumnValue(row, columnMap.part_number);
    if (!partNumber) continue; // Skip empty rows
    
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
  
  // Analyze BOM for summary
  const summary = analyzeBOM(rows);
  
  return {
    filename,
    total_rows: rows.length,
    rows,
    summary,
    raw_text: rawText,
  };
}

function findHeaderRow(data: any[][]): number {
  // Look for row with multiple known header keywords
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

function mapColumns(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  
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

/**
 * Parse multiple sheets for multi-board BOMs
 */
export async function parseMultiBoardBOM(
  buffer: Buffer | ArrayBuffer,
  filename: string
): Promise<Map<string, ParsedBOM>> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const results = new Map<string, ParsedBOM>();
  
  for (const sheetName of workbook.SheetNames) {
    // Skip sheets that don't look like BOMs
    if (sheetName.toLowerCase().includes('summary') || 
        sheetName.toLowerCase().includes('cover')) {
      continue;
    }
    
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
    
    if (jsonData.length < 2) continue;
    
    try {
      // Re-parse each sheet
      const sheetBuffer = XLSX.write(
        { SheetNames: [sheetName], Sheets: { [sheetName]: sheet } },
        { type: 'buffer' }
      );
      const bom = await parseExcelBOM(sheetBuffer, `${filename}:${sheetName}`);
      results.set(sheetName, bom);
    } catch (e) {
      console.warn(`Failed to parse sheet ${sheetName}:`, e);
    }
  }
  
  return results;
}
```

### File 3: `lib/parsers/bom-analyzer.ts`

```typescript
import type { ParsedBOMRow, BOMSummaryExtracted } from './types';

/**
 * Component category patterns
 */
const PATTERNS = {
  // MCU/Processor
  mcu: /STM32|ESP32|NRF52|PIC\d|ATMEGA|ATTINY|RP2040|ARM|CORTEX|ATSAM|LPC|IMXRT|MSP430/i,
  
  // RF/Wireless
  rf: /WIFI|BT|BLUETOOTH|NRF24|SX127|CC1101|LoRa|4G|LTE|GSM|GPRS|RF|ANT|2\.4G|5G|WLAN|BLE/i,
  
  // Sensors
  sensor: /BME\d|BMP\d|MPU\d|LSM\d|ICM\d|SHT\d|AHT\d|HDC\d|ACCEL|GYRO|COMPASS|MEMS|IMU|TEMP|HUMID|PRESSURE|LIGHT|PIR|TOF/i,
  
  // Power Management
  power: /TPS|LM317|LM78|AMS1117|MP1584|MP2307|LDO|DCDC|BUCK|BOOST|PMIC|REG|PWR|BATT|CHARGER|BQ\d/i,
  
  // IC general
  ic: /IC|CHIP|U\d|QFN|QFP|BGA|SOP|SSOP|TSSOP|SOIC|DIP|LQFP|LFBGA|VFBGA/i,
  
  // Passives
  resistor: /^R\d|RES|OHM|\dR\d|\dK|\dM|RESISTOR/i,
  capacitor: /^C\d|CAP|UF|NF|PF|MLCC|CAPACITOR|ELEC/i,
  inductor: /^L\d|IND|UH|NH|INDUCTOR|FERRITE|CHOKE/i,
  
  // Connectors
  connector: /CONN|USB|HDMI|FPC|FFC|JST|MOLEX|HEADER|PIN|JACK|SOCKET|SIM|SD|MICRO|TYPE-C/i,
  
  // Packages
  bga: /BGA|CSP|WLCSP|FBGA|VFBGA|LFBGA/i,
  fine_pitch: /0\.4MM|0\.5MM|0402|0201|01005|FINE/i,
  through_hole: /DIP|PTH|TH|THROUGH|HOLE|RADIAL|AXIAL/i,
};

/**
 * Analyze BOM rows to extract summary statistics
 */
export function analyzeBOM(rows: ParsedBOMRow[]): BOMSummaryExtracted {
  const summary: BOMSummaryExtracted = {
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
    } else if (PATTERNS.resistor.test(text) || PATTERNS.capacitor.test(text) || PATTERNS.inductor.test(text)) {
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
  
  // Deduplicate part lists
  summary.mcu_parts = [...new Set(summary.mcu_parts)];
  summary.rf_parts = [...new Set(summary.rf_parts)];
  summary.sensor_parts = [...new Set(summary.sensor_parts)];
  summary.power_parts = [...new Set(summary.power_parts)];
  
  return summary;
}

/**
 * Infer PCB features from BOM analysis
 */
export function inferPCBFeaturesFromBOM(summary: BOMSummaryExtracted): {
  has_rf: boolean;
  has_sensors: boolean;
  has_power_stage: boolean;
  smt_component_count: number;
  through_hole_count: number;
  bga_count: number;
  fine_pitch_count: number;
} {
  return {
    has_rf: summary.rf_parts.length > 0,
    has_sensors: summary.sensor_parts.length > 0,
    has_power_stage: summary.power_parts.length > 0,
    smt_component_count: summary.smd_count,
    through_hole_count: summary.through_hole_count,
    bga_count: summary.bga_count,
    fine_pitch_count: summary.fine_pitch_count,
  };
}
```

### File 4: `lib/parsers/pdf-parser.ts`

```typescript
import pdf from 'pdf-parse';
import type { ParsedPCBInfo } from './types';

/**
 * Parse PDF for PCB dimension information
 */
export async function parsePCBPdf(
  buffer: Buffer,
  filename: string
): Promise<ParsedPCBInfo> {
  const data = await pdf(buffer);
  const text = data.text;
  
  const result: ParsedPCBInfo = {
    filename,
    extracted_text: text,
  };
  
  // Try to extract dimensions
  const dimensions = extractDimensions(text);
  if (dimensions) {
    result.dimensions = dimensions;
  }
  
  // Try to extract layer count
  const layers = extractLayerCount(text);
  if (layers) {
    result.layer_count = layers;
  }
  
  // Try to extract cavity/panel info
  const cavity = extractCavityCount(text);
  if (cavity) {
    result.cavity_count = cavity;
  }
  
  return result;
}

/**
 * Extract PCB dimensions from text
 * Looks for patterns like "100mm x 50mm", "L: 100, W: 50"
 */
function extractDimensions(text: string): { length_mm: number; width_mm: number } | null {
  // Pattern: NNNmm x NNNmm or NNN x NNN mm
  const pattern1 = /(\d+\.?\d*)\s*(?:mm)?\s*[x×X]\s*(\d+\.?\d*)\s*mm/i;
  const match1 = text.match(pattern1);
  if (match1) {
    const [, l, w] = match1;
    return {
      length_mm: Math.max(parseFloat(l), parseFloat(w)),
      width_mm: Math.min(parseFloat(l), parseFloat(w)),
    };
  }
  
  // Pattern: Length: NNN Width: NNN
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
  
  // Pattern: Board Size NNN x NNN
  const pattern2 = /board\s*size\s*[:=]?\s*(\d+\.?\d*)\s*[x×X]\s*(\d+\.?\d*)/i;
  const match2 = text.match(pattern2);
  if (match2) {
    const [, l, w] = match2;
    return {
      length_mm: Math.max(parseFloat(l), parseFloat(w)),
      width_mm: Math.min(parseFloat(l), parseFloat(w)),
    };
  }
  
  return null;
}

/**
 * Extract layer count from text
 */
function extractLayerCount(text: string): number | null {
  // Pattern: N-layer, N layer, N layers
  const pattern = /(\d+)\s*[-]?\s*layer/i;
  const match = text.match(pattern);
  if (match) {
    return parseInt(match[1]);
  }
  
  // Pattern: Layer: N, Layers: N
  const pattern2 = /layers?\s*[:=]?\s*(\d+)/i;
  const match2 = text.match(pattern2);
  if (match2) {
    return parseInt(match2[1]);
  }
  
  return null;
}

/**
 * Extract cavity/panel count from text
 */
function extractCavityCount(text: string): number | null {
  // Pattern: N-up, Nup, N up
  const pattern1 = /(\d+)\s*[-]?\s*up/i;
  const match1 = text.match(pattern1);
  if (match1) {
    return parseInt(match1[1]);
  }
  
  // Pattern: cavity: N, cavities: N, N cavity
  const pattern2 = /(?:cavit(?:y|ies))\s*[:=]?\s*(\d+)|(\d+)\s*cavit/i;
  const match2 = text.match(pattern2);
  if (match2) {
    return parseInt(match2[1] || match2[2]);
  }
  
  // Pattern: panel N x N (e.g., 2x2 = 4 cavity)
  const pattern3 = /panel\s*(\d+)\s*[x×X]\s*(\d+)/i;
  const match3 = text.match(pattern3);
  if (match3) {
    return parseInt(match3[1]) * parseInt(match3[2]);
  }
  
  return null;
}
```

### File 5: `lib/parsers/index.ts`

```typescript
import { parseExcelBOM, parseMultiBoardBOM } from './excel-parser';
import { parsePCBPdf } from './pdf-parser';
import { analyzeBOM, inferPCBFeaturesFromBOM } from './bom-analyzer';
import type { FileParseResult, ParsedBOM, ParsedPCBInfo } from './types';

export * from './types';
export { analyzeBOM, inferPCBFeaturesFromBOM };

/**
 * Parse uploaded file based on type
 */
export async function parseUploadedFile(
  file: File
): Promise<FileParseResult> {
  const buffer = await file.arrayBuffer();
  const filename = file.name.toLowerCase();
  
  try {
    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      const bom = await parseExcelBOM(Buffer.from(buffer), file.name);
      return { success: true, bom };
    }
    
    if (filename.endsWith('.pdf')) {
      const pcb = await parsePCBPdf(Buffer.from(buffer), file.name);
      return { success: true, pcb };
    }
    
    return {
      success: false,
      error: `Unsupported file type: ${filename}. Supported: .xlsx, .xls, .pdf`,
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to parse ${filename}: ${error.message}`,
    };
  }
}

/**
 * Parse multiple files and combine results
 */
export async function parseMultipleFiles(
  files: File[]
): Promise<{
  boms: ParsedBOM[];
  pcbs: ParsedPCBInfo[];
  errors: string[];
}> {
  const boms: ParsedBOM[] = [];
  const pcbs: ParsedPCBInfo[] = [];
  const errors: string[] = [];
  
  for (const file of files) {
    const result = await parseUploadedFile(file);
    
    if (result.success) {
      if (result.bom) boms.push(result.bom);
      if (result.pcb) pcbs.push(result.pcb);
    } else if (result.error) {
      errors.push(result.error);
    }
  }
  
  return { boms, pcbs, errors };
}
```

---

## 🔌 INTEGRATION WITH WIZARD

Update `components/rfq/wizard/steps/FileUploadStep.tsx`:

```typescript
import { parseUploadedFile, inferPCBFeaturesFromBOM } from '@/lib/parsers';

// In file upload handler:
const handleFileUpload = async (files: FileList) => {
  setIsProcessing(true);
  
  for (const file of Array.from(files)) {
    const result = await parseUploadedFile(file);
    
    if (result.success) {
      if (result.bom) {
        // Extract features and update wizard data
        const features = inferPCBFeaturesFromBOM(result.bom.summary);
        onChange({
          bom: result.bom,
          pcbFeatures: { ...data.pcbFeatures, ...features },
        });
      }
      if (result.pcb) {
        onChange({
          pcbInfo: result.pcb,
          pcbFeatures: {
            ...data.pcbFeatures,
            ...result.pcb.dimensions,
            layer_count: result.pcb.layer_count,
            cavity_count: result.pcb.cavity_count,
          },
        });
      }
    } else {
      toast.error(result.error);
    }
  }
  
  setIsProcessing(false);
};
```

---

## ✅ ACCEPTANCE CRITERIA

- [ ] Excel BOM parser handles common formats (Altium, KiCad, generic)
- [ ] Column mapping works with varied header names
- [ ] Component categorization accurate for IC/passive/connector
- [ ] MCU, RF, sensor detection from part numbers
- [ ] PDF dimension extraction works for common formats
- [ ] Multi-board BOMs (multiple sheets) handled
- [ ] Errors reported gracefully without crashing
- [ ] File upload in wizard works end-to-end

---

## 🧪 TEST FILES

Create test files in `__tests__/fixtures/`:
- `sample_bom.xlsx` - Standard BOM with varied columns
- `multi_board_bom.xlsx` - Multiple sheets for Main/Sub boards
- `pcb_drawing.pdf` - PDF with dimension info

---

## 🚀 NEXT PHASE

After parsers work, proceed to PHASE 4: Cost Calculation Engine
