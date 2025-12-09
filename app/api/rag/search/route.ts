/**
 * RAG Search API
 * POST /api/rag/search
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchKnowledge, getRAGContext, getKnowledgeStats } from '@/lib/rag/search';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, options = {} } = body;
    
    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Query is required' },
        { status: 400 }
      );
    }
    
    const results = await searchKnowledge(query, {
      maxResults: options.maxResults || 5,
      minSimilarity: options.minSimilarity || 0.5,
      filterSource: options.filterSource,
      hybridSearch: options.hybridSearch || false,
    });
    
    return NextResponse.json({
      success: true,
      results,
      count: results.length,
    });
  } catch (error) {
    console.error('RAG search error:', error);
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const stats = await getKnowledgeStats();
    
    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('RAG stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}
