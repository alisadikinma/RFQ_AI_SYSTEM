import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { analyzeRFQ } from '@/lib/similarity';
import { calculateCostBreakdown, assessRisks } from '@/lib/cost';
import { explainRFQResult, generateSuggestions, isLLMAvailable } from '@/lib/llm';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const rfqId = params.id;

  try {
    // Update status to processing
    await supabase
      .from('rfq_requests')
      .update({ status: 'processing' })
      .eq('id', rfqId);

    // Fetch RFQ with stations
    const { data: rfq, error: rfqError } = await supabase
      .from('rfq_requests')
      .select(`
        *,
        customer:customers(id, code, name),
        stations:rfq_stations(*)
      `)
      .eq('id', rfqId)
      .single();

    if (rfqError) throw rfqError;

    // Build features from RFQ data
    const pcbFeatures = rfq.pcb_features || getDefaultPCBFeatures();
    const bomSummary = rfq.bom_summary || getDefaultBOMSummary();
    const rfqStations = ((rfq.stations as { board_type: string; station_code: string; sequence: number }[]) || []).map((s) => ({
      board_type: s.board_type,
      station_code: s.station_code,
      sequence: s.sequence,
    }));

    const customer = rfq.customer as { id: string; code: string; name: string } | null;

    // 1. Run Similarity Analysis
    const analysis = await analyzeRFQ(
      pcbFeatures,
      bomSummary,
      rfqStations,
      customer?.id
    );

    const topMatch = analysis.top_match;

    // 2. Calculate Costs
    let costBreakdown = null;
    let riskAssessment = null;

    if (topMatch || rfqStations.length > 0) {
      const allStations = [
        ...rfqStations.map((s) => ({
          station_code: s.station_code,
          quantity: 1,
          manpower: 1,
        })),
        ...analysis.inference.recommended_stations.map(s => ({
          station_code: s.code,
          quantity: 1,
          manpower: 1,
        })),
      ];

      costBreakdown = await calculateCostBreakdown(
        allStations,
        rfq.target_uph || 200,
        rfq.target_volume || 10000
      );

      riskAssessment = assessRisks(
        allStations,
        {
          lineUtilization: costBreakdown.line_utilization_percent,
          bottleneckStation: costBreakdown.bottleneck_station
        },
        pcbFeatures.has_rf,
        pcbFeatures.bga_count > 0,
        pcbFeatures.fine_pitch_count > 0
      );
    }

    // 3. Generate LLM Explanation (Bahasa Indonesia)
    let explanation = null;
    if (isLLMAvailable()) {
      try {
        explanation = await explainRFQResult({
          modelName: rfq.model_name,
          customerName: customer?.name || 'Unknown',
          topMatch: topMatch?.model_code || 'Tidak ada',
          score: topMatch?.overall_similarity || 0,
          confidence: topMatch?.confidence || 'low',
          matched: topMatch?.matched_stations.map(s => s.master_code) || [],
          missing: topMatch?.missing_stations || [],
          inferred: analysis.inference.recommended_stations.map(s => s.code),
          riskScore: riskAssessment?.risk_score || 0,
          riskFlags: riskAssessment?.risk_factors.map(f => f.description) || [],
          investment: costBreakdown?.total_investment_usd || 0,
        });
      } catch (llmError) {
        console.warn('LLM explanation failed:', llmError);
      }
    }

    // 4. Generate Suggestions
    let suggestions = null;
    if (isLLMAvailable() && costBreakdown) {
      try {
        suggestions = await generateSuggestions({
          productType: pcbFeatures.has_rf ? 'RF/Wireless' : 'General Electronics',
          volume: rfq.target_volume || 10000,
          targetUPH: rfq.target_uph || 200,
          stations: rfqStations.map((s) => s.station_code),
          issues: riskAssessment?.recommendations || [],
          costs: {
            labor: costBreakdown.monthly_labor_cost_usd,
            test: costBreakdown.test_cost_per_unit * (rfq.target_volume || 10000),
            fixture: costBreakdown.total_fixture_cost_usd,
          },
        });
      } catch (llmError) {
        console.warn('LLM suggestions failed:', llmError);
      }
    }

    // 5. Save Results
    for (const match of analysis.similar_models) {
      await supabase.from('rfq_results').insert({
        rfq_id: rfqId,
        matched_model_id: match.model_id,
        similarity_score: match.overall_similarity * 100,
        matched_stations: match.matched_stations,
        missing_stations: match.missing_stations,
        inferred_stations: match === topMatch ? analysis.inference.recommended_stations : null,
        investment_breakdown: match === topMatch ? costBreakdown : null,
        cost_per_unit: match === topMatch ? { total: costBreakdown?.total_cost_per_unit } : null,
        risk_assessment: match === topMatch ? riskAssessment : null,
        recommendation: match === topMatch ? {
          explanation,
          suggestions,
          go_no_go: riskAssessment?.overall_level === 'high' ? 'Review Required' : 'Proceed',
        } : null,
      });
    }

    // Update status to completed
    await supabase
      .from('rfq_requests')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', rfqId);

    return NextResponse.json({
      success: true,
      results_count: analysis.similar_models.length,
      top_match: topMatch?.model_code,
      top_similarity: topMatch?.overall_similarity,
      has_explanation: !!explanation,
      has_suggestions: !!suggestions,
    });

  } catch (error: unknown) {
    await supabase
      .from('rfq_requests')
      .update({ status: 'failed' })
      .eq('id', rfqId);

    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Default values
function getDefaultPCBFeatures() {
  return {
    length_mm: 100,
    width_mm: 50,
    layer_count: 4,
    cavity_count: 1,
    side_count: 2,
    smt_component_count: 200,
    bga_count: 0,
    fine_pitch_count: 0,
    has_rf: false,
    has_power_stage: false,
    has_sensors: false,
    has_display_connector: false,
    has_battery_connector: false,
  };
}

function getDefaultBOMSummary() {
  return {
    total_line_items: 100,
    ic_count: 15,
    passive_count: 70,
    connector_count: 8,
    mcu_part_numbers: [],
    rf_module_parts: [],
    sensor_parts: [],
  };
}
