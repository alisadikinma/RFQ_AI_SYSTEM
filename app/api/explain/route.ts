import { NextRequest, NextResponse } from 'next/server';
import { explainRFQResult, generateSuggestions, isLLMAvailable } from '@/lib/llm';

export async function POST(request: NextRequest) {
  try {
    if (!isLLMAvailable()) {
      return NextResponse.json(
        { error: 'LLM not configured. Set OPENROUTER_API_KEY environment variable.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { type, params } = body;

    if (!type || !params) {
      return NextResponse.json(
        { error: 'type and params are required' },
        { status: 400 }
      );
    }

    if (type === 'explain') {
      const explanation = await explainRFQResult(params);
      return NextResponse.json({ data: explanation });
    }

    if (type === 'suggest') {
      const suggestions = await generateSuggestions(params);
      return NextResponse.json({ data: suggestions });
    }

    return NextResponse.json({ error: 'Invalid type. Use "explain" or "suggest"' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    available: isLLMAvailable(),
    endpoints: {
      explain: {
        description: 'Generate RFQ explanation in Bahasa Indonesia',
        params: {
          modelName: 'string',
          customerName: 'string',
          topMatch: 'string',
          score: 'number (0-1)',
          confidence: 'string (high/medium/low)',
          matched: 'string[]',
          missing: 'string[]',
          inferred: 'string[]',
          riskScore: 'number (0-5)',
          riskFlags: 'string[]',
          investment: 'number (USD)',
        },
      },
      suggest: {
        description: 'Generate optimization suggestions',
        params: {
          productType: 'string',
          volume: 'number',
          targetUPH: 'number',
          stations: 'string[]',
          issues: 'string[]',
          costs: '{ labor: number, test: number, fixture: number }',
        },
      },
    },
  });
}
