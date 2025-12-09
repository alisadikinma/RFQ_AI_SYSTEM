/**
 * Document Parser
 * Parses station lists from Excel files, PDFs, and manual input
 */

import * as XLSX from 'xlsx';
import { detectPastedData, parseSimpleText } from './paste-detector';
import { callLLMJSON, isLLMAvailable } from '@/lib/llm/client';
import type {
  StationInput,
  ParsedDocument,
  DetectedColumns,
  PasteDetectionResult,
} from './types';

/**
 * Status values that indicate a station is disabled
 */
const DISABLED_STATUS_VALUES = ['0', 'no', 'n', 'false', 'disabled', '否', '不选', 'tidak'];

/**
 * Parse an Excel file to extract station list
 * @param file - The uploaded Excel file
 * @returns Parsed document with stations
 */
export async function parseExcelFile(file: File): Promise<ParsedDocument> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  // Get the first sheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert to array of arrays
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

  if (rows.length === 0) {
    return {
      source: 'excel',
      stations: [],
      metadata: {
        fileName: file.name,
        totalRows: 0,
        enabledRows: 0,
        sheetName,
      },
    };
  }

  // Detect columns - use LLM if available, otherwise use heuristics
  const headers = (rows[0] || []).map(String);
  const sampleRows = rows.slice(1, 6).map(row => row.map(String));
  const columns = await detectColumns(headers, sampleRows);

  // Extract stations from rows
  const stations: StationInput[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i].map(cell => String(cell ?? '').trim());

    // Skip if row is empty
    if (row.every(cell => !cell)) continue;

    // Check status column if detected
    if (columns.status !== null) {
      const status = row[columns.status]?.toLowerCase();
      if (DISABLED_STATUS_VALUES.includes(status)) {
        continue; // Skip disabled rows
      }
    }

    // Get station name
    const stationNameCol = columns.stationName ?? 0;
    const stationName = row[stationNameCol];

    if (!stationName) continue;

    stations.push({
      name: stationName,
      description: columns.description !== null ? row[columns.description] : undefined,
      boardType: columns.boardType !== null ? row[columns.boardType] : undefined,
      enabled: true,
    });
  }

  return {
    source: 'excel',
    stations,
    metadata: {
      fileName: file.name,
      totalRows: rows.length - 1,
      enabledRows: stations.length,
      sheetName,
    },
  };
}

/**
 * Parse manual text input
 * Handles both simple lists and Excel paste
 */
export function parseManualInput(
  text: string,
  columnMapping?: DetectedColumns
): ParsedDocument {
  // First check if it's tabular data (Excel paste)
  const detection = detectPastedData(text);

  if (detection.isTabular) {
    return parseFromDetection(detection, columnMapping);
  }

  // Simple text parsing (comma, newline, or semicolon separated)
  const names = parseSimpleText(text);

  return {
    source: 'manual',
    stations: names.map(name => ({ name, enabled: true })),
  };
}

/**
 * Parse stations from paste detection result
 */
export function parseFromDetection(
  detection: PasteDetectionResult,
  customMapping?: DetectedColumns
): ParsedDocument {
  const columns = customMapping || detection.detectedColumns;
  const { rows } = detection;

  const stations: StationInput[] = [];

  for (const row of rows) {
    // Check status column if detected
    if (columns.status !== null) {
      const status = row[columns.status]?.toLowerCase().trim();
      if (DISABLED_STATUS_VALUES.includes(status)) {
        continue; // Skip disabled rows
      }
    }

    // Get station name (default to first column if not detected)
    const stationNameCol = columns.stationName ?? 0;
    const stationName = row[stationNameCol]?.trim();

    if (!stationName) continue;

    stations.push({
      name: stationName,
      description: columns.description !== null ? row[columns.description]?.trim() : undefined,
      boardType: columns.boardType !== null ? row[columns.boardType]?.trim() : undefined,
      enabled: true,
    });
  }

  return {
    source: 'smart_paste',
    stations,
    metadata: {
      totalRows: rows.length,
      enabledRows: stations.length,
    },
  };
}

/**
 * Detect column purposes using LLM or heuristics
 */
async function detectColumns(
  headers: string[],
  sampleRows: string[][]
): Promise<DetectedColumns> {
  // First try heuristic detection
  const heuristicResult = detectColumnsHeuristic(headers);

  // If heuristics found good columns, use them
  const foundCount = Object.values(heuristicResult).filter(v => v !== null).length;
  if (foundCount >= 2) {
    return heuristicResult;
  }

  // Try LLM detection if available
  if (isLLMAvailable()) {
    try {
      const llmResult = await detectColumnsWithLLM(headers, sampleRows);
      if (llmResult) {
        return llmResult;
      }
    } catch (error) {
      console.error('LLM column detection failed:', error);
    }
  }

  // Return heuristic result as fallback
  return heuristicResult;
}

/**
 * Detect columns using pattern matching heuristics
 */
function detectColumnsHeuristic(headers: string[]): DetectedColumns {
  const result: DetectedColumns = {
    stationName: null,
    description: null,
    boardType: null,
    status: null,
  };

  const patterns = {
    stationName: [
      /工艺名称/i, /process.*name/i, /station.*name/i, /站点/i,
      /station/i, /工站/i, /nama.*stasiun/i, /proses/i, /工艺$/i,
    ],
    description: [
      /工艺边界/i, /description/i, /描述/i, /说明/i,
      /boundary/i, /detail/i, /keterangan/i, /deskripsi/i,
    ],
    boardType: [
      /工段/i, /section/i, /board.*type/i, /板型/i,
      /板测/i, /整机/i, /main.*board/i, /sub.*board/i, /tipe.*board/i,
    ],
    status: [
      /选择/i, /status/i, /状态/i, /enable/i,
      /启用/i, /selected/i, /active/i, /aktif/i,
    ],
  };

  headers.forEach((header, index) => {
    const h = header.toLowerCase().trim();

    for (const [columnType, patternList] of Object.entries(patterns)) {
      const key = columnType as keyof DetectedColumns;
      if (result[key] === null) {
        for (const pattern of patternList) {
          if (pattern.test(h)) {
            result[key] = index;
            break;
          }
        }
      }
    }
  });

  // If no station name column found, try to find a likely candidate
  if (result.stationName === null) {
    for (let i = 0; i < headers.length; i++) {
      // Skip columns already assigned
      if (Object.values(result).includes(i)) continue;

      const h = headers[i].toLowerCase();
      // Look for columns that might contain station names
      if (/name|名称|nama|process|工艺|站/i.test(h)) {
        result.stationName = i;
        break;
      }
    }
  }

  return result;
}

/**
 * Detect columns using LLM
 */
async function detectColumnsWithLLM(
  headers: string[],
  sampleRows: string[][]
): Promise<DetectedColumns | null> {
  const systemPrompt = `You are parsing an Excel document from an EMS factory.
The document may contain Chinese (中文), English, or Indonesian text.

Identify column indices (0-based) for:
1. stationName: Station/process name column (e.g., MBT, CAL, RFT, 主板MMI)
2. description: Station description/details column
3. boardType: Board type/section column (e.g., 板测, 整机, Main Board)
4. status: Enable/disable flag column (values: 0/1, yes/no, ✓/✗)

Return -1 or null for columns that don't exist.`;

  const userPrompt = `Headers: ${JSON.stringify(headers)}
Sample rows: ${JSON.stringify(sampleRows.slice(0, 3))}

Respond in JSON only:
{"stationName": index, "description": index, "boardType": index, "status": index}`;

  try {
    const response = await callLLMJSON<{
      stationName: number | null;
      description: number | null;
      boardType: number | null;
      status: number | null;
    }>([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], {
      temperature: 0.1,
      max_tokens: 128,
    });

    // Convert -1 to null
    return {
      stationName: response.stationName === -1 ? null : response.stationName,
      description: response.description === -1 ? null : response.description,
      boardType: response.boardType === -1 ? null : response.boardType,
      status: response.status === -1 ? null : response.status,
    };
  } catch (error) {
    console.error('LLM column detection failed:', error);
    return null;
  }
}

/**
 * Extract stations from pasted text with custom column mapping
 */
export function extractStationsFromPaste(
  text: string,
  columnMapping: DetectedColumns,
  filterEnabled: boolean = true
): StationInput[] {
  const detection = detectPastedData(text);

  if (!detection.isTabular) {
    // If not tabular, treat as simple list
    return parseSimpleText(text).map(name => ({ name, enabled: true }));
  }

  const stations: StationInput[] = [];

  for (const row of detection.rows) {
    // Check status if filtering and column is mapped
    if (filterEnabled && columnMapping.status !== null) {
      const status = row[columnMapping.status]?.toLowerCase().trim();
      if (DISABLED_STATUS_VALUES.includes(status)) {
        continue;
      }
    }

    // Get station name
    const stationNameCol = columnMapping.stationName ?? 0;
    const stationName = row[stationNameCol]?.trim();

    if (!stationName) continue;

    stations.push({
      name: stationName,
      description: columnMapping.description !== null
        ? row[columnMapping.description]?.trim()
        : undefined,
      boardType: columnMapping.boardType !== null
        ? row[columnMapping.boardType]?.trim()
        : undefined,
      enabled: true,
    });
  }

  return stations;
}

/**
 * Validate parsed document
 */
export function validateParsedDocument(doc: ParsedDocument): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for empty stations
  if (doc.stations.length === 0) {
    errors.push('No stations were extracted from the input');
  }

  // Check for duplicate station names
  const names = doc.stations.map(s => s.name.toUpperCase());
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
  if (duplicates.length > 0) {
    const uniqueDuplicates = Array.from(new Set(duplicates));
    warnings.push(`Duplicate station names found: ${uniqueDuplicates.join(', ')}`);
  }

  // Check for empty names
  const emptyNames = doc.stations.filter(s => !s.name.trim());
  if (emptyNames.length > 0) {
    warnings.push(`${emptyNames.length} station(s) have empty names`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
