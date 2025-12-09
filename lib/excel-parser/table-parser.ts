/**
 * Table Parser
 * Parse Excel table from pasted text into structured format
 */

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
    raw: line,
  }));

  // Detect max columns
  const maxColumns = Math.max(...allRows.map((r) => r.cells.length));

  // Normalize all rows to same column count
  allRows.forEach((row) => {
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
    rowCount: rows.length,
  };
}

/**
 * Parse single row, handling tab-separated values
 */
function parseRow(line: string): string[] {
  return line.split('\t').map((cell) => cleanCell(cell));
}

/**
 * Clean cell value
 */
function cleanCell(cell: string): string {
  return cell
    .trim()
    .replace(/\r/g, '') // Remove carriage returns
    .replace(/^["']|["']$/g, '') // Remove surrounding quotes
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Merge multi-row headers (Chinese + English in separate rows)
 * Common in XIAOMI format where row 1 is Chinese, row 2 is English
 */
export function mergeMultiRowHeaders(table: ParsedTable): ParsedTable {
  if (table.rows.length === 0) return table;

  const firstDataRow = table.rows[0];

  // Check if first data row looks like continuation of headers
  const looksLikeHeader = firstDataRow.cells.every((cell) => {
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
      rowCount: table.rowCount - 1,
    };
  }

  return table;
}

/**
 * Get preview of table for debugging/display
 */
export function getTablePreview(
  table: ParsedTable,
  maxRows: number = 5
): {
  headers: string[];
  rows: string[][];
  truncated: boolean;
} {
  return {
    headers: table.headers,
    rows: table.rows.slice(0, maxRows).map((r) => r.cells),
    truncated: table.rows.length > maxRows,
  };
}
