/**
 * RAG Types
 */

export interface KnowledgeChunk {
  id?: string;
  content: string;
  embedding?: number[];
  source_file: string;
  section_title: string | null;
  chunk_index: number;
  token_count: number;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface ChunkingOptions {
  maxTokens?: number;      // Max tokens per chunk (default: 500)
  overlapTokens?: number;  // Overlap between chunks (default: 100)
  preserveHeaders?: boolean; // Keep section headers (default: true)
}

export interface SearchResult {
  id: string;
  content: string;
  source_file: string;
  section_title: string | null;
  similarity: number;
  keyword_rank?: number;
  combined_score?: number;
}

export interface SearchOptions {
  maxResults?: number;     // Max results to return (default: 5)
  minSimilarity?: number;  // Minimum similarity threshold (default: 0.5)
  filterSource?: string;   // Filter by source file
  hybridSearch?: boolean;  // Use hybrid search (default: false)
  vectorWeight?: number;   // Weight for vector search (default: 0.7)
}

export interface EmbeddingResult {
  embedding: number[];
  tokenCount: number;
}
