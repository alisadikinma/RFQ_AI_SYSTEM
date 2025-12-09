/**
 * RAG Search
 * Search knowledge base using vector similarity
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SearchResult, SearchOptions, KnowledgeChunk } from './types';
import { generateQueryEmbedding } from './embeddings';

// Lazy-initialized Supabase client
let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    }
    
    _supabase = createClient(supabaseUrl, supabaseKey);
  }
  return _supabase;
}

/**
 * Search knowledge base
 */
export async function searchKnowledge(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const {
    maxResults = 5,
    minSimilarity = 0.5,
    filterSource,
    hybridSearch = false,
    vectorWeight = 0.7,
  } = options;
  
  const supabase = getSupabase();
  
  // Generate query embedding
  const embedding = await generateQueryEmbedding(query);
  
  let results: SearchResult[];
  
  if (hybridSearch) {
    // Hybrid search (vector + keyword)
    const { data, error } = await supabase.rpc('hybrid_search_knowledge', {
      query_embedding: embedding,
      query_text: query,
      match_count: maxResults,
      vector_weight: vectorWeight,
    });
    
    if (error) {
      console.error('Hybrid search error:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
    
    results = (data || []).map((row: any) => ({
      id: row.id,
      content: row.content,
      source_file: row.source_file,
      section_title: row.section_title,
      similarity: row.similarity,
      keyword_rank: row.keyword_rank,
      combined_score: row.combined_score,
    }));
  } else {
    // Vector-only search
    const { data, error } = await supabase.rpc('search_knowledge', {
      query_embedding: embedding,
      match_count: maxResults,
      filter_source: filterSource || null,
    });
    
    if (error) {
      console.error('Vector search error:', error);
      throw new Error(`Search failed: ${error.message}`);
    }
    
    results = (data || []).map((row: any) => ({
      id: row.id,
      content: row.content,
      source_file: row.source_file,
      section_title: row.section_title,
      similarity: row.similarity,
    }));
  }
  
  // Filter by minimum similarity
  return results.filter(r => r.similarity >= minSimilarity);
}

/**
 * Get context for AI prompt
 * Returns formatted string of relevant chunks
 */
export async function getRAGContext(
  query: string,
  options: SearchOptions = {}
): Promise<string> {
  const results = await searchKnowledge(query, options);
  
  if (results.length === 0) {
    return '';
  }
  
  // Format results for context
  const contextParts = results.map((r, i) => {
    const source = r.source_file.replace('.md', '').replace('EMS_', '');
    const section = r.section_title ? ` > ${r.section_title}` : '';
    return `[Source: ${source}${section}]\n${r.content}`;
  });
  
  return contextParts.join('\n\n---\n\n');
}

/**
 * Insert chunks into database
 */
export async function insertChunks(chunks: KnowledgeChunk[]): Promise<number> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('knowledge_chunks')
    .insert(chunks.map(chunk => ({
      content: chunk.content,
      embedding: chunk.embedding,
      source_file: chunk.source_file,
      section_title: chunk.section_title,
      chunk_index: chunk.chunk_index,
      token_count: chunk.token_count,
      metadata: chunk.metadata || {},
    })))
    .select('id');
  
  if (error) {
    console.error('Insert error:', error);
    throw new Error(`Failed to insert chunks: ${error.message}`);
  }
  
  return data?.length || 0;
}

/**
 * Clear all chunks (for re-indexing)
 */
export async function clearAllChunks(): Promise<void> {
  const supabase = getSupabase();
  
  const { error } = await supabase
    .from('knowledge_chunks')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
  
  if (error) {
    throw new Error(`Failed to clear chunks: ${error.message}`);
  }
}

/**
 * Clear chunks from specific source
 */
export async function clearChunksBySource(sourceFile: string): Promise<void> {
  const supabase = getSupabase();
  
  const { error } = await supabase
    .from('knowledge_chunks')
    .delete()
    .eq('source_file', sourceFile);
  
  if (error) {
    throw new Error(`Failed to clear chunks: ${error.message}`);
  }
}

/**
 * Get stats about knowledge base
 */
export async function getKnowledgeStats(): Promise<{
  totalChunks: number;
  bySource: Record<string, number>;
  totalTokens: number;
}> {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('knowledge_chunks')
    .select('source_file, token_count');
  
  if (error) {
    throw new Error(`Failed to get stats: ${error.message}`);
  }
  
  const bySource: Record<string, number> = {};
  let totalTokens = 0;
  
  for (const row of data || []) {
    bySource[row.source_file] = (bySource[row.source_file] || 0) + 1;
    totalTokens += row.token_count || 0;
  }
  
  return {
    totalChunks: data?.length || 0,
    bySource,
    totalTokens,
  };
}
