# PHASE_6B: Similarity Search & Model Comparison

## 🎯 Objective
Build similarity search and comparison system that:
1. Takes resolved station codes from Phase 6A
2. Finds TOP 3 similar historical models using Jaccard similarity
3. Displays side-by-side comparison (Your Request vs Historical Model)
4. Shows full station details, cost estimation, and recommendations

**Input**: `ResolutionResult` from Phase 6A with `uniqueCodes` array
**Output**: TOP 3 matching models with detailed comparison views

---

## 🔗 Input from Phase 6A

```typescript
// Phase 6A outputs this:
interface ResolutionResult {
  stations: ResolvedStation[];
  summary: {
    total: number;
    resolved: number;
    unresolved: number;
    uniqueCodes: string[];  // ← Used for similarity search
  };
}

// Example:
{
  summary: {
    uniqueCodes: ["MBT", "CAL", "RFT", "MMI", "VISUAL"]
  }
}
```

---

## 📊 Jaccard Similarity Algorithm

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      JACCARD SIMILARITY                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Formula: J(A,B) = |A ∩ B| / |A ∪ B| × 100%                             │
│                                                                          │
│  Example:                                                                │
│  ─────────                                                               │
│  Your Request (A): {MBT, CAL, RFT, MMI, VISUAL}                         │
│  Historical Model (B): {MBT, CAL, RFT, MMI, VISUAL, OS_DOWNLOAD}        │
│                                                                          │
│  Intersection (A ∩ B): {MBT, CAL, RFT, MMI, VISUAL} = 5                 │
│  Union (A ∪ B): {MBT, CAL, RFT, MMI, VISUAL, OS_DOWNLOAD} = 6           │
│                                                                          │
│  Similarity = 5/6 × 100% = 83.3%                                        │
│                                                                          │
│  Threshold: Only return models with similarity ≥ 70%                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🖥️ UI Design

### Page: Results Summary (`/rfq/[id]/results`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back to RFQ Form                                                      │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  📋 Station Resolution Summary                                   │    │
│  │  ─────────────────────────────────────────────────────────────  │    │
│  │  Input            │ Resolved To      │ Confidence │ Method      │    │
│  │  ─────────────────┼──────────────────┼────────────┼───────────  │    │
│  │  MBT              │ MBT              │ ✅ High    │ Exact       │    │
│  │  CAL1             │ CAL              │ ✅ High    │ Alias       │    │
│  │  4G仪表           │ RFT              │ 🟡 Medium  │ Semantic    │    │
│  │  主板MMI          │ MMI              │ 🟡 Medium  │ Semantic    │    │
│  │  VISUAL           │ VISUAL           │ ✅ High    │ Exact       │    │
│  │                                                                  │    │
│  │  ✅ 5 stations resolved → 5 unique codes                         │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  🏆 TOP 3 SIMILAR MODELS                                         │    │
│  │  ─────────────────────────────────────────────────────────────  │    │
│  │                                                                  │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │  🥇 92% Match                                              │  │    │
│  │  │  ──────────────────────────────────────────────────────── │  │    │
│  │  │  POCO-X6-PRO                                              │  │    │
│  │  │  Customer: XIAOMI                                          │  │    │
│  │  │  📊 12 stations │ 👷 15 MP │ 🏭 Main + Sub Board           │  │    │
│  │  │                                                            │  │    │
│  │  │  Matched: 5/5 of your stations ✅                         │  │    │
│  │  │  Extra: 7 stations you might also need                    │  │    │
│  │  │                                                            │  │    │
│  │  │                              [View Details →]              │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  │                                                                  │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │  🥈 85% Match                                              │  │    │
│  │  │  ──────────────────────────────────────────────────────── │  │    │
│  │  │  REDMI-NOTE-13                                            │  │    │
│  │  │  Customer: XIAOMI                                          │  │    │
│  │  │  📊 10 stations │ 👷 12 MP │ 🏭 Main Board only            │  │    │
│  │  │                                                            │  │    │
│  │  │  Matched: 4/5 of your stations                            │  │    │
│  │  │  Missing: VISUAL (you need, model doesn't have)           │  │    │
│  │  │                                                            │  │    │
│  │  │                              [View Details →]              │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  │                                                                  │    │
│  │  ┌───────────────────────────────────────────────────────────┐  │    │
│  │  │  🥉 78% Match                                              │  │    │
│  │  │  ──────────────────────────────────────────────────────── │  │    │
│  │  │  TCL-50-SE                                                 │  │    │
│  │  │  Customer: TCL                                             │  │    │
│  │  │  📊 8 stations │ 👷 9 MP │ 🏭 Main Board only              │  │    │
│  │  │                                                            │  │    │
│  │  │  Matched: 4/5 of your stations                            │  │    │
│  │  │  Extra: 3 stations                                        │  │    │
│  │  │                                                            │  │    │
│  │  │                              [View Details →]              │  │    │
│  │  └───────────────────────────────────────────────────────────┘  │    │
│  │                                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### No Matches State

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ❌ No Similar Models Found                                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  No historical models found with similarity ≥ 70%                       │
│                                                                          │
│  Your unique stations: MBT, CAL, RFT, MMI, VISUAL                       │
│                                                                          │
│  💡 Suggestions:                                                         │
│  • This may be a new product type not yet in our database              │
│  • Try reducing station requirements to find partial matches           │
│  • Contact engineering team for manual quotation                        │
│                                                                          │
│  Closest match found: POCO-X5 (62% similarity) - below threshold       │
│                                                                          │
│  [← Edit RFQ]        [Request Manual Quote]                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 SIDE-BY-SIDE COMPARISON

### Page: Model Detail (`/rfq/[id]/results/[modelId]`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back to Results                                                       │
│                                                                          │
│  ═══════════════════════════════════════════════════════════════════    │
│                         🏆 92% MATCH                                     │
│  ═══════════════════════════════════════════════════════════════════    │
│                                                                          │
│  ┌─────────────────────────────┐   ┌─────────────────────────────┐      │
│  │   📋 YOUR REQUEST           │   │   📦 HISTORICAL MODEL        │      │
│  │   ─────────────────────     │   │   ─────────────────────      │      │
│  │   Customer: XIAOMI          │   │   POCO-X6-PRO               │      │
│  │   Model: POCO-X7 (new)      │   │   Customer: XIAOMI          │      │
│  │   Qty: 50,000/month         │   │   Status: ✅ Active          │      │
│  │   Stations: 5 requested     │   │   Production: 6 months      │      │
│  │                             │   │   Total Stations: 12        │      │
│  │                             │   │   Total MP: 15              │      │
│  └─────────────────────────────┘   └─────────────────────────────┘      │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  📊 STATION COMPARISON (Side-by-Side)                            │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │                                                                  │    │
│  │  ┌────────────────────┬─────────────┬────────────────────┐      │    │
│  │  │   YOUR REQUEST     │   STATUS    │   POCO-X6-PRO      │      │    │
│  │  ├────────────────────┼─────────────┼────────────────────┤      │    │
│  │  │ ✅ MBT             │ ═══ MATCH   │ ✅ MBT             │      │    │
│  │  │    Manual Bench    │             │    Manual Bench    │      │    │
│  │  ├────────────────────┼─────────────┼────────────────────┤      │    │
│  │  │ ✅ CAL             │ ═══ MATCH   │ ✅ CAL             │      │    │
│  │  │    Calibration     │             │    Calibration     │      │    │
│  │  ├────────────────────┼─────────────┼────────────────────┤      │    │
│  │  │ ✅ RFT             │ ═══ MATCH   │ ✅ RFT             │      │    │
│  │  │    RF Test         │             │    RF Test         │      │    │
│  │  ├────────────────────┼─────────────┼────────────────────┤      │    │
│  │  │ ✅ MMI             │ ═══ MATCH   │ ✅ MMI             │      │    │
│  │  │    Interface Test  │             │    Interface Test  │      │    │
│  │  ├────────────────────┼─────────────┼────────────────────┤      │    │
│  │  │ ✅ VISUAL          │ ═══ MATCH   │ ✅ VISUAL          │      │    │
│  │  │    Inspection      │             │    Inspection      │      │    │
│  │  ├────────────────────┼─────────────┼────────────────────┤      │    │
│  │  │        -           │ ➕ EXTRA    │ ➕ OS_DOWNLOAD     │      │    │
│  │  │                    │   IN MODEL  │    Firmware Flash  │      │    │
│  │  ├────────────────────┼─────────────┼────────────────────┤      │    │
│  │  │        -           │ ➕ EXTRA    │ ➕ CURRENT         │      │    │
│  │  │                    │   IN MODEL  │    Current Test    │      │    │
│  │  ├────────────────────┼─────────────┼────────────────────┤      │    │
│  │  │        -           │ ➕ EXTRA    │ ➕ UNDERFILL       │      │    │
│  │  │                    │   IN MODEL  │    BGA Underfill   │      │    │
│  │  └────────────────────┴─────────────┴────────────────────┘      │    │
│  │                                                                  │    │
│  │  📈 MATCH SUMMARY:                                               │    │
│  │  ┌─────────────────────────────────────────────────────────┐    │    │
│  │  │  ✅ Matched:  5 stations (100% of your request covered) │    │    │
│  │  │  ➕ Extra:    7 stations (model has, you didn't request)│    │    │
│  │  │  ➖ Missing:  0 stations (you need but model doesn't)   │    │    │
│  │  └─────────────────────────────────────────────────────────┘    │    │
│  │                                                                  │    │
│  │  💡 The historical model covers ALL your requested stations     │    │
│  │     plus has additional stations you may want to consider.      │    │
│  │                                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  🏭 HISTORICAL MODEL - FULL STATION DETAILS                      │    │
│  │  ─────────────────────────────────────────────────────────────  │    │
│  │                                                                  │    │
│  │  📋 Main Board (主板) - 8 stations                               │    │
│  │  ┌────┬──────────┬────────────────────┬────┬─────┬──────┬──────┐│    │
│  │  │ #  │ Station  │ Description        │ MP │ UPH │Cycle │ Cost ││    │
│  │  ├────┼──────────┼────────────────────┼────┼─────┼──────┼──────┤│    │
│  │  │ 1  │ MBT ✅   │ Manual Bench Test  │ 2  │ 30  │ 120s │$8K   ││    │
│  │  │ 2  │ CAL ✅   │ Calibration        │ 1  │ 60  │ 60s  │$15K  ││    │
│  │  │ 3  │ RFT ✅   │ Radio Frequency    │ 2  │ 45  │ 80s  │$25K  ││    │
│  │  │ 4  │ MMI ✅   │ Interface Test     │ 1  │ 90  │ 40s  │$12K  ││    │
│  │  │ 5  │ VISUAL ✅│ Visual Inspection  │ 2  │ 120 │ 30s  │$5K   ││    │
│  │  │ 6  │ OS_DL ➕ │ Firmware Flash     │ 1  │ 100 │ 36s  │$8K   ││    │
│  │  │ 7  │ CURRENT➕│ Current Testing    │ 1  │ 90  │ 40s  │$10K  ││    │
│  │  │ 8  │ UNDRFIL➕│ BGA Underfill      │ 1  │ 80  │ 45s  │$20K  ││    │
│  │  ├────┴──────────┴────────────────────┼────┼─────┼──────┼──────┤│    │
│  │  │ SUBTOTAL (Main Board)              │ 11 │ 30* │  -   │$103K ││    │
│  │  └────────────────────────────────────┴────┴─────┴──────┴──────┘│    │
│  │                                                                  │    │
│  │  📋 Sub Board (副板) - 4 stations                                │    │
│  │  ┌────┬──────────┬────────────────────┬────┬─────┬──────┬──────┐│    │
│  │  │ #  │ Station  │ Description        │ MP │ UPH │Cycle │ Cost ││    │
│  │  ├────┼──────────┼────────────────────┼────┼─────┼──────┼──────┤│    │
│  │  │ 1  │ MBT ✅   │ Manual Bench Test  │ 1  │ 40  │ 90s  │$6K   ││    │
│  │  │ 2  │ CAL ✅   │ Calibration        │ 1  │ 80  │ 45s  │$12K  ││    │
│  │  │ 3  │ VISUAL ✅│ Visual Inspection  │ 1  │ 150 │ 24s  │$4K   ││    │
│  │  │ 4  │ MMI ✅   │ Sub-board MMI      │ 1  │ 100 │ 36s  │$8K   ││    │
│  │  ├────┴──────────┴────────────────────┼────┼─────┼──────┼──────┤│    │
│  │  │ SUBTOTAL (Sub Board)               │ 4  │ 40* │  -   │$30K  ││    │
│  │  └────────────────────────────────────┴────┴─────┴──────┴──────┘│    │
│  │                                                                  │    │
│  │  * UPH limited by bottleneck station                            │    │
│  │  ⚠️ BOTTLENECK: MBT on Main Board (30 UPH) limits total output   │    │
│  │                                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  💰 COST ESTIMATION (Based on POCO-X6-PRO)                       │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │                                                                  │    │
│  │  ┌─────────────────────────────┬─────────────┬─────────────────┐│    │
│  │  │ Category                    │ Amount      │ Notes           ││    │
│  │  ├─────────────────────────────┼─────────────┼─────────────────┤│    │
│  │  │ 🏭 Equipment Investment     │ $133,000    │ 12 stations     ││    │
│  │  │ 🔧 Fixture Cost (amortized) │ $28,000     │ Per model       ││    │
│  │  │ 👷 Total Manpower           │ 15 MP       │ 11 Main + 4 Sub ││    │
│  │  │ 💵 Monthly Labor Cost       │ $10,500     │ @ $700/MP avg   ││    │
│  │  │ ⚡ Line UPH (Bottleneck)    │ 30 UPH      │ Limited by MBT  ││    │
│  │  │ 📦 Monthly Capacity         │ ~14,400 pcs │ 30×20hr×24day   ││    │
│  │  ├─────────────────────────────┼─────────────┼─────────────────┤│    │
│  │  │ 💲 Est. Test Cost/Unit      │ $1.45       │ Labor + Deprec  ││    │
│  │  └─────────────────────────────┴─────────────┴─────────────────┘│    │
│  │                                                                  │    │
│  │  ⚠️ DISCLAIMER: Estimates based on similar historical model.     │    │
│  │     Actual costs may vary based on specific requirements.        │    │
│  │                                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  💡 RECOMMENDATIONS                                               │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │                                                                  │    │
│  │  ✅ GOOD MATCH - This model covers all your requested stations   │    │
│  │                                                                  │    │
│  │  Consider these additional stations from POCO-X6-PRO:            │    │
│  │  • OS_DOWNLOAD - Required if product has firmware                │    │
│  │  • CURRENT - Recommended for battery-powered devices             │    │
│  │  • UNDERFILL - Required if PCB has BGA components                │    │
│  │                                                                  │    │
│  │  💬 Questions to confirm with customer:                           │    │
│  │  • Does product require firmware programming?                    │    │
│  │  • Is product battery-powered?                                   │    │
│  │  • Does PCB have BGA packages?                                   │    │
│  │                                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐      │
│  │ 📄 Export PDF   │  │ 📊 Export Excel │  │ ✅ Use as Reference │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Implementation

### Task 1: Types
**File: `lib/rfq/types.ts`** (extend from Phase 6A)

```typescript
// Similarity search result
export interface SimilarModel {
  modelId: string;
  modelCode: string;
  customerCode: string;
  customerName: string;
  boardTypes: string[];
  stationCodes: string[];
  stationCount: number;
  totalManpower: number;
  similarity: number;
  matchedStations: string[];
  extraStations: string[];    // In model, not in request
  missingStations: string[];  // In request, not in model
}

// Model detail for comparison
export interface ModelDetail {
  id: string;
  code: string;
  customer: {
    code: string;
    name: string;
  };
  boardTypes: string[];
  status: string;
  stations: ModelStationDetail[];
  summary: {
    totalStations: number;
    totalManpower: number;
    totalInvestment: number;
    bottleneckStation: string;
    bottleneckUPH: number;
  };
}

export interface ModelStationDetail {
  id: string;
  boardType: string;
  sequence: number;
  stationCode: string;
  stationName: string;
  description: string;
  manpower: number;
  uph: number | null;
  cycleTime: number | null;
  investment: number | null;
  isMatched: boolean;  // true if in user's request
}

// Comparison result
export interface ComparisonResult {
  yourRequest: {
    stations: ResolvedStation[];
    uniqueCodes: string[];
  };
  historicalModel: ModelDetail;
  comparison: {
    matched: string[];
    extra: string[];
    missing: string[];
    matchPercentage: number;
  };
  costEstimate: CostEstimate;
}

export interface CostEstimate {
  equipmentInvestment: number;
  fixturesCost: number;
  totalManpower: number;
  monthlyLaborCost: number;
  lineUPH: number;
  monthlyCapacity: number;
  costPerUnit: number;
}
```

### Task 2: Similarity Engine
**File: `lib/rfq/similarity-engine.ts`**

```typescript
import { createClient } from '@/lib/supabase/client';

export async function findSimilarModels(
  requestedCodes: string[],
  limit: number = 3,
  minSimilarity: number = 70
): Promise<SimilarModel[]> {
  const supabase = createClient();
  
  // Get all models with their station codes
  const { data: models, error } = await supabase
    .from('models')
    .select(`
      id,
      code,
      board_types,
      status,
      customer:customers(code, name),
      stations:model_stations(
        manpower,
        station:station_master(code)
      )
    `)
    .eq('status', 'active');
  
  if (error || !models) {
    throw new Error('Failed to fetch models');
  }
  
  const requestedSet = new Set(requestedCodes);
  const results: SimilarModel[] = [];
  
  for (const model of models) {
    // Extract unique station codes
    const modelCodes = [...new Set(
      model.stations
        .map((s: any) => s.station?.code)
        .filter(Boolean)
    )];
    const modelSet = new Set(modelCodes);
    
    // Calculate Jaccard similarity
    const similarity = jaccardSimilarity(requestedSet, modelSet);
    
    if (similarity >= minSimilarity) {
      const matched = [...requestedSet].filter(c => modelSet.has(c));
      const extra = [...modelSet].filter(c => !requestedSet.has(c));
      const missing = [...requestedSet].filter(c => !modelSet.has(c));
      
      results.push({
        modelId: model.id,
        modelCode: model.code,
        customerCode: model.customer?.code || '',
        customerName: model.customer?.name || '',
        boardTypes: model.board_types || [],
        stationCodes: modelCodes,
        stationCount: modelCodes.length,
        totalManpower: model.stations.reduce((sum: number, s: any) => sum + (s.manpower || 0), 0),
        similarity,
        matchedStations: matched,
        extraStations: extra,
        missingStations: missing
      });
    }
  }
  
  // Sort by similarity descending, take top N
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  
  if (union.size === 0) return 0;
  return Math.round((intersection.size / union.size) * 100);
}

export async function getModelDetails(
  modelId: string,
  requestedCodes: string[]
): Promise<ModelDetail> {
  const supabase = createClient();
  
  const { data: model, error } = await supabase
    .from('models')
    .select(`
      id,
      code,
      board_types,
      status,
      customer:customers(code, name),
      stations:model_stations(
        id,
        board_type,
        sequence,
        manpower,
        station:station_master(
          code,
          name,
          description,
          typical_uph,
          typical_cycle_time_sec
        )
      )
    `)
    .eq('id', modelId)
    .single();
  
  if (error || !model) {
    throw new Error('Model not found');
  }
  
  const requestedSet = new Set(requestedCodes);
  
  // Process stations
  const stations: ModelStationDetail[] = model.stations.map((s: any) => ({
    id: s.id,
    boardType: s.board_type,
    sequence: s.sequence,
    stationCode: s.station?.code || '',
    stationName: s.station?.name || '',
    description: s.station?.description || '',
    manpower: s.manpower || 0,
    uph: s.station?.typical_uph || null,
    cycleTime: s.station?.typical_cycle_time_sec || null,
    investment: null, // TODO: Add to station_master
    isMatched: requestedSet.has(s.station?.code)
  }));
  
  // Find bottleneck (lowest UPH)
  const stationsWithUPH = stations.filter(s => s.uph && s.uph > 0);
  const bottleneck = stationsWithUPH.length > 0
    ? stationsWithUPH.reduce((min, s) => s.uph! < min.uph! ? s : min)
    : null;
  
  return {
    id: model.id,
    code: model.code,
    customer: {
      code: model.customer?.code || '',
      name: model.customer?.name || ''
    },
    boardTypes: model.board_types || [],
    status: model.status,
    stations,
    summary: {
      totalStations: stations.length,
      totalManpower: stations.reduce((sum, s) => sum + s.manpower, 0),
      totalInvestment: 0, // TODO
      bottleneckStation: bottleneck?.stationCode || '',
      bottleneckUPH: bottleneck?.uph || 0
    }
  };
}
```

### Task 3: API Routes

**File: `app/api/rfq/similarity/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { findSimilarModels } from '@/lib/rfq/similarity-engine';

export async function POST(request: NextRequest) {
  try {
    const { stationCodes, limit = 3, minSimilarity = 70 } = await request.json();
    
    if (!stationCodes || !Array.isArray(stationCodes)) {
      return NextResponse.json({ error: 'stationCodes array required' }, { status: 400 });
    }
    
    const results = await findSimilarModels(stationCodes, limit, minSimilarity);
    
    return NextResponse.json({
      success: true,
      query: {
        stationCodes,
        count: stationCodes.length
      },
      results,
      hasMatches: results.length > 0
    });
  } catch (error) {
    console.error('Similarity search error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
```

**File: `app/api/rfq/[id]/model/[modelId]/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getModelDetails } from '@/lib/rfq/similarity-engine';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; modelId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestedCodes = searchParams.get('codes')?.split(',') || [];
    
    const modelDetail = await getModelDetails(params.modelId, requestedCodes);
    
    // Calculate comparison
    const requestedSet = new Set(requestedCodes);
    const modelCodes = new Set(modelDetail.stations.map(s => s.stationCode));
    
    const comparison = {
      matched: requestedCodes.filter(c => modelCodes.has(c)),
      extra: [...modelCodes].filter(c => !requestedSet.has(c)),
      missing: requestedCodes.filter(c => !modelCodes.has(c)),
      matchPercentage: Math.round(
        (requestedCodes.filter(c => modelCodes.has(c)).length / requestedCodes.length) * 100
      )
    };
    
    return NextResponse.json({
      success: true,
      model: modelDetail,
      comparison
    });
  } catch (error) {
    console.error('Get model detail error:', error);
    return NextResponse.json({ error: 'Failed to get model' }, { status: 500 });
  }
}
```

### Task 4: UI Components

**File: `components/rfq/SimilarModelCard.tsx`**
**File: `components/rfq/StationComparisonSideBySide.tsx`**
**File: `components/rfq/StationDetailsTable.tsx`**
**File: `components/rfq/CostSummaryCard.tsx`**
**File: `components/rfq/RecommendationsBox.tsx`**

### Task 5: Results Page
**File: `app/(dashboard)/rfq/[id]/results/page.tsx`**

### Task 6: Model Detail Page
**File: `app/(dashboard)/rfq/[id]/results/[modelId]/page.tsx`**

---

## 📁 File Structure

```
lib/rfq/
├── types.ts                  # Extended types for Phase 6B
└── similarity-engine.ts      # Jaccard similarity + model details

app/api/rfq/
├── similarity/
│   └── route.ts              # Similarity search endpoint
└── [id]/
    └── model/[modelId]/
        └── route.ts          # Model detail endpoint

components/rfq/
├── SimilarModelCard.tsx      # Model card with medal emoji
├── NoMatchesFound.tsx        # Empty state
├── StationComparisonSideBySide.tsx  # Side-by-side comparison
├── StationDetailsTable.tsx   # Full station details per board type
├── CostSummaryCard.tsx       # Cost breakdown
└── RecommendationsBox.tsx    # AI recommendations

app/(dashboard)/rfq/[id]/results/
├── page.tsx                  # Results summary (TOP 3)
└── [modelId]/
    └── page.tsx              # Model detail view
```

---

## ✅ Acceptance Criteria

### Similarity Search
- [ ] Jaccard similarity correctly calculated
- [ ] Returns TOP 3 models with ≥70% similarity
- [ ] Handles "no matches" gracefully
- [ ] Shows matched/extra/missing station counts on cards

### Side-by-Side Comparison
- [ ] Clear visual: YOUR REQUEST | STATUS | HISTORICAL MODEL
- [ ] ✅ Green for matched stations
- [ ] ➕ Blue for extra stations (in model, not requested)
- [ ] ➖ Orange for missing stations (requested, not in model)
- [ ] Summary counts accurate

### Station Details
- [ ] Grouped by board type (Main Board, Sub Board)
- [ ] Shows MP, UPH, Cycle time per station
- [ ] Identifies bottleneck station (lowest UPH)
- [ ] Subtotals per board type

### Cost Estimation
- [ ] Total manpower calculated
- [ ] Monthly labor cost estimated
- [ ] Line UPH from bottleneck
- [ ] Monthly capacity calculated
- [ ] Cost per unit estimated

### Recommendations
- [ ] Identifies extra stations user might need
- [ ] Generates relevant questions for customer
- [ ] Clear disclaimer about estimates

---

## 🔗 Dependency on Phase 6A

Phase 6B requires completed Phase 6A because:
1. Needs `uniqueCodes` array from `ResolutionResult`
2. Uses `ResolvedStation[]` for comparison display
3. RFQ form must exist at `/rfq/new`

**Start Phase 6B only after Phase 6A is fully working.**
