# Phase 7C: Extracted Data Table & Similar Model Cards

## 🎯 OBJECTIVE
Implementasi tampilan hasil ekstraksi (Extracted Data Table) dan Similar Model Cards dengan WOW effect animations.

---

## ⚠️ PRE-REQUISITES

1. **Phase 7A & 7B HARUS selesai** ✅
2. **Baca PROJECT_STATUS.md** - pastikan Phase 7A & 7B sudah ✅
3. Install tambahan jika belum:
```bash
npm install react-countup
```

---

## 📋 TASKS

### Task 1: Results Components
```
components/rfq/chat-v2/
├── results/
│   ├── ExtractedDataTable.tsx   # Editable station table
│   ├── SimilarModelCards.tsx    # Container for 3 cards
│   ├── ModelCard.tsx            # Individual card with animation
│   └── ScoreRing.tsx            # Animated circular progress
├── animations/
│   └── motion-variants.ts       # Framer Motion configs
```

---

## 📁 FILE IMPLEMENTATIONS

### 1. motion-variants.ts (Animation Configs)
```tsx
// components/rfq/chat-v2/animations/motion-variants.ts

export const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 50, 
    scale: 0.9 
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.15,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
  hover: {
    y: -8,
    scale: 1.02,
    boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
    transition: { duration: 0.2 },
  },
  tap: {
    scale: 0.98,
    transition: { duration: 0.1 },
  },
};

export const tableRowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
    },
  }),
};

export const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
    },
  },
};

export const pulseGlow = {
  animate: {
    boxShadow: [
      "0 0 0 0 rgba(59, 130, 246, 0)",
      "0 0 0 10px rgba(59, 130, 246, 0.3)",
      "0 0 0 20px rgba(59, 130, 246, 0)",
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
    },
  },
};
```

### 2. ExtractedDataTable.tsx
```tsx
// components/rfq/chat-v2/results/ExtractedDataTable.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Check,
  AlertTriangle,
  X,
  Plus,
  Trash2,
  GripVertical,
  Search,
  Edit2,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { tableRowVariants, fadeInUp } from "../animations/motion-variants";

export interface ExtractedStation {
  id: string;
  code: string;
  name?: string;
  section?: string;
  sequence: number;
  isValid: boolean;
  suggestedCode?: string;
  confidence?: number;
}

interface ExtractedDataTableProps {
  stations: ExtractedStation[];
  onStationsChange: (stations: ExtractedStation[]) => void;
  onFindSimilar: (stations: ExtractedStation[]) => void;
  isEditing?: boolean;
}

export function ExtractedDataTable({
  stations,
  onStationsChange,
  onFindSimilar,
  isEditing: initialEditing = false,
}: ExtractedDataTableProps) {
  const [isEditing, setIsEditing] = useState(initialEditing);
  const [editedStations, setEditedStations] = useState(stations);

  const validCount = editedStations.filter((s) => s.isValid).length;
  const invalidCount = editedStations.filter((s) => !s.isValid).length;

  const handleCodeChange = (id: string, newCode: string) => {
    setEditedStations((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, code: newCode, isValid: true, suggestedCode: undefined }
          : s
      )
    );
  };

  const handleDelete = (id: string) => {
    setEditedStations((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAdd = () => {
    const newStation: ExtractedStation = {
      id: crypto.randomUUID(),
      code: "",
      sequence: editedStations.length + 1,
      isValid: false,
    };
    setEditedStations((prev) => [...prev, newStation]);
  };

  const handleSave = () => {
    onStationsChange(editedStations);
    setIsEditing(false);
  };

  const handleUseSuggestion = (id: string, suggestedCode: string) => {
    setEditedStations((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, code: suggestedCode, isValid: true, suggestedCode: undefined }
          : s
      )
    );
  };

  const getStatusIcon = (station: ExtractedStation) => {
    if (station.isValid) {
      return <Check className="h-4 w-4 text-green-500" />;
    }
    if (station.suggestedCode) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
    return <X className="h-4 w-4 text-red-500" />;
  };

  const getStatusText = (station: ExtractedStation) => {
    if (station.isValid) return "Valid";
    if (station.suggestedCode) return `→ ${station.suggestedCode}`;
    return "Tidak ditemukan";
  };

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-3">
          <span className="text-lg">📋</span>
          <div>
            <h3 className="font-semibold text-white">
              Extracted Stations ({editedStations.length})
            </h3>
            <p className="text-xs text-zinc-500">
              <span className="text-green-500">{validCount} valid</span>
              {invalidCount > 0 && (
                <span className="text-yellow-500 ml-2">
                  {invalidCount} perlu review
                </span>
              )}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          className="text-zinc-400 hover:text-white"
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4 mr-1" /> Simpan
            </>
          ) : (
            <>
              <Edit2 className="h-4 w-4 mr-1" /> Edit
            </>
          )}
        </Button>
      </div>

      {/* Table */}
      <div className="max-h-[400px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="w-12 text-zinc-400">#</TableHead>
              <TableHead className="text-zinc-400">Station Code</TableHead>
              <TableHead className="text-zinc-400">Section</TableHead>
              <TableHead className="w-40 text-zinc-400">Status</TableHead>
              {isEditing && (
                <TableHead className="w-12 text-zinc-400"></TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {editedStations.map((station, index) => (
                <motion.tr
                  key={station.id}
                  custom={index}
                  variants={tableRowVariants}
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, x: -20 }}
                  className={cn(
                    "border-zinc-800",
                    index % 2 === 0 ? "bg-zinc-900/30" : "bg-transparent",
                    !station.isValid && "bg-yellow-500/5"
                  )}
                >
                  <TableCell className="text-zinc-500 font-mono">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input
                        value={station.code}
                        onChange={(e) =>
                          handleCodeChange(station.id, e.target.value)
                        }
                        className="h-8 bg-zinc-800 border-zinc-700 text-white"
                      />
                    ) : (
                      <span className="font-mono text-white font-medium">
                        {station.code}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-zinc-400">
                    {station.section || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(station)}
                      <span
                        className={cn(
                          "text-sm",
                          station.isValid
                            ? "text-green-500"
                            : station.suggestedCode
                            ? "text-yellow-500"
                            : "text-red-500"
                        )}
                      >
                        {getStatusText(station)}
                      </span>
                      {station.suggestedCode && !station.isValid && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-blue-400 hover:text-blue-300"
                          onClick={() =>
                            handleUseSuggestion(station.id, station.suggestedCode!)
                          }
                        >
                          Gunakan
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  {isEditing && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-zinc-500 hover:text-red-500"
                        onClick={() => handleDelete(station.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800 bg-zinc-900">
        {isEditing ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAdd}
            className="text-zinc-400 hover:text-white"
          >
            <Plus className="h-4 w-4 mr-1" /> Tambah Station
          </Button>
        ) : (
          <div />
        )}
        <Button
          onClick={() => onFindSimilar(editedStations)}
          disabled={validCount === 0}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Search className="h-4 w-4 mr-2" />
          Cari Model Serupa
        </Button>
      </div>
    </motion.div>
  );
}
```

### 3. ScoreRing.tsx (Animated Circular Progress)
```tsx
// components/rfq/chat-v2/results/ScoreRing.tsx
"use client";

import { motion } from "framer-motion";
import CountUp from "react-countup";
import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number; // 0-100
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const sizeConfig = {
  sm: { width: 60, stroke: 4, fontSize: "text-sm" },
  md: { width: 80, stroke: 5, fontSize: "text-lg" },
  lg: { width: 100, stroke: 6, fontSize: "text-2xl" },
};

export function ScoreRing({ score, size = "md", showLabel = true, className }: ScoreRingProps) {
  const config = sizeConfig[size];
  const radius = (config.width - config.stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  // Color based on score
  const getColor = () => {
    if (score >= 80) return { stroke: "#10b981", glow: "rgba(16, 185, 129, 0.4)" };
    if (score >= 60) return { stroke: "#f59e0b", glow: "rgba(245, 158, 11, 0.4)" };
    return { stroke: "#ef4444", glow: "rgba(239, 68, 68, 0.4)" };
  };

  const colors = getColor();

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      {/* Glow effect */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: config.width,
          height: config.width,
          boxShadow: `0 0 20px ${colors.glow}`,
        }}
        animate={{
          boxShadow: [
            `0 0 10px ${colors.glow}`,
            `0 0 25px ${colors.glow}`,
            `0 0 10px ${colors.glow}`,
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* SVG Ring */}
      <svg width={config.width} height={config.width} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={config.stroke}
          fill="none"
          className="text-zinc-800"
        />
        {/* Progress circle */}
        <motion.circle
          cx={config.width / 2}
          cy={config.width / 2}
          r={radius}
          stroke={colors.stroke}
          strokeWidth={config.stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>

      {/* Score Text */}
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold text-white", config.fontSize)}>
            <CountUp end={score} duration={1.5} suffix="%" />
          </span>
        </div>
      )}
    </div>
  );
}
```

### 4. ModelCard.tsx
```tsx
// components/rfq/chat-v2/results/ModelCard.tsx
"use client";

import { motion } from "framer-motion";
import { Users, Gauge, Clock, ChevronRight } from "lucide-react";
import { ScoreRing } from "./ScoreRing";
import { cardVariants } from "../animations/motion-variants";
import { cn } from "@/lib/utils";

export interface SimilarModel {
  id: string;
  code: string;
  customerName: string;
  customerCode: string;
  similarity: number;
  stationCount: number;
  matchedStations: number;
  manpower: number;
  uph: number;
  cycleTime?: number;
}

interface ModelCardProps {
  model: SimilarModel;
  rank: 1 | 2 | 3;
  index: number;
  onClick: () => void;
}

const rankConfig = {
  1: { emoji: "🥇", gradient: "from-yellow-500/20 to-yellow-600/10", border: "border-yellow-500/30" },
  2: { emoji: "🥈", gradient: "from-zinc-400/20 to-zinc-500/10", border: "border-zinc-400/30" },
  3: { emoji: "🥉", gradient: "from-orange-500/20 to-orange-600/10", border: "border-orange-500/30" },
};

export function ModelCard({ model, rank, index, onClick }: ModelCardProps) {
  const config = rankConfig[rank];

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-2xl border bg-gradient-to-br p-6 transition-colors",
        config.gradient,
        config.border,
        "hover:border-blue-500/50"
      )}
    >
      {/* Rank Badge */}
      <motion.div
        className="absolute -top-3 -left-3 text-3xl"
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: index * 0.15 + 0.3, type: "spring" }}
      >
        {config.emoji}
      </motion.div>

      {/* Score Ring */}
      <div className="flex justify-center mb-4">
        <ScoreRing score={Math.round(model.similarity * 100)} size="md" />
      </div>

      {/* Model Info */}
      <div className="text-center mb-4">
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
          {model.customerName}
        </p>
        <h3 className="text-lg font-bold text-white truncate">{model.code}</h3>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="text-center p-2 rounded-lg bg-zinc-900/50">
          <Users className="h-4 w-4 text-blue-400 mx-auto mb-1" />
          <p className="text-sm font-semibold text-white">{model.manpower}</p>
          <p className="text-xs text-zinc-500">MP</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-zinc-900/50">
          <Gauge className="h-4 w-4 text-green-400 mx-auto mb-1" />
          <p className="text-sm font-semibold text-white">{model.uph}</p>
          <p className="text-xs text-zinc-500">UPH</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-zinc-900/50">
          <Clock className="h-4 w-4 text-purple-400 mx-auto mb-1" />
          <p className="text-sm font-semibold text-white">{model.stationCount}</p>
          <p className="text-xs text-zinc-500">Stations</p>
        </div>
      </div>

      {/* Match Info */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-zinc-400">
          {model.matchedStations}/{model.stationCount} stations match
        </span>
        <ChevronRight className="h-4 w-4 text-zinc-500" />
      </div>

      {/* Hover Glow Effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        style={{
          background: "radial-gradient(circle at center, rgba(59, 130, 246, 0.15), transparent 70%)",
        }}
      />
    </motion.div>
  );
}
```

### 5. SimilarModelCards.tsx (Container)
```tsx
// components/rfq/chat-v2/results/SimilarModelCards.tsx
"use client";

import { motion } from "framer-motion";
import { ModelCard, SimilarModel } from "./ModelCard";
import { staggerContainer, fadeInUp } from "../animations/motion-variants";
import { Sparkles } from "lucide-react";

interface SimilarModelCardsProps {
  models: SimilarModel[];
  onSelectModel: (model: SimilarModel) => void;
}

export function SimilarModelCards({ models, onSelectModel }: SimilarModelCardsProps) {
  // Take top 3 models
  const topModels = models.slice(0, 3);

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Sparkles className="h-5 w-5 text-yellow-500" />
        </motion.div>
        <div>
          <h3 className="font-semibold text-white">Model Serupa Ditemukan</h3>
          <p className="text-sm text-zinc-400">
            Top 3 model dengan similarity tertinggi
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {topModels.map((model, index) => (
          <ModelCard
            key={model.id}
            model={model}
            rank={(index + 1) as 1 | 2 | 3}
            index={index}
            onClick={() => onSelectModel(model)}
          />
        ))}
      </motion.div>

      {/* Additional Results Note */}
      {models.length > 3 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-sm text-zinc-500 text-center"
        >
          +{models.length - 3} model lainnya tersedia
        </motion.p>
      )}
    </motion.div>
  );
}
```

### 6. Update MessageBubble untuk Results

```tsx
// Update components/rfq/chat-v2/main/MessageBubble.tsx

import { ExtractedDataTable, ExtractedStation } from "../results/ExtractedDataTable";
import { SimilarModelCards, SimilarModel } from "../results/SimilarModelCards";

// Add to ChatMessage interface
export interface ChatMessage {
  // ... existing fields
  extractedStations?: ExtractedStation[];
  similarModels?: SimilarModel[];
}

// Update render to include results
export function MessageBubble({ message, onFindSimilar, onSelectModel }: MessageBubbleProps) {
  // ... existing code ...

  return (
    <motion.div /* ... */ >
      {/* ... avatar and content ... */}

      {/* Extracted Stations Table */}
      {message.extractedStations && message.extractedStations.length > 0 && (
        <div className="mt-4">
          <ExtractedDataTable
            stations={message.extractedStations}
            onStationsChange={(stations) => {
              // Update message stations
            }}
            onFindSimilar={onFindSimilar}
          />
        </div>
      )}

      {/* Similar Models Cards */}
      {message.similarModels && message.similarModels.length > 0 && (
        <div className="mt-4">
          <SimilarModelCards
            models={message.similarModels}
            onSelectModel={onSelectModel}
          />
        </div>
      )}
    </motion.div>
  );
}
```

---

## 🎨 ANIMATION SPECIFICATIONS

### Card Entrance
```
- Initial: opacity 0, y +50, scale 0.9
- Stagger delay: 150ms between cards
- Duration: 500ms
- Easing: easeOutQuad
```

### Card Hover
```
- Y offset: -8px (lift)
- Scale: 1.02
- Box shadow: 0 20px 40px rgba(0,0,0,0.3)
- Duration: 200ms
```

### Score Ring
```
- Stroke animation: 0% → actual%
- Duration: 1500ms
- Easing: easeOut
- Counter animation: count from 0
- Glow pulse: infinite
```

### Table Rows
```
- Initial: opacity 0, x -20
- Stagger delay: 50ms
- Duration: 300ms
```

---

## 📊 MOCK DATA FOR TESTING

```tsx
// lib/mock/similar-models.ts

export const mockSimilarModels: SimilarModel[] = [
  {
    id: "1",
    code: "5G_PRO_V2",
    customerName: "XIAOMI",
    customerCode: "XI",
    similarity: 0.91,
    stationCount: 11,
    matchedStations: 9,
    manpower: 12,
    uph: 150,
    cycleTime: 240,
  },
  {
    id: "2",
    code: "4G_PLUS_V1",
    customerName: "HUAWEI",
    customerCode: "HW",
    similarity: 0.82,
    stationCount: 9,
    matchedStations: 7,
    manpower: 8,
    uph: 180,
    cycleTime: 200,
  },
  {
    id: "3",
    code: "TABLET_5G",
    customerName: "TCL",
    customerCode: "TC",
    similarity: 0.73,
    stationCount: 10,
    matchedStations: 7,
    manpower: 10,
    uph: 120,
    cycleTime: 300,
  },
];

export const mockExtractedStations: ExtractedStation[] = [
  { id: "1", code: "MBT", sequence: 1, isValid: true },
  { id: "2", code: "CAL1", sequence: 2, isValid: true },
  { id: "3", code: "CAL2", sequence: 3, isValid: true },
  { id: "4", code: "RF_TEST", sequence: 4, isValid: false, suggestedCode: "RFT" },
  { id: "5", code: "WIFIBT", sequence: 5, isValid: true },
  { id: "6", code: "4G_INSTRUMENT", sequence: 6, isValid: true },
  { id: "7", code: "MAINBOARD_MMI", sequence: 7, isValid: true },
  { id: "8", code: "SUBBOARD_MMI", sequence: 8, isValid: true },
  { id: "9", code: "UNKNOWN_TEST", sequence: 9, isValid: false },
  { id: "10", code: "VISUAL", sequence: 10, isValid: true },
  { id: "11", code: "PACKING", sequence: 11, isValid: true },
];
```

---

## ✅ ACCEPTANCE CRITERIA

- [ ] ExtractedDataTable shows all stations
- [ ] Valid/invalid status icons display correctly
- [ ] Edit mode allows changing station codes
- [ ] Suggested code "Gunakan" button works
- [ ] Add/delete station in edit mode works
- [ ] "Cari Model Serupa" button triggers search
- [ ] 3 ModelCards display with stagger animation
- [ ] Score ring animates from 0 to actual percentage
- [ ] Card hover shows lift + glow effect
- [ ] Card click triggers onSelectModel
- [ ] Rank badges (🥇🥈🥉) animate in
- [ ] Stats grid shows manpower/UPH/stations
- [ ] Match count shows X/Y format
- [ ] Mobile responsive (cards stack vertically)

---

## 📝 POST-COMPLETION

**WAJIB UPDATE** `PROJECT_STATUS.md`:

```markdown
### [YYYY-MM-DD] Phase 7C Complete
- ExtractedDataTable dengan edit capability
- SimilarModelCards dengan 3-card layout
- ScoreRing animated progress
- Framer Motion animations
- Files created:
  - components/rfq/chat-v2/results/ExtractedDataTable.tsx
  - components/rfq/chat-v2/results/SimilarModelCards.tsx
  - components/rfq/chat-v2/results/ModelCard.tsx
  - components/rfq/chat-v2/results/ScoreRing.tsx
  - components/rfq/chat-v2/animations/motion-variants.ts
  - lib/mock/similar-models.ts
```

Update progress bar:
```
Phase 7C: Results & Cards         ████████████████████ 100% ✅
```

---

**NEXT**: Lanjut ke Phase 7D untuk Model Detail Modal & Polish
