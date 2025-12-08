import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('rfq_requests')
      .select(`
        *,
        customer:customers(code, name),
        reference_model:models(code, name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { data: rfq, error: rfqError } = await supabase
      .from('rfq_requests')
      .insert({
        customer_id: body.customer_id,
        model_name: body.model_name,
        reference_model_id: body.reference_model_id || null,
        target_uph: body.target_uph,
        target_volume: body.target_volume,
        status: 'draft',
        input_method: body.input_method,
        pcb_features: body.pcb_features,
        bom_summary: body.bom_summary,
      })
      .select()
      .single();

    if (rfqError) throw rfqError;

    // Save stations if provided
    if (body.stations && body.stations.length > 0) {
      const stationsData = body.stations.map((s: { board_type?: string; station_code: string; sequence?: number; manpower?: number }, idx: number) => ({
        rfq_id: rfq.id,
        board_type: s.board_type || 'Main Board',
        station_code: s.station_code,
        sequence: s.sequence || idx + 1,
        manpower: s.manpower || 1,
      }));

      const { error: stationsError } = await supabase
        .from('rfq_stations')
        .insert(stationsData);

      if (stationsError) throw stationsError;
    }

    return NextResponse.json({ data: rfq });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
