# PHASE_6A: Smart Input & Station Resolution

## 🎯 Objective
Build intelligent input system for New RFQ form that:
1. Accepts multiple input formats (Excel upload, PDF upload, Smart Paste)
2. Auto-detects tabular data from Excel paste
3. Resolves customer station names to standard codes using 3-level intelligence
4. Outputs resolved station list with confidence scores

**Deliverable**: User can input stations → System resolves to standard codes → Ready for Phase 6B similarity search

---

## 📊 Customer Document Format

### Sample XIAOMI Excel Structure

| 序号 | 工段 Section | 选择 Status | 工艺名称 Process Name | 工艺边界 Description |
|------|--------------|-------------|----------------------|---------------------|
| 1 | 板测 Board test | 1 | MBT | MBT测试及物料取放 |
| 2 | 板测 Board test | 0 | CAL1 | CAL1测试及物料取放 |
| 3 | 板测 Board test | 1 | RFT1 | RF1测试及物料取放 |
| 4 | 板测 Board test | 1 | 4G仪表 | 板测段测试用4G仪表 |
| 5 | 板测 Board test | 1 | 主板MMI | 主板MMI抽检及物料取放 |

### Key Challenges
- **Format NOT standardized** - Different customers use different columns
- **Multi-language**: 中文 + English + Indonesian mixed
- **Status filter**: Only extract rows where 选择=1
- **Naming variations**: CAL1/CAL2 → CAL, 4G仪表 → RFT

---

## 📋 SMART PASTE FEATURE

### User Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SMART PASTE WORKFLOW                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. USER COPIES FROM EXCEL                                               │
│     Select columns → Ctrl+C → Clipboard contains TAB-separated text     │
│                                                                          │
│  2. USER PASTES INTO TEXTAREA                                            │
│     Ctrl+V into manual input field                                      │
│                                                                          │
│  3. SYSTEM DETECTS TABULAR DATA                                          │
│     • Contains TAB characters? → Likely Excel paste                     │
│     • Consistent column count? → Tabular data                           │
│     • First row looks like headers? → Has column names                  │
│                                                                          │
│  4. SHOW TABLE PREVIEW MODAL                                             │
│     ┌─────────────────────────────────────────────────────────────┐     │
│     │  📊 Detected Table (5 columns × 8 rows)                      │     │
│     │                                                              │     │
│     │  ┌──────┬────────┬────────┬──────────┬─────────────────┐    │     │
│     │  │ 序号 │ 工段   │ 选择   │ 工艺名称 │ 工艺边界        │    │     │
│     │  ├──────┼────────┼────────┼──────────┼─────────────────┤    │     │
│     │  │ 1    │ 板测   │ 1      │ MBT      │ MBT测试...      │    │     │
│     │  │ 2    │ 板测   │ 0      │ CAL1     │ CAL1测试...     │    │     │
│     │  │ ...  │ ...    │ ...    │ ...      │ ...             │    │     │
│     │  └──────┴────────┴────────┴──────────┴─────────────────┘    │     │
│     │                                                              │     │
│     │  🔍 Column Mapping:                                          │     │
│     │  • Station Name: [工艺名称 ▼]  ← auto-detected               │     │
│     │  • Description:  [工艺边界 ▼]  ← auto-detected               │     │
│     │  • Board Type:   [工段 ▼]                                    │     │
│     │  • Status:       [选择 ▼]                                    │     │
│     │                                                              │     │
│     │  ☑ Filter only enabled (选择=1)                              │     │
│     │                                                              │     │
│     │  [Cancel]                            [✓ Use This Data]       │     │
│     └─────────────────────────────────────────────────────────────┘     │
│                                                                          │
│  5. EXTRACT & PROCEED                                                    │
│     Filter enabled rows → Extract stations → Continue to resolution     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 3-Level Station Resolution

```
┌─────────────────────────────────────────────────────────────────────────┐
│              INTELLIGENT STATION RESOLUTION                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Input: { name: "4G仪表", description: "板测段测试用4G仪表..." }         │
│                                                                          │
│  LEVEL 1: EXACT MATCH                                                    │
│  ─────────────────────                                                   │
│  Query: station_master WHERE UPPER(code) = UPPER("4G仪表")              │
│  Result: ❌ No match                                                     │
│                                                                          │
│  LEVEL 2: ALIAS LOOKUP                                                   │
│  ─────────────────────                                                   │
│  Query: station_aliases WHERE alias_name ILIKE "4G仪表"                 │
│  Try variations: "4G仪表", "4G_仪表", "4G-仪表", "4G INSTRUMENT"         │
│  Result: ❌ No match                                                     │
│                                                                          │
│  LEVEL 3: SEMANTIC MATCH (LLM)                                           │
│  ─────────────────────────────                                           │
│  Send to Gemini:                                                        │
│  - Station name: "4G仪表"                                               │
│  - Description: "板测段测试用4G仪表..."                                  │
│  - Available stations: [list from station_master]                       │
│                                                                          │
│  LLM Response:                                                          │
│  {                                                                       │
│    "matchedCode": "RFT",                                                │
│    "confidence": "medium",                                              │
│    "reasoning": "4G仪表 refers to 4G RF testing instrument"             │
│  }                                                                       │
│                                                                          │
│  OUTPUT:                                                                 │
│  {                                                                       │
│    input: "4G仪表",                                                     │
│    inputDescription: "板测段测试用4G仪表...",                           │
│    resolvedCode: "RFT",                                                 │
│    resolvedName: "Radio Frequency Test",                                │
│    confidence: "medium",                                                │
│    matchMethod: "semantic",                                             │
│    reasoning: "4G仪表 refers to 4G RF testing instrument"               │
│  }                                                                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🖥️ UI Design

### Page: New RFQ Form (`/rfq/new`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🏭 New RFQ Request                                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  📋 Basic Information                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Customer:     [XIAOMI ▼]                                        │    │
│  │  Model Name:   [POCO-X7-PRO          ]                          │    │
│  │  Target Qty:   [50,000    ] pcs/month  (optional)               │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  📊 Station List Input                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  [📄 Excel] [📑 PDF] [✏️ Manual/Paste]  ← Tab selection          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  ✏️ MANUAL / SMART PASTE                                         │    │
│  │  ─────────────────────────────────────────────────────────────  │    │
│  │                                                                  │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │                                                           │  │    │
│  │  │  Enter station names or paste from Excel...              │  │    │
│  │  │                                                           │  │    │
│  │  │  💡 TIP: Copy columns from Excel and paste here -        │  │    │
│  │  │     we'll auto-detect the format!                        │  │    │
│  │  │                                                           │  │    │
│  │  │  Supports: 中文, English, Indonesian                      │  │    │
│  │  │                                                           │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  │                                                                  │    │
│  │  Examples:                                                       │    │
│  │  • Simple list: MBT, CAL, RFT, MMI, VISUAL                      │    │
│  │  • One per line: MBT↵CAL↵RFT↵MMI                                │    │
│  │  • Chinese: 主板MMI, 4G仪表, 副板测试                            │    │
│  │  • Excel paste: Copy entire columns → auto-detected!            │    │
│  │                                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │               [🔍 Resolve Stations & Find Similar Models]        │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Processing State

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🔄 Processing RFQ...                                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ✅ Step 1: Input received (8 stations)                                  │
│  ✅ Step 2: Parsing complete                                             │
│  🔄 Step 3: Resolving station names... (5/8)                            │
│  ⏳ Step 4: Searching similar models                                     │
│                                                                          │
│  ████████████████████░░░░░░░░░░  65%                                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Resolution Results (before similarity search)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ✅ Station Resolution Complete                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  Input            │ Resolved To      │ Confidence │ Method      │    │
│  ├───────────────────┼──────────────────┼────────────┼─────────────┤    │
│  │ MBT               │ MBT              │ ✅ High    │ Exact       │    │
│  │ CAL1              │ CAL              │ ✅ High    │ Alias       │    │
│  │ RFT1              │ RFT              │ ✅ High    │ Alias       │    │
│  │ 4G仪表            │ RFT              │ 🟡 Medium  │ Semantic    │    │
│  │ 主板MMI           │ MMI              │ 🟡 Medium  │ Semantic    │    │
│  │ VISUAL            │ VISUAL           │ ✅ High    │ Exact       │    │
│  │ 未知站点          │ ⚠️ Unresolved    │ ❌ None    │ -           │    │
│  └───────────────────┴──────────────────┴────────────┴─────────────┘    │
│                                                                          │
│  Summary: 6 resolved, 1 unresolved                                      │
│  Unique stations: MBT, CAL, RFT, MMI, VISUAL (5 total)                  │
│                                                                          │
│  ⚠️ 1 station could not be resolved. Please review or proceed anyway.   │
│                                                                          │
│  [← Edit Input]                    [Continue to Find Similar Models →]  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Implementation

### Task 1: TypeScript Types
**File: `lib/rfq/types.ts`**

```typescript
// Input types
export interface StationInput {
  name: string;
  description?: string;
  boardType?: string;
  enabled?: boolean;
}

// Paste detection
export interface PasteDetectionResult {
  isTabular: boolean;
  rows: string[][];
  headers: string[];
  columnCount: number;
  rowCount: number;
  detectedColumns: {
    stationName: number | null;
    description: number | null;
    boardType: number | null;
    status: number | null;
  };
  confidence: 'high' | 'medium' | 'low';
}

// Parsed document
export interface ParsedDocument {
  source: 'excel' | 'pdf' | 'manual' | 'smart_paste';
  stations: StationInput[];
  metadata?: {
    fileName?: string;
    totalRows?: number;
    enabledRows?: number;
  };
}

// Resolution result
export interface ResolvedStation {
  input: string;
  inputDescription?: string;
  inputBoardType?: string;
  resolvedCode: string | null;
  resolvedName: string | null;
  confidence: 'high' | 'medium' | 'low' | 'none';
  matchMethod: 'exact' | 'alias' | 'semantic' | 'unresolved';
  reasoning?: string;
}

// Resolution summary
export interface ResolutionResult {
  stations: ResolvedStation[];
  summary: {
    total: number;
    resolved: number;
    unresolved: number;
    uniqueCodes: string[];
  };
}

// RFQ Request (to be saved)
export interface RFQRequest {
  id?: string;
  customerId: string;
  customerCode?: string;
  modelName: string;
  targetQty?: number;
  inputSource: 'excel' | 'pdf' | 'manual' | 'smart_paste';
  rawInput: StationInput[];
  resolvedStations: ResolvedStation[];
  status: 'draft' | 'processing' | 'completed' | 'error';
  createdAt?: Date;
}
```

### Task 2: Paste Detector
**File: `lib/rfq/paste-detector.ts`**

```typescript
export function detectPastedData(text: string): PasteDetectionResult {
  // 1. Check for TAB characters
  const hasTabs = text.includes('\t');
  
  // 2. Split into rows and columns
  const lines = text.trim().split('\n').filter(line => line.trim());
  const rows = lines.map(line => line.split('\t'));
  
  // 3. Check column consistency
  const columnCounts = rows.map(r => r.length);
  const isConsistent = columnCounts.length > 0 && 
    columnCounts.every(c => Math.abs(c - columnCounts[0]) <= 1);
  
  // 4. Detect if first row is header
  const firstRow = rows[0] || [];
  const headerPatterns = /工艺|Process|Station|Name|序号|No|Section|Status|选择|Description|工段|Board/i;
  const looksLikeHeader = firstRow.some(cell => headerPatterns.test(cell));
  
  // 5. Auto-detect columns
  const detectedColumns = detectColumnPurposes(firstRow);
  
  const isTabular = hasTabs && isConsistent && rows.length > 1;
  
  return {
    isTabular,
    rows: looksLikeHeader ? rows.slice(1) : rows,
    headers: looksLikeHeader ? firstRow : [],
    columnCount: columnCounts[0] || 0,
    rowCount: rows.length - (looksLikeHeader ? 1 : 0),
    detectedColumns,
    confidence: calculateConfidence(isTabular, detectedColumns)
  };
}

function detectColumnPurposes(headers: string[]) {
  const result = { stationName: null, description: null, boardType: null, status: null };
  
  headers.forEach((header, index) => {
    const h = header.toLowerCase();
    if (/工艺名称|process.*name|station|站点/.test(h)) result.stationName = index;
    if (/工艺边界|description|描述|说明|boundary/.test(h)) result.description = index;
    if (/工段|section|board|板型|板测|整机/.test(h)) result.boardType = index;
    if (/选择|status|状态|enable|启用/.test(h)) result.status = index;
  });
  
  return result;
}

function calculateConfidence(isTabular: boolean, detected: any): 'high' | 'medium' | 'low' {
  if (!isTabular) return 'low';
  const foundCount = Object.values(detected).filter(v => v !== null).length;
  if (foundCount >= 3) return 'high';
  if (foundCount >= 1) return 'medium';
  return 'low';
}
```

### Task 3: Station Resolver
**File: `lib/rfq/station-resolver.ts`**

```typescript
import { createClient } from '@/lib/supabase/client';
import { generateText } from '@/lib/llm/client';

export async function resolveStations(
  inputs: StationInput[]
): Promise<ResolutionResult> {
  const supabase = createClient();
  
  // Load master stations and aliases
  const { data: masterStations } = await supabase
    .from('station_master')
    .select('id, code, name, description');
  
  const { data: aliases } = await supabase
    .from('station_aliases')
    .select('alias_name, master_station_id, station_master(code, name)');
  
  const resolved: ResolvedStation[] = [];
  
  for (const input of inputs) {
    const result = await resolveStation(input, masterStations, aliases);
    resolved.push(result);
  }
  
  // Build summary
  const uniqueCodes = [...new Set(
    resolved
      .filter(r => r.resolvedCode)
      .map(r => r.resolvedCode!)
  )];
  
  return {
    stations: resolved,
    summary: {
      total: resolved.length,
      resolved: resolved.filter(r => r.resolvedCode).length,
      unresolved: resolved.filter(r => !r.resolvedCode).length,
      uniqueCodes
    }
  };
}

async function resolveStation(
  input: StationInput,
  masterStations: any[],
  aliases: any[]
): Promise<ResolvedStation> {
  const name = input.name.trim();
  
  // LEVEL 1: Exact match
  const exactMatch = masterStations.find(
    s => s.code.toUpperCase() === name.toUpperCase()
  );
  if (exactMatch) {
    return {
      input: name,
      inputDescription: input.description,
      resolvedCode: exactMatch.code,
      resolvedName: exactMatch.name,
      confidence: 'high',
      matchMethod: 'exact'
    };
  }
  
  // LEVEL 2: Alias lookup
  const normalizedName = name.replace(/[\s_-]/g, '').toUpperCase();
  const aliasMatch = aliases.find(a => {
    const normalizedAlias = a.alias_name.replace(/[\s_-]/g, '').toUpperCase();
    return normalizedAlias === normalizedName || 
           a.alias_name.toUpperCase() === name.toUpperCase();
  });
  if (aliasMatch) {
    return {
      input: name,
      inputDescription: input.description,
      resolvedCode: aliasMatch.station_master.code,
      resolvedName: aliasMatch.station_master.name,
      confidence: 'high',
      matchMethod: 'alias'
    };
  }
  
  // LEVEL 3: Semantic match (LLM)
  const semanticResult = await semanticMatch(input, masterStations);
  if (semanticResult) {
    return {
      input: name,
      inputDescription: input.description,
      resolvedCode: semanticResult.code,
      resolvedName: semanticResult.name,
      confidence: semanticResult.confidence,
      matchMethod: 'semantic',
      reasoning: semanticResult.reasoning
    };
  }
  
  // Unresolved
  return {
    input: name,
    inputDescription: input.description,
    resolvedCode: null,
    resolvedName: null,
    confidence: 'none',
    matchMethod: 'unresolved'
  };
}

async function semanticMatch(
  input: StationInput,
  masterStations: any[]
): Promise<{ code: string; name: string; confidence: 'medium' | 'low'; reasoning: string } | null> {
  const stationList = masterStations
    .map(s => `${s.code} | ${s.name} | ${s.description || ''}`)
    .join('\n');
  
  const prompt = `You are a station name resolver for an EMS factory.
You MUST understand Chinese (中文), English, and Indonesian.

Input Station:
- Name: "${input.name}"
- Description: "${input.description || 'N/A'}"
- Board Type: "${input.boardType || 'N/A'}"

Standard Stations (code | name | description):
${stationList}

Common Chinese terms:
- 测试 = test, 仪表 = instrument, 主板 = mainboard, 副板 = sub-board
- 抽检 = spot check, 物料取放 = material handling, 装盘入库 = packing

Rules:
1. Match by function/meaning, not spelling
2. Handle numbered variants: CAL1→CAL, RFT1→RFT
3. Compound names (WIFIBT) → primary function
4. Return null if no reasonable match

Respond in JSON only:
{"matchedCode": "CODE" or null, "confidence": "medium" or "low", "reasoning": "brief explanation"}`;

  try {
    const response = await generateText(prompt);
    const json = JSON.parse(response);
    
    if (json.matchedCode) {
      const station = masterStations.find(s => s.code === json.matchedCode);
      if (station) {
        return {
          code: station.code,
          name: station.name,
          confidence: json.confidence || 'medium',
          reasoning: json.reasoning
        };
      }
    }
  } catch (e) {
    console.error('Semantic match failed:', e);
  }
  
  return null;
}
```

### Task 4: Document Parser
**File: `lib/rfq/document-parser.ts`**

```typescript
import * as XLSX from 'xlsx';
import { detectPastedData } from './paste-detector';
import { generateText } from '@/lib/llm/client';

export async function parseExcelFile(file: File): Promise<ParsedDocument> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
  
  // Use LLM to detect columns
  const headers = rows[0] || [];
  const sampleRows = rows.slice(1, 6);
  const columns = await detectColumnsWithLLM(headers, sampleRows);
  
  // Extract stations
  const stations: StationInput[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    // Check status if column detected
    if (columns.status !== null) {
      const status = row[columns.status];
      if (status === 0 || status === '0' || status === 'no' || status === 'N') {
        continue; // Skip disabled
      }
    }
    
    if (columns.stationName !== null && row[columns.stationName]) {
      stations.push({
        name: String(row[columns.stationName]).trim(),
        description: columns.description !== null ? String(row[columns.description] || '') : undefined,
        boardType: columns.boardType !== null ? String(row[columns.boardType] || '') : undefined,
        enabled: true
      });
    }
  }
  
  return {
    source: 'excel',
    stations,
    metadata: {
      fileName: file.name,
      totalRows: rows.length - 1,
      enabledRows: stations.length
    }
  };
}

export function parseManualInput(text: string): ParsedDocument {
  // First check if it's tabular (Excel paste)
  const detection = detectPastedData(text);
  
  if (detection.isTabular) {
    return parseFromDetection(detection);
  }
  
  // Simple text parsing (comma or newline separated)
  const lines = text
    .split(/[,\n]/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  return {
    source: 'manual',
    stations: lines.map(name => ({ name, enabled: true }))
  };
}

function parseFromDetection(detection: PasteDetectionResult): ParsedDocument {
  const { rows, detectedColumns } = detection;
  const stations: StationInput[] = [];
  
  for (const row of rows) {
    // Check status
    if (detectedColumns.status !== null) {
      const status = row[detectedColumns.status];
      if (status === '0' || status === 'no' || status === 'N' || status === '否') {
        continue;
      }
    }
    
    // Get station name
    const nameCol = detectedColumns.stationName ?? 0;
    const name = row[nameCol]?.trim();
    if (!name) continue;
    
    stations.push({
      name,
      description: detectedColumns.description !== null ? row[detectedColumns.description] : undefined,
      boardType: detectedColumns.boardType !== null ? row[detectedColumns.boardType] : undefined,
      enabled: true
    });
  }
  
  return {
    source: 'smart_paste',
    stations,
    metadata: {
      totalRows: rows.length,
      enabledRows: stations.length
    }
  };
}

async function detectColumnsWithLLM(headers: string[], sampleRows: string[][]) {
  const prompt = `You are parsing an Excel document from an EMS factory.
The document may contain Chinese (中文), English, or Indonesian text.

Given these column headers and sample rows, identify which columns contain:
1. station_name_col: Station/process name (e.g., MBT, CAL, RFT, 主板MMI)
2. description_col: Station description/details
3. board_type_col: Board type/section (e.g., 板测, 整机, Main Board)
4. status_col: Enable/disable flag (values: 0/1, yes/no, ✓/✗)

Headers: ${JSON.stringify(headers)}
Sample rows: ${JSON.stringify(sampleRows)}

Respond in JSON only:
{"stationName": column_index or null, "description": column_index or null, "boardType": column_index or null, "status": column_index or null}`;

  try {
    const response = await generateText(prompt);
    return JSON.parse(response);
  } catch (e) {
    // Fallback to heuristic detection
    return detectColumnPurposes(headers);
  }
}
```

### Task 5: API Route
**File: `app/api/rfq/resolve/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { parseManualInput, parseExcelFile } from '@/lib/rfq/document-parser';
import { resolveStations } from '@/lib/rfq/station-resolver';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const inputType = formData.get('inputType') as string;
    
    let parsed;
    
    if (inputType === 'excel') {
      const file = formData.get('file') as File;
      parsed = await parseExcelFile(file);
    } else if (inputType === 'manual') {
      const text = formData.get('text') as string;
      parsed = parseManualInput(text);
    } else {
      return NextResponse.json({ error: 'Invalid input type' }, { status: 400 });
    }
    
    // Resolve stations
    const resolution = await resolveStations(parsed.stations);
    
    return NextResponse.json({
      success: true,
      parsed,
      resolution
    });
  } catch (error) {
    console.error('RFQ resolve error:', error);
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}
```

### Task 6: UI Components

**File: `components/rfq/SmartPasteTextarea.tsx`**
**File: `components/rfq/TablePreviewModal.tsx`**
**File: `components/rfq/StationResolutionTable.tsx`**

### Task 7: RFQ Form Page
**File: `app/(dashboard)/rfq/new/page.tsx`**

---

## 📁 File Structure

```
lib/rfq/
├── types.ts                  # TypeScript interfaces
├── paste-detector.ts         # Smart paste detection
├── station-resolver.ts       # 3-level resolution
└── document-parser.ts        # Excel/PDF/Manual parsing

app/api/rfq/
└── resolve/
    └── route.ts              # Resolution endpoint

components/rfq/
├── SmartPasteTextarea.tsx    # Textarea with paste detection
├── TablePreviewModal.tsx     # Preview modal for detected table
├── ColumnMappingDropdowns.tsx # Manual column override
├── ProcessingProgress.tsx    # Step indicator
└── StationResolutionTable.tsx # Resolution results table

app/(dashboard)/rfq/
└── new/
    └── page.tsx              # New RFQ form
```

---

## ✅ Acceptance Criteria

### Smart Paste
- [ ] Detects Excel paste (TAB-separated) on paste event
- [ ] Shows table preview modal with column count
- [ ] Auto-detects column purposes (station name, status, etc.)
- [ ] Allows manual column mapping override
- [ ] Filters only enabled rows (status=1)
- [ ] Works with CN/EN/ID mixed content

### Station Resolution
- [ ] Level 1: Exact match works (case-insensitive)
- [ ] Level 2: Alias lookup works (normalized)
- [ ] Level 3: Semantic match via Gemini works
- [ ] Multi-language support (中文, English, Indonesian)
- [ ] Confidence badges display correctly
- [ ] Unresolved stations flagged clearly

### Output
- [ ] Resolution table shows all results
- [ ] Summary shows resolved/unresolved counts
- [ ] Unique station codes extracted
- [ ] Ready to pass to Phase 6B similarity search

---

## 🔗 Output for Phase 6B

Phase 6A outputs `ResolutionResult` which Phase 6B consumes:

```typescript
{
  stations: ResolvedStation[],
  summary: {
    total: 8,
    resolved: 7,
    unresolved: 1,
    uniqueCodes: ["MBT", "CAL", "RFT", "MMI", "VISUAL"]  // ← Used for similarity
  }
}
```

Phase 6B will use `uniqueCodes` array for Jaccard similarity search.
