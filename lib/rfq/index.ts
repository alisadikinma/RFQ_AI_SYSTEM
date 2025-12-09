/**
 * RFQ Module
 * Smart input processing and station resolution
 */

// Types
export type {
  StationInput,
  DetectedColumns,
  PasteDetectionResult,
  DocumentSource,
  DocumentMetadata,
  ParsedDocument,
  MatchMethod,
  ConfidenceLevel,
  ResolvedStation,
  ResolutionSummary,
  ResolutionResult,
  RFQStatus,
  RFQRequest,
  ResolveRequest,
  ResolveResponse,
  ProcessingStepStatus,
  ProcessingStep,
  SmartPasteState,
  // Phase 6B Types
  SimilarModel,
  ModelDetail,
  ModelSummary,
  ModelStationDetail,
  ComparisonResult,
  ComparisonStats,
  CostEstimate,
  SimilaritySearchRequest,
  SimilaritySearchResponse,
  ModelComparisonResponse,
  // Phase 6C Types
  ChatMessage,
  SuggestedStation,
  ActionButton,
  AIAssistantState,
  ChatRequest,
  ChatResponse,
} from './types';

// Paste Detection
export {
  detectPastedData,
  parseSimpleText,
  isExcelPaste,
} from './paste-detector';

// Document Parsing
export {
  parseExcelFile,
  parseManualInput,
  parseFromDetection,
  extractStationsFromPaste,
  validateParsedDocument,
} from './document-parser';

// Station Resolution
export {
  resolveStations,
  batchResolveStations,
  quickResolve,
} from './station-resolver';

// Similarity Engine (Phase 6B)
export {
  findSimilarModels,
  getModelDetails,
  calculateComparison,
  estimateCosts,
  getComparisonResult,
} from './similarity-engine';
