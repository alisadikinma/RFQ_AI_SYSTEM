import { NextRequest, NextResponse } from 'next/server';
import { findSimilarModels, analyzeRFQ } from '@/lib/similarity';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      pcb_features,
      bom_summary,
      stations,
      customer_id,
      full_analysis = false,
      top_n = 5,
    } = body;

    if (!pcb_features) {
      return NextResponse.json(
        { error: 'pcb_features is required' },
        { status: 400 }
      );
    }

    if (full_analysis) {
      // Full RFQ analysis with inference
      const result = await analyzeRFQ(
        pcb_features,
        bom_summary || {},
        stations || [],
        customer_id
      );

      return NextResponse.json({
        success: true,
        data: result,
      });
    } else {
      // Simple similarity search
      const results = await findSimilarModels(
        pcb_features,
        bom_summary || {},
        stations || [],
        customer_id,
        top_n
      );

      return NextResponse.json({
        success: true,
        data: results,
      });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
