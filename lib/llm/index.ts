/**
 * LLM Module
 * AI-powered text generation and analysis for RFQ system
 */

// Core OpenRouter client functions (fallback)
export {
  callLLM,
  callLLMJSON,
  complete,
  isLLMAvailable,
} from './client';

// Gemini client functions
export {
  callGemini,
  callGeminiJSON,
  completeGemini,
  toGeminiMessages,
  isGeminiAvailable,
  type GeminiMessage,
  type GeminiConfig,
  type GeminiResponse,
} from './gemini-client';

// RFQ Agent v2 - Function Calling + RAG (RECOMMENDED)
export {
  processAgentMessage,
  isAgentAvailable,
  type AgentMessage,
  type AgentResponse,
} from './agent-v2';

// Agent Tools
export {
  AGENT_TOOLS,
  executeTool,
} from './tools';

// Legacy Agent (for backward compatibility)
export {
  processAgentMessage as processAgentMessageLegacy,
  inferStationsFromDescription,
  quickInferStations,
  extractConfirmedStations,
  getStationDefinition,
  getAllStations,
  type AgentMessage as LegacyAgentMessage,
  type InferredStation,
  type AgentAction,
  type AgentResponse as LegacyAgentResponse,
} from './agent';

// RFQ Agent prompts (legacy)
export {
  RFQ_AGENT_SYSTEM_PROMPT,
  STATION_INFERENCE_PROMPT,
  QUICK_INFERENCE_MAP,
  STATION_DEFINITIONS,
} from './prompts/rfq-agent';

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

// AI Assistant prompts
export {
  buildAIAssistantPrompt,
  parseAIResponse,
  extractStationsFromConversation,
  INFERENCE_RULES,
  DEFAULT_STATION_LIST,
  type ParsedAIResponse,
} from './prompts/ai-assistant';
