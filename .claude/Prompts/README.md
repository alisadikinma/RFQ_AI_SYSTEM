# RFQ AI System - Claude Code Development Prompts

## 📋 Overview

Phased development plan for RFQ AI System backend with LLM integration.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│                      (Next.js React)                            │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     NEXT.JS API ROUTES                          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ /api/rfq/*   │  │/api/parse/*  │  │ /api/analyze/*       │  │
│  │ CRUD         │  │ Excel/PDF    │  │ Similarity + Cost    │  │
│  └──────────────┘  └──────┬───────┘  └──────────┬───────────┘  │
│                           │                      │              │
│                           ▼                      ▼              │
│                    ┌────────────────────────────────┐           │
│                    │           LLM Layer            │           │
│                    │  ┌─────────────────────────┐   │           │
│                    │  │ Gemini 2.0 Flash (main) │   │           │
│                    │  │ Llama 3.3 70B (fallback)│   │           │
│                    │  └─────────────────────────┘   │           │
│                    └────────────────────────────────┘           │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                │
│   PostgreSQL + pgvector + RLS                                   │
│                                                                 │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐    │
│   │ station_    │  │ models      │  │ rfq_requests        │    │
│   │ master (38) │  │ (784)       │  │ rfq_results         │    │
│   └─────────────┘  └─────────────┘  └─────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database State

| Table | Records | Status |
|-------|---------|--------|
| customers | 15 | ✅ Ready |
| station_master | 38 | ✅ Ready |
| station_aliases | 257 | ✅ Ready |
| models | 784 | ✅ Ready |
| model_stations | 6,189 | ✅ Ready |
| pcb_features | 0 | ✅ Schema ready |
| bom_data | 0 | ✅ Schema ready |
| model_costs | 0 | ✅ Schema ready |
| rfq_requests | 0 | ✅ Schema ready |
| rfq_results | 0 | ✅ Schema ready |
| rfq_stations | 0 | ⚠️ **Create in Phase 5** |
| ~~machines~~ | - | ❌ DEPRECATED |

---

## 📁 Prompt Files

| Phase | File | Description | Status |
|-------|------|-------------|--------|
| 0 | `PHASE_0_FIX_UI_BUGS.md` | UI fixes, uses station_master | ✅ Updated |
| 1 | `PHASE_1_DATABASE_SCHEMA.md` | Database schema | ✅ Done |
| 2 | `PHASE_2_SIMILARITY_ENGINE.md` | AI matching with aliases | ✅ Updated |
| 3 | `PHASE_3_FILE_PARSERS.md` | Excel/PDF + LLM parsing | ✅ Updated |
| 4 | `PHASE_4_COST_ENGINE.md` | Cost calculation | ✅ Updated |
| 5 | `PHASE_5_INTEGRATION.md` | API + UI + LLM | ✅ Updated |
| - | `LLM_INTEGRATION.md` | Gemini + OpenRouter | ✅ Ready |

---

## 🚀 Execution Order

```
Phase 0 → UI Fixes (optional, if needed)
    │
    ▼
Phase 1 ✅ DONE (Database)
    │
    ▼
Phase 2 → Similarity Engine ← YOU ARE HERE
    │
    ├──────────────────┐
    ▼                  ▼
Phase 3            Phase 4
File Parsers       Cost Engine
(+LLM)             
    │                  │
    └────────┬─────────┘
             ▼
         Phase 5
    Integration (+LLM)
```

---

## 🤖 LLM Usage

| Feature | Model | Purpose |
|---------|-------|---------|
| BOM Parsing | Gemini 2.0 Flash | Extract parts from Excel |
| PDF Extraction | Gemini 2.0 Flash | Extract PCB dimensions |
| Result Explanation | Gemini 2.0 Flash | Bahasa Indonesia summary |
| Suggestions | Gemini 2.0 Flash | Improvement recommendations |
| Fallback | Llama 3.3 70B | When Gemini fails |

---

## ⚙️ Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tluqvuhayjjmfwkdskdq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# LLM - Primary (Google AI Studio)
GEMINI_API_KEY=AIzaSyBCjMPcXXD8gvvGjIQD6d2Nb23HY6_4UOc

# LLM - Fallback (OpenRouter)
OPENROUTER_API_KEY=sk-or-v1-xxxxx
```

---

## ⚠️ Important Notes

### Deprecated Table
- ❌ **DO NOT USE** `machines` table
- ✅ **USE** `station_master` table instead

### Station Alias Flow
```
Customer Input: "RFT1" or "Thermal_Gress"
         ↓
station_aliases lookup
         ↓
Resolved: RFT or T_GREASE
         ↓
station_master: full details
```

### Missing Table (Phase 5)
Run this SQL before Phase 5:
```sql
CREATE TABLE IF NOT EXISTS rfq_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id uuid REFERENCES rfq_requests(id) ON DELETE CASCADE,
  board_type text NOT NULL,
  station_code text NOT NULL,
  sequence integer NOT NULL,
  manpower integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);
```

---

## 🧪 Verification Queries

```sql
-- Check station alias resolution
SELECT 
  sa.alias_name,
  sm.code as master_code,
  sm.name as master_name,
  c.name as customer
FROM station_aliases sa
JOIN station_master sm ON sa.master_station_id = sm.id
LEFT JOIN customers c ON sa.customer_id = c.id
LIMIT 20;

-- Check model with stations (uses station_master)
SELECT 
  m.code as model,
  sm.code as station,
  sm.category,
  ms.sequence
FROM models m
JOIN model_stations ms ON ms.model_id = m.id
JOIN station_master sm ON ms.machine_id = sm.id
WHERE m.code LIKE 'POCO%'
ORDER BY ms.sequence
LIMIT 20;

-- Check inference triggers
SELECT code, name, triggers_if, required_for
FROM station_master
WHERE triggers_if != '{}';
```

---

## 📊 Quick Stats

- **38** standard station definitions
- **257** customer-specific aliases
- **784** historical models
- **6,189** model-station relationships
- **15** customers
