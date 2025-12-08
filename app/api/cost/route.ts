import { NextRequest, NextResponse } from 'next/server';
import {
  calculateCostBreakdown,
  assessRisks,
  calculateTotalFixtureInvestment,
  calculateTotalManpower,
  calculateLineCapacity,
  suggestStationQuantities,
  type StationCostInput,
} from '@/lib/cost';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      stations,
      target_uph = 200,
      target_volume = 10000,
      shift_count = 1,
      pcb_features,
      calculation_type = 'full', // full, fixture, manpower, capacity, suggest
    } = body;

    if (!stations || !Array.isArray(stations) || stations.length === 0) {
      return NextResponse.json(
        { error: 'stations array is required' },
        { status: 400 }
      );
    }

    const stationInputs: StationCostInput[] = stations.map((s: {
      station_code: string;
      quantity?: number;
      manpower?: number;
    }) => ({
      station_code: s.station_code,
      quantity: s.quantity || 1,
      manpower: s.manpower || 1,
    }));

    let result: Record<string, unknown> = {};

    switch (calculation_type) {
      case 'fixture':
        const fixtureResult = calculateTotalFixtureInvestment(
          stationInputs,
          target_volume * 12
        );
        result = {
          estimates: fixtureResult.estimates,
          total_cost: fixtureResult.totalCost,
          amortized_per_unit: fixtureResult.amortizedPerUnit,
        };
        break;

      case 'manpower':
        const manpowerResult = await calculateTotalManpower(
          stationInputs,
          shift_count
        );
        result = manpowerResult;
        break;

      case 'capacity':
        const capacityResult = await calculateLineCapacity(
          stationInputs,
          target_uph
        );
        result = capacityResult;
        break;

      case 'suggest':
        const stationCodes = stationInputs.map(s => s.station_code);
        const suggestions = suggestStationQuantities(stationCodes, target_uph);
        result = {
          suggestions: Object.fromEntries(suggestions),
          target_uph,
        };
        break;

      case 'full':
      default:
        const costBreakdown = await calculateCostBreakdown(
          stationInputs,
          target_uph,
          target_volume
        );

        let riskAssessment = null;
        if (pcb_features) {
          riskAssessment = assessRisks(
            stationInputs,
            {
              lineUtilization: costBreakdown.line_utilization_percent,
              bottleneckStation: costBreakdown.bottleneck_station,
            },
            pcb_features.has_rf || false,
            (pcb_features.bga_count || 0) > 0,
            (pcb_features.fine_pitch_count || 0) > 0
          );
        }

        result = {
          cost_breakdown: costBreakdown,
          risk_assessment: riskAssessment,
        };
        break;
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
