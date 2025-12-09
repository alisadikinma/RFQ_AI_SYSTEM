-- RAG Knowledge Base Schema
-- Run this in Supabase SQL Editor

-- Enable pgvector if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge chunks table
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding vector(768), -- Gemini text-embedding-004 dimension
  
  -- Metadata
  source_file TEXT NOT NULL,
  section_title TEXT,
  chunk_index INTEGER NOT NULL,
  token_count INTEGER,
  
  -- Searchable metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx 
ON knowledge_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Index for filtering by source
CREATE INDEX IF NOT EXISTS knowledge_chunks_source_idx 
ON knowledge_chunks (source_file);

-- Full text search index
CREATE INDEX IF NOT EXISTS knowledge_chunks_content_idx 
ON knowledge_chunks 
USING gin (to_tsvector('english', content));

-- Function to search knowledge base
CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding vector(768),
  match_count INT DEFAULT 5,
  filter_source TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  source_file TEXT,
  section_title TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kc.id,
    kc.content,
    kc.source_file,
    kc.section_title,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE 
    (filter_source IS NULL OR kc.source_file = filter_source)
    AND kc.embedding IS NOT NULL
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to hybrid search (vector + keyword)
CREATE OR REPLACE FUNCTION hybrid_search_knowledge(
  query_embedding vector(768),
  query_text TEXT,
  match_count INT DEFAULT 5,
  vector_weight FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  source_file TEXT,
  section_title TEXT,
  similarity FLOAT,
  keyword_rank FLOAT,
  combined_score FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kc.id,
    kc.content,
    kc.source_file,
    kc.section_title,
    1 - (kc.embedding <=> query_embedding) AS similarity,
    ts_rank(to_tsvector('english', kc.content), plainto_tsquery('english', query_text)) AS keyword_rank,
    (
      vector_weight * (1 - (kc.embedding <=> query_embedding)) +
      (1 - vector_weight) * COALESCE(ts_rank(to_tsvector('english', kc.content), plainto_tsquery('english', query_text)), 0)
    ) AS combined_score
  FROM knowledge_chunks kc
  WHERE kc.embedding IS NOT NULL
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;

-- Comment
COMMENT ON TABLE knowledge_chunks IS 'RAG knowledge base for EMS AI Agent';
