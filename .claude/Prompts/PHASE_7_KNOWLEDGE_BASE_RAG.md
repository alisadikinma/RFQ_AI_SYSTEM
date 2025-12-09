# PHASE_7: EMS Knowledge Base & Advanced RAG

## 🎯 Objective
Build comprehensive knowledge base dengan Advanced RAG untuk AI Assistant:
- Chunking strategy untuk optimal retrieval
- Hybrid search (semantic + keyword)
- Citation & source tracking
- Multi-domain knowledge support

**Prerequisite**: Phase 6A-C completed, Knowledge documents collected

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ADVANCED RAG ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐   │
│  │   RAW DOCS   │───▶│   CHUNKER    │───▶│   EMBEDDING + STORAGE   │   │
│  │  (Markdown)  │    │  (Semantic)  │    │     (Supabase)          │   │
│  └──────────────┘    └──────────────┘    └──────────────────────────┘   │
│                                                   │                      │
│                                                   ▼                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐   │
│  │  USER QUERY  │───▶│   HYBRID     │───▶│   RANKED CHUNKS         │   │
│  │              │    │   SEARCH     │    │   + Citations           │   │
│  └──────────────┘    └──────────────┘    └──────────────────────────┘   │
│                                                   │                      │
│                                                   ▼                      │
│                                          ┌──────────────────────────┐   │
│                                          │   LLM + CONTEXT          │   │
│                                          │   (Gemini 2.0 Flash)     │   │
│                                          └──────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### knowledge_documents
Master table untuk source documents.

```sql
CREATE TABLE knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Document identification
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  source_type TEXT NOT NULL, -- 'internal', 'research', 'standard', 'manual'
  
  -- Categorization
  domain TEXT NOT NULL, -- 'smt', 'testing', 'quality', 'troubleshooting', 'cost', 'industry'
  subdomain TEXT, -- More specific category
  tags TEXT[], -- Array of tags for filtering
  
  -- Content
  raw_content TEXT NOT NULL, -- Original markdown
  word_count INTEGER,
  
  -- Metadata
  version TEXT DEFAULT '1.0',
  author TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Quality indicators
  verified_by TEXT, -- Who validated this content
  verified_at TIMESTAMPTZ,
  confidence_score DECIMAL(3,2), -- 0.00-1.00
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_knowledge_documents_domain ON knowledge_documents(domain);
CREATE INDEX idx_knowledge_documents_tags ON knowledge_documents USING GIN(tags);
```

### knowledge_chunks
Chunked content dengan embeddings.

```sql
CREATE TABLE knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  
  -- Chunk identification
  chunk_index INTEGER NOT NULL, -- Order within document
  chunk_type TEXT NOT NULL, -- 'section', 'paragraph', 'table', 'list', 'code'
  
  -- Content
  content TEXT NOT NULL, -- The chunk text
  token_count INTEGER, -- For context window management
  
  -- Hierarchy (for context)
  parent_header TEXT, -- H1 header this belongs to
  section_header TEXT, -- H2/H3 header
  
  -- Vector embedding
  embedding vector(1536), -- text-embedding-3-small dimension
  
  -- Search optimization
  keywords TEXT[], -- Extracted keywords for BM25
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(document_id, chunk_index)
);

-- Vector index for similarity search
CREATE INDEX idx_knowledge_chunks_embedding 
ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);

-- Full-text search index
CREATE INDEX idx_knowledge_chunks_fts 
ON knowledge_chunks USING GIN (to_tsvector('english', content));

-- Keyword index for filtering
CREATE INDEX idx_knowledge_chunks_keywords 
ON knowledge_chunks USING GIN(keywords);
```

### knowledge_citations
Track which chunks were used in responses.

```sql
CREATE TABLE knowledge_citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference to chunk
  chunk_id UUID REFERENCES knowledge_chunks(id),
  
  -- Context
  conversation_id UUID, -- Link to chat session
  query TEXT NOT NULL, -- User's question
  
  -- Citation details
  relevance_score DECIMAL(4,3), -- 0.000-1.000
  was_useful BOOLEAN, -- User feedback
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics index
CREATE INDEX idx_knowledge_citations_chunk ON knowledge_citations(chunk_id);
CREATE INDEX idx_knowledge_citations_date ON knowledge_citations(created_at);
```

---

## 🔪 Chunking Strategy

### Semantic Chunking Algorithm

```typescript
interface ChunkConfig {
  maxTokens: number;        // 500-800 optimal
  minTokens: number;        // 100 minimum
  overlapTokens: number;    // 50-100 for context
  respectHeaders: boolean;  // Never split mid-section
  respectLists: boolean;    // Keep lists together
  respectTables: boolean;   // Tables as single chunk
  respectCode: boolean;     // Code blocks as single chunk
}

const DEFAULT_CHUNK_CONFIG: ChunkConfig = {
  maxTokens: 600,
  minTokens: 100,
  overlapTokens: 75,
  respectHeaders: true,
  respectLists: true,
  respectTables: true,
  respectCode: true
};
```

### Chunking Rules

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     CHUNKING RULES                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  RULE 1: RESPECT SEMANTIC BOUNDARIES                                    │
│  ────────────────────────────────────                                   │
│  • Never split in middle of paragraph                                   │
│  • Never split in middle of list                                        │
│  • Never split table rows                                               │
│  • Never split code block                                               │
│                                                                          │
│  RULE 2: HEADER HIERARCHY                                               │
│  ─────────────────────────                                              │
│  • H1 starts new chunk (if previous chunk exists)                       │
│  • H2/H3 can start new chunk if current > maxTokens/2                   │
│  • Keep header with its content                                         │
│                                                                          │
│  RULE 3: OVERLAP FOR CONTEXT                                            │
│  ───────────────────────────                                            │
│  • Add last 1-2 sentences from previous chunk                           │
│  • Add header context to each chunk                                     │
│                                                                          │
│  RULE 4: SPECIAL CONTENT                                                │
│  ───────────────────────                                                │
│  • Tables: Keep whole, mark as chunk_type='table'                       │
│  • Code: Keep whole, mark as chunk_type='code'                          │
│  • Lists: Keep whole if < maxTokens                                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Implementation

**File: `lib/knowledge/chunker.ts`**

```typescript
import { encode, decode } from 'gpt-tokenizer'; // or tiktoken

interface Chunk {
  content: string;
  type: 'section' | 'paragraph' | 'table' | 'list' | 'code';
  parentHeader: string;
  sectionHeader: string;
  tokenCount: number;
  index: number;
}

export function chunkDocument(
  markdown: string, 
  config: ChunkConfig = DEFAULT_CHUNK_CONFIG
): Chunk[] {
  const chunks: Chunk[] = [];
  const lines = markdown.split('\n');
  
  let currentChunk: string[] = [];
  let currentTokens = 0;
  let currentH1 = '';
  let currentH2 = '';
  let inCodeBlock = false;
  let inTable = false;
  
  for (const line of lines) {
    // Track code blocks
    if (line.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
    }
    
    // Track tables
    if (line.startsWith('|') && !inTable) {
      inTable = true;
    } else if (!line.startsWith('|') && inTable) {
      inTable = false;
    }
    
    // Track headers
    if (line.startsWith('# ')) {
      currentH1 = line.replace('# ', '');
      // Flush current chunk
      if (currentChunk.length > 0) {
        chunks.push(createChunk(currentChunk, currentH1, currentH2, chunks.length));
        currentChunk = [];
        currentTokens = 0;
      }
    } else if (line.startsWith('## ')) {
      currentH2 = line.replace('## ', '');
      // Maybe start new chunk
      if (currentTokens > config.maxTokens / 2) {
        chunks.push(createChunk(currentChunk, currentH1, currentH2, chunks.length));
        currentChunk = [];
        currentTokens = 0;
      }
    }
    
    // Add line to current chunk
    currentChunk.push(line);
    currentTokens = countTokens(currentChunk.join('\n'));
    
    // Check if chunk is full (but respect boundaries)
    if (currentTokens >= config.maxTokens && !inCodeBlock && !inTable) {
      // Find safe split point
      const splitPoint = findSafeSplitPoint(currentChunk, config);
      
      if (splitPoint > 0) {
        const chunk1 = currentChunk.slice(0, splitPoint);
        const chunk2 = currentChunk.slice(splitPoint);
        
        chunks.push(createChunk(chunk1, currentH1, currentH2, chunks.length));
        
        // Add overlap
        const overlap = getOverlap(chunk1, config.overlapTokens);
        currentChunk = [...overlap, ...chunk2];
        currentTokens = countTokens(currentChunk.join('\n'));
      }
    }
  }
  
  // Flush remaining
  if (currentChunk.length > 0) {
    chunks.push(createChunk(currentChunk, currentH1, currentH2, chunks.length));
  }
  
  return chunks;
}

function createChunk(
  lines: string[], 
  h1: string, 
  h2: string, 
  index: number
): Chunk {
  const content = lines.join('\n').trim();
  return {
    content,
    type: detectChunkType(content),
    parentHeader: h1,
    sectionHeader: h2,
    tokenCount: countTokens(content),
    index
  };
}

function detectChunkType(content: string): Chunk['type'] {
  if (content.includes('```')) return 'code';
  if (content.startsWith('|') && content.includes('|---')) return 'table';
  if (/^[\s]*[-*]\s/m.test(content)) return 'list';
  if (content.includes('\n\n')) return 'section';
  return 'paragraph';
}

function countTokens(text: string): number {
  return encode(text).length;
}
```

---

## 🔍 Hybrid Search Implementation

### Search Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      HYBRID SEARCH                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  USER QUERY: "Apa penyebab tombstoning dan cara mengatasinya?"          │
│                                                                          │
│  STEP 1: SEMANTIC SEARCH (Vector)                                       │
│  ─────────────────────────────────                                      │
│  • Generate embedding for query                                         │
│  • Cosine similarity against knowledge_chunks.embedding                 │
│  • Return top 20 candidates                                             │
│                                                                          │
│  STEP 2: KEYWORD SEARCH (BM25)                                          │
│  ─────────────────────────────                                          │
│  • Extract keywords: [tombstoning, penyebab, cara, mengatasi]           │
│  • Full-text search with ts_rank                                        │
│  • Return top 20 candidates                                             │
│                                                                          │
│  STEP 3: FUSION & RERANK                                                │
│  ───────────────────────                                                │
│  • Reciprocal Rank Fusion (RRF)                                         │
│  • Score = Σ (1 / (k + rank_i)) for each search method                 │
│  • k = 60 (standard RRF constant)                                       │
│  • Return top 5-10 final chunks                                         │
│                                                                          │
│  STEP 4: CONTEXT ENRICHMENT                                             │
│  ──────────────────────────                                             │
│  • Fetch parent/sibling chunks for context                              │
│  • Include section headers                                              │
│  • Add source document metadata                                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Implementation

**File: `lib/knowledge/hybrid-search.ts`**

```typescript
import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/llm/embeddings';

interface SearchResult {
  chunkId: string;
  content: string;
  relevanceScore: number;
  documentTitle: string;
  parentHeader: string;
  sectionHeader: string;
  sourceType: string;
  domain: string;
}

interface SearchOptions {
  topK?: number;
  domainFilter?: string[];
  minScore?: number;
  includeContext?: boolean;
}

export async function hybridSearch(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const {
    topK = 10,
    domainFilter,
    minScore = 0.5,
    includeContext = true
  } = options;
  
  const supabase = createClient();
  
  // Step 1: Semantic search
  const queryEmbedding = await generateEmbedding(query);
  const semanticResults = await semanticSearch(supabase, queryEmbedding, 20, domainFilter);
  
  // Step 2: Keyword search
  const keywords = extractKeywords(query);
  const keywordResults = await keywordSearch(supabase, keywords, 20, domainFilter);
  
  // Step 3: Reciprocal Rank Fusion
  const fusedResults = reciprocalRankFusion(semanticResults, keywordResults);
  
  // Step 4: Filter by score and limit
  const filtered = fusedResults
    .filter(r => r.score >= minScore)
    .slice(0, topK);
  
  // Step 5: Enrich with context
  if (includeContext) {
    return enrichWithContext(supabase, filtered);
  }
  
  return filtered;
}

async function semanticSearch(
  supabase: any,
  embedding: number[],
  limit: number,
  domainFilter?: string[]
): Promise<{ id: string; score: number }[]> {
  
  let query = supabase.rpc('search_knowledge_semantic', {
    query_embedding: embedding,
    match_count: limit
  });
  
  if (domainFilter?.length) {
    query = query.in('domain', domainFilter);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return data.map((d: any) => ({
    id: d.id,
    score: d.similarity
  }));
}

async function keywordSearch(
  supabase: any,
  keywords: string[],
  limit: number,
  domainFilter?: string[]
): Promise<{ id: string; score: number }[]> {
  
  const searchQuery = keywords.join(' | '); // OR search
  
  let query = supabase.rpc('search_knowledge_fts', {
    search_query: searchQuery,
    match_count: limit
  });
  
  if (domainFilter?.length) {
    query = query.in('domain', domainFilter);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return data.map((d: any) => ({
    id: d.id,
    score: d.rank
  }));
}

function reciprocalRankFusion(
  semanticResults: { id: string; score: number }[],
  keywordResults: { id: string; score: number }[]
): { id: string; score: number }[] {
  const k = 60; // RRF constant
  const scores: Map<string, number> = new Map();
  
  // Score from semantic search
  semanticResults.forEach((r, rank) => {
    const rrfScore = 1 / (k + rank + 1);
    scores.set(r.id, (scores.get(r.id) || 0) + rrfScore);
  });
  
  // Score from keyword search
  keywordResults.forEach((r, rank) => {
    const rrfScore = 1 / (k + rank + 1);
    scores.set(r.id, (scores.get(r.id) || 0) + rrfScore);
  });
  
  // Sort by combined score
  return Array.from(scores.entries())
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);
}

function extractKeywords(query: string): string[] {
  // Remove stopwords and extract meaningful terms
  const stopwords = ['apa', 'dan', 'atau', 'yang', 'untuk', 'dengan', 'dari', 'ke', 'di'];
  
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(word => 
      word.length > 2 && 
      !stopwords.includes(word) &&
      !/^\d+$/.test(word)
    );
}

async function enrichWithContext(
  supabase: any,
  results: { id: string; score: number }[]
): Promise<SearchResult[]> {
  const ids = results.map(r => r.id);
  
  const { data, error } = await supabase
    .from('knowledge_chunks')
    .select(`
      id,
      content,
      parent_header,
      section_header,
      chunk_type,
      document:document_id (
        title,
        source_type,
        domain
      )
    `)
    .in('id', ids);
  
  if (error) throw error;
  
  // Map scores back to results
  const scoreMap = new Map(results.map(r => [r.id, r.score]));
  
  return data.map((d: any) => ({
    chunkId: d.id,
    content: d.content,
    relevanceScore: scoreMap.get(d.id) || 0,
    documentTitle: d.document.title,
    parentHeader: d.parent_header,
    sectionHeader: d.section_header,
    sourceType: d.document.source_type,
    domain: d.document.domain
  }));
}
```

### Supabase SQL Functions

```sql
-- Semantic search function
CREATE OR REPLACE FUNCTION search_knowledge_semantic(
  query_embedding vector(1536),
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kc.id,
    kc.content,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  JOIN knowledge_documents kd ON kc.document_id = kd.id
  WHERE kd.is_active = true
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Full-text search function
CREATE OR REPLACE FUNCTION search_knowledge_fts(
  search_query text,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  content text,
  rank float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    kc.id,
    kc.content,
    ts_rank(to_tsvector('english', kc.content), plainto_tsquery('english', search_query)) AS rank
  FROM knowledge_chunks kc
  JOIN knowledge_documents kd ON kc.document_id = kd.id
  WHERE 
    kd.is_active = true
    AND to_tsvector('english', kc.content) @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC
  LIMIT match_count;
END;
$$;
```

---

## 📎 Citation System

### Citation Format

```typescript
interface Citation {
  id: string;
  chunkId: string;
  documentTitle: string;
  sectionHeader: string;
  excerpt: string; // First 100 chars
  relevanceScore: number;
}

// In AI response, citations appear as:
// "Tombstoning terjadi karena ketidakseimbangan gaya surface tension [1]..."
// 
// [1] SMT Process Fundamentals > Reflow Soldering > Common Defects
```

### Implementation in AI Response

**File: `lib/knowledge/citation-builder.ts`**

```typescript
export function buildCitedResponse(
  llmResponse: string,
  usedChunks: SearchResult[]
): { response: string; citations: Citation[] } {
  
  // Build citation list
  const citations: Citation[] = usedChunks.map((chunk, idx) => ({
    id: `[${idx + 1}]`,
    chunkId: chunk.chunkId,
    documentTitle: chunk.documentTitle,
    sectionHeader: chunk.sectionHeader || chunk.parentHeader,
    excerpt: chunk.content.slice(0, 100) + '...',
    relevanceScore: chunk.relevanceScore
  }));
  
  // Format citations footer
  const citationFooter = citations.map(c => 
    `${c.id} ${c.documentTitle} > ${c.sectionHeader}`
  ).join('\n');
  
  return {
    response: llmResponse + '\n\n---\n**Sumber:**\n' + citationFooter,
    citations
  };
}
```

---

## 🔄 Document Processing Pipeline

### Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  DOCUMENT PROCESSING PIPELINE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  INPUT: Markdown file from Gemini Deep Research                         │
│                                                                          │
│  STEP 1: VALIDATE & PARSE                                               │
│  ─────────────────────────                                              │
│  • Check markdown format                                                │
│  • Extract metadata (title, domain, tags)                               │
│  • Calculate word count                                                 │
│                                                                          │
│  STEP 2: INSERT DOCUMENT                                                │
│  ───────────────────────                                                │
│  • Create record in knowledge_documents                                 │
│  • Get document_id                                                      │
│                                                                          │
│  STEP 3: CHUNK CONTENT                                                  │
│  ────────────────────                                                   │
│  • Apply semantic chunking algorithm                                    │
│  • Respect boundaries (tables, code, lists)                             │
│  • Add overlap for context                                              │
│                                                                          │
│  STEP 4: GENERATE EMBEDDINGS                                            │
│  ──────────────────────────                                             │
│  • Batch process chunks (max 20 per API call)                           │
│  • Use text-embedding-3-small                                           │
│  • Handle rate limits                                                   │
│                                                                          │
│  STEP 5: EXTRACT KEYWORDS                                               │
│  ────────────────────────                                               │
│  • TF-IDF or RAKE algorithm                                             │
│  • Technical term extraction                                            │
│  • Store in keywords array                                              │
│                                                                          │
│  STEP 6: INSERT CHUNKS                                                  │
│  ────────────────────                                                   │
│  • Batch insert to knowledge_chunks                                     │
│  • Include embeddings and keywords                                      │
│                                                                          │
│  OUTPUT: Document ready for RAG search                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Admin UI for Document Management

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📚 Knowledge Base Management                                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [+ Upload Document]  [🔄 Reprocess All]  [📊 Analytics]                 │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Search documents...                                      🔍     │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Domain Filter: [All ▼] [SMT] [Testing] [Quality] [Cost] [Trends]       │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Title                    │ Domain   │ Chunks │ Status  │ Action│    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │ SMT Process Fundamentals │ smt      │ 45     │ ✅ Active│ [···]│    │
│  │ Testing & Inspection     │ testing  │ 62     │ ✅ Active│ [···]│    │
│  │ IPC Standards & Quality  │ quality  │ 38     │ ✅ Active│ [···]│    │
│  │ Troubleshooting Guide    │ trouble  │ 71     │ ✅ Active│ [···]│    │
│  │ Cost Engineering         │ cost     │ 48     │ ⏳ Process│[···]│    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Total: 6 documents │ 264 chunks │ Last updated: 2 hours ago            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Implementation Tasks

### Task 1: Database Schema
- [ ] Create `knowledge_documents` table
- [ ] Create `knowledge_chunks` table with vector column
- [ ] Create `knowledge_citations` table
- [ ] Create SQL functions for search
- [ ] Create indexes (vector HNSW, FTS GIN)

### Task 2: Chunker Module
- [ ] Implement `lib/knowledge/chunker.ts`
- [ ] Semantic boundary detection
- [ ] Table/code/list handling
- [ ] Overlap management
- [ ] Unit tests

### Task 3: Embedding Pipeline
- [ ] Setup OpenAI/Gemini embedding API
- [ ] Batch processing with rate limiting
- [ ] Embedding storage in Supabase
- [ ] Error handling & retry logic

### Task 4: Hybrid Search
- [ ] Implement `lib/knowledge/hybrid-search.ts`
- [ ] Semantic search function
- [ ] Keyword search with BM25
- [ ] Reciprocal Rank Fusion
- [ ] Context enrichment

### Task 5: Citation System
- [ ] Citation builder module
- [ ] Integration with AI response
- [ ] Citation tracking in database
- [ ] Analytics queries

### Task 6: Document Processing Pipeline
- [ ] Upload API endpoint
- [ ] Processing queue (or sync for MVP)
- [ ] Status tracking
- [ ] Error handling

### Task 7: Admin UI
- [ ] Document list page
- [ ] Upload form
- [ ] Chunk preview
- [ ] Search testing interface

### Task 8: AI Assistant Integration
- [ ] Update AI Assistant to use RAG
- [ ] Context injection into prompts
- [ ] Citation display in chat
- [ ] Domain-specific routing

---

## 📁 File Structure

```
lib/knowledge/
├── types.ts              # TypeScript interfaces
├── chunker.ts            # Semantic chunking
├── embeddings.ts         # Embedding generation
├── hybrid-search.ts      # Hybrid search engine
├── citation-builder.ts   # Citation formatting
├── pipeline.ts           # Document processing
└── index.ts              # Exports

app/api/knowledge/
├── upload/route.ts       # Document upload
├── search/route.ts       # Search endpoint
├── documents/route.ts    # CRUD operations
└── [id]/route.ts         # Single document ops

app/(dashboard)/admin/
└── knowledge/
    ├── page.tsx          # Document list
    ├── upload/page.tsx   # Upload form
    └── [id]/page.tsx     # Document detail
```

---

## ✅ Acceptance Criteria

### Chunking
- [ ] Respects semantic boundaries
- [ ] Tables kept as single chunk
- [ ] Code blocks kept as single chunk
- [ ] Overlap provides context
- [ ] Token count accurate

### Search
- [ ] Semantic search returns relevant chunks
- [ ] Keyword search handles technical terms
- [ ] Hybrid fusion improves results
- [ ] Sub-500ms response time
- [ ] Domain filtering works

### Citations
- [ ] Sources clearly displayed
- [ ] Links to original section
- [ ] Relevance score visible
- [ ] Citations tracked in DB

### AI Integration
- [ ] AI Assistant uses knowledge base
- [ ] Responses include citations
- [ ] Domain-specific answers
- [ ] Handles "I don't know" gracefully

---

## 🔗 Dependencies

- **Phase 6C**: AI Assistant integration point
- **Gemini Deep Research Output**: Source documents
- **OpenAI API**: text-embedding-3-small (or Gemini embedding)
- **Supabase pgvector**: Vector storage

---

## 📊 Performance Targets

| Metric | Target |
|--------|--------|
| Chunk size | 400-800 tokens |
| Search latency | < 500ms |
| Embedding batch | 20 chunks/request |
| Vector dimensions | 1536 |
| Top-K retrieval | 5-10 chunks |
| Min relevance score | 0.5 |
