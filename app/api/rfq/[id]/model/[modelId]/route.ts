/**
 * Model Detail & Comparison API
 * GET /api/rfq/[id]/model/[modelId]
 *
 * Get detailed model information with comparison against requested stations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getComparisonResult } from '@/lib/rfq/similarity-engine';
import type { ModelComparisonResponse } from '@/lib/rfq/types';

interface RouteParams {
  params: Promise<{
    id: string;
    modelId: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: rfqId, modelId } = await params;

    // Get requested station codes from query params
    const searchParams = request.nextUrl.searchParams;
    const codesParam = searchParams.get('codes');

    if (!codesParam) {
      return NextResponse.json<ModelComparisonResponse>(
        {
          success: false,
          model: null as any,
          comparison: null as any,
          error: 'codes query parameter is required'
        },
        { status: 400 }
      );
    }

    // Parse and normalize station codes
    const requestedCodes = codesParam
      .split(',')
      .map(code => code.toUpperCase().trim())
      .filter(Boolean);

    if (requestedCodes.length === 0) {
      return NextResponse.json<ModelComparisonResponse>(
        {
          success: false,
          model: null as any,
          comparison: null as any,
          error: 'codes parameter cannot be empty'
        },
        { status: 400 }
      );
    }

    // Get full comparison result
    const { model, comparison, costEstimate } = await getComparisonResult(
      modelId,
      requestedCodes
    );

    return NextResponse.json<ModelComparisonResponse>({
      success: true,
      model,
      comparison,
      costEstimate,
    });

  } catch (error) {
    console.error('Get model detail error:', error);
    return NextResponse.json<ModelComparisonResponse>(
      {
        success: false,
        model: null as any,
        comparison: null as any,
        error: error instanceof Error ? error.message : 'Failed to get model details'
      },
      { status: 500 }
    );
  }
}
