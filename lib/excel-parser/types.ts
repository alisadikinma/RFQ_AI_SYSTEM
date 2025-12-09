/**
 * Excel Parser Types
 * Type definitions for smart Excel parsing and table preview
 */

// Input detection result
export type InputType = 'excel_table' | 'simple_list' | 'inline_list' | 'unknown';

export interface DetectionResult {
  type: InputType;
  confidence: number;        // 0-1
  hasHeaders: boolean;
  rowCount: number;
  columnCount: number;
  rawData: string;
  isQuestion?: boolean;      // True if detected as natural language/question
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
