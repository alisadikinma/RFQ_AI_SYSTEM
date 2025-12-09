# Phase 6D: Smart Excel Parser & Table Preview

## 📋 Overview

Phase 6D fixes the broken Excel paste functionality with intelligent column detection, table preview modal, status filtering, and auto-resolve.

**Problem Solved**: Current paste treats headers as station names and doesn't detect table structure.

---

## 🎯 Objectives

| Current (Broken) | Phase 6D (Fixed) |
|------------------|------------------|
| Headers parsed as stations | Auto-detect & skip headers |
| All text treated as stations | Extract "Process Name" column only |
| No status filtering | Filter by Status = 1 only |
| Manual "Resolve" button | Auto-resolve after import |
| Berantakan display | Clean table preview modal |

---

## 📊 Input Data Analysis

### XIAOMI Excel Format (from screenshot)

```
| 序号 | 工段              | 选择   | 工艺路线         | 工艺名称                  | 工艺边界              | 工艺编号 | 工站通用性 | 工站属性   |
| No.  | Section           | Status | Process Routing  | Process Name              | Process Description   | Process  | Versatility| Section    |
|------|-------------------|--------|------------------|---------------------------|----------------------|----------|------------|------------|
| 1    | 板测 Board level  | 1      | 主板测试         | MBT                       | MBT测试及物料取放     | SA001    | 全通用     | 制程       |
| 2    | 板测 Board level  | 1      | 主板测试         | CAL1                      | CAL1测试及物料取放    | SA002    | 全通用     | 制程       |
| 3    | 板测 Board level  | 0      | 主板测试         | CAL2                      | CAL2测试及物料取放    | SA003    | 全通用     | 制程       |
| 4    | 板测 Board level  | 1      | 主板测试         | RFT1                      | RF1测试及物料取放     | SA004    | 全通用     | 制程       |
| 5    | 板测 Board level  | 1      | 主板测试         | RFT2                      | RF2测试及物料取放     | SA005    | 全通用     | 制程       |
| 6    | 板测 Board level  | 0      | Mainboard testing| WIFIBT                    | WIFIBT测试及物料取放  | SA006    | 全通用     | 制程       |
| 7    | 板测 Board level  | 1      | 主板测试         | 4G仪表 4G instrumentation | 板测段测试用4G仪表... | SA007    | 全通用     | 制程       |
```

### Key Columns to Detect

| Column Name (EN) | Column Name (CN) | Purpose | Required |
|------------------|------------------|---------|----------|
| Process Name | 工艺名称 | **Station code to extract** | ✅ Yes |
| Status | 选择 | **Filter: only Status=1** | ✅ Yes |
| Section | 工段 | Board type info | Optional |
| Process Description | 工艺边界 | Context info | Optional |

---

## 🏗️ Architecture

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PHASE 6D FLOW                                    │
└─────────────────────────────────────────────────────────────────────────┘

  User pastes Excel data into textarea
              │
              ▼
  ┌───────────────────────────────────┐
  │  1. DETECT INPUT TYPE             │
  │  ─────────────────────────────    │
  │  • Contains TAB (\t)?             │
  │    → Excel table format           │
  │  • Contains newlines only?        │
  │    → Simple list format           │
  │  • Comma/space separated?         │
  │    → Inline list format           │
  └───────────────────────────────────┘
              │
              │ If Excel format detected
              ▼
  ┌───────────────────────────────────┐
  │  2. PARSE TABLE STRUCTURE         │
  │  ─────────────────────────────    │
  │  • Split by rows (\n)             │
  │  • Split each row by TAB (\t)     │
  │  • Detect header row (row 0 or 1) │
  │  • Count columns                  │
  │  • Handle multi-line headers      │
  └───────────────────────────────────┘
              │
              ▼
  ┌───────────────────────────────────┐
  │  3. AUTO-DETECT COLUMNS           │
  │  ─────────────────────────────    │
  │  • Find "Process Name" / 工艺名称 │
  │  • Find "Status" / 选择           │
  │  • Find "Section" / 工段          │
  │  • Find "Description" / 工艺边界  │
  │  • Confidence score per column    │
  └───────────────────────────────────┘
              │
              ▼
  ┌───────────────────────────────────┐
  │  4. SHOW TABLE PREVIEW MODAL      │
  │  ─────────────────────────────    │
  │  • Display parsed table           │
  │  • Column role dropdowns          │
  │  • Status filter toggle           │
  │  • Preview extracted stations     │
  │  • Row count summary              │
  └───────────────────────────────────┘
              │
              │ User confirms
              ▼
  ┌───────────────────────────────────┐
  │  5. EXTRACT & AUTO-RESOLVE        │
  │  ─────────────────────────────    │
  │  • Extract station names          │
  │  • Filter by Status = 1           │
  │  • Call resolution API            │
  │  • Display results immediately    │
  └───────────────────────────────────┘
```

---

## 📁 File Structure

```
lib/
├── excel-parser/
│   ├── index.ts                 # Main export
│   ├── detector.ts              # Input type detection
│   ├── table-parser.ts          # Parse Excel table structure
│   ├── column-detector.ts       # Auto-detect column roles
│   └── types.ts                 # TypeScript types

components/
├── rfq/
│   ├── SmartPasteInput.tsx      # Enhanced textarea with detection
│   ├── TablePreviewModal.tsx    # Preview & configure modal
│   ├── ColumnRoleSelector.tsx   # Dropdown for column assignment
│   └── ExtractedStationsPreview.tsx  # Preview before resolve

app/
└── api/
    └── rfq/
        └── parse-excel/
            └── route.ts         # API endpoint for parsing
```

---

## 📝 Type Definitions

### `lib/excel-parser/types.ts`

```typescript
// Input detection result
export type InputType = 'excel_table' | 'simple_list' | 'inline_list' | 'unknown';

export interface DetectionResult {
  type: InputType;
  confidence: number;        // 0-1
  hasHeaders: boolean;
  rowCount: number;
  columnCount: number;
  rawData: string;
}

// Parsed table structure
export interface ParsedTable {
  headers: string[];          // First row (or detected headers)
  rows: TableRow[];           // Data rows
  columnCount: number;
  rowCount: number;
}

export interface TableRow {
  index: number;              // Original row number
  cells: string[];            // Cell values
  raw: string;                // Original row text
}

// Column role assignment
export type ColumnRole = 
  | 'station_name'      // Process Name / 工艺名称 - REQUIRED
  | 'status'            // Status / 选择 - for filtering
  | 'section'           // Section / 工段 - board type
  | 'description'       // Description / 工艺边界
  | 'sequence'          // No. / 序号
  | 'process_code'      // Process Code / 工艺编号
  | 'ignore';           // Skip this column

export interface ColumnMapping {
  index: number;              // Column index
  header: string;             // Header text
  role: ColumnRole;           // Assigned role
  confidence: number;         // Auto-detection confidence
  samples: string[];          // Sample values for preview
}

// Auto-detection result
export interface ColumnDetectionResult {
  columns: ColumnMapping[];
  stationNameColumn: number | null;    // Index of station name column
  statusColumn: number | null;         // Index of status column
  sectionColumn: number | null;        // Index of section column
  confidence: number;                  // Overall confidence
}

// Extraction config
export interface ExtractionConfig {
  stationNameColumn: number;
  statusColumn: number | null;
  statusFilterValue: string;          // "1" or "true" or custom
  sectionColumn: number | null;
  skipHeaderRows: number;             // Usually 1 or 2
  includeDescription: boolean;
}

// Extracted station
export interface ExtractedStation {
  name: string;                       // Station name/code
  section: string | null;             // Board type if available
  description: string | null;         // Description if available
  originalRow: number;                // Source row for reference
  status: string | null;              // Original status value
}

// Final extraction result
export interface ExtractionResult {
  stations: ExtractedStation[];
  totalRows: number;
  includedRows: number;
  skippedRows: number;               // Filtered out by status
  skippedHeaders: number;            // Header rows skipped
}
```

---

## 🔧 Implementation

### 1. Input Type Detector

`lib/excel-parser/detector.ts`

```typescript
import { DetectionResult, InputType } from './types';

/**
 * Detect input type from pasted text
 */
export function detectInputType(input: string): DetectionResult {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return {
      type: 'unknown',
      confidence: 0,
      hasHeaders: false,
      rowCount: 0,
      columnCount: 0,
      rawData: input
    };
  }

  const lines = trimmed.split('\n');
  const tabCount = (trimmed.match(/\t/g) || []).length;
  const commaCount = (trimmed.match(/,/g) || []).length;
  
  // Excel table: has TABs and multiple lines
  if (tabCount > 0 && lines.length > 1) {
    const firstLineTabCount = (lines[0].match(/\t/g) || []).length;
    const columnCount = firstLineTabCount + 1;
    
    // Check if first row looks like headers
    const hasHeaders = detectHeaders(lines[0], lines[1]);
    
    return {
      type: 'excel_table',
      confidence: tabCount > lines.length ? 0.95 : 0.8,
      hasHeaders,
      rowCount: lines.length,
      columnCount,
      rawData: input
    };
  }
  
  // Simple list: one item per line, no tabs
  if (lines.length > 1 && tabCount === 0) {
    return {
      type: 'simple_list',
      confidence: 0.9,
      hasHeaders: false,
      rowCount: lines.length,
      columnCount: 1,
      rawData: input
    };
  }
  
  // Inline list: comma or space separated, single line
  if (lines.length === 1 && (commaCount > 0 || trimmed.includes(' '))) {
    const items = trimmed.split(/[,\s]+/).filter(Boolean);
    return {
      type: 'inline_list',
      confidence: 0.85,
      hasHeaders: false,
      rowCount: 1,
      columnCount: items.length,
      rawData: input
    };
  }
  
  return {
    type: 'unknown',
    confidence: 0.5,
    hasHeaders: false,
    rowCount: lines.length,
    columnCount: 1,
    rawData: input
  };
}

/**
 * Check if first row looks like headers
 */
function detectHeaders(firstRow: string, secondRow: string): boolean {
  const firstCells = firstRow.split('\t');
  const secondCells = secondRow.split('\t');
  
  // Headers often contain keywords
  const headerKeywords = [
    'no', 'name', 'status', 'section', 'process', 'code', 'description',
    '序号', '名称', '选择', '工段', '工艺', '编号', '边界'
  ];
  
  const firstRowLower = firstRow.toLowerCase();
  const keywordMatches = headerKeywords.filter(kw => firstRowLower.includes(kw));
  
  // If first row has multiple keywords, likely headers
  if (keywordMatches.length >= 2) {
    return true;
  }
  
  // If second row has numbers in first column, first row is likely header
  const secondFirstCell = secondCells[0]?.trim();
  if (/^\d+$/.test(secondFirstCell)) {
    return true;
  }
  
  return false;
}
```

### 2. Table Parser

`lib/excel-parser/table-parser.ts`

```typescript
import { ParsedTable, TableRow } from './types';

/**
 * Parse Excel table from pasted text
 */
export function parseTable(input: string): ParsedTable {
  const lines = input.trim().split('\n');
  
  if (lines.length === 0) {
    return { headers: [], rows: [], columnCount: 0, rowCount: 0 };
  }
  
  // Parse all rows
  const allRows: TableRow[] = lines.map((line, index) => ({
    index,
    cells: parseRow(line),
    raw: line
  }));
  
  // Detect max columns
  const maxColumns = Math.max(...allRows.map(r => r.cells.length));
  
  // Normalize all rows to same column count
  allRows.forEach(row => {
    while (row.cells.length < maxColumns) {
      row.cells.push('');
    }
  });
  
  // First row as headers, rest as data
  const headers = allRows[0]?.cells || [];
  const rows = allRows.slice(1);
  
  return {
    headers,
    rows,
    columnCount: maxColumns,
    rowCount: rows.length
  };
}

/**
 * Parse single row, handling multi-line cell content
 */
function parseRow(line: string): string[] {
  return line.split('\t').map(cell => cleanCell(cell));
}

/**
 * Clean cell value
 */
function cleanCell(cell: string): string {
  return cell
    .trim()
    .replace(/\r/g, '')           // Remove carriage returns
    .replace(/^["']|["']$/g, '')  // Remove surrounding quotes
    .replace(/\s+/g, ' ');        // Normalize whitespace
}

/**
 * Merge multi-row headers (Chinese + English in separate rows)
 */
export function mergeMultiRowHeaders(table: ParsedTable): ParsedTable {
  if (table.rows.length === 0) return table;
  
  const firstDataRow = table.rows[0];
  
  // Check if first data row looks like continuation of headers
  const looksLikeHeader = firstDataRow.cells.every(cell => {
    // Headers typically: no numbers only, contains letters
    return !/^\d+$/.test(cell) && /[a-zA-Z\u4e00-\u9fa5]/.test(cell);
  });
  
  if (looksLikeHeader) {
    // Merge headers
    const mergedHeaders = table.headers.map((h, i) => {
      const second = firstDataRow.cells[i] || '';
      if (h && second && h !== second) {
        return `${h} / ${second}`;
      }
      return h || second;
    });
    
    return {
      headers: mergedHeaders,
      rows: table.rows.slice(1),
      columnCount: table.columnCount,
      rowCount: table.rowCount - 1
    };
  }
  
  return table;
}
```

### 3. Column Role Detector

`lib/excel-parser/column-detector.ts`

```typescript
import { ColumnMapping, ColumnDetectionResult, ColumnRole, ParsedTable } from './types';

// Keywords for each column role
const ROLE_KEYWORDS: Record<ColumnRole, string[]> = {
  station_name: [
    'process name', 'station', 'name', 'process',
    '工艺名称', '站名', '名称', '工艺'
  ],
  status: [
    'status', 'select', 'enable', 'active', 'use',
    '选择', '状态', '启用', '使用'
  ],
  section: [
    'section', 'board', 'type', 'category',
    '工段', '板', '类型', '分类'
  ],
  description: [
    'description', 'desc', 'detail', 'note', 'boundary',
    '工艺边界', '描述', '说明', '备注'
  ],
  sequence: [
    'no', 'number', 'seq', 'order', 'index',
    '序号', '编号', '顺序'
  ],
  process_code: [
    'code', 'id', 'process code',
    '工艺编号', '代码', 'ID'
  ],
  ignore: []
};

/**
 * Auto-detect column roles
 */
export function detectColumns(table: ParsedTable): ColumnDetectionResult {
  const columns: ColumnMapping[] = table.headers.map((header, index) => {
    const role = detectColumnRole(header, table, index);
    const samples = table.rows.slice(0, 3).map(r => r.cells[index] || '');
    
    return {
      index,
      header,
      role: role.role,
      confidence: role.confidence,
      samples
    };
  });
  
  // Find key columns
  const stationNameColumn = columns.find(c => c.role === 'station_name')?.index ?? null;
  const statusColumn = columns.find(c => c.role === 'status')?.index ?? null;
  const sectionColumn = columns.find(c => c.role === 'section')?.index ?? null;
  
  // Calculate overall confidence
  const hasStationName = stationNameColumn !== null;
  const overallConfidence = hasStationName ? 
    columns.reduce((sum, c) => sum + c.confidence, 0) / columns.length :
    0;
  
  return {
    columns,
    stationNameColumn,
    statusColumn,
    sectionColumn,
    confidence: overallConfidence
  };
}

/**
 * Detect role for single column
 */
function detectColumnRole(
  header: string, 
  table: ParsedTable, 
  columnIndex: number
): { role: ColumnRole; confidence: number } {
  const headerLower = header.toLowerCase();
  
  // Check keywords for each role
  for (const [role, keywords] of Object.entries(ROLE_KEYWORDS)) {
    if (role === 'ignore') continue;
    
    for (const keyword of keywords) {
      if (headerLower.includes(keyword.toLowerCase())) {
        return { role: role as ColumnRole, confidence: 0.9 };
      }
    }
  }
  
  // Fallback: analyze sample values
  const samples = table.rows.slice(0, 5).map(r => r.cells[columnIndex] || '');
  
  // Status column: mostly 0/1 or true/false
  if (samples.every(s => ['0', '1', 'true', 'false', ''].includes(s.toLowerCase()))) {
    return { role: 'status', confidence: 0.7 };
  }
  
  // Sequence column: all numbers
  if (samples.every(s => /^\d*$/.test(s))) {
    return { role: 'sequence', confidence: 0.7 };
  }
  
  // Station name: short codes, uppercase, alphanumeric
  const looksLikeStationName = samples.every(s => 
    s.length > 0 && s.length < 30 && /^[A-Z0-9_\-\u4e00-\u9fa5]+$/i.test(s)
  );
  if (looksLikeStationName && columnIndex > 0) {
    return { role: 'station_name', confidence: 0.5 };
  }
  
  return { role: 'ignore', confidence: 0.3 };
}

/**
 * Validate column detection - ensure we have required columns
 */
export function validateDetection(result: ColumnDetectionResult): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (result.stationNameColumn === null) {
    errors.push('Could not detect Station Name column. Please select manually.');
  }
  
  if (result.statusColumn === null) {
    warnings.push('No Status column detected. All rows will be included.');
  }
  
  if (result.confidence < 0.5) {
    warnings.push('Low confidence in column detection. Please verify.');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
```

### 4. Station Extractor

`lib/excel-parser/extractor.ts`

```typescript
import { ParsedTable, ExtractionConfig, ExtractionResult, ExtractedStation } from './types';

/**
 * Extract stations from parsed table
 */
export function extractStations(
  table: ParsedTable,
  config: ExtractionConfig
): ExtractionResult {
  const stations: ExtractedStation[] = [];
  let skippedRows = 0;
  
  for (const row of table.rows) {
    // Get station name
    const name = row.cells[config.stationNameColumn]?.trim();
    
    if (!name) {
      skippedRows++;
      continue;
    }
    
    // Check status filter
    if (config.statusColumn !== null) {
      const status = row.cells[config.statusColumn]?.trim();
      if (status !== config.statusFilterValue) {
        skippedRows++;
        continue;
      }
    }
    
    // Get optional fields
    const section = config.sectionColumn !== null 
      ? row.cells[config.sectionColumn]?.trim() || null
      : null;
    
    const description = config.includeDescription
      ? row.cells.find((_, i) => i !== config.stationNameColumn && row.cells[i]?.length > 20) || null
      : null;
    
    stations.push({
      name,
      section,
      description,
      originalRow: row.index,
      status: config.statusColumn !== null ? row.cells[config.statusColumn] : null
    });
  }
  
  return {
    stations,
    totalRows: table.rows.length,
    includedRows: stations.length,
    skippedRows,
    skippedHeaders: config.skipHeaderRows
  };
}

/**
 * Get unique station names for resolution
 */
export function getUniqueStationNames(result: ExtractionResult): string[] {
  const unique = new Set<string>();
  
  for (const station of result.stations) {
    // Clean station name
    const cleaned = cleanStationName(station.name);
    if (cleaned) {
      unique.add(cleaned);
    }
  }
  
  return Array.from(unique);
}

/**
 * Clean station name for resolution
 */
function cleanStationName(name: string): string {
  return name
    .trim()
    .split(/[\s\/]+/)[0]  // Take first part if "MBT / Manual Bench Test"
    .toUpperCase()
    .replace(/[^A-Z0-9_\-]/g, '');  // Remove special chars
}
```

---

## 🎨 UI Components

### 5. Table Preview Modal

`components/rfq/TablePreviewModal.tsx`

```tsx
'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { 
  ParsedTable, 
  ColumnMapping, 
  ColumnRole,
  ExtractionConfig,
  ExtractionResult 
} from '@/lib/excel-parser/types';
import { extractStations } from '@/lib/excel-parser/extractor';

interface TablePreviewModalProps {
  open: boolean;
  onClose: () => void;
  table: ParsedTable;
  initialColumns: ColumnMapping[];
  onConfirm: (stations: ExtractionResult) => void;
}

const ROLE_OPTIONS: { value: ColumnRole; label: string }[] = [
  { value: 'station_name', label: '🎯 Station Name (Required)' },
  { value: 'status', label: '✅ Status (Filter)' },
  { value: 'section', label: '📂 Section / Board Type' },
  { value: 'description', label: '📝 Description' },
  { value: 'sequence', label: '🔢 Sequence No.' },
  { value: 'process_code', label: '🏷️ Process Code' },
  { value: 'ignore', label: '⏭️ Ignore' },
];

export function TablePreviewModal({
  open,
  onClose,
  table,
  initialColumns,
  onConfirm,
}: TablePreviewModalProps) {
  const [columns, setColumns] = useState<ColumnMapping[]>(initialColumns);
  const [statusFilterValue, setStatusFilterValue] = useState('1');
  const [filterByStatus, setFilterByStatus] = useState(true);

  // Find assigned columns
  const stationNameCol = columns.find(c => c.role === 'station_name')?.index ?? null;
  const statusCol = columns.find(c => c.role === 'status')?.index ?? null;
  const sectionCol = columns.find(c => c.role === 'section')?.index ?? null;

  // Preview extraction
  const preview = useMemo(() => {
    if (stationNameCol === null) return null;
    
    const config: ExtractionConfig = {
      stationNameColumn: stationNameCol,
      statusColumn: filterByStatus ? statusCol : null,
      statusFilterValue,
      sectionColumn: sectionCol,
      skipHeaderRows: 1,
      includeDescription: false,
    };
    
    return extractStations(table, config);
  }, [table, stationNameCol, statusCol, sectionCol, filterByStatus, statusFilterValue]);

  // Update column role
  const updateColumnRole = (index: number, role: ColumnRole) => {
    setColumns(prev => prev.map(c => 
      c.index === index ? { ...c, role } : c
    ));
  };

  // Handle confirm
  const handleConfirm = () => {
    if (preview) {
      onConfirm(preview);
    }
  };

  // Check if row will be included
  const willIncludeRow = (rowIndex: number): boolean => {
    if (!filterByStatus || statusCol === null) return true;
    const status = table.rows[rowIndex]?.cells[statusCol];
    return status === statusFilterValue;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            📋 Table Preview
            <Badge variant="outline">
              {table.rowCount} rows × {table.columnCount} columns
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Column Role Assignment */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Column Roles</h4>
            <div className="flex flex-wrap gap-2">
              {columns.map((col) => (
                <div key={col.index} className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground w-20 truncate" title={col.header}>
                    {col.header || `Col ${col.index + 1}`}
                  </span>
                  <Select
                    value={col.role}
                    onValueChange={(v) => updateColumnRole(col.index, v as ColumnRole)}
                  >
                    <SelectTrigger className="h-7 w-40 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {col.confidence >= 0.8 && (
                    <Badge variant="secondary" className="text-xs">Auto</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          {statusCol !== null && (
            <div className="flex items-center gap-4 p-2 bg-muted rounded">
              <Checkbox
                id="filterStatus"
                checked={filterByStatus}
                onCheckedChange={(c) => setFilterByStatus(!!c)}
              />
              <label htmlFor="filterStatus" className="text-sm">
                Filter by Status column
              </label>
              {filterByStatus && (
                <Select value={statusFilterValue} onValueChange={setStatusFilterValue}>
                  <SelectTrigger className="h-7 w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">= 1</SelectItem>
                    <SelectItem value="0">= 0</SelectItem>
                    <SelectItem value="true">= true</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Table Preview */}
          <ScrollArea className="flex-1 border rounded">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Include</TableHead>
                  {columns.map((col) => (
                    <TableHead 
                      key={col.index}
                      className={col.role === 'station_name' ? 'bg-primary/10' : ''}
                    >
                      <div className="flex flex-col">
                        <span className="truncate">{col.header}</span>
                        <span className="text-xs text-muted-foreground">
                          {ROLE_OPTIONS.find(r => r.value === col.role)?.label.split(' ')[0]}
                        </span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {table.rows.slice(0, 20).map((row, idx) => {
                  const included = willIncludeRow(idx);
                  return (
                    <TableRow 
                      key={idx} 
                      className={!included ? 'opacity-40 bg-muted/50' : ''}
                    >
                      <TableCell>
                        {included ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400" />
                        )}
                      </TableCell>
                      {row.cells.map((cell, cellIdx) => (
                        <TableCell 
                          key={cellIdx}
                          className={columns[cellIdx]?.role === 'station_name' ? 'font-medium bg-primary/5' : ''}
                        >
                          <span className="truncate block max-w-32" title={cell}>
                            {cell || '-'}
                          </span>
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
                {table.rows.length > 20 && (
                  <TableRow>
                    <TableCell colSpan={columns.length + 1} className="text-center text-muted-foreground">
                      ... and {table.rows.length - 20} more rows
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          {/* Extraction Preview */}
          {preview && (
            <div className="p-3 bg-muted rounded space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">Extraction Preview</h4>
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600">
                    ✅ {preview.includedRows} stations
                  </span>
                  <span className="text-muted-foreground">
                    ⏭️ {preview.skippedRows} skipped
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {preview.stations.slice(0, 15).map((s, i) => (
                  <Badge key={i} variant="secondary">{s.name}</Badge>
                ))}
                {preview.stations.length > 15 && (
                  <Badge variant="outline">+{preview.stations.length - 15} more</Badge>
                )}
              </div>
            </div>
          )}

          {/* Validation */}
          {stationNameCol === null && (
            <div className="flex items-center gap-2 p-2 bg-destructive/10 text-destructive rounded">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Please select a Station Name column</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={stationNameCol === null || !preview?.stations.length}
          >
            Import {preview?.stations.length || 0} Stations
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 6. Enhanced Smart Paste Input

`components/rfq/SmartPasteInput.tsx`

```tsx
'use client';

import { useState, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Table, List, Sparkles } from 'lucide-react';
import { detectInputType } from '@/lib/excel-parser/detector';
import { parseTable, mergeMultiRowHeaders } from '@/lib/excel-parser/table-parser';
import { detectColumns } from '@/lib/excel-parser/column-detector';
import { TablePreviewModal } from './TablePreviewModal';
import { ExtractionResult } from '@/lib/excel-parser/types';

interface SmartPasteInputProps {
  onStationsExtracted: (stations: string[]) => void;
  onResolve: (stations: string[]) => Promise<void>;
}

export function SmartPasteInput({ onStationsExtracted, onResolve }: SmartPasteInputProps) {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [parsedData, setParsedData] = useState<{
    table: ReturnType<typeof parseTable>;
    columns: ReturnType<typeof detectColumns>;
  } | null>(null);

  // Handle paste event
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text');
    setInput(text);
    
    // Auto-detect and process
    const detection = detectInputType(text);
    
    if (detection.type === 'excel_table' && detection.confidence > 0.7) {
      e.preventDefault();
      setIsProcessing(true);
      
      try {
        // Parse table
        let table = parseTable(text);
        table = mergeMultiRowHeaders(table);
        
        // Detect columns
        const columns = detectColumns(table);
        
        setParsedData({ table, columns });
        setShowPreview(true);
      } finally {
        setIsProcessing(false);
      }
    }
  }, []);

  // Handle manual trigger
  const handleDetect = useCallback(() => {
    const detection = detectInputType(input);
    
    if (detection.type === 'excel_table') {
      setIsProcessing(true);
      try {
        let table = parseTable(input);
        table = mergeMultiRowHeaders(table);
        const columns = detectColumns(table);
        setParsedData({ table, columns });
        setShowPreview(true);
      } finally {
        setIsProcessing(false);
      }
    } else if (detection.type === 'simple_list' || detection.type === 'inline_list') {
      // Direct extraction for simple formats
      const stations = input
        .split(/[\n,]+/)
        .map(s => s.trim())
        .filter(Boolean);
      onStationsExtracted(stations);
      onResolve(stations);
    }
  }, [input, onStationsExtracted, onResolve]);

  // Handle extraction confirm
  const handleConfirm = useCallback(async (result: ExtractionResult) => {
    setShowPreview(false);
    const stationNames = result.stations.map(s => s.name);
    onStationsExtracted(stationNames);
    await onResolve(stationNames);
    setInput('');
    setParsedData(null);
  }, [onStationsExtracted, onResolve]);

  // Detect input type for badge
  const detection = input ? detectInputType(input) : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Smart Paste</h3>
        {detection && (
          <Badge variant="outline" className="gap-1">
            {detection.type === 'excel_table' && <Table className="h-3 w-3" />}
            {detection.type === 'simple_list' && <List className="h-3 w-3" />}
            {detection.type === 'excel_table' ? 'Excel Table' : 
             detection.type === 'simple_list' ? 'List' : 
             detection.type === 'inline_list' ? 'Inline' : 'Unknown'}
          </Badge>
        )}
      </div>
      
      <Textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onPaste={handlePaste}
        placeholder="Paste station data from Excel or enter manually - we'll auto-detect and process..."
        className="min-h-[150px] font-mono text-sm"
      />
      
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Supported: Excel copy-paste, comma-separated list, one per line
        </p>
        <Button 
          onClick={handleDetect}
          disabled={!input || isProcessing}
          className="gap-2"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Process & Resolve
        </Button>
      </div>

      {/* Table Preview Modal */}
      {parsedData && (
        <TablePreviewModal
          open={showPreview}
          onClose={() => setShowPreview(false)}
          table={parsedData.table}
          initialColumns={parsedData.columns.columns}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
```

---

## 🔌 API Endpoint

### `app/api/rfq/parse-excel/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { detectInputType } from '@/lib/excel-parser/detector';
import { parseTable, mergeMultiRowHeaders } from '@/lib/excel-parser/table-parser';
import { detectColumns, validateDetection } from '@/lib/excel-parser/column-detector';

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json();
    
    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: 'Input text is required' },
        { status: 400 }
      );
    }
    
    // Detect input type
    const detection = detectInputType(input);
    
    if (detection.type !== 'excel_table') {
      return NextResponse.json({
        type: detection.type,
        confidence: detection.confidence,
        message: 'Not an Excel table format',
        suggestion: detection.type === 'simple_list' 
          ? 'Use simple list processing' 
          : 'Try pasting directly from Excel'
      });
    }
    
    // Parse table
    let table = parseTable(input);
    table = mergeMultiRowHeaders(table);
    
    // Detect columns
    const columnDetection = detectColumns(table);
    const validation = validateDetection(columnDetection);
    
    return NextResponse.json({
      type: 'excel_table',
      confidence: detection.confidence,
      table: {
        headers: table.headers,
        rowCount: table.rowCount,
        columnCount: table.columnCount,
        sampleRows: table.rows.slice(0, 5).map(r => r.cells)
      },
      columns: columnDetection,
      validation
    });
    
  } catch (error) {
    console.error('Parse Excel error:', error);
    return NextResponse.json(
      { error: 'Failed to parse Excel data' },
      { status: 500 }
    );
  }
}
```

---

## 🧪 Test Cases

### Test 1: XIAOMI Format
```typescript
const xiaomiInput = `序号\t工段\t选择\t工艺路线\t工艺名称\t工艺边界
No.\tSection\tStatus\tProcess Routing\tProcess Name\tProcess Description
1\t板测 Board level\t1\t主板测试\tMBT\tMBT测试及物料取放
2\t板测 Board level\t1\t主板测试\tCAL1\tCAL1测试
3\t板测 Board level\t0\t主板测试\tCAL2\tCAL2测试
4\t板测 Board level\t1\t主板测试\tRFT1\tRF1测试`;

// Expected: Detect "Process Name" column, filter Status=1
// Result: MBT, CAL1, RFT1 (CAL2 skipped because Status=0)
```

### Test 2: Simple List
```typescript
const simpleInput = `MBT
CAL1
RFT1
RFT2
MMI`;

// Expected: Direct extraction, no modal
// Result: MBT, CAL1, RFT1, RFT2, MMI
```

### Test 3: Inline List
```typescript
const inlineInput = `MBT, CAL1, RFT1, RFT2, MMI`;

// Expected: Split by comma
// Result: MBT, CAL1, RFT1, RFT2, MMI
```

---

## ✅ Acceptance Criteria

| # | Criteria | Priority |
|---|----------|----------|
| 1 | Auto-detect Excel table format on paste | P0 |
| 2 | Show table preview modal for Excel data | P0 |
| 3 | Auto-detect column roles (station name, status) | P0 |
| 4 | Filter rows by Status = 1 | P0 |
| 5 | Skip header rows automatically | P0 |
| 6 | Manual column role override | P1 |
| 7 | Preview extracted stations before confirm | P1 |
| 8 | Handle multi-row headers (CN + EN) | P1 |
| 9 | Support simple list format (fallback) | P1 |
| 10 | Auto-resolve immediately after import | P0 |

---

## 📋 Implementation Checklist

### Phase 6D Tasks

- [ ] **Types & Interfaces**
  - [ ] Create `lib/excel-parser/types.ts`

- [ ] **Parser Library**
  - [ ] Implement `detector.ts` (input type detection)
  - [ ] Implement `table-parser.ts` (parse Excel table)
  - [ ] Implement `column-detector.ts` (auto-detect roles)
  - [ ] Implement `extractor.ts` (extract stations)
  - [ ] Create `index.ts` (exports)

- [ ] **UI Components**
  - [ ] Create `TablePreviewModal.tsx`
  - [ ] Create `SmartPasteInput.tsx` (enhanced)
  - [ ] Update RFQ form to use new components

- [ ] **API**
  - [ ] Create `/api/rfq/parse-excel/route.ts`

- [ ] **Integration**
  - [ ] Connect to existing resolution flow
  - [ ] Auto-resolve after import

- [ ] **Testing**
  - [ ] Test XIAOMI format
  - [ ] Test other customer formats
  - [ ] Test edge cases (empty, malformed)

---

## 🔗 Dependencies

| Dependency | Purpose | Status |
|------------|---------|--------|
| Phase 6A | Station resolution logic | Required |
| `station_master` | Standard station codes | ✅ Ready |
| `station_aliases` | Customer term mapping | ✅ Ready |

---

## 📊 Expected Outcome

**Before (Current):**
```
Paste → Berantakan → Headers as stations → Manual resolve → 45% success
```

**After (Phase 6D):**
```
Paste → Auto-detect → Preview modal → Select columns → Filter status → Import → Auto-resolve → 95%+ success
```
