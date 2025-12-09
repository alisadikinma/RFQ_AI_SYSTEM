/**
 * Smart Paste Detector
 * Detects and parses tabular data pasted from Excel or other spreadsheet applications
 */

import type { PasteDetectionResult, DetectedColumns } from './types';

/**
 * Common header patterns for column detection
 * Supports Chinese, English, and Indonesian
 */
const COLUMN_PATTERNS = {
  stationName: [
    /工艺名称/i,
    /process.*name/i,
    /station.*name/i,
    /站点/i,
    /station/i,
    /工站/i,
    /nama.*stasiun/i,
    /proses/i,
  ],
  description: [
    /工艺边界/i,
    /description/i,
    /描述/i,
    /说明/i,
    /boundary/i,
    /detail/i,
    /keterangan/i,
    /deskripsi/i,
  ],
  boardType: [
    /工段/i,
    /section/i,
    /board.*type/i,
    /板型/i,
    /板测/i,
    /整机/i,
    /main.*board/i,
    /sub.*board/i,
    /tipe.*board/i,
  ],
  status: [
    /选择/i,
    /status/i,
    /状态/i,
    /enable/i,
    /启用/i,
    /selected/i,
    /active/i,
    /aktif/i,
  ],
};

/**
 * Header keywords that indicate a row is likely a header
 */
const HEADER_PATTERNS = [
  /序号/i,
  /no\.?$/i,
  /number/i,
  /工艺/i,
  /process/i,
  /station/i,
  /section/i,
  /status/i,
  /选择/i,
  /description/i,
  /工段/i,
  /board/i,
];

/**
 * Detect if pasted text is tabular data from Excel
 * @param text - The pasted text content
 * @returns Detection result with parsed data and column mapping
 */
export function detectPastedData(text: string): PasteDetectionResult {
  // Normalize line endings
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Check for TAB characters (Excel copies use TABs)
  const hasTabs = normalizedText.includes('\t');

  // Split into rows and columns
  const lines = normalizedText.trim().split('\n').filter(line => line.trim());
  const rows = lines.map(line => splitRow(line, hasTabs));

  // Check column consistency
  const columnCounts = rows.map(r => r.length);
  const mostCommonCount = getMostCommonValue(columnCounts);
  const isConsistent = columnCounts.length > 0 &&
    columnCounts.filter(c => Math.abs(c - mostCommonCount) <= 1).length >= columnCounts.length * 0.8;

  // Detect if first row is header
  const firstRow = rows[0] || [];
  const looksLikeHeader = detectHeader(firstRow);

  // Auto-detect column purposes
  const detectedColumns = looksLikeHeader
    ? detectColumnPurposes(firstRow)
    : inferColumnsFromData(rows);

  // Determine if data is tabular
  const isTabular = hasTabs && isConsistent && rows.length > 1 && mostCommonCount > 1;

  // Calculate confidence
  const confidence = calculateConfidence(isTabular, detectedColumns, looksLikeHeader);

  return {
    isTabular,
    rows: looksLikeHeader ? rows.slice(1) : rows,
    headers: looksLikeHeader ? firstRow : [],
    columnCount: mostCommonCount,
    rowCount: rows.length - (looksLikeHeader ? 1 : 0),
    detectedColumns,
    confidence,
  };
}

/**
 * Split a row into columns
 */
function splitRow(line: string, hasTabs: boolean): string[] {
  if (hasTabs) {
    return line.split('\t').map(cell => cell.trim());
  }
  // Fallback to comma if no tabs
  return line.split(',').map(cell => cell.trim());
}

/**
 * Get the most common value in an array
 */
function getMostCommonValue(arr: number[]): number {
  const counts = new Map<number, number>();
  let maxCount = 0;
  let mostCommon = arr[0] || 0;

  for (const val of arr) {
    const count = (counts.get(val) || 0) + 1;
    counts.set(val, count);
    if (count > maxCount) {
      maxCount = count;
      mostCommon = val;
    }
  }

  return mostCommon;
}

/**
 * Detect if a row looks like a header
 */
function detectHeader(row: string[]): boolean {
  if (row.length === 0) return false;

  const matchCount = row.filter(cell =>
    HEADER_PATTERNS.some(pattern => pattern.test(cell))
  ).length;

  // If at least 2 cells match header patterns, it's likely a header
  return matchCount >= 2;
}

/**
 * Detect column purposes based on header names
 */
function detectColumnPurposes(headers: string[]): DetectedColumns {
  const result: DetectedColumns = {
    stationName: null,
    description: null,
    boardType: null,
    status: null,
  };

  headers.forEach((header, index) => {
    const normalizedHeader = header.toLowerCase().trim();

    // Check each column type pattern
    for (const [columnType, patterns] of Object.entries(COLUMN_PATTERNS)) {
      const key = columnType as keyof DetectedColumns;
      if (result[key] === null) {
        for (const pattern of patterns) {
          if (pattern.test(normalizedHeader)) {
            result[key] = index;
            break;
          }
        }
      }
    }
  });

  return result;
}

/**
 * Infer columns from data when no headers are present
 */
function inferColumnsFromData(rows: string[][]): DetectedColumns {
  const result: DetectedColumns = {
    stationName: null,
    description: null,
    boardType: null,
    status: null,
  };

  if (rows.length === 0 || rows[0].length === 0) return result;

  const columnCount = rows[0].length;

  // Analyze each column's values
  for (let col = 0; col < columnCount; col++) {
    const values = rows.map(row => row[col] || '');

    // Check for status column (0/1 values)
    const statusValues = values.filter(v => /^[01]$/.test(v) || /^(yes|no|是|否)$/i.test(v));
    if (statusValues.length > values.length * 0.5 && result.status === null) {
      result.status = col;
      continue;
    }

    // Check for station name column (short strings, often all caps or contains specific terms)
    const stationLike = values.filter(v =>
      v.length > 0 && v.length <= 20 &&
      (/^[A-Z0-9_\-]+$/i.test(v) || /test|测试|站|MMI|CAL|RFT/i.test(v))
    );
    if (stationLike.length > values.length * 0.3 && result.stationName === null) {
      result.stationName = col;
      continue;
    }

    // Check for description column (longer strings)
    const avgLength = values.reduce((sum, v) => sum + v.length, 0) / values.length;
    if (avgLength > 15 && result.description === null) {
      result.description = col;
      continue;
    }

    // Check for board type column
    const boardLike = values.filter(v =>
      /板测|整机|main.*board|sub.*board|board.*test|assembly/i.test(v)
    );
    if (boardLike.length > values.length * 0.3 && result.boardType === null) {
      result.boardType = col;
    }
  }

  // If no station name column found, use first non-status column
  if (result.stationName === null) {
    for (let i = 0; i < columnCount; i++) {
      if (result.status !== i && result.description !== i && result.boardType !== i) {
        result.stationName = i;
        break;
      }
    }
  }

  return result;
}

/**
 * Calculate confidence level based on detection quality
 */
function calculateConfidence(
  isTabular: boolean,
  detected: DetectedColumns,
  hasHeader: boolean
): 'high' | 'medium' | 'low' {
  if (!isTabular) return 'low';

  const foundCount = Object.values(detected).filter(v => v !== null).length;

  if (hasHeader && foundCount >= 3) return 'high';
  if (hasHeader && foundCount >= 2) return 'medium';
  if (foundCount >= 2) return 'medium';
  if (foundCount >= 1) return 'low';

  return 'low';
}

/**
 * Parse simple text input (comma or newline separated)
 * @param text - Simple text with station names
 * @returns Array of station names
 */
export function parseSimpleText(text: string): string[] {
  // Split by comma, newline, or semicolon
  return text
    .split(/[,;\n]/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Check if text looks like it was pasted from Excel
 */
export function isExcelPaste(text: string): boolean {
  // Excel paste typically has tabs and consistent column structure
  const hasTabs = text.includes('\t');
  const lines = text.trim().split('\n');

  if (!hasTabs || lines.length < 2) return false;

  const firstLineTabs = (lines[0].match(/\t/g) || []).length;
  const secondLineTabs = (lines[1].match(/\t/g) || []).length;

  // If first two lines have similar number of tabs, likely Excel
  return Math.abs(firstLineTabs - secondLineTabs) <= 1 && firstLineTabs > 0;
}
