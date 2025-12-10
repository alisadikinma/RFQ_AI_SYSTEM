/**
 * POST /api/model-groups/similar
 * Find similar model groups based on station list
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

interface BoardVariant {
  id: string;
  code: string;
  boardType: string;
  emmcSize?: string;
  ramSize?: string;
  investment: number;
  stationCount: number;
  manpower: number;
  uph?: number;
}

export async function POST(request: NextRequest) {
  try {
    const { stations, limit = 5 } = await request.json();
    const supabase = getSupabase();

    // Get model groups from the view
    const { data: groups, error } = await supabase
      .from("v_model_groups_summary")
      .select("*")
      .limit(limit * 2); // Get more to filter

    if (error) {
      console.error("Error fetching model groups:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!groups || groups.length === 0) {
      return NextResponse.json({
        success: true,
        models: [],
        message: "No model groups found",
      });
    }

    // Calculate similarity for each group
    const queryStationCodes = new Set<string>(
      (stations || []).map((s: any) =>
        (typeof s === 'string' ? s : s.code).toUpperCase()
      )
    );

    const scoredGroups = groups.map((g: any) => {
      // Get all stations from all boards in this group
      const modelStations = new Set<string>();
      const boards: BoardVariant[] = (g.boards || []).map((b: any) => {
        // Add stations from this board
        (b.stations || []).forEach((code: string) => {
          modelStations.add(code.toUpperCase());
        });

        return {
          id: b.id,
          code: b.code,
          boardType: b.board_type || "Main Board",
          emmcSize: b.emmc_size,
          ramSize: b.ram_size,
          investment: b.investment || 0,
          stationCount: b.station_count || 0,
          manpower: b.manpower || 0,
          uph: b.uph,
        };
      });

      // Calculate Jaccard similarity
      const queryArray = Array.from(queryStationCodes);
      const modelArray = Array.from(modelStations);
      const intersection = new Set(
        queryArray.filter(x => modelStations.has(x))
      );
      const union = new Set([...queryArray, ...modelArray]);
      const similarity = union.size > 0 ? intersection.size / union.size : 0;

      // Calculate matched/missing/extra
      const matchedStations = Array.from(intersection);
      const missingStations = queryArray.filter(
        x => !modelStations.has(x)
      );
      const extraStations = modelArray.filter(
        x => !queryStationCodes.has(x)
      );

      return {
        id: g.id,
        typeModel: g.type_model,
        customerName: g.customer_name,
        customerCode: g.customer_code,
        similarity,
        totalBoards: g.total_boards || boards.length,
        totalStations: g.total_stations || modelStations.size,
        matchedStations: matchedStations.length,
        totalManpower: g.total_manpower || 0,
        totalInvestment: g.total_investment || 0,
        boards,
        // Legacy compatibility
        code: g.type_model,
        stationCount: g.total_stations || modelStations.size,
        manpower: g.total_manpower || 0,
        uph: boards[0]?.uph || 60,
        // Station arrays
        matchedStationCodes: matchedStations,
        missingStations,
        extraStations,
        allStations: modelArray,
      };
    });

    // Sort by similarity and limit
    scoredGroups.sort((a, b) => b.similarity - a.similarity);
    const topGroups = scoredGroups.slice(0, limit);

    return NextResponse.json({
      success: true,
      models: topGroups,
      total: groups.length,
    });
  } catch (error) {
    console.error("Similar model groups API error:", error);
    return NextResponse.json(
      { error: "Failed to find similar model groups" },
      { status: 500 }
    );
  }
}
