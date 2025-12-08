# PHASE 5: Integration & End-to-End Testing

## 🎯 OBJECTIVE
Wire all backend engines (similarity, parsers, cost) to the UI wizard, implement API routes, and conduct end-to-end testing with realistic data.

---

## 📋 CONTEXT

Project: RFQ AI System for EMS Manufacturing
Location: `D:\Projects\RFQ_AI_SYSTEM`

**Dependencies from previous phases:**
- Phase 0: Fixed UI pages (Machines, Models, RFQ History)
- Phase 1: Database schema with pgvector
- Phase 2: Similarity engine
- Phase 3: File parsers
- Phase 4: Cost calculation engine

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
│   └── cost/
│       └── route.ts              # POST - calculate costs
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
        notes: body.notes,
        input_method: body.input_method,
        status: 'draft',
      })
      .select()
      .single();

    if (rfqError) throw rfqError;

    // Save stations if provided
    if (body.stations && body.stations.length > 0) {
      const stationsData = body.stations.map((s: any, idx: number) => ({
        rfq_id: rfq.id,
        board_type: s.board_type,
        station_code: s.station_code,
        sequence: s.sequence || idx + 1,
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

#### `app/api/rfq/[id]/process/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { findSimilarModels, inferMissingStations } from '@/lib/similarity';
import { calculateCostBreakdown, assessRisks } from '@/lib/cost';

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
        stations:rfq_stations(*)
      `)
      .eq('id', rfqId)
      .single();

    if (rfqError) throw rfqError;

    // Build PCB features from RFQ data (or use defaults)
    const pcbFeatures = rfq.pcb_features || {
      length_mm: 100,
      width_mm: 50,
      layer_count: 4,
      cavity_count: 1,
      side_count: 2,
      smt_component_count: 200,
      bga_count: 2,
      fine_pitch_count: 5,
      has_rf: true,
      has_power_stage: false,
      has_sensors: true,
      has_display_connector: true,
      has_battery_connector: true,
    };

    const bomSummary = rfq.bom_summary || {
      total_line_items: 150,
      ic_count: 20,
      passive_count: 100,
      connector_count: 10,
      mcu_part_numbers: [],
      rf_module_parts: [],
      sensor_parts: [],
      power_ic_parts: [],
    };

    const rfqStations = (rfq.stations || []).map((s: any) => ({
      board_type: s.board_type,
      station_code: s.station_code,
      sequence: s.sequence,
    }));

    // Find similar models
    const similarModels = await findSimilarModels(
      pcbFeatures,
      bomSummary,
      rfqStations,
      5
    );

    // Infer missing stations
    const existingCodes = rfqStations.map((s: any) => s.station_code);
    const inference = inferMissingStations(pcbFeatures, existingCodes);

    // Calculate costs for top match
    const topMatch = similarModels[0];
    let costBreakdown = null;
    let riskAssessment = null;

    if (topMatch) {
      // Build station input from matched + inferred
      const allStations = [
        ...rfqStations.map((s: any) => ({
          station_code: s.station_code,
          quantity: 1,
          manpower: 1,
        })),
        ...inference.recommended_stations.map(s => ({
          station_code: s.station_code,
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
        { lineUtilization: costBreakdown.line_utilization_percent, bottleneckStation: costBreakdown.bottleneck_station },
        pcbFeatures.has_rf,
        pcbFeatures.bga_count > 0,
        pcbFeatures.fine_pitch_count > 0
      );
    }

    // Save results
    for (const match of similarModels) {
      await supabase.from('rfq_results').insert({
        rfq_id: rfqId,
        matched_model_id: match.model_id,
        similarity_score: match.overall_similarity * 100,
        matched_stations: match.matched_stations,
        missing_stations: match.missing_stations,
        investment_breakdown: match === topMatch ? costBreakdown : null,
        manpower_estimate: match === topMatch ? { total: costBreakdown?.total_manpower } : null,
        risk_assessment: match === topMatch ? riskAssessment : null,
      });
    }

    // Update status to completed
    await supabase
      .from('rfq_requests')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', rfqId);

    return NextResponse.json({ 
      success: true,
      results_count: similarModels.length,
      top_match: topMatch?.model_code,
      top_similarity: topMatch?.overall_similarity,
    });

  } catch (error: any) {
    // Update status to failed
    await supabase
      .from('rfq_requests')
      .update({ status: 'failed' })
      .eq('id', rfqId);

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

#### `app/api/parse/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { parseUploadedFile, inferPCBFeaturesFromBOM } from '@/lib/parsers';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const result = await parseUploadedFile(file);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // If BOM, also infer PCB features
    let inferredFeatures = null;
    if (result.bom) {
      inferredFeatures = inferPCBFeaturesFromBOM(result.bom.summary);
    }

    return NextResponse.json({
      success: true,
      bom: result.bom,
      pcb: result.pcb,
      inferred_features: inferredFeatures,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

#### `app/api/similarity/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { findSimilarModels, normalizeStationCode } from '@/lib/similarity';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Normalize station codes if provided
    if (body.stations) {
      body.stations = body.stations.map((s: any) => ({
        ...s,
        ...normalizeStationCode(s.station_code),
      }));
    }

    const results = await findSimilarModels(
      body.pcb_features,
      body.bom_summary,
      body.stations || [],
      body.top_n || 5
    );

    return NextResponse.json({ data: results });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

### Part 2: Wire Wizard to API

#### Update `app/(dashboard)/rfq/new/page.tsx`

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageTransition } from '@/components/layout/PageTransition';
import { WizardContainer } from '@/components/rfq/wizard/WizardContainer';
// ... other imports

export default function NewRFQPage() {
  const router = useRouter();
  const [wizardData, setWizardData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async (data: any) => {
    setIsSubmitting(true);

    try {
      // 1. Create RFQ
      const createRes = await fetch('/api/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: data.customer_id,
          model_name: data.modelName,
          reference_model_id: data.referenceModelId,
          target_uph: parseInt(data.targetUPH) || 200,
          target_volume: parseInt(data.targetVolume) || 10000,
          notes: data.notes,
          input_method: data.inputMethod || 'manual',
          stations: data.stations,
          pcb_features: data.pcbFeatures,
          bom_summary: data.bomSummary,
        }),
      });

      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error);

      const rfqId = createData.data.id;

      // 2. Trigger processing
      toast.info('Processing RFQ with AI...');
      
      const processRes = await fetch(`/api/rfq/${rfqId}/process`, {
        method: 'POST',
      });

      const processData = await processRes.json();
      if (!processRes.ok) throw new Error(processData.error);

      toast.success('RFQ processed successfully!', {
        description: `Found ${processData.results_count} similar models`,
      });

      // 3. Navigate to results
      router.push(`/rfq/${rfqId}/results`);

    } catch (error: any) {
      toast.error('Failed to submit RFQ', {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ... rest of component
}
```

#### Update `FileUploadStep.tsx` to use parse API

```typescript
const handleFileSelect = async (files: FileList) => {
  setIsProcessing(true);

  for (const file of Array.from(files)) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/parse', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      if (result.success) {
        if (result.bom) {
          setUploadedFiles(prev => [...prev, {
            name: file.name,
            type: 'bom',
            data: result.bom,
          }]);
          
          // Update wizard data with parsed BOM
          onChange({
            bomSummary: result.bom.summary,
            pcbFeatures: {
              ...data.pcbFeatures,
              ...result.inferred_features,
            },
          });

          toast.success(`Parsed ${result.bom.total_rows} BOM lines`);
        }

        if (result.pcb) {
          setUploadedFiles(prev => [...prev, {
            name: file.name,
            type: 'pcb',
            data: result.pcb,
          }]);

          // Update wizard data with PCB info
          if (result.pcb.dimensions) {
            onChange({
              pcbFeatures: {
                ...data.pcbFeatures,
                length_mm: result.pcb.dimensions.length_mm,
                width_mm: result.pcb.dimensions.width_mm,
                layer_count: result.pcb.layer_count,
                cavity_count: result.pcb.cavity_count,
              },
            });
          }

          toast.success('Extracted PCB dimensions');
        }
      } else {
        toast.error(result.error);
      }
    } catch (error: any) {
      toast.error(`Failed to parse ${file.name}`);
    }
  }

  setIsProcessing(false);
};
```

---

### Part 3: Update Results Page

#### `app/(dashboard)/rfq/[id]/results/page.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
// ... imports

interface RFQResult {
  id: string;
  matched_model_id: string;
  similarity_score: number;
  matched_stations: string[];
  missing_stations: string[];
  investment_breakdown: any;
  manpower_estimate: any;
  risk_assessment: any;
  matched_model?: {
    code: string;
    name: string;
    customer: { code: string };
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
      // Load RFQ
      const { data: rfqData } = await supabase
        .from('rfq_requests')
        .select(`
          *,
          customer:customers(code, name)
        `)
        .eq('id', params.id)
        .single();

      setRfq(rfqData);

      // Load results
      const { data: resultsData } = await supabase
        .from('rfq_results')
        .select(`
          *,
          matched_model:models(
            code,
            name,
            customer:customers(code)
          )
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

  // Convert DB results to component props
  const recommendations = results.map((r, idx) => ({
    id: r.id,
    model_id: r.matched_model_id,
    model_code: r.matched_model?.code || 'Unknown',
    model_name: r.matched_model?.name || 'Unknown',
    customer: r.matched_model?.customer?.code || 'Unknown',
    similarity_score: r.similarity_score,
    matched_stations: r.matched_stations || [],
    missing_stations: r.missing_stations || [],
    total_investment_usd: r.investment_breakdown?.total_investment_usd || 0,
    total_manpower: r.manpower_estimate?.total || 0,
    estimated_uph: r.investment_breakdown?.effective_uph || 0,
    bottleneck_station: r.investment_breakdown?.bottleneck_station || '-',
    status: 'Active',
  }));

  // ... render with real data
}
```

---

### Part 4: Testing Checklist

#### Unit Tests (`__tests__/`)

```
__tests__/
├── similarity/
│   ├── pcb-similarity.test.ts
│   ├── bom-similarity.test.ts
│   └── inference.test.ts
├── parsers/
│   ├── excel-parser.test.ts
│   └── bom-analyzer.test.ts
├── cost/
│   ├── fixture-cost.test.ts
│   ├── capacity-calc.test.ts
│   └── cost-breakdown.test.ts
└── api/
    └── rfq.test.ts
```

#### E2E Test Scenarios

```markdown
## Test Case 1: New RFQ - Manual Entry
1. Go to /rfq/new
2. Select customer: XIAOMI
3. Enter model name: TEST-MODEL-001
4. Select reference model: POCO-X6-PRO-MAIN
5. Set target UPH: 200
6. Set target volume: 10000
7. Add stations manually: MBT, CAL, RFT1, MMI
8. Submit
9. Verify: Redirects to results page with similarity matches

## Test Case 2: New RFQ - File Upload
1. Go to /rfq/new
2. Select customer: TCL
3. Upload BOM Excel file
4. Verify: BOM summary extracted (IC count, RF detected, etc.)
5. Upload PCB PDF
6. Verify: Dimensions extracted
7. Submit
8. Verify: Results include inferred stations

## Test Case 3: Results Accuracy
1. Create RFQ similar to existing POCO-X6-PRO-MAIN
2. Verify: Similarity score > 85%
3. Verify: Matched stations correct
4. Verify: Missing stations identified
5. Verify: Investment breakdown reasonable ($100K-$500K)
6. Verify: Manpower estimate reasonable (8-15 operators)

## Test Case 4: Edge Cases
1. Empty stations list → Should infer all from features
2. Unknown station codes → Should map to standard
3. Very different PCB → Similarity < 70%, low confidence
4. No reference model → Still calculates costs
```

---

### Part 5: Performance Optimization

```typescript
// lib/supabase/client.ts - Add query caching

import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-application-name': 'rfq-ai-system',
      },
    },
  }
);

// Add React Query for client-side caching
// Already in package.json: @tanstack/react-query
```

```typescript
// lib/api/hooks.ts - React Query hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRFQs, createRFQ } from './rfq';

export function useRFQs() {
  return useQuery({
    queryKey: ['rfqs'],
    queryFn: getRFQs,
    staleTime: 30000, // 30 seconds
  });
}

export function useCreateRFQ() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createRFQ,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
    },
  });
}
```

---

## ✅ FINAL ACCEPTANCE CRITERIA

### Functional
- [ ] New RFQ wizard works end-to-end
- [ ] File upload parses BOM/PDF correctly
- [ ] Similarity engine returns accurate matches
- [ ] Cost breakdown calculates correctly
- [ ] Results page shows real data from DB
- [ ] RFQ History shows all requests with status

### Non-Functional
- [ ] Page load < 2 seconds
- [ ] Similarity search < 500ms for 100 models
- [ ] No TypeScript errors
- [ ] `npm run build` passes
- [ ] No console errors in browser

### Data Integrity
- [ ] RFQ data persists in Supabase
- [ ] Results linked correctly to RFQ
- [ ] Station mappings preserved
- [ ] Cost calculations reproducible

---

## 🚀 DEPLOYMENT CHECKLIST

```bash
# 1. Environment variables
cp .env.example .env.production
# Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# 2. Database migrations
npx supabase db push

# 3. Build check
npm run build

# 4. Type check
npm run typecheck

# 5. Deploy
# Vercel: git push (auto-deploy)
# Self-hosted: npm start
```

---

## 📊 SUCCESS METRICS

After deployment, track:
1. **RFQ Processing Time**: Target < 30 seconds
2. **Similarity Accuracy**: Top match should be correct >80% of time
3. **Cost Estimation Variance**: Within ±20% of actual quotes
4. **User Adoption**: Engineers using system for new RFQs

---

## 🎉 PROJECT COMPLETE

With Phase 5 done, the RFQ AI System should be fully functional:
- ✅ UI pages working (Dashboard, Machines, Models, RFQ)
- ✅ Database schema with pgvector
- ✅ Similarity engine matching historical models
- ✅ File parsers extracting BOM/PCB data
- ✅ Cost engine calculating investment & manpower
- ✅ API routes connecting frontend to backend
- ✅ End-to-end flow from RFQ creation to results
