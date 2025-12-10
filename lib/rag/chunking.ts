/**
 * Chunking Utility
 * Split markdown documents into semantic chunks for RAG
 */

import { KnowledgeChunk, ChunkingOptions } from './types';

// Simple token estimation (roughly 4 chars per token for English)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Split text by markdown headers
function splitByHeaders(content: string): Array<{ title: string | null; content: string }> {
  const sections: Array<{ title: string | null; content: string }> = [];
  
  // Match ## and ### headers
  const headerRegex = /^(#{2,3})\s+(.+)$/gm;
  const matches = Array.from(content.matchAll(headerRegex));
  
  if (matches.length === 0) {
    // No headers, return whole content
    return [{ title: null, content: content.trim() }];
  }
  
  let lastIndex = 0;
  let lastTitle: string | null = null;
  
  // Check for content before first header
  const firstMatch = matches[0];
  if (firstMatch.index && firstMatch.index > 0) {
    const preContent = content.slice(0, firstMatch.index).trim();
    if (preContent.length > 50) {
      sections.push({ title: null, content: preContent });
    }
  }
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const nextMatch = matches[i + 1];
    
    const title = match[2].trim();
    const startIndex = match.index! + match[0].length;
    const endIndex = nextMatch ? nextMatch.index! : content.length;
    
    const sectionContent = content.slice(startIndex, endIndex).trim();
    
    if (sectionContent.length > 20) {
      sections.push({ title, content: sectionContent });
    }
  }
  
  return sections;
}

// Split large section into smaller chunks
function splitIntoChunks(
  text: string, 
  maxTokens: number, 
  overlapTokens: number
): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  
  let currentChunk = '';
  let currentTokens = 0;
  
  for (const para of paragraphs) {
    const paraTokens = estimateTokens(para);
    
    // If single paragraph exceeds max, split by sentences
    if (paraTokens > maxTokens) {
      // Save current chunk first
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
        currentTokens = 0;
      }
      
      // Split by sentences
      const sentences = para.split(/(?<=[.!?])\s+/);
      for (const sentence of sentences) {
        const sentenceTokens = estimateTokens(sentence);
        
        if (currentTokens + sentenceTokens > maxTokens && currentChunk.trim()) {
          chunks.push(currentChunk.trim());
          // Keep overlap
          const words = currentChunk.split(/\s+/);
          const overlapWords = Math.floor(overlapTokens * 0.75); // ~75% of tokens are words
          currentChunk = words.slice(-overlapWords).join(' ') + ' ' + sentence;
          currentTokens = estimateTokens(currentChunk);
        } else {
          currentChunk += ' ' + sentence;
          currentTokens += sentenceTokens;
        }
      }
    } else if (currentTokens + paraTokens > maxTokens) {
      // Save current chunk and start new one with overlap
      chunks.push(currentChunk.trim());
      
      // Create overlap from end of current chunk
      const words = currentChunk.split(/\s+/);
      const overlapWords = Math.floor(overlapTokens * 0.75);
      const overlap = words.slice(-overlapWords).join(' ');
      
      currentChunk = overlap + '\n\n' + para;
      currentTokens = estimateTokens(currentChunk);
    } else {
      currentChunk += '\n\n' + para;
      currentTokens += paraTokens;
    }
  }
  
  // Don't forget last chunk
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

/**
 * Chunk a markdown document into semantic pieces
 */
export function chunkDocument(
  content: string,
  sourceFile: string,
  options: ChunkingOptions = {}
): KnowledgeChunk[] {
  const {
    maxTokens = 500,
    overlapTokens = 100,
    preserveHeaders = true,
  } = options;
  
  const chunks: KnowledgeChunk[] = [];
  
  // First split by headers
  const sections = splitByHeaders(content);
  
  let globalChunkIndex = 0;
  
  for (const section of sections) {
    const sectionTokens = estimateTokens(section.content);
    
    if (sectionTokens <= maxTokens) {
      // Section fits in one chunk
      const chunkContent = preserveHeaders && section.title
        ? `## ${section.title}\n\n${section.content}`
        : section.content;
      
      chunks.push({
        content: chunkContent,
        source_file: sourceFile,
        section_title: section.title,
        chunk_index: globalChunkIndex++,
        token_count: estimateTokens(chunkContent),
      });
    } else {
      // Need to split section into multiple chunks
      const subChunks = splitIntoChunks(section.content, maxTokens, overlapTokens);
      
      for (let i = 0; i < subChunks.length; i++) {
        const subChunk = subChunks[i];
        const chunkContent = preserveHeaders && section.title && i === 0
          ? `## ${section.title}\n\n${subChunk}`
          : subChunk;
        
        chunks.push({
          content: chunkContent,
          source_file: sourceFile,
          section_title: section.title,
          chunk_index: globalChunkIndex++,
          token_count: estimateTokens(chunkContent),
        });
      }
    }
  }
  
  return chunks;
}

/**
 * Process multiple files
 */
export function chunkMultipleDocuments(
  documents: Array<{ content: string; filename: string }>,
  options: ChunkingOptions = {}
): KnowledgeChunk[] {
  const allChunks: KnowledgeChunk[] = [];
  
  for (const doc of documents) {
    const chunks = chunkDocument(doc.content, doc.filename, options);
    allChunks.push(...chunks);
  }
  
  return allChunks;
}
