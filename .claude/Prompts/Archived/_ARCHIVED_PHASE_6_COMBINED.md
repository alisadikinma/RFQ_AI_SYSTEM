# PHASE_6_NEW_RFQ_SMART_FLOW.md

## 🎯 Objective
Enhance the New RFQ form to implement an intelligent workflow that:
1. Accepts customer documents (Excel/PDF) or manual station input (with SMART PASTE)
2. Resolves customer station names to standard station codes using 3-level intelligence
3. Performs similarity search to find TOP 3 matching historical models
4. Displays detailed results with SIDE-BY-SIDE comparison, manpower, and cost information

---

## 📊 Customer Document Format (CRITICAL!)

### Sample Excel Structure (XIAOMI Format)

Customer documents vary significantly. Here's a real example:

| 序号 No. | 工段 Section | 选择 Status | 工艺路线 Process Routing | 工艺名称 Process Name | 工艺边界 Process Description | 工艺编号 Code |
|----------|--------------|-------------|-------------------------|----------------------|------------------------------|---------------|
| 1 | 板测 Board level testing | 1 | 主板测试 Board testing | MBT | MBT测试及物料取放 MBT testing, material pick and place | SA001 |
| 2 | 板测 Board level testing | 0 | 主板测试 Board testing | CAL1 | CAL1测试及物料取放 CAL1 testing | SA002 |
| 3 | 板测 Board level testing | 1 | 主板测试 Board testing | RFT1 | RF1测试及物料取放 RF1 testing | SA004 |
| 4 | 板测 Board level testing | 0 | 主板测试 Mainboard testing | WIFIBT | WIFIBT测试及物料取放 WIFIBT testing | SA006 |
| 5 | 板测 Board level testing | 0 | 主板测试 Mainboard testing | 4G仪表 | 板测段测试用4G仪表... 4G instrumentation | SA007 |
| 6 | 板测 Board level testing | 1 | 主板测试 Mainboard testing | 5G仪表 | 板测段测试用5G仪表... 5G instrumentation | SA008 |
| 7 | 板测 Board level testing | 1 | 主板测试 Mainboard testing | 主板MMI | 主板MMI抽检及物料取放 Mainboard MMI spot check | SA009 |
| 8 | 板测 Board level testing | 1 | 主板测试 Mainboard testing | 副板MMI | 副板MMI抽检及物料取放 Sub-board MMI spot check | SA010 |

### Key Observations

1. **Format is NOT standardized** - Different customers use different column names/structures
2. **Multi-language content** (MUST support all three):
   - **Mandarin (中文)**: 主板测试, 物料取放, 仪表, 抽检
   - **English**: Board testing, material pick and place
   - **Indonesian**: Possible in some documents
   - **Mixed in same cell**: "主板MMI Mainboard MMI"
3. **Important columns to extract**:
   - **Section/工段**: Board type (板测 = Board level testing)
   - **Process Name/工艺名称**: Station name (MBT, CAL1, RFT1, 4G仪表, etc.)
   - **Process Description/工艺边界**: Description for semantic matching
   - **Status/选择**: 1 = enabled, 0 = disabled (filter ONLY enabled!)

---

## 📋 SMART PASTE FEATURE (CRITICAL!)

### User Flow for Manual Input

User can copy ENTIRE columns from Excel and paste directly into our textarea.
System MUST intelligently detect and parse the tabular data.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SMART PASTE WORKFLOW                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Step 1: USER COPIES FROM EXCEL                                          │
│  ──────────────────────────────                                          │
│  User selects multiple columns in Excel (including headers) and          │
│  presses Ctrl+C. Excel clipboard contains TAB-separated values:          │
│                                                                          │
│  "序号\t工段\t选择\t工艺名称\t工艺边界\n"                                  │
│  "1\t板测\t1\tMBT\tMBT测试及物料取放\n"                                   │
│  "2\t板测\t0\tCAL1\tCAL1测试及物料取放\n"                                 │
│  "3\t板测\t1\tRFT1\tRF1测试及物料取放\n"                                  │
│  ...                                                                     │
│                                                                          │
│  Step 2: USER PASTES INTO TEXTAREA                                       │
│  ─────────────────────────────────                                       │
│  User pastes (Ctrl+V) into our manual input textarea                    │
│                                                                          │
│  Step 3: SMART DETECTION (on paste event)                                │
│  ────────────────────────────────────────                                │
│  System detects:                                                         │
│  • Contains TAB characters (\t) → Likely Excel paste                    │
│  • Multiple lines with consistent column count → Tabular data           │
│  • First line looks like headers → Has column names                     │
│                                                                          │
│  Step 4: AUTO-CONVERT TO TABLE PREVIEW                                   │
│  ─────────────────────────────────────                                   │
│  System shows a modal or inline table preview:                           │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  📊 Detected Table Data (7 columns × 12 rows)                    │    │
│  │                                                                  │    │
│  │  ┌────────┬────────┬────────┬──────────┬──────────────────┐    │    │
│  │  │ 序号   │ 工段   │ 选择   │ 工艺名称 │ 工艺边界         │    │    │
│  │  ├────────┼────────┼────────┼──────────┼──────────────────┤    │    │
│  │  │ 1      │ 板测   │ 1      │ MBT      │ MBT测试及物料... │    │    │
│  │  │ 2      │ 板测   │ 0      │ CAL1     │ CAL1测试及物料...│    │    │
│  │  │ 3      │ 板测   │ 1      │ RFT1     │ RF1测试及物料... │    │    │
│  │  │ ...    │ ...    │ ...    │ ...      │ ...              │    │    │
│  │  └────────┴────────┴────────┴──────────┴──────────────────┘    │    │
│  │                                                                  │    │
│  │  🔍 Select columns:                                              │    │
│  │  • Station Name: [工艺名称 ▼]  (auto-detected)                   │    │
│  │  • Description:  [工艺边界 ▼]  (auto-detected)                   │    │
│  │  • Board Type:   [工段 ▼]      (auto-detected)                   │    │
│  │  • Status:       [选择 ▼]      (auto-detected)                   │    │
│  │                                                                  │    │
│  │  ☑ Filter only enabled (选择=1)                                  │    │
│  │                                                                  │    │
│  │  [Cancel]                              [✓ Use This Data]         │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Step 5: COLUMN MAPPING (auto + manual override)                         │
│  ───────────────────────────────────────────────                         │
│  • System auto-detects column purposes using LLM or heuristics          │
│  • User can manually override if detection is wrong                     │
│  • Dropdowns allow selecting which column = station name, etc.          │
│                                                                          │
│  Step 6: EXTRACT & PROCEED                                               │
│  ─────────────────────────                                               │
│  Click "Use This Data" → Extract enabled stations → Continue flow       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Smart Paste Detection Logic

```typescript
interface PasteDetectionResult {
  isTabular: boolean;
  rows: string[][];
  headers: string[];
  columnCount: number;
  rowCount: number;
  detectedColumns: {
    stationName: number | null;  // column index
    description: number | null;
    boardType: number | null;
    status: number | null;
  };
  confidence: 'high' | 'medium' | 'low';
}

function detectPastedData(text: string): PasteDetectionResult {
  // 1. Check for TAB characters (Excel paste indicator)
  const hasTabsǃ = text.includes('\t');
  
  // 2. Split into lines and columns
  const lines = text.trim().split('\n');
  const rows = lines.map(line => line.split('\t'));
  
  // 3. Check column consistency
  const columnCounts = rows.map(r => r.length);
  const isConsistent = columnCounts.every(c => c === columnCounts[0]);
  
  // 4. Detect if first row is header
  const firstRow = rows[0];
  const looksLikeHeader = firstRow.some(cell => 
    /工艺|Process|Station|Name|序号|No|Section|Status|选择|Description/i.test(cell)
  );
  
  // 5. Auto-detect column purposes
  const detectedColumns = detectColumnPurposes(firstRow);
  
  return {
    isTabular: hasTabs && isConsistent && rows.length > 1,
    rows: looksLikeHeader ? rows.slice(1) : rows,
    headers: looksLikeHeader ? firstRow : [],
    columnCount: columnCounts[0] || 0,
    rowCount: rows.length - (looksLikeHeader ? 1 : 0),
    detectedColumns,
    confidence: calculateConfidence(...)
  };
}

function detectColumnPurposes(headers: string[]): DetectedColumns {
  const result = { stationName: null, description: null, boardType: null, status: null };
  
  headers.forEach((header, index) => {
    const h = header.toLowerCase();
    // Station name detection
    if (/工艺名称|process.*name|station|站点/.test(h)) {
      result.stationName = index;
    }
    // Description detection
    if (/工艺边界|description|描述|说明/.test(h)) {
      result.description = index;
    }
    // Board type detection
    if (/工段|section|board|板/.test(h)) {
      result.boardType = index;
    }
    // Status detection
    if (/选择|status|状态|enable/.test(h)) {
      result.status = index;
    }
  });
  
  return result;
}
```

### UI Component: SmartPasteTextarea

```tsx
// components/rfq/SmartPasteTextarea.tsx

interface SmartPasteTextareaProps {
  onDataExtracted: (stations: ExtractedStation[]) => void;
}

export function SmartPasteTextarea({ onDataExtracted }: SmartPasteTextareaProps) {
  const [rawText, setRawText] = useState('');
  const [showTablePreview, setShowTablePreview] = useState(false);
  const [detectedData, setDetectedData] = useState<PasteDetectionResult | null>(null);
  
  const handlePaste = (e: React.ClipboardEvent) => {
    const pastedText = e.clipboardData.getData('text');
    const detection = detectPastedData(pastedText);
    
    if (detection.isTabular && detection.rowCount > 0) {
      e.preventDefault(); // Prevent default paste
      setDetectedData(detection);
      setShowTablePreview(true);
    } else {
      // Not tabular, allow normal paste
      setRawText(pastedText);
    }
  };
  
  return (
    <>
      <textarea
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        onPaste={handlePaste}
        placeholder={`Enter station names (one per line or comma-separated)

Or copy & paste directly from Excel - we'll detect the format automatically!

Example:
MBT
CAL1, CAL2
RFT1
主板MMI
VISUAL`}
      />
      
      {showTablePreview && detectedData && (
        <TablePreviewModal
          data={detectedData}
          onConfirm={handleConfirm}
          onCancel={() => setShowTablePreview(false)}
        />
      )}
    </>
  );
}
```

---

## 🔄 SIDE-BY-SIDE COMPARISON (Model Detail Page)

### Design Philosophy
When user clicks "View Details" on a matching model, they MUST see a clear, convincing comparison that shows:
1. **What they requested** vs **What this historical model has**
2. **Matched stations** (green ✅)
3. **Extra stations** in historical model (blue ➕)
4. **Missing stations** they need but model doesn't have (orange ➖)
5. **Full details** of each station from historical model

### Page 4: Enhanced Model Detail View (`/rfq/[id]/results/[modelId]`)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ← Back to Results                                                       │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     🏆 92% MATCH                                 │    │
│  │  ┌──────────────────────────┐   ┌──────────────────────────┐   │    │
│  │  │   📋 YOUR REQUEST        │   │   📦 HISTORICAL MODEL     │   │    │
│  │  │   (New RFQ)              │   │   POCO-X6-PRO             │   │    │
│  │  │                          │   │   Customer: XIAOMI        │   │    │
│  │  │   Customer: XIAOMI       │   │   Status: Active          │   │    │
│  │  │   Model: POCO-X7         │   │   Created: 2024-03-15     │   │    │
│  │  │   Qty: 50,000/month      │   │   Production: 6 months    │   │    │
│  │  └──────────────────────────┘   └──────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  📊 STATION COMPARISON (Side-by-Side)                            │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │                                                                  │    │
│  │  ┌──────────────────────┬───────────┬──────────────────────┐    │    │
│  │  │   YOUR REQUEST       │  STATUS   │   POCO-X6-PRO        │    │    │
│  │  │   (Resolved)         │           │   (Historical)       │    │    │
│  │  ├──────────────────────┼───────────┼──────────────────────┤    │    │
│  │  │ ✅ MBT               │  ═══════  │ ✅ MBT               │    │    │
│  │  │    Manual Bench Test │  MATCH    │    Manual Bench Test │    │    │
│  │  ├──────────────────────┼───────────┼──────────────────────┤    │    │
│  │  │ ✅ CAL               │  ═══════  │ ✅ CAL               │    │    │
│  │  │    Calibration       │  MATCH    │    Calibration       │    │    │
│  │  ├──────────────────────┼───────────┼──────────────────────┤    │    │
│  │  │ ✅ RFT               │  ═══════  │ ✅ RFT               │    │    │
│  │  │    RF Test           │  MATCH    │    RF Test           │    │    │
│  │  ├──────────────────────┼───────────┼──────────────────────┤    │    │
│  │  │ ✅ MMI               │  ═══════  │ ✅ MMI               │    │    │
│  │  │    Interface Test    │  MATCH    │    Interface Test    │    │    │
│  │  ├──────────────────────┼───────────┼──────────────────────┤    │    │
│  │  │ ✅ VISUAL            │  ═══════  │ ✅ VISUAL            │    │    │
│  │  │    Inspection        │  MATCH    │    Inspection        │    │    │
│  │  ├──────────────────────┼───────────┼──────────────────────┤    │    │
│  │  │ ✅ CURRENT           │  ═══════  │ ✅ CURRENT           │    │    │
│  │  │    Current Test      │  MATCH    │    Current Test      │    │    │
│  │  ├──────────────────────┼───────────┼──────────────────────┤    │    │
│  │  │                      │  ➕ EXTRA │ ➕ OS_DOWNLOAD       │    │    │
│  │  │         -            │  IN MODEL │    Firmware Flash    │    │    │
│  │  ├──────────────────────┼───────────┼──────────────────────┤    │    │
│  │  │                      │  ➕ EXTRA │ ➕ UNDERFILL         │    │    │
│  │  │         -            │  IN MODEL │    BGA Underfill     │    │    │
│  │  ├──────────────────────┼───────────┼──────────────────────┤    │    │
│  │  │ ➖ T_GREASE          │  MISSING  │                      │    │    │
│  │  │    Thermal Grease    │  IN MODEL │         -            │    │    │
│  │  └──────────────────────┴───────────┴──────────────────────┘    │    │
│  │                                                                  │    │
│  │  📈 MATCH SUMMARY:                                               │    │
│  │  • Matched: 6 stations (✅)                                      │    │
│  │  • Extra in model: 2 stations (➕) - you may also need these     │    │
│  │  • Missing in model: 1 station (➖) - model doesn't have this    │    │
│  │                                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  🏭 HISTORICAL MODEL STATION DETAILS                             │    │
│  │  (Full breakdown from POCO-X6-PRO production history)            │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │                                                                  │    │
│  │  📋 Main Board (主板) - 8 stations                               │    │
│  │  ┌────┬──────────┬────────────────────┬────┬─────┬───────┬─────────┐ │
│  │  │ #  │ Station  │ Description        │ MP │ UPH │Cycle  │ Invest  │ │
│  │  ├────┼──────────┼────────────────────┼────┼─────┼───────┼─────────┤ │
│  │  │ 1  │ MBT      │ Manual Bench Test  │ 2  │ 30  │ 120s  │ $8,000  │ │
│  │  │ 2  │ CAL      │ Calibration        │ 1  │ 60  │ 60s   │ $15,000 │ │
│  │  │ 3  │ RFT      │ Radio Frequency    │ 2  │ 45  │ 80s   │ $25,000 │ │
│  │  │ 4  │ MMI      │ Interface Test     │ 1  │ 90  │ 40s   │ $12,000 │ │
│  │  │ 5  │ VISUAL   │ Visual Inspection  │ 2  │ 120 │ 30s   │ $5,000  │ │
│  │  │ 6  │ CURRENT  │ Current Testing    │ 1  │ 90  │ 40s   │ $10,000 │ │
│  │  │ 7  │ OS_DL    │ Firmware Flash     │ 1  │ 100 │ 36s   │ $8,000  │ │
│  │  │ 8  │ UNDERFILL│ BGA Underfill      │ 1  │ 80  │ 45s   │ $20,000 │ │
│  │  ├────┴──────────┴────────────────────┼────┼─────┼───────┼─────────┤ │
│  │  │ SUBTOTAL (Main Board)              │ 11 │ 30* │   -   │$103,000 │ │
│  │  └────────────────────────────────────┴────┴─────┴───────┴─────────┘ │
│  │                                                                  │    │
│  │  📋 Sub Board (副板) - 4 stations                                │    │
│  │  ┌────┬──────────┬────────────────────┬────┬─────┬───────┬─────────┐ │
│  │  │ #  │ Station  │ Description        │ MP │ UPH │Cycle  │ Invest  │ │
│  │  ├────┼──────────┼────────────────────┼────┼─────┼───────┼─────────┤ │
│  │  │ 1  │ MBT      │ Manual Bench Test  │ 1  │ 40  │ 90s   │ $6,000  │ │
│  │  │ 2  │ CAL      │ Calibration        │ 1  │ 80  │ 45s   │ $12,000 │ │
│  │  │ 3  │ VISUAL   │ Visual Inspection  │ 1  │ 150 │ 24s   │ $4,000  │ │
│  │  │ 4  │ MMI      │ Sub-board MMI      │ 1  │ 100 │ 36s   │ $8,000  │ │
│  │  ├────┴──────────┴────────────────────┼────┼─────┼───────┼─────────┤ │
│  │  │ SUBTOTAL (Sub Board)               │ 4  │ 40* │   -   │ $30,000 │ │
│  │  └────────────────────────────────────┴────┴─────┴───────┴─────────┘ │
│  │                                                                  │    │
│  │  * Line UPH limited by bottleneck station                       │    │
│  │  💡 BOTTLENECK: MBT on Main Board (30 UPH) limits total output  │    │
│  │                                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  💰 COST ESTIMATION (Based on POCO-X6-PRO Historical Data)       │    │
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
│  │  │ 💲 Est. Cost per Unit       │ $1.45       │ @ 50K vol/month ││    │
│  │  └─────────────────────────────┴─────────────┴─────────────────┘│    │
│  │                                                                  │    │
│  │  ⚠️ IMPORTANT: These are estimates based on similar historical   │    │
│  │     model. Actual costs may vary based on your specific needs.   │    │
│  │                                                                  │    │
│  │  💡 RECOMMENDATION:                                               │    │
│  │  • Your request needs T_GREASE which this model doesn't have    │    │
│  │  • Consider adding ~$15,000 investment + 1 MP for T_GREASE      │    │
│  │  • Model has OS_DOWNLOAD & UNDERFILL - confirm if you need these│    │
│  │                                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌─────────────────────┐  ┌─────────────────────┐                       │
│  │  📄 Export Report    │  │  ✅ Use as Reference │                       │
│  └─────────────────────┘  └─────────────────────┘                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Side-by-Side Comparison Component

```tsx
// components/rfq/StationComparisonSideBySide.tsx

interface ComparisonProps {
  yourStations: ResolvedStation[];
  modelStations: ModelStation[];
  matchedStations: string[];
  extraStations: string[];   // In model but not in your request
  missingStations: string[]; // In your request but not in model
}

export function StationComparisonSideBySide({
  yourStations,
  modelStations,
  matchedStations,
  extraStations,
  missingStations
}: ComparisonProps) {
  // Build comparison rows
  const rows: ComparisonRow[] = [];
  
  // 1. Add matched stations (both sides have)
  matchedStations.forEach(code => {
    const yourStation = yourStations.find(s => s.resolvedCode === code);
    const modelStation = modelStations.find(s => s.code === code);
    rows.push({
      type: 'match',
      left: yourStation,
      right: modelStation
    });
  });
  
  // 2. Add extra stations (model has, you don't)
  extraStations.forEach(code => {
    const modelStation = modelStations.find(s => s.code === code);
    rows.push({
      type: 'extra',
      left: null,
      right: modelStation
    });
  });
  
  // 3. Add missing stations (you have, model doesn't)
  missingStations.forEach(code => {
    const yourStation = yourStations.find(s => s.resolvedCode === code);
    rows.push({
      type: 'missing',
      left: yourStation,
      right: null
    });
  });
  
  return (
    <table className="w-full">
      <thead>
        <tr>
          <th className="text-left">YOUR REQUEST</th>
          <th className="text-center">STATUS</th>
          <th className="text-right">HISTORICAL MODEL</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <ComparisonRow key={i} row={row} />
        ))}
      </tbody>
    </table>
  );
}

function ComparisonRow({ row }: { row: ComparisonRow }) {
  const statusConfig = {
    match: { icon: '═══', label: 'MATCH', color: 'green' },
    extra: { icon: '➕', label: 'EXTRA IN MODEL', color: 'blue' },
    missing: { icon: '➖', label: 'MISSING IN MODEL', color: 'orange' }
  };
  
  const config = statusConfig[row.type];
  
  return (
    <tr className={`border-b border-${config.color}-200`}>
      <td className="py-3">
        {row.left ? (
          <div className="flex items-center gap-2">
            <span className={`text-${config.color}-600`}>
              {row.type === 'match' ? '✅' : '➖'}
            </span>
            <div>
              <div className="font-medium">{row.left.resolvedCode}</div>
              <div className="text-sm text-gray-500">{row.left.resolvedName}</div>
            </div>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
      <td className="text-center py-3">
        <span className={`px-3 py-1 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-700`}>
          {config.icon} {config.label}
        </span>
      </td>
      <td className="text-right py-3">
        {row.right ? (
          <div className="flex items-center justify-end gap-2">
            <div className="text-right">
              <div className="font-medium">{row.right.code}</div>
              <div className="text-sm text-gray-500">{row.right.name}</div>
            </div>
            <span className={`text-${config.color}-600`}>
              {row.type === 'match' ? '✅' : '➕'}
            </span>
          </div>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
    </tr>
  );
}
```

---

## 📋 Current State

### Existing Database Tables
```sql
-- station_master: 38 standard stations
-- Fields: id, code, name, description, category, typical_cycle_time_sec, typical_uph, operator_ratio

-- station_aliases: 257 known mappings
-- Fields: id, master_station_id, alias_name, customer_id (nullable = global alias)

-- models: 784 historical models
-- Fields: id, customer_id, code, name, status, board_types

-- model_stations: 6,189 station assignments
-- Fields: id, model_id, board_type, machine_id (FK to station_master), sequence, manpower

-- customers: 15 customers
-- Fields: id, code, name
```

---

## 🔄 New RFQ Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         NEW RFQ WORKFLOW                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  STEP 1: INPUT (3 options)                                               │
│  ─────────────────────────                                               │
│  ├── Option A: Upload Excel file (.xlsx, .xls)                          │
│  ├── Option B: Upload PDF file (.pdf)                                   │
│  └── Option C: Manual/Smart Paste (copy from Excel → auto-detect)       │
│                           ↓                                              │
│  STEP 2: PARSE & PREVIEW                                                 │
│  ───────────────────────                                                 │
│  • Excel: Read file, detect columns                                     │
│  • PDF: LLM extraction                                                  │
│  • Smart Paste: Detect tabular data, show preview, let user map columns │
│  → User confirms extracted stations before proceeding                   │
│                           ↓                                              │
│  STEP 3: INTELLIGENT STATION RESOLUTION (3-Level)                        │
│  ─────────────────────────────────────────────────                       │
│  For each station: Exact → Alias → Semantic (LLM)                       │
│  Multi-language support: 中文, English, Indonesian                       │
│                           ↓                                              │
│  STEP 4: SIMILARITY SEARCH                                               │
│  ─────────────────────────                                               │
│  Jaccard similarity on resolved station codes                           │
│  Return TOP 3 with score ≥ 70%                                          │
│                           ↓                                              │
│  STEP 5: DISPLAY RESULTS                                                 │
│  ──────────────────────                                                  │
│  • Resolution summary with confidence badges                            │
│  • TOP 3 model cards with similarity %                                  │
│  • Click "View Details" → Side-by-side comparison page                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Implementation Tasks

### Task 1: Types & Interfaces
**File: `lib/rfq/types.ts`**

### Task 2: Smart Paste Detection
**File: `lib/rfq/paste-detector.ts`**

### Task 3: Station Resolver (3-Level)
**File: `lib/rfq/station-resolver.ts`**

### Task 4: Document Parser
**File: `lib/rfq/document-parser.ts`**

### Task 5: Similarity Engine
**File: `lib/rfq/similarity-engine.ts`**

### Task 6: API Routes
**File: `app/api/rfq/process/route.ts`**

### Task 7: RFQ Form UI with Smart Paste
**File: `app/(dashboard)/rfq/new/page.tsx`**
- Tab interface (Excel/PDF/Manual)
- Smart paste textarea with table preview modal
- Column mapping UI

### Task 8: Results Page
**File: `app/(dashboard)/rfq/[id]/results/page.tsx`**

### Task 9: Model Detail Page with Side-by-Side
**File: `app/(dashboard)/rfq/[id]/results/[modelId]/page.tsx`**
- Header with match score
- Side-by-side station comparison
- Full station details table
- Cost summary
- Recommendations

### Components to Create:
```
components/rfq/
├── SmartPasteTextarea.tsx      # Textarea with paste detection
├── TablePreviewModal.tsx        # Modal showing detected table
├── ColumnMappingDropdowns.tsx   # Column mapping UI
├── ProcessingProgress.tsx       # Step indicator
├── StationResolutionTable.tsx   # Resolution summary
├── SimilarModelCard.tsx         # TOP 3 cards
├── StationComparisonSideBySide.tsx  # Side-by-side comparison
├── StationDetailsTable.tsx      # Full details per board type
├── CostSummaryCard.tsx          # Cost breakdown
└── RecommendationsBox.tsx       # AI recommendations
```

---

## ✅ Acceptance Criteria

### Smart Paste
- [ ] Detects Excel paste (TAB-separated) automatically
- [ ] Shows table preview modal with detected columns
- [ ] Auto-detects column purposes (station name, description, status, board type)
- [ ] Allows manual override of column mapping
- [ ] Filters only enabled rows (status=1)
- [ ] Works with multi-language content (CN/EN/ID)

### Side-by-Side Comparison
- [ ] Clear visual separation: YOUR REQUEST | STATUS | HISTORICAL MODEL
- [ ] Green ✅ for matched stations
- [ ] Blue ➕ for extra stations (in model, not in request)
- [ ] Orange ➖ for missing stations (in request, not in model)
- [ ] Summary counts for each category
- [ ] Full station details with MP, UPH, Cycle, Investment
- [ ] Bottleneck indicator
- [ ] Cost estimation
- [ ] Actionable recommendations

### Overall
- [ ] Convincing presentation that helps user decide if model is a good match
- [ ] All information needed to make informed decision
- [ ] Clean, professional UI
- [ ] Mobile responsive

---

## 🚀 Execution Order

1. `lib/rfq/types.ts` - All TypeScript interfaces
2. `lib/rfq/paste-detector.ts` - Smart paste detection
3. `lib/rfq/station-resolver.ts` - 3-level resolution
4. `lib/rfq/document-parser.ts` - Excel/PDF parsing
5. `lib/rfq/similarity-engine.ts` - Jaccard similarity
6. `app/api/rfq/process/route.ts` - Main API
7. `components/rfq/SmartPasteTextarea.tsx` - Smart paste UI
8. `components/rfq/TablePreviewModal.tsx` - Preview modal
9. `components/rfq/StationComparisonSideBySide.tsx` - Comparison
10. `app/(dashboard)/rfq/new/page.tsx` - Form page
11. `app/(dashboard)/rfq/[id]/results/page.tsx` - Results page
12. `app/(dashboard)/rfq/[id]/results/[modelId]/page.tsx` - Detail page

---

## 📚 Reference Documents

- `EMS_Test_Line_Reference_Guide.md` - Station definitions and cycle times
- `README.md` - System architecture overview
- Database: 38 stations, 257 aliases, 784 models, 6,189 assignments
