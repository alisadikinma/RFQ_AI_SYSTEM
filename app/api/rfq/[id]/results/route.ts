import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: results, error } = await supabase
      .from('rfq_results')
      .select(`
        *,
        matched_model:models(
          id,
          code,
          name,
          customer:customers(code, name)
        )
      `)
      .eq('rfq_id', params.id)
      .order('similarity_score', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
