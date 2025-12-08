# PHASE 5: Integration & End-to-End Testing + LLM

## 🎯 OBJECTIVE
Wire all backend engines (similarity, parsers, cost, **LLM**) to the UI wizard, implement API routes, and conduct end-to-end testing.

---

## 📋 CONTEXT

Project: RFQ AI System for EMS Manufacturing
Location: `D:\Projects\RFQ_AI_SYSTEM`

**Dependencies from previous phases:**
- Phase 1: Database schema with pgvector ✅
- Phase 2: Similarity engine ✅
- Phase 3: File parsers + LLM ✅
- Phase 4: Cost calculation engine ✅
- LLM Integration: Gemini + OpenRouter ✅

---

## ⚠️ PRE-REQUISITE: Create Missing Table

**Run this in Supabase SQL Editor first:**

```sql
-- rfq_stations table (missing from Phase 1)
CREATE TABLE IF NOT EXISTS rfq_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id uuid REFERENCES rfq_requests(id) ON DELETE CASCADE,
  board_type text NOT NULL,
  station_code text NOT NULL,
  sequence integer NOT NULL,
  manpower integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_rfq_stations_rfq ON rfq_stations(rfq_id);

ALTER TABLE rfq_stations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated" ON rfq_stations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow read anon" ON rfq_stations FOR SELECT TO anon USING (true);
```

---

## 🏗️ ARCHITECTURE

```
app/
├── api/
│   ├── rfq/
│   │   ├── route.ts              # GET (list), POST (create)
│   │   ├── [id]/
│   │   │   ├── route.ts          # GET, PUT, DELETE single RFQ
│   │   │   ├── process/route.ts  # POST - trigger AI processing
│   │   │   └── results/route.ts  # GET - fetch results
│   ├── similarity/
│   │   └── route.ts              # POST - find similar models
│   ├── parse/
│   │   └── route.ts              # POST - parse uploaded files
│   ├── cost/
│   │   └── route.ts              # POST - calculate costs
│   └── explain/
│       └── route.ts              # POST - LLM explanation (NEW)
```

---

## 📝 IMPLEMENTATION

### Part 1: API Routes

#### `app/api/rfq/route.ts`

```typescript
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
      const stationsData = body.stations.map((s: any, idx: number) => ({
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

#### `app/api/rfq/[id]/process/route.ts` (WITH LLM)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { analyzeRFQ } from '@/lib/similarity';
import { calculateCostBreakdown, assessRisks } from '@/lib/cost';
import { explainRFQResult, generateSuggestions } from '@/lib/llm';

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
    const rfqStations = (rfq.stations || []).map((s: any) => ({
      board_type: s.board_type,
      station_code: s.station_code,
      sequence: s.sequence,
    }));

    // 1. Run Similarity Analysis
    const analysis = await analyzeRFQ(
      pcbFeatures,
      bomSummary,
      rfqStations,
      rfq.customer?.id
    );

    const topMatch = analysis.top_match;

    // 2. Calculate Costs
    let costBreakdown = null;
    let riskAssessment = null;

    if (topMatch || rfqStations.length > 0) {
      const allStations = [
        ...rfqStations.map((s: any) => ({
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
    try {
      explanation = await explainRFQResult({
        modelName: rfq.model_name,
        customerName: rfq.customer?.name || 'Unknown',
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

    // 4. Generate Suggestions
    let suggestions = null;
    try {
      if (costBreakdown) {
        suggestions = await generateSuggestions({
          productType: pcbFeatures.has_rf ? 'RF/Wireless' : 'General Electronics',
          volume: rfq.target_volume || 10000,
          targetUPH: rfq.target_uph || 200,
          stations: rfqStations.map((s: any) => s.station_code),
          issues: riskAssessment?.recommendations || [],
          costs: {
            labor: costBreakdown.monthly_labor_cost_usd,
            test: costBreakdown.test_cost_per_unit * (rfq.target_volume || 10000),
            fixture: costBreakdown.total_fixture_cost_usd,
          },
        });
      }
    } catch (llmError) {
      console.warn('LLM suggestions failed:', llmError);
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

  } catch (error: any) {
    await supabase
      .from('rfq_requests')
      .update({ status: 'failed' })
      .eq('id', rfqId);

    return NextResponse.json({ error: error.message }, { status: 500 });
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
```

#### `app/api/explain/route.ts` (LLM Endpoint)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { explainRFQResult, generateSuggestions } from '@/lib/llm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, params } = body;

    if (type === 'explain') {
      const explanation = await explainRFQResult(params);
      return NextResponse.json({ data: explanation });
    }

    if (type === 'suggest') {
      const suggestions = await generateSuggestions(params);
      return NextResponse.json({ data: suggestions });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

#### `app/api/parse/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { parseUploadedFile } from '@/lib/parsers';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const forceLLM = formData.get('forceLLM') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const result = await parseUploadedFile(file, { forceLLM });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      bom: result.bom,
      pcb: result.pcb,
      inferred_features: result.inferred_features,
      parse_method: result.bom?.parse_method || result.pcb?.parse_method,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

### Part 2: Update Results Page with LLM Content

#### `app/(dashboard)/rfq/[id]/results/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
// ... other imports

interface RFQResult {
  id: string;
  matched_model_id: string;
  similarity_score: number;
  matched_stations: any[];
  missing_stations: string[];
  inferred_stations: any[];
  investment_breakdown: any;
  cost_per_unit: any;
  risk_assessment: any;
  recommendation: {
    explanation?: {
      summary: string;
      similarity_explanation: string;
      station_analysis: string;
      risk_summary: string;
      recommendations: string[];
    };
    suggestions?: Array<{
      category: string;
      title: string;
      description: string;
      impact: string;
      action: string;
    }>;
    go_no_go: string;
  };
  matched_model?: {
    code: string;
    name: string;
    customer: { code: string; name: string };
  };
}

export default function ResultsPage() {
  const params = useParams();
  const [rfq, setRfq] = useState<any>(null);
  const [results, setResults] = useState<RFQResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [params.id]);

  const loadResults = async () => {
    try {
      const { data: rfqData } = await supabase
        .from('rfq_requests')
        .select(`*, customer:customers(code, name)`)
        .eq('id', params.id)
        .single();

      setRfq(rfqData);

      const { data: resultsData } = await supabase
        .from('rfq_results')
        .select(`
          *,
          matched_model:models(code, name, customer:customers(code, name))
        `)
        .eq('rfq_id', params.id)
        .order('similarity_score', { ascending: false });

      setResults(resultsData || []);
    } catch (error) {
      console.error('Failed to load results:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <LoadingSkeleton />;

  const topResult = results[0];
  const explanation = topResult?.recommendation?.explanation;
  const suggestions = topResult?.recommendation?.suggestions;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{rfq?.model_name}</h1>
          <p className="text-muted-foreground">{rfq?.customer?.name}</p>
        </div>
        <Badge variant={topResult?.recommendation?.go_no_go === 'Proceed' ? 'default' : 'destructive'}>
          {topResult?.recommendation?.go_no_go || 'Pending'}
        </Badge>
      </div>

      {/* AI Summary (LLM Generated) */}
      {explanation && (
        <Card>
          <CardHeader>
            <CardTitle>📋 Ringkasan AI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">{explanation.summary}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Analisis Similarity</h4>
                <p className="text-sm text-muted-foreground">{explanation.similarity_explanation}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Analisis Station</h4>
                <p className="text-sm text-muted-foreground">{explanation.station_analysis}</p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Risiko</h4>
              <p className="text-sm text-muted-foreground">{explanation.risk_summary}</p>
            </div>

            {explanation.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Rekomendasi</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground">
                  {explanation.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Similarity Results */}
      <Card>
        <CardHeader>
          <CardTitle>🔍 Model Serupa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {results.map((result, idx) => (
              <div key={result.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <span className="font-medium">{result.matched_model?.code}</span>
                  <span className="text-muted-foreground ml-2">
                    ({result.matched_model?.customer?.code})
                  </span>
                </div>
                <Badge variant={result.similarity_score >= 85 ? 'default' : 'secondary'}>
                  {Math.round(result.similarity_score)}% Match
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cost Summary */}
      {topResult?.investment_breakdown && (
        <Card>
          <CardHeader>
            <CardTitle>💰 Estimasi Biaya</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Investment</p>
                <p className="text-xl font-bold">
                  ${topResult.investment_breakdown.total_investment_usd?.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cost/Unit</p>
                <p className="text-xl font-bold">
                  ${topResult.cost_per_unit?.total?.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Effective UPH</p>
                <p className="text-xl font-bold">{topResult.investment_breakdown.effective_uph}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Manpower</p>
                <p className="text-xl font-bold">{topResult.investment_breakdown.total_manpower}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>💡 Saran AI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {suggestions.map((sug, idx) => (
                <div key={idx} className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{sug.category}</Badge>
                    <Badge variant={sug.impact === 'high' ? 'destructive' : 'secondary'}>
                      {sug.impact} impact
                    </Badge>
                  </div>
                  <h4 className="font-medium">{sug.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{sug.description}</p>
                  <p className="text-sm font-medium mt-2">Action: {sug.action}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Assessment */}
      {topResult?.risk_assessment && (
        <Card>
          <CardHeader>
            <CardTitle>⚠️ Risk Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-3xl font-bold">
                {topResult.risk_assessment.risk_score}/5
              </div>
              <Badge variant={
                topResult.risk_assessment.overall_level === 'high' ? 'destructive' :
                topResult.risk_assessment.overall_level === 'medium' ? 'secondary' : 'default'
              }>
                {topResult.risk_assessment.overall_level.toUpperCase()}
              </Badge>
            </div>
            <div className="space-y-2">
              {topResult.risk_assessment.risk_factors?.map((factor: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span>{factor.description}</span>
                  <Badge variant="outline">{factor.score}/5</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-1/3" />
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}
```

---

### Part 3: Testing Checklist

#### E2E Test Scenarios

```markdown
## Test Case 1: New RFQ with AI Processing
1. Go to /rfq/new
2. Select customer: XIAOMI
3. Enter model name: TEST-AI-001
4. Upload BOM Excel (verify LLM parsing if messy)
5. Add stations: MBT, CAL, RFT, MMI
6. Submit
7. Verify: Results page shows:
   - Similarity matches ✅
   - AI Explanation (Bahasa Indonesia) ✅
   - Cost breakdown ✅
   - AI Suggestions ✅
   - Risk assessment ✅

## Test Case 2: LLM Fallback
1. Create RFQ with poorly formatted BOM
2. Verify: System uses LLM parsing
3. Check: parse_method === 'hybrid' or 'llm'

## Test Case 3: Explanation Quality
1. Create RFQ for RF product without RFT station
2. Verify: AI explanation mentions missing RF test
3. Verify: Suggestions include "Add RFT station"
4. Verify: Risk score elevated
```

---

## ✅ FINAL CHECKLIST

### Functional
- [ ] New RFQ wizard works end-to-end
- [ ] File upload parses BOM/PDF (with LLM fallback)
- [ ] Similarity engine returns accurate matches
- [ ] Cost breakdown calculates correctly
- [ ] **LLM explanation generated (Bahasa Indonesia)**
- [ ] **AI suggestions relevant to context**
- [ ] Results page shows all data
- [ ] RFQ History lists all requests

### Non-Functional
- [ ] Page load < 2 seconds
- [ ] AI processing < 30 seconds
- [ ] No TypeScript errors
- [ ] `npm run build` passes

### Database
- [ ] `rfq_stations` table exists
- [ ] `rfq_results` has `recommendation` column
- [ ] All RLS policies working

---

## 🚀 DEPLOYMENT

```bash
# 1. Environment check
cat .env.local
# Should have: SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY

# 2. Run missing migration (rfq_stations)
# Execute SQL in Supabase Dashboard

# 3. Build check
npm run build

# 4. Deploy
git push
```
