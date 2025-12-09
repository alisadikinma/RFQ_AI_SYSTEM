/**
 * Input Type Detector
 * Detects whether pasted input is Excel table, simple list, inline list, or natural language
 */

import { DetectionResult, InputType } from './types';

/**
 * Common question patterns in multiple languages
 */
const QUESTION_PATTERNS = [
  // Indonesian
  /^(apa|siapa|dimana|kapan|mengapa|kenapa|bagaimana|berapa|tolong|bisa|boleh|minta|jelaskan|terangkan|ceritakan)/i,
  // English  
  /^(what|who|where|when|why|how|can|could|please|explain|tell|describe|help)/i,
  // Chinese
  /^(什么|谁|哪里|何时|为什么|怎么|请|帮)/,
  // Contains question mark
  /\?$/,
];

/**
 * Common station code patterns
 */
const STATION_PATTERNS = [
  /^[A-Z][A-Z0-9_]{1,15}$/,  // Uppercase alphanumeric with underscore
  /^(RFT|CAL|MMI|ICT|FCT|AOI|MBT|VISUAL|OS|CURRENT|UNDERFILL|T.?GREASE|SHIELDING|ROUTER|DEPANEL)/i,
];

/**
 * Check if text looks like natural language/question
 */
function isNaturalLanguage(text: string): boolean {
  const trimmed = text.trim();
  
  // Check question patterns
  for (const pattern of QUESTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      return true;
    }
  }
  
  // Contains multiple spaces between words (natural sentence)
  const words = trimmed.split(/\s+/);
  if (words.length > 3 && !trimmed.includes('\t')) {
    // Check if most words are NOT station-like
    const stationLikeWords = words.filter(w => 
      STATION_PATTERNS.some(p => p.test(w))
    );
    if (stationLikeWords.length < words.length * 0.3) {
      return true;
    }
  }
  
  // Long text without tabs is likely natural language
  if (trimmed.length > 50 && !trimmed.includes('\t') && trimmed.split('\n').length === 1) {
    return true;
  }
  
  return false;
}

/**
 * Check if text looks like station list
 */
function looksLikeStationList(text: string): boolean {
  const lines = text.trim().split('\n').filter(Boolean);
  
  // Check if most lines look like station codes
  let stationLikeCount = 0;
  for (const line of lines) {
    const cleaned = line.trim().toUpperCase();
    if (STATION_PATTERNS.some(p => p.test(cleaned)) || cleaned.length <= 20) {
      stationLikeCount++;
    }
  }
  
  return stationLikeCount > lines.length * 0.5;
}

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
      rawData: input,
    };
  }

  // Check if it's natural language/question FIRST
  if (isNaturalLanguage(trimmed)) {
    return {
      type: 'unknown',  // Mark as unknown so it won't be parsed as stations
      confidence: 0.3,
      hasHeaders: false,
      rowCount: 1,
      columnCount: 1,
      rawData: input,
      isQuestion: true,  // Flag for downstream handling
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
      rawData: input,
    };
  }

  // Simple list: one item per line, no tabs
  if (lines.length > 1 && tabCount === 0) {
    // Check if it actually looks like a station list
    if (looksLikeStationList(trimmed)) {
      return {
        type: 'simple_list',
        confidence: 0.9,
        hasHeaders: false,
        rowCount: lines.length,
        columnCount: 1,
        rawData: input,
      };
    }
    
    // Multi-line but doesn't look like stations
    return {
      type: 'unknown',
      confidence: 0.4,
      hasHeaders: false,
      rowCount: lines.length,
      columnCount: 1,
      rawData: input,
    };
  }

  // Inline list: comma or space separated, single line
  if (lines.length === 1 && (commaCount > 0 || trimmed.includes(' '))) {
    const items = trimmed.split(/[,\s]+/).filter(Boolean);
    
    // Check if items look like station codes
    const stationLikeItems = items.filter(item => 
      STATION_PATTERNS.some(p => p.test(item.toUpperCase()))
    );
    
    if (stationLikeItems.length > items.length * 0.5) {
      return {
        type: 'inline_list',
        confidence: 0.85,
        hasHeaders: false,
        rowCount: 1,
        columnCount: items.length,
        rawData: input,
      };
    }
    
    // Doesn't look like station list
    return {
      type: 'unknown',
      confidence: 0.3,
      hasHeaders: false,
      rowCount: 1,
      columnCount: items.length,
      rawData: input,
    };
  }

  return {
    type: 'unknown',
    confidence: 0.5,
    hasHeaders: false,
    rowCount: lines.length,
    columnCount: 1,
    rawData: input,
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
    'no',
    'name',
    'status',
    'section',
    'process',
    'code',
    'description',
    '序号',
    '名称',
    '选择',
    '工段',
    '工艺',
    '编号',
    '边界',
  ];

  const firstRowLower = firstRow.toLowerCase();
  const keywordMatches = headerKeywords.filter((kw) =>
    firstRowLower.includes(kw)
  );

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

/**
 * Get simple list items from input
 * Used when input is detected as simple_list or inline_list
 */
export function extractSimpleList(input: string, type: InputType): string[] {
  const trimmed = input.trim();

  if (type === 'simple_list') {
    return trimmed
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }

  if (type === 'inline_list') {
    return trimmed.split(/[,\s]+/).filter(Boolean);
  }

  return [];
}
