/**
 * Embeddings Utility
 * Generate embeddings using Gemini text-embedding-004
 */

import { EmbeddingResult } from './types';

const EMBEDDING_MODEL = 'text-embedding-004';
const EMBEDDING_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent`;

// Rate limiting
const RATE_LIMIT_DELAY = 100; // ms between requests
let lastRequestTime = 0;

// Get API key lazily
function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error('GEMINI_API_KEY not configured');
  }
  return key;
}

async function rateLimitedDelay(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
}

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  const apiKey = getApiKey();
  
  await rateLimitedDelay();
  
  const response = await fetch(`${EMBEDDING_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: `models/${EMBEDDING_MODEL}`,
      content: {
        parts: [{ text }]
      },
      taskType: 'RETRIEVAL_DOCUMENT',
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  
  if (!data.embedding?.values) {
    throw new Error('No embedding in response');
  }
  
  return {
    embedding: data.embedding.values,
    tokenCount: Math.ceil(text.length / 4), // Estimate
  };
}

/**
 * Generate embedding for a query (uses different task type)
 */
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  const apiKey = getApiKey();
  
  await rateLimitedDelay();
  
  const response = await fetch(`${EMBEDDING_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: `models/${EMBEDDING_MODEL}`,
      content: {
        parts: [{ text: query }]
      },
      taskType: 'RETRIEVAL_QUERY',
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }
  
  const data = await response.json();
  
  if (!data.embedding?.values) {
    throw new Error('No embedding in response');
  }
  
  return data.embedding.values;
}

/**
 * Generate embeddings for multiple texts (batch)
 */
export async function generateEmbeddings(
  texts: string[],
  onProgress?: (current: number, total: number) => void
): Promise<EmbeddingResult[]> {
  const results: EmbeddingResult[] = [];
  
  for (let i = 0; i < texts.length; i++) {
    const result = await generateEmbedding(texts[i]);
    results.push(result);
    
    if (onProgress) {
      onProgress(i + 1, texts.length);
    }
  }
  
  return results;
}

/**
 * Check if Gemini embedding API is available
 */
export function isEmbeddingAvailable(): boolean {
  return !!process.env.GEMINI_API_KEY;
}
