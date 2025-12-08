/**
 * Excel BOM Parser
 * Parses Excel/CSV files to extract BOM data with smart column detection
 */

import * as XLSX from 'xlsx';
import type { ParsedBOM, ParsedBOMRow, ColumnMapping } from './types';
import { analyzeBOM } from './bom-analyzer';

// Default column name mappings for common BOM formats
const COLUMN_MAPPINGS: ColumnMapping = {
  item_no: ['item', 'no', 'line', '#', 'seq', 'item no', 'line no', 'item #', 'row'],
  part_number: ['part', 'pn', 'part number', 'part no', 'mpn', 'mfr part', 'component', 'part#', 'p/n', 'partnumber', 'mfg part', 'manufacturer part'],
  description: ['description', 'desc', 'part description', 'component name', 'name', 'value', 'part name', 'item description'],
  quantity: ['qty', 'quantity', 'qy', 'amount', 'count', 'qty.', 'pcs', 'qty per'],
  package_type: ['package', 'footprint', 'case', 'pkg', 'size', 'case size', 'package type', 'smd size'],
  manufacturer: ['mfr', 'manufacturer', 'vendor', 'make', 'brand', 'mfg', 'supplier'],
  reference_designator: ['ref', 'designator', 'ref des', 'reference', 'location', 'ref. des.', 'refdes'],
};

/**
 * Parse an Excel file buffer to extract BOM data
 */
export async function parseExcelBOM(
  buffer: Buffer | ArrayBuffer,
  filename: string
): Promise<ParsedBOM> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  // Find BOM sheet (prefer sheets with 'bom' in name)
  let sheetName = workbook.SheetNames.find(
    name => name.toLowerCase().includes('bom')
  ) || workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

  if (jsonData.length < 2) {
    throw new Error('BOM file appears to be empty or has no data rows');
  }

  // Find header row (within first 10 rows)
  const headerRowIndex = findHeaderRow(jsonData);
  const headers = (jsonData[headerRowIndex] as unknown[]).map(h => String(h || '').toLowerCase().trim());

  // Map columns to our schema
  const columnMap = mapColumns(headers);

  // Check parsing confidence
  const foundColumns = Object.values(columnMap).filter(v => v !== undefined).length;
  const confidence = foundColumns >= 4 ? 0.95 : foundColumns >= 3 ? 0.8 : foundColumns >= 2 ? 0.6 : 0.3;

  // Parse data rows
  const rows: ParsedBOMRow[] = [];
  let rawText = '';

  for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i] as unknown[];
    if (!row || row.length === 0) continue;

    // Skip empty rows
    const rowHasData = row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
    if (!rowHasData) continue;

    const partNumber = getColumnValue(row, columnMap.part_number);

    // Skip rows without part number
    if (!partNumber || partNumber.toLowerCase() === 'total' || partNumber.toLowerCase() === 'sum') {
      continue;
    }

    const parsedRow: ParsedBOMRow = {
      item_no: parseInt(getColumnValue(row, columnMap.item_no)) || i - headerRowIndex,
      part_number: partNumber,
      description: getColumnValue(row, columnMap.description),
      quantity: parseQuantity(getColumnValue(row, columnMap.quantity)),
      package_type: getColumnValue(row, columnMap.package_type) || undefined,
      manufacturer: getColumnValue(row, columnMap.manufacturer) || undefined,
      reference_designator: getColumnValue(row, columnMap.reference_designator) || undefined,
    };

    rows.push(parsedRow);
    rawText += `${parsedRow.part_number} ${parsedRow.description} ${parsedRow.package_type || ''}\n`;
  }

  if (rows.length === 0) {
    throw new Error('No valid BOM rows found in file');
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

/**
 * Find the header row in the data (within first 10 rows)
 */
function findHeaderRow(data: unknown[][]): number {
  const headerKeywords = ['part', 'qty', 'description', 'quantity', 'component', 'item', 'ref', 'manufacturer'];

  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (!row || !Array.isArray(row)) continue;

    const rowText = row.map(c => String(c || '').toLowerCase()).join(' ');
    const matches = headerKeywords.filter(kw => rowText.includes(kw));

    // Found header if at least 2 keywords match
    if (matches.length >= 2) return i;
  }

  // Default to first row
  return 0;
}

/**
 * Map detected headers to our column schema
 */
function mapColumns(headers: string[]): Record<keyof ColumnMapping, number | undefined> {
  const map: Record<keyof ColumnMapping, number | undefined> = {
    item_no: undefined,
    part_number: undefined,
    description: undefined,
    quantity: undefined,
    package_type: undefined,
    manufacturer: undefined,
    reference_designator: undefined,
  };

  for (const [field, variations] of Object.entries(COLUMN_MAPPINGS)) {
    const fieldKey = field as keyof ColumnMapping;
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      if (variations.some((v: string) => header.includes(v) || header === v)) {
        map[fieldKey] = i;
        break;
      }
    }
  }

  return map;
}

/**
 * Get value from row at column index
 */
function getColumnValue(row: unknown[], index: number | undefined): string {
  if (index === undefined || index < 0 || index >= row.length) return '';
  const value = row[index];
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

/**
 * Parse quantity value (handles various formats)
 */
function parseQuantity(value: string): number {
  if (!value) return 1;

  // Remove common prefixes/suffixes
  const cleaned = value
    .replace(/[^0-9.,]/g, '')
    .replace(',', '.');

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) || parsed <= 0 ? 1 : Math.round(parsed);
}

/**
 * Extract raw text from Excel for LLM fallback
 */
export function extractRawTextFromExcel(buffer: Buffer | ArrayBuffer): string {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  let rawText = '';

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    rawText += `=== Sheet: ${sheetName} ===\n${csv}\n\n`;
  }

  return rawText;
}

/**
 * Parse CSV file content
 */
export async function parseCSVBOM(
  content: string,
  filename: string
): Promise<ParsedBOM> {
  const workbook = XLSX.read(content, { type: 'string' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return parseExcelBOM(buffer, filename);
}

/**
 * Get list of sheets in workbook
 */
export function getSheetNames(buffer: Buffer | ArrayBuffer): string[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  return workbook.SheetNames;
}

/**
 * Parse specific sheet from workbook
 */
export async function parseExcelSheet(
  buffer: Buffer | ArrayBuffer,
  sheetName: string,
  filename: string
): Promise<ParsedBOM> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  if (!workbook.SheetNames.includes(sheetName)) {
    throw new Error(`Sheet "${sheetName}" not found in workbook`);
  }

  const sheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

  // Same parsing logic as parseExcelBOM
  if (jsonData.length < 2) {
    throw new Error('Sheet appears to be empty');
  }

  const headerRowIndex = findHeaderRow(jsonData);
  const headers = (jsonData[headerRowIndex] as unknown[]).map(h => String(h || '').toLowerCase().trim());
  const columnMap = mapColumns(headers);

  const foundColumns = Object.values(columnMap).filter(v => v !== undefined).length;
  const confidence = foundColumns >= 4 ? 0.95 : foundColumns >= 3 ? 0.8 : foundColumns >= 2 ? 0.6 : 0.3;

  const rows: ParsedBOMRow[] = [];
  let rawText = '';

  for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
    const row = jsonData[i] as unknown[];
    if (!row || row.length === 0) continue;

    const rowHasData = row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
    if (!rowHasData) continue;

    const partNumber = getColumnValue(row, columnMap.part_number);
    if (!partNumber) continue;

    const parsedRow: ParsedBOMRow = {
      item_no: parseInt(getColumnValue(row, columnMap.item_no)) || i - headerRowIndex,
      part_number: partNumber,
      description: getColumnValue(row, columnMap.description),
      quantity: parseQuantity(getColumnValue(row, columnMap.quantity)),
      package_type: getColumnValue(row, columnMap.package_type) || undefined,
      manufacturer: getColumnValue(row, columnMap.manufacturer) || undefined,
      reference_designator: getColumnValue(row, columnMap.reference_designator) || undefined,
    };

    rows.push(parsedRow);
    rawText += `${parsedRow.part_number} ${parsedRow.description} ${parsedRow.package_type || ''}\n`;
  }

  const summary = analyzeBOM(rows);

  return {
    filename: `${filename} [${sheetName}]`,
    total_rows: rows.length,
    rows,
    summary,
    raw_text: rawText,
    parse_method: 'algorithmic',
    confidence,
  };
}
