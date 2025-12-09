/**
 * Similarity Search API
 * POST /api/rfq/similarity
 *
 * Find similar historical models based on station codes using Jaccard similarity
 */

import { NextRequest, NextResponse } from 'next/server';
import { findSimilarModels } from '@/lib/rfq/similarity-engine';
import type { SimilaritySearchResponse } from '@/lib/rfq/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      stationCodes,
      limit = 3,
      minSimilarity = 70,
      customerId
    } = body;

    // Validate input
    if (!stationCodes || !Array.isArray(stationCodes)) {
      return NextResponse.json<SimilaritySearchResponse>(
        {
          success: false,
          query: { stationCodes: [], count: 0 },
          results: [],
          hasMatches: false,
          error: 'stationCodes array is required'
        },
        { status: 400 }
      );
    }

    if (stationCodes.length === 0) {
      return NextResponse.json<SimilaritySearchResponse>(
        {
          success: false,
          query: { stationCodes: [], count: 0 },
          results: [],
          hasMatches: false,
          error: 'stationCodes array cannot be empty'
        },
        { status: 400 }
      );
    }

    // Normalize station codes (uppercase, unique)
    const normalizedCodes = Array.from(new Set(
      stationCodes.map((code: string) => code.toUpperCase().trim()).filter(Boolean)
    ));

    // Find similar models
    const { results, closestMatch } = await findSimilarModels(
      normalizedCodes,
      limit,
      minSimilarity,
      customerId
    );

    const response: SimilaritySearchResponse = {
      success: true,
      query: {
        stationCodes: normalizedCodes,
        count: normalizedCodes.length,
      },
      results,
      hasMatches: results.length > 0,
    };

    // Include closest match info if no results above threshold
    if (!response.hasMatches && closestMatch) {
      response.closestMatch = closestMatch;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Similarity search error:', error);
    return NextResponse.json<SimilaritySearchResponse>(
      {
        success: false,
        query: { stationCodes: [], count: 0 },
        results: [],
        hasMatches: false,
        error: error instanceof Error ? error.message : 'Similarity search failed'
      },
      { status: 500 }
    );
  }
}
