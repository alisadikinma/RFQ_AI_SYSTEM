/**
 * RFQ Chat Interface Components - Phase 6E
 * Unified chat interface for RFQ input
 */

export { RfqChatInterface } from './RfqChatInterface';
export { ChatInput } from './ChatInput';
export { ModeSwitch } from './ModeSwitch';
export { QuickActions } from './QuickActions';
export { MessageBubble } from './MessageBubble';
export { FilePreview } from './FilePreview';
export { ExtractionResult } from './ExtractionResult';
export { ProcessingIndicator } from './ProcessingIndicator';
export { SimilarModelsCard } from './SimilarModelsCard';
export { ModelComparisonModal } from './ModelComparisonModal';

// Types
export type {
  ChatMode,
  ChatMessage,
  RfqChatState,
  UploadedFile,
  MessageAction,
  MessageAttachment,
  QuickActionType,
  InferredStation,
  SimilarModel,
  ProcessInputResult,
  AgentChatResponse,
} from './types';
