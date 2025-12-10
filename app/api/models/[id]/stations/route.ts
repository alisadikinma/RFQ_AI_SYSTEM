/**
 * GET /api/models/[id]/stations
 * Get stations for a specific model (board)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase not configured");
  }

  return createClient(url, key);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabase();

    // Query model_stations with station_master join
    const { data: stations, error } = await supabase
      .from("model_stations")
      .select(`
        id,
        station_code,
        sequence,
        manpower,
        board_type,
        area,
        cycle_time,
        station_master:machine_id (
          code,
          name,
          typical_cycle_time_sec
        )
      `)
      .eq("model_id", id)
      .order("sequence");

    if (error) {
      console.error("Error fetching stations:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Transform data
    const transformedStations = (stations || []).map((s: any) => ({
      id: s.id,
      stationCode: s.station_code,
      stationName: s.station_master?.name || s.station_code,
      sequence: s.sequence || 0,
      manpower: s.manpower || 1,
      cycleTime: s.cycle_time || s.station_master?.typical_cycle_time_sec,
      area: s.area,
      boardType: s.board_type,
    }));

    return NextResponse.json({
      success: true,
      stations: transformedStations,
      total: transformedStations.length,
    });
  } catch (error) {
    console.error("Stations API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stations" },
      { status: 500 }
    );
  }
}
