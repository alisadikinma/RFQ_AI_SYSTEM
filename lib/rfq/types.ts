/**
 * RFQ Input & Station Resolution Types
 * Types for smart input, paste detection, and station resolution
 */

// ============================================================================
// Input Types
// ============================================================================

/** Input station from customer document */
export interface StationInput {
  name: string;
  description?: string;
  boardType?: string;
  enabled?: boolean;
}

// ============================================================================
// Paste Detection Types
// ============================================================================

/** Column mapping for detected table */
export interface DetectedColumns {
  stationName: number | null;
  description: number | null;
  boardType: number | null;
  status: number | null;
}

/** Result of paste detection analysis */
export interface PasteDetectionResult {
  isTabular: boolean;
  rows: string[][];
  headers: string[];
  columnCount: number;
  rowCount: number;
  detectedColumns: DetectedColumns;
  confidence: 'high' | 'medium' | 'low';
}

// ============================================================================
// Parsed Document Types
// ============================================================================

/** Source of the parsed document */
export type DocumentSource = 'excel' | 'pdf' | 'manual' | 'smart_paste';

/** Metadata about the parsed document */
export interface DocumentMetadata {
  fileName?: string;
  totalRows?: number;
  enabledRows?: number;
  sheetName?: string;
}

/** Result of parsing a document */
export interface ParsedDocument {
  source: DocumentSource;
  stations: StationInput[];
  metadata?: DocumentMetadata;
}

// ============================================================================
// Resolution Types
// ============================================================================

/** Method used to resolve a station */
export type MatchMethod = 'exact' | 'alias' | 'semantic' | 'unresolved';

/** Confidence level for a resolution */
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'none';

/** Result of resolving a single station */
export interface ResolvedStation {
  input: string;
  inputDescription?: string;
  inputBoardType?: string;
  resolvedCode: string | null;
  resolvedName: string | null;
  confidence: ConfidenceLevel;
  matchMethod: MatchMethod;
  reasoning?: string;
}

/** Summary of resolution results */
export interface ResolutionSummary {
  total: number;
  resolved: number;
  unresolved: number;
  uniqueCodes: string[];
  byMethod: {
    exact: number;
    alias: number;
    semantic: number;
    unresolved: number;
  };
}

/** Complete resolution result */
export interface ResolutionResult {
  stations: ResolvedStation[];
  summary: ResolutionSummary;
}

// ============================================================================
// RFQ Request Types
// ============================================================================

/** Status of an RFQ request */
export type RFQStatus = 'draft' | 'processing' | 'completed' | 'error';

/** RFQ request data structure */
export interface RFQRequest {
  id?: string;
  customerId: string;
  customerCode?: string;
  modelName: string;
  targetQty?: number;
  inputSource: DocumentSource;
  rawInput: StationInput[];
  resolvedStations: ResolvedStation[];
  status: RFQStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/** Request body for resolve API */
export interface ResolveRequest {
  inputType: 'excel' | 'manual';
  text?: string;
  columnMapping?: DetectedColumns;
  customerId?: string;
}

/** Response from resolve API */
export interface ResolveResponse {
  success: boolean;
  parsed?: ParsedDocument;
  resolution?: ResolutionResult;
  error?: string;
}

// ============================================================================
// UI State Types
// ============================================================================

/** Processing step status */
export type ProcessingStepStatus = 'pending' | 'processing' | 'completed' | 'error';

/** Processing step for UI */
export interface ProcessingStep {
  id: string;
  label: string;
  status: ProcessingStepStatus;
  progress?: number;
  message?: string;
}

/** Smart paste modal state */
export interface SmartPasteState {
  isOpen: boolean;
  detection: PasteDetectionResult | null;
  columnMapping: DetectedColumns;
  filterEnabled: boolean;
}

// ============================================================================
// Phase 6B: Similarity Search & Comparison Types
// ============================================================================

/** Similarity search result for a model */
export interface SimilarModel {
  modelId: string;
  modelCode: string;
  customerCode: string;
  customerName: string;
  boardTypes: string[];
  stationCodes: string[];
  stationCount: number;
  totalManpower: number;
  similarity: number;
  matchedStations: string[];
  extraStations: string[];    // In model, not in request
  missingStations: string[];  // In request, not in model
}

/** Model detail for comparison view */
export interface ModelDetail {
  id: string;
  code: string;
  customer: {
    code: string;
    name: string;
  };
  boardTypes: string[];
  status: string;
  stations: ModelStationDetail[];
  summary: ModelSummary;
}

/** Summary metrics for a model */
export interface ModelSummary {
  totalStations: number;
  totalManpower: number;
  totalInvestment: number;
  bottleneckStation: string;
  bottleneckUPH: number;
}

/** Station detail within a model */
export interface ModelStationDetail {
  id: string;
  boardType: string;
  sequence: number;
  stationCode: string;
  stationName: string;
  description: string;
  category?: string;
  manpower: number;
  uph: number | null;
  cycleTime: number | null;
  investment: number | null;
  isMatched: boolean;  // true if station is in user's request
}

/** Side-by-side comparison result */
export interface ComparisonResult {
  yourRequest: {
    stations: ResolvedStation[];
    uniqueCodes: string[];
  };
  historicalModel: ModelDetail;
  comparison: ComparisonStats;
  costEstimate: CostEstimate;
}

/** Station comparison statistics */
export interface ComparisonStats {
  matched: string[];     // Stations in both request and model
  extra: string[];       // Stations in model but not requested
  missing: string[];     // Stations requested but not in model
  matchPercentage: number;
}

/** Cost estimation based on historical model */
export interface CostEstimate {
  equipmentInvestment: number;
  fixturesCost: number;
  totalManpower: number;
  monthlyLaborCost: number;
  lineUPH: number;
  monthlyCapacity: number;
  costPerUnit: number;
}

/** Similarity search API request */
export interface SimilaritySearchRequest {
  stationCodes: string[];
  limit?: number;
  minSimilarity?: number;
  customerId?: string;
}

/** Similarity search API response */
export interface SimilaritySearchResponse {
  success: boolean;
  query: {
    stationCodes: string[];
    count: number;
  };
  results: SimilarModel[];
  hasMatches: boolean;
  closestMatch?: {
    modelCode: string;
    similarity: number;
  };
  error?: string;
}

/** Model comparison API response */
export interface ModelComparisonResponse {
  success: boolean;
  model: ModelDetail;
  comparison: ComparisonStats;
  costEstimate?: CostEstimate;
  error?: string;
}

// ============================================================================
// Phase 6C: AI Assistant Chat Types
// ============================================================================

/** Chat message in AI Assistant conversation */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  /** Structured station suggestions from AI */
  suggestedStations?: SuggestedStation[];
  /** Similar models found by AI */
  similarModels?: SimilarModel[];
  /** Action buttons for user interaction */
  actionButtons?: ActionButton[];
  /** Is this message still being streamed */
  isStreaming?: boolean;
  /** Clarification questions from AI */
  needsClarification?: string[];
}

/** Station suggestion from AI with reasoning */
export interface SuggestedStation {
  code: string;
  name: string;
  reason: string;
}

/** Action button in AI response */
export interface ActionButton {
  id: string;
  label: string;
  action: 'use_stations' | 'search_models' | 'view_model' | 'add_station' | 'remove_station';
  data?: {
    stations?: string[];
    modelId?: string;
    stationCode?: string;
  };
  variant?: 'default' | 'outline' | 'secondary';
}

/** AI Assistant conversation state */
export interface AIAssistantState {
  messages: ChatMessage[];
  extractedStations: string[];
  isProcessing: boolean;
  conversationComplete: boolean;
  currentSuggestions?: SuggestedStation[];
}

/** Chat API request */
export interface ChatRequest {
  messages?: Array<{
    role: 'user' | 'assistant';
    content: string;
    suggestedStations?: SuggestedStation[];
  }>;
  action?: 'chat' | 'search_models' | 'confirm_stations';
  stationCodes?: string[];
  customerId?: string;
}

/** Chat API response */
export interface ChatResponse {
  success: boolean;
  type?: 'message' | 'search_results' | 'stations_confirmed';
  message?: string;
  suggestedStations?: SuggestedStation[];
  similarModels?: SimilarModel[];
  stations?: string[];
  extractedStations?: string[];
  actionButtons?: ActionButton[];
  isComplete?: boolean;
  needsClarification?: string[];
  error?: string;
}
