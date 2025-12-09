/**
 * Model Details API
 * Get detailed information about a specific model
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error('Supabase not configured');
  }
  
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const { modelId } = await request.json();
    
    if (!modelId) {
      return NextResponse.json(
        { success: false, error: 'modelId is required' },
        { status: 400 }
      );
    }
    
    const supabase = getSupabase();
    
    // Check if modelId is UUID or code
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(modelId);
    
    let query = supabase
      .from('models')
      .select(`
        id,
        code,
        name,
        board_types,
        customer:customers(id, code, name),
        model_stations(
          id,
          station_code,
          board_type,
          sequence,
          manpower,
          cycle_time,
          station:station_master(
            code,
            name,
            category,
            description
          )
        )
      `);
    
    if (isUUID) {
      query = query.eq('id', modelId);
    } else {
      query = query.ilike('code', `%${modelId}%`);
    }
    
    const { data: model, error } = await query.limit(1).single();
    
    if (error || !model) {
      return NextResponse.json(
        { success: false, error: `Model "${modelId}" not found` },
        { status: 404 }
      );
    }
    
    // Group stations by board type
    const stationsByBoard: Record<string, any[]> = {};
    let totalManpower = 0;
    let totalCycleTime = 0;
    
    for (const ms of (model.model_stations as any[]) || []) {
      const boardType = ms.board_type || 'Main';
      if (!stationsByBoard[boardType]) {
        stationsByBoard[boardType] = [];
      }
      
      stationsByBoard[boardType].push({
        code: ms.station_code,
        name: (ms.station as any)?.name || ms.station_code,
        category: (ms.station as any)?.category || 'Other',
        sequence: ms.sequence || 0,
        manpower: ms.manpower || 0,
        cycle_time: ms.cycle_time || 0,
      });
      
      totalManpower += ms.manpower || 0;
      totalCycleTime += ms.cycle_time || 0;
    }
    
    // Sort by sequence
    for (const board in stationsByBoard) {
      stationsByBoard[board].sort((a, b) => a.sequence - b.sequence);
    }
    
    return NextResponse.json({
      success: true,
      model: {
        id: model.id,
        code: model.code,
        name: model.name,
        customer: (model.customer as any)?.name,
        customer_code: (model.customer as any)?.code,
        board_types: model.board_types || Object.keys(stationsByBoard),
      },
      summary: {
        total_stations: (model.model_stations as any[])?.length || 0,
        total_manpower: totalManpower,
        total_cycle_time: totalCycleTime,
        board_count: Object.keys(stationsByBoard).length,
      },
      stations_by_board: stationsByBoard,
    });
  } catch (error) {
    console.error('Model details error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get model details' },
      { status: 500 }
    );
  }
}
