/**
 * Column Role Detector
 * Auto-detect column roles from Excel table headers and sample data
 */

import {
  ColumnMapping,
  ColumnDetectionResult,
  ColumnRole,
  ParsedTable,
} from './types';

// Keywords for each column role (English and Chinese)
const ROLE_KEYWORDS: Record<ColumnRole, string[]> = {
  station_name: [
    'process name',
    'station',
    'name',
    'process',
    '工艺名称',
    '站名',
    '名称',
    '工艺',
  ],
  status: [
    'status',
    'select',
    'enable',
    'active',
    'use',
    '选择',
    '状态',
    '启用',
    '使用',
  ],
  section: [
    'section',
    'board',
    'type',
    'category',
    '工段',
    '板',
    '类型',
    '分类',
  ],
  description: [
    'description',
    'desc',
    'detail',
    'note',
    'boundary',
    '工艺边界',
    '描述',
    '说明',
    '备注',
  ],
  sequence: ['no', 'number', 'seq', 'order', 'index', '序号', '编号', '顺序'],
  process_code: ['code', 'id', 'process code', '工艺编号', '代码', 'ID'],
  ignore: [],
};

/**
 * Auto-detect column roles from table structure
 */
export function detectColumns(table: ParsedTable): ColumnDetectionResult {
  const columns: ColumnMapping[] = table.headers.map((header, index) => {
    const role = detectColumnRole(header, table, index);
    const samples = table.rows.slice(0, 3).map((r) => r.cells[index] || '');

    return {
      index,
      header,
      role: role.role,
      confidence: role.confidence,
      samples,
    };
  });

  // Find key columns
  const stationNameColumn =
    columns.find((c) => c.role === 'station_name')?.index ?? null;
  const statusColumn = columns.find((c) => c.role === 'status')?.index ?? null;
  const sectionColumn =
    columns.find((c) => c.role === 'section')?.index ?? null;

  // Calculate overall confidence
  const hasStationName = stationNameColumn !== null;
  const overallConfidence = hasStationName
    ? columns.reduce((sum, c) => sum + c.confidence, 0) / columns.length
    : 0;

  return {
    columns,
    stationNameColumn,
    statusColumn,
    sectionColumn,
    confidence: overallConfidence,
  };
}

/**
 * Detect role for single column based on header and sample values
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
  const samples = table.rows.slice(0, 5).map((r) => r.cells[columnIndex] || '');

  // Status column: mostly 0/1 or true/false
  if (
    samples.every((s) =>
      ['0', '1', 'true', 'false', ''].includes(s.toLowerCase())
    )
  ) {
    return { role: 'status', confidence: 0.7 };
  }

  // Sequence column: all numbers
  if (samples.every((s) => /^\d*$/.test(s))) {
    return { role: 'sequence', confidence: 0.7 };
  }

  // Station name: short codes, uppercase, alphanumeric
  const looksLikeStationName = samples.every(
    (s) =>
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
    warnings,
  };
}

/**
 * Update column role manually
 */
export function updateColumnRole(
  columns: ColumnMapping[],
  columnIndex: number,
  newRole: ColumnRole
): ColumnMapping[] {
  return columns.map((col) =>
    col.index === columnIndex
      ? { ...col, role: newRole, confidence: 1.0 }
      : col
  );
}
