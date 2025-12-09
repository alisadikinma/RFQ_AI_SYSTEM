/**
 * Excel Parser Module
 * Smart Excel parsing for RFQ station data extraction
 */

// Types
export type {
  InputType,
  DetectionResult,
  ParsedTable,
  TableRow,
  ColumnRole,
  ColumnMapping,
  ColumnDetectionResult,
  ExtractionConfig,
  ExtractedStation,
  ExtractionResult,
} from './types';

// Detector functions
export { detectInputType, extractSimpleList } from './detector';

// Table parser functions
export { parseTable, mergeMultiRowHeaders, getTablePreview } from './table-parser';

// Column detector functions
export {
  detectColumns,
  validateDetection,
  updateColumnRole,
} from './column-detector';

// Extractor functions
export {
  extractStations,
  getUniqueStationNames,
  groupStationsBySection,
  getExtractionStats,
} from './extractor';
