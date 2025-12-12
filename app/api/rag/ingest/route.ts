/**
 * RAG Ingest API
 * Import markdown documents into knowledge base
 */

import { NextRequest, NextResponse } from 'next/server';
import { chunkDocument } from '@/lib/rag/chunking';
import { generateEmbedding } from '@/lib/rag/embeddings';
import { insertChunks, clearChunksBySource, getKnowledgeStats } from '@/lib/rag/search';
import { KnowledgeChunk } from '@/lib/rag/types';

interface IngestRequest {
  content: string;
  filename: string;
  replace?: boolean; // If true, delete existing chunks from this source first
}

interface IngestResponse {
  success: boolean;
  filename?: string;
  chunksCreated?: number;
  totalTokens?: number;
  error?: string;
  stats?: {
    totalChunks: number;
    bySource: Record<string, number>;
  };
}

/**
 * POST - Ingest a markdown document
 */
export async function POST(request: NextRequest) {
  try {
    const body: IngestRequest = await request.json();
    const { content, filename, replace = true } = body;

    if (!content || !filename) {
      return NextResponse.json<IngestResponse>(
        { success: false, error: 'Content and filename required' },
        { status: 400 }
      );
    }

    console.log(`📥 Ingesting document: ${filename}`);
    console.log(`📄 Content length: ${content.length} chars`);

    // Clear existing chunks if replace mode
    if (replace) {
      console.log(`🗑️ Clearing existing chunks for: ${filename}`);
      await clearChunksBySource(filename);
    }

    // Chunk the document
    console.log('✂️ Chunking document...');
    const chunks = chunkDocument(content, filename, {
      maxTokens: 500,
      overlapTokens: 100,
      preserveHeaders: true,
    });

    console.log(`📦 Created ${chunks.length} chunks`);

    // Generate embeddings for each chunk
    console.log('🧠 Generating embeddings...');
    const chunksWithEmbeddings: KnowledgeChunk[] = [];
    let totalTokens = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        const { embedding, tokenCount } = await generateEmbedding(chunk.content);
        
        chunksWithEmbeddings.push({
          ...chunk,
          embedding,
          token_count: tokenCount,
        });
        
        totalTokens += tokenCount;
        
        // Progress log every 5 chunks
        if ((i + 1) % 5 === 0 || i === chunks.length - 1) {
          console.log(`  Progress: ${i + 1}/${chunks.length} chunks embedded`);
        }
      } catch (embeddingError) {
        console.error(`Failed to embed chunk ${i}:`, embeddingError);
        // Continue with other chunks
      }
    }

    // Insert into database
    console.log('💾 Inserting into database...');
    const insertedCount = await insertChunks(chunksWithEmbeddings);

    console.log(`✅ Successfully ingested ${insertedCount} chunks`);

    // Get updated stats
    const stats = await getKnowledgeStats();

    return NextResponse.json<IngestResponse>({
      success: true,
      filename,
      chunksCreated: insertedCount,
      totalTokens,
      stats: {
        totalChunks: stats.totalChunks,
        bySource: stats.bySource,
      },
    });

  } catch (error) {
    console.error('Ingest error:', error);
    return NextResponse.json<IngestResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Ingest failed',
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Get knowledge base stats
 */
export async function GET() {
  try {
    const stats = await getKnowledgeStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get stats',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Clear knowledge base (optional source filter)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');

    if (source) {
      await clearChunksBySource(source);
      return NextResponse.json({
        success: true,
        message: `Cleared chunks from source: ${source}`,
      });
    }

    // Clear all (dangerous, require confirmation)
    const confirm = searchParams.get('confirm');
    if (confirm !== 'yes') {
      return NextResponse.json(
        { success: false, error: 'Add ?confirm=yes to clear all' },
        { status: 400 }
      );
    }

    // Import clearAllChunks
    const { clearAllChunks } = await import('@/lib/rag/search');
    await clearAllChunks();

    return NextResponse.json({
      success: true,
      message: 'Cleared all chunks',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      },
      { status: 500 }
    );
  }
}
