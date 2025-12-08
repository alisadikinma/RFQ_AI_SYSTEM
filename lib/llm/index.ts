/**
 * LLM Module
 * AI-powered text generation and analysis for RFQ system
 */

// Core client functions
export {
  callLLM,
  callLLMJSON,
  complete,
  isLLMAvailable,
} from './client';

// Explanation and suggestion functions
export {
  explainRFQResult,
  generateSuggestions,
  type ExplainParams,
  type RFQExplanation,
  type SuggestionParams,
  type Suggestion,
} from './explain';

// BOM parsing prompts
export { parseBOMWithLLM } from './prompts/bom-parser';

// PDF extraction prompts
export { extractPCBDimensionsWithLLM } from './prompts/pdf-extractor';
