# Phase 7E: Board Type Tabs & Investment Integration

## 🎯 REQUIREMENTS
Setelah migration `MIGRATION_CONSOLIDATED.sql` dijalankan, tambahkan fitur:
1. **Board Type Tabs** - Tampilkan stations per board type (Main Board, Sub Board, dll)
2. **Investment from Database** - Ambil `total_investment` dari `model_groups` table
3. **Variant Information** - Tampilkan emmc_size dan ram_size untuk Main Board variants

---

## 📊 UPDATED DATA INTERFACES

### Updated SimilarModel Interface
```tsx
// types/rfq.ts

export interface BoardVariant {
  id: string;
  code: string;
  boardType: string;          // "Main Board", "Sub Board", "LED Board", etc.
  emmcSize?: string;          // "256G", "128G", "32G"
  ramSize?: string;           // "12G", "8G", "3G"
  investment: number;         // Individual board investment
  stationCount: number;
  manpower: number;
  uph?: number;
}

export interface SimilarModel {
  id: string;                 // This is now model_group.id
  typeModel: string;          // "N16", "C3S", "ZS660KL"
  customerName: string;
  customerCode: string;
  
  // Similarity
  similarity: number;         // 0.0 - 1.0
  
  // Aggregated from all boards
  totalBoards: number;        // Count of board types
  totalStations: number;      // Sum across all boards
  matchedStations: number;
  totalManpower: number;
  totalInvestment: number;    // From model_groups.total_investment
  
  // Board variants (from models table)
  boards: BoardVariant[];
  
  // Legacy compatibility
  stationCount?: number;      // = totalStations
  manpower?: number;          // = totalManpower
  uph?: number;               // From first Main Board
  cycleTime?: number;
}
```

### Updated ExtractedStation Interface
```tsx
export interface ExtractedStation {
  id: string;
  code: string;
  name?: string;
  section?: string;
  boardType?: string;         // NEW: Which board this station belongs to
  sequence: number;
  isValid: boolean;
  suggestedCode?: string;
  confidence?: number;
}
```

---

## 📁 COMPONENTS TO CREATE/UPDATE

### 1. ModelDetailModal.tsx (With Board Tabs)
```tsx
// components/rfq/chat-v2/results/ModelDetailModal.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  X, FileText, FileSpreadsheet, CheckCircle, 
  Cpu, CircuitBoard, Lightbulb, Usb, Radio, Box 
} from "lucide-react";
import { SimilarModel, BoardVariant } from "@/types/rfq";
import { ExtractedStation } from "./ExtractedDataTable";
import { ComparisonTable } from "./ComparisonTable";
import { InvestmentSummary } from "./InvestmentSummary";
import { BoardStationsTable } from "./BoardStationsTable";
import { ScoreRing } from "./ScoreRing";

// Board type icons
const BOARD_ICONS: Record<string, React.ElementType> = {
  "Main Board": Cpu,
  "Sub Board": CircuitBoard,
  "LED Board": Lightbulb,
  "USB Board": Usb,
  "SUB_ANT Board": Radio,
  "default": Box,
};

interface ModelDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: SimilarModel | null;
  queryStations: ExtractedStation[];
  onUseModel: (model: SimilarModel) => void;
}

export function ModelDetailModal({
  isOpen,
  onClose,
  model,
  queryStations,
  onUseModel,
}: ModelDetailModalProps) {
  const [activeBoard, setActiveBoard] = useState<string>("overview");
  
  if (!model) return null;

  const rankEmoji = 
    model.similarity >= 0.85 ? "🥇" : 
    model.similarity >= 0.70 ? "🥈" : "🥉";

  // Format currency
  const formatRupiah = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 gap-0 bg-zinc-900 border-zinc-800 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col h-full"
        >
          {/* Header */}
          <DialogHeader className="relative px-6 py-4 border-b border-zinc-800 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
            <div className="flex items-center gap-4">
              <span className="text-3xl">{rankEmoji}</span>
              <ScoreRing score={Math.round(model.similarity * 100)} size="sm" />
              
              <div className="flex-1">
                <DialogTitle className="text-xl font-bold text-white flex items-center gap-3">
                  {model.customerName} - {model.typeModel}
                  <Badge variant="secondary" className="ml-2">
                    {model.totalBoards} Board{model.totalBoards > 1 ? 's' : ''}
                  </Badge>
                </DialogTitle>
                <p className="text-sm text-zinc-400">
                  {model.matchedStations} dari {model.totalStations} stations match • 
                  Investment: {formatRupiah(model.totalInvestment)}
                </p>
              </div>

              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          {/* Board Type Tabs */}
          <Tabs value={activeBoard} onValueChange={setActiveBoard} className="flex-1 flex flex-col">
            <div className="border-b border-zinc-800 px-6">
              <TabsList className="bg-transparent h-auto p-0 gap-2">
                {/* Overview Tab */}
                <TabsTrigger 
                  value="overview"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-blue-600"
                >
                  📊 Overview
                </TabsTrigger>
                
                {/* Board Type Tabs */}
                {model.boards.map((board) => {
                  const Icon = BOARD_ICONS[board.boardType] || BOARD_ICONS.default;
                  return (
                    <TabsTrigger
                      key={board.id}
                      value={board.id}
                      className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-t-lg rounded-b-none border-b-2 border-transparent data-[state=active]:border-blue-600 flex items-center gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {board.boardType}
                      {board.emmcSize && board.emmcSize !== "0GB" && (
                        <span className="text-xs text-zinc-400">
                          ({board.ramSize}/{board.emmcSize})
                        </span>
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <ScrollArea className="flex-1 px-6 py-4">
              {/* Overview Tab Content */}
              <TabsContent value="overview" className="mt-0 space-y-6">
                {/* Investment Summary */}
                <InvestmentSummary 
                  model={model} 
                  showBoardBreakdown={true}
                />

                {/* Station Comparison (all boards) */}
                <ComparisonTable
                  queryStations={queryStations}
                  modelBoards={model.boards}
                />
              </TabsContent>

              {/* Individual Board Tab Contents */}
              {model.boards.map((board) => (
                <TabsContent key={board.id} value={board.id} className="mt-0 space-y-6">
                  {/* Board Info Card */}
                  <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {board.boardType}
                        </h3>
                        <p className="text-sm text-zinc-400">
                          Model: {board.code}
                        </p>
                      </div>
                      {board.emmcSize && board.emmcSize !== "0GB" && (
                        <div className="text-right">
                          <p className="text-sm text-zinc-400">Variant</p>
                          <p className="text-lg font-semibold text-white">
                            {board.ramSize} / {board.emmcSize}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Board Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 rounded-lg bg-zinc-900">
                        <p className="text-2xl font-bold text-white">{board.stationCount}</p>
                        <p className="text-xs text-zinc-500">Stations</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-zinc-900">
                        <p className="text-2xl font-bold text-white">{board.manpower}</p>
                        <p className="text-xs text-zinc-500">Manpower</p>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-zinc-900">
                        <p className="text-2xl font-bold text-white">
                          {formatRupiah(board.investment).replace('IDR', 'Rp')}
                        </p>
                        <p className="text-xs text-zinc-500">Investment</p>
                      </div>
                    </div>
                  </div>

                  {/* Board Stations Table */}
                  <BoardStationsTable 
                    boardId={board.id}
                    boardType={board.boardType}
                  />
                </TabsContent>
              ))}
            </ScrollArea>
          </Tabs>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="border-zinc-700">
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm" className="border-zinc-700">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
            <Button onClick={() => onUseModel(model)} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Gunakan Model Ini
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
```

### 2. BoardStationsTable.tsx (NEW COMPONENT)
```tsx
// components/rfq/chat-v2/results/BoardStationsTable.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

interface BoardStation {
  id: string;
  stationCode: string;
  stationName: string;
  sequence: number;
  manpower: number;
  cycleTime?: number;
  area?: string;
}

interface BoardStationsTableProps {
  boardId: string;
  boardType: string;
}

export function BoardStationsTable({ boardId, boardType }: BoardStationsTableProps) {
  const [stations, setStations] = useState<BoardStation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStations = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/models/${boardId}/stations`);
        const data = await response.json();
        setStations(data.stations || []);
      } catch (error) {
        console.error("Error fetching stations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStations();
  }, [boardId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 bg-zinc-800">
        <h3 className="font-semibold text-white">
          📋 Station List - {boardType}
        </h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800 hover:bg-transparent">
            <TableHead className="w-12 text-zinc-400">#</TableHead>
            <TableHead className="text-zinc-400">Station Code</TableHead>
            <TableHead className="text-zinc-400">Station Name</TableHead>
            <TableHead className="text-zinc-400 text-center">Manpower</TableHead>
            <TableHead className="text-zinc-400 text-center">Cycle Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {stations.map((station, index) => (
            <motion.tr
              key={station.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border-zinc-800"
            >
              <TableCell className="text-zinc-500 font-mono">{station.sequence}</TableCell>
              <TableCell className="font-mono text-white font-medium">{station.stationCode}</TableCell>
              <TableCell className="text-zinc-300">{station.stationName || "-"}</TableCell>
              <TableCell className="text-center text-white">{station.manpower}</TableCell>
              <TableCell className="text-center text-zinc-400">
                {station.cycleTime ? `${station.cycleTime}s` : "-"}
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

### 3. Updated InvestmentSummary.tsx
Add board breakdown section:
```tsx
// Add to InvestmentSummary.tsx

interface InvestmentSummaryProps {
  model: SimilarModel;
  showBoardBreakdown?: boolean;  // NEW prop
}

// Add this section in the component when showBoardBreakdown is true:
{showBoardBreakdown && model.boards && model.boards.length > 1 && (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.5 }}
    className="rounded-xl border border-zinc-800 overflow-hidden"
  >
    <div className="px-4 py-3 bg-zinc-800">
      <h3 className="font-semibold text-white">📦 Investment per Board Type</h3>
    </div>
    <div className="p-4 space-y-2">
      {model.boards.map((board, index) => (
        <motion.div
          key={board.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 + index * 0.1 }}
          className="flex items-center justify-between py-2 border-b border-zinc-800 last:border-0"
        >
          <div className="flex items-center gap-3">
            <span className="text-zinc-400">{board.boardType}</span>
            {board.emmcSize && board.emmcSize !== "0GB" && (
              <Badge variant="outline" className="text-xs">
                {board.ramSize}/{board.emmcSize}
              </Badge>
            )}
          </div>
          <span className="font-semibold text-white">
            {formatRupiah(board.investment)}
          </span>
        </motion.div>
      ))}
      <div className="pt-2 border-t border-zinc-700 flex justify-between font-bold">
        <span className="text-white">TOTAL</span>
        <span className="text-white text-lg">
          {formatRupiah(model.totalInvestment)}
        </span>
      </div>
    </div>
  </motion.div>
)}
```

---

## 🔗 API ENDPOINTS TO CREATE

### GET /api/models/[id]/stations
```tsx
// app/api/models/[id]/stations/route.ts

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  
  const { data: stations, error } = await supabase
    .from("model_stations")
    .select(`
      id,
      station_code,
      sequence,
      manpower,
      board_type,
      area,
      station_master:station_code (
        name,
        typical_cycle_time_sec
      )
    `)
    .eq("model_id", params.id)
    .order("sequence");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    stations: stations.map(s => ({
      id: s.id,
      stationCode: s.station_code,
      stationName: s.station_master?.name,
      sequence: s.sequence,
      manpower: s.manpower || 1,
      cycleTime: s.station_master?.typical_cycle_time_sec,
      area: s.area,
    })),
  });
}
```

### POST /api/model-groups/similar
```tsx
// app/api/model-groups/similar/route.ts

import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { stations, limit = 5 } = await request.json();

  // Get similar model groups using similarity engine
  const { data: groups, error } = await supabase
    .from("v_model_groups_summary")
    .select("*")
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform to SimilarModel format
  const similarModels = groups.map(g => ({
    id: g.id,
    typeModel: g.type_model,
    customerName: g.customer_name,
    customerCode: g.customer_code,
    similarity: 0.85, // TODO: Calculate actual similarity
    totalBoards: g.total_boards,
    totalStations: g.total_stations,
    matchedStations: Math.floor(g.total_stations * 0.8), // TODO: Calculate actual
    totalManpower: g.total_manpower,
    totalInvestment: g.total_investment,
    boards: g.boards || [],
    // Legacy compatibility
    stationCount: g.total_stations,
    manpower: g.total_manpower,
  }));

  return NextResponse.json({ models: similarModels });
}
```

---

## ✅ ACCEPTANCE CRITERIA

- [ ] Model groups shown instead of individual models in search results
- [ ] Board type tabs visible in modal
- [ ] Per-board station tables load correctly (lazy loaded)
- [ ] Investment breakdown per board type shown
- [ ] Main Board variants display RAM/eMMC specs
- [ ] Total investment fetched from database (not calculated client-side)
- [ ] API endpoints return grouped data correctly
- [ ] Loading states shown during data fetch

---

## 📝 DEPENDENCIES

**Prerequisites:**
1. Run `MIGRATION_CONSOLIDATED.sql` in Supabase SQL Editor
2. Ensure Phase 7D base modal is complete

**Uses existing components:**
- `lib/api/model-groups.ts` (already created)
- `components/models/ModelGroupCard.tsx` (already created)
- `components/models/BoardTypeTabs.tsx` (already created)

---

## 🎯 EXECUTION ORDER

1. Verify migration was run successfully
2. Create API endpoint `/api/models/[id]/stations`
3. Create API endpoint `/api/model-groups/similar`
4. Update `ModelDetailModal.tsx` with board tabs
5. Create `BoardStationsTable.tsx` component
6. Update `InvestmentSummary.tsx` with board breakdown
7. Update `types/rfq.ts` with new interfaces
8. Test all components together
