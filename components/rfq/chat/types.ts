/**
 * Types for Unified RFQ Chat Interface - Phase 6E
 */

import type { ExtractedStation } from '@/lib/excel-parser/types';

// Chat mode
export type ChatMode = 'normal' | 'ai_agent';

// File attachment info
export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  file?: File;
}

// Message action button
export interface MessageAction {
  id: string;
  label: string;
  action: string;
  variant: 'primary' | 'secondary' | 'outline';
  data?: Record<string, unknown>;
}

// Message attachment
export interface MessageAttachment {
  type: 'file' | 'extraction' | 'recommendation';
  data: unknown;
}

// Inferred station from AI
export interface InferredStation {
  code: string;
  name: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

// Similar model from similarity search
export interface SimilarModel {
  id: string;
  code: string;
  name: string;
  customer: string;
  customer_code: string;
  similarity: number;
  total_stations: number;
  total_manpower: number;
  matched_stations: string[];
  missing_stations: string[];
  extra_stations: string[];
  all_stations: string[];
}

// Chat message
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: MessageAttachment[];
  actions?: MessageAction[];
  data?: {
    stations?: InferredStation[];
    similarModels?: SimilarModel[];
    questions?: string[];
    warnings?: string[];
    toolsUsed?: string[];
  };
}

// Main chat state
export interface RfqChatState {
  mode: ChatMode;
  messages: ChatMessage[];
  extractedStations: ExtractedStation[];
  uploadedFiles: UploadedFile[];
  isProcessing: boolean;
  processingStep: string | null;
  canProceed: boolean;
  selectedCustomer: string | null;
  skippedCount: number;
  similarModels?: SimilarModel[];
  selectedModel?: SimilarModel;
}

// Quick action type
export type QuickActionType = 'paste' | 'excel' | 'pdf' | 'manual';

// Processing input result
export interface ProcessInputResult {
  type: 'excel_table' | 'station_list' | 'file_upload';
  stations: ExtractedStation[];
  skipped: number;
  warnings?: string[];
  needsPreview?: boolean;
  rawTable?: unknown;
}

// AI Agent response
export interface AgentChatResponse {
  success: boolean;
  content?: string;
  stations?: InferredStation[];
  similarModels?: SimilarModel[];
  actions?: Array<{
    id: string;
    label: string;
    type: 'primary' | 'secondary' | 'outline';
  }>;
  questions?: string[];
  warnings?: string[];
  toolsUsed?: string[];
  error?: string;
}
