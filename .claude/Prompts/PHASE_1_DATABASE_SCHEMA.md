# PHASE 1: Complete Database Schema & Seed Data

## 🎯 OBJECTIVE
Implement full database schema for RFQ AI System including vector support (pgvector), historical data tables, and seed data from EMS Test Line Reference Guide.

---

## 📋 CONTEXT

Project: RFQ AI System for EMS Manufacturing
Stack: Next.js 13 + Supabase + pgvector
Location: `D:\Projects\RFQ_AI_SYSTEM`

Reference: `EMS_Test_Line_Reference_Guide.md` in project files contains station codes, cycle times, and manpower ratios.

---

## 🗄️ DATABASE SCHEMA

### Migration 1: Enable pgvector Extension

```sql
-- Enable pgvector for similarity search
CREATE EXTENSION IF NOT EXISTS vector;
```

### Migration 2: PCB Features Table (for geometric similarity)

```sql
CREATE TABLE pcb_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES models(id) ON DELETE CASCADE,
  board_type text NOT NULL,
  
  -- Physical dimensions
  length_mm numeric NOT NULL,
  width_mm numeric NOT NULL,
  area_mm2 numeric GENERATED ALWAYS AS (length_mm * width_mm) STORED,
  thickness_mm numeric DEFAULT 1.6,
  
  -- Board characteristics
  layer_count integer DEFAULT 2,
  cavity_count integer DEFAULT 1,
  side_count integer DEFAULT 2, -- 1=single, 2=double sided SMT
  
  -- Component metrics
  smt_component_count integer DEFAULT 0,
  through_hole_count integer DEFAULT 0,
  bga_count integer DEFAULT 0,
  fine_pitch_count integer DEFAULT 0, -- <0.5mm pitch
  
  -- Complexity indicators
  has_rf boolean DEFAULT false,
  has_power_stage boolean DEFAULT false,
  has_sensors boolean DEFAULT false,
  has_display_connector boolean DEFAULT false,
  has_battery_connector boolean DEFAULT false,
  
  -- Vector embedding (384 dimensions for MiniLM)
  feature_vector vector(384),
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(model_id, board_type)
);

CREATE INDEX idx_pcb_features_model ON pcb_features(model_id);
CREATE INDEX idx_pcb_features_vector ON pcb_features USING ivfflat (feature_vector vector_cosine_ops);
```

### Migration 3: BOM Data Table

```sql
CREATE TABLE bom_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES models(id) ON DELETE CASCADE,
  board_type text NOT NULL,
  
  -- BOM summary
  total_line_items integer DEFAULT 0,
  unique_parts integer DEFAULT 0,
  total_quantity integer DEFAULT 0,
  
  -- Component categories (counts)
  ic_count integer DEFAULT 0,
  passive_count integer DEFAULT 0,  -- R, C, L
  connector_count integer DEFAULT 0,
  mechanical_count integer DEFAULT 0,
  
  -- Key components (for semantic matching)
  mcu_part_numbers text[],
  rf_module_parts text[],
  sensor_parts text[],
  power_ic_parts text[],
  
  -- Raw BOM text for embedding
  bom_text_concat text,
  bom_embedding vector(384),
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(model_id, board_type)
);

CREATE INDEX idx_bom_data_model ON bom_data(model_id);
CREATE INDEX idx_bom_embedding ON bom_data USING ivfflat (bom_embedding vector_cosine_ops);
```

### Migration 4: Historical Cost Data

```sql
CREATE TABLE model_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES models(id) ON DELETE CASCADE,
  
  -- Cost breakdown (USD)
  material_cost numeric DEFAULT 0,
  process_cost numeric DEFAULT 0,
  labor_cost numeric DEFAULT 0,
  overhead_cost numeric DEFAULT 0,
  test_cost numeric DEFAULT 0,
  fixture_cost numeric DEFAULT 0,
  router_cost numeric DEFAULT 0,
  shipment_cost numeric DEFAULT 0,
  margin_percent numeric DEFAULT 15,
  
  total_cost numeric GENERATED ALWAYS AS (
    material_cost + process_cost + labor_cost + overhead_cost + 
    test_cost + fixture_cost + router_cost + shipment_cost
  ) STORED,
  
  -- Production metrics
  actual_uph integer,
  actual_fpy numeric, -- First Pass Yield %
  production_volume integer, -- total units produced
  
  -- Validity
  valid_from date DEFAULT CURRENT_DATE,
  valid_to date,
  
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_model_costs_model ON model_costs(model_id);
```

### Migration 5: Similarity Results Cache

```sql
CREATE TABLE similarity_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_model_id uuid REFERENCES models(id) ON DELETE CASCADE,
  target_model_id uuid REFERENCES models(id) ON DELETE CASCADE,
  
  -- Similarity scores
  pcb_similarity numeric,
  bom_similarity numeric,
  overall_similarity numeric,
  
  -- Weights used
  pcb_weight numeric DEFAULT 0.6,
  bom_weight numeric DEFAULT 0.4,
  
  -- Matching details
  matched_features jsonb,
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(source_model_id, target_model_id)
);

CREATE INDEX idx_similarity_source ON similarity_cache(source_model_id);
CREATE INDEX idx_similarity_target ON similarity_cache(target_model_id);
```

---

## 🌱 SEED DATA

### Seed Machines from Reference Guide

```sql
-- Clear existing and insert comprehensive machine list
DELETE FROM machines;

INSERT INTO machines (code, name, description, category, typical_uph, cycle_time, operator_ratio) VALUES
  -- Programming
  ('OS_DOWNLOAD', 'OS Download', 'Firmware/software programming and flashing', 'Programming', 120, 30, 1.0),
  
  -- Testing
  ('MBT', 'Manual Bench Test', 'Manual rework, repair, and bench-level testing', 'Testing', 150, 24, 1.0),
  ('CAL', 'Calibration', 'Sensor calibration, voltage/current trimming', 'Testing', 200, 18, 1.0),
  ('RFT', 'RF Test', 'RF performance testing (RSSI, RSRP, frequency)', 'Testing', 90, 40, 1.0),
  ('RFT1', 'RF Test Station 1', 'Primary RF testing station', 'Testing', 90, 40, 1.0),
  ('RFT_2G4G', 'RF Test 2G-4G', 'Multi-RAT RF calibration 2G/3G/4G', 'Testing', 60, 60, 1.0),
  ('MMI', 'MMI Test', 'Man-Machine Interface testing (touch, buttons, display)', 'Testing', 144, 25, 1.0),
  ('BLMMI', 'BL MMI Test', 'Backlight and MMI combined testing', 'Testing', 144, 25, 1.0),
  ('CURRENT', 'Current Testing', 'Power consumption verification under load', 'Testing', 200, 18, 1.0),
  ('PCB_CURRENT', 'PCB Current Test', 'Board-level current draw verification', 'Testing', 240, 15, 1.0),
  ('ICT', 'In-Circuit Test', 'Automated circuit testing (~400 test points)', 'Testing', 1200, 3, 0.25),
  ('FCT', 'Functional Test', 'Full functional circuit test', 'Testing', 60, 60, 1.0),
  
  -- Inspection
  ('VISUAL', 'Visual Inspection', 'Manual optical inspection for defects', 'Inspection', 180, 20, 1.0),
  ('AOI', 'Auto Optical Inspection', 'Automated optical inspection', 'Inspection', 240, 15, 0.5),
  ('AXI', 'Auto X-Ray Inspection', 'Automated X-ray for BGA/hidden joints', 'Inspection', 120, 30, 0.5),
  ('FQC', 'Final QC', 'Final quality control before packing', 'Inspection', 120, 30, 1.0),
  ('OQC', 'Outgoing QC', 'Outgoing quality control sampling', 'Inspection', 144, 25, 1.0),
  
  -- Assembly
  ('UNDERFILL', 'Underfill', 'Epoxy underfill for BGA/CSP reliability', 'Assembly', 120, 30, 1.0),
  ('T_GREASE', 'Thermal Grease', 'Thermal interface material application', 'Assembly', 240, 15, 1.0),
  ('SHIELD', 'Shielding Cover', 'RF shielding and EMI cover installation', 'Assembly', 180, 20, 1.0),
  ('ROUTER', 'PCB Router', 'Depaneling/singulation from panel', 'Assembly', 300, 12, 0.5),
  ('LABEL', 'Labeling', 'Product labeling and serialization', 'Assembly', 360, 10, 1.0),
  ('PACKING', 'Packing', 'Final packaging', 'Assembly', 240, 15, 1.0),
  
  -- SMT (for reference)
  ('PRINTER', 'Solder Printer', 'Solder paste printing', 'SMT', 180, 20, 0.25),
  ('SPI', 'Solder Paste Inspection', 'Solder paste inspection after printing', 'SMT', 200, 18, 0.25),
  ('PNP', 'Pick and Place', 'Component placement', 'SMT', 120, 30, 0.25),
  ('REFLOW', 'Reflow Oven', 'Reflow soldering', 'SMT', 150, 24, 0.25)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  typical_uph = EXCLUDED.typical_uph,
  cycle_time = EXCLUDED.cycle_time,
  operator_ratio = EXCLUDED.operator_ratio,
  updated_at = now();
```

### Seed Sample Models (XIAOMI example)

```sql
-- Sample model with full station configuration
WITH new_model AS (
  INSERT INTO models (customer_id, code, name, status, board_types)
  SELECT 
    c.id,
    'POCO-X6-PRO-MAIN',
    'POCO X6 Pro Main Board',
    'active',
    ARRAY['Main Board', 'Sub Board']
  FROM customers c WHERE c.code = 'XIAOMI'
  ON CONFLICT (code) DO UPDATE SET updated_at = now()
  RETURNING id
)
INSERT INTO model_stations (model_id, board_type, machine_id, sequence, manpower)
SELECT 
  nm.id,
  station.board_type,
  m.id,
  station.seq,
  station.mp
FROM new_model nm
CROSS JOIN (VALUES
  ('Main Board', 'MBT', 1, 2),
  ('Main Board', 'CAL', 2, 1),
  ('Main Board', 'RFT1', 3, 2),
  ('Main Board', 'MMI', 4, 1),
  ('Main Board', 'CURRENT', 5, 1),
  ('Main Board', 'FQC', 6, 1),
  ('Sub Board', 'T_GREASE', 1, 1),
  ('Sub Board', 'SHIELD', 2, 1),
  ('Sub Board', 'VISUAL', 3, 1)
) AS station(board_type, machine_code, seq, mp)
JOIN machines m ON m.code = station.machine_code
ON CONFLICT DO NOTHING;
```

---

## 📁 FILES TO CREATE

```
supabase/migrations/
├── 20251208100000_enable_pgvector.sql
├── 20251208100001_pcb_features_table.sql
├── 20251208100002_bom_data_table.sql
├── 20251208100003_model_costs_table.sql
├── 20251208100004_similarity_cache_table.sql
├── 20251208100005_seed_machines.sql
└── 20251208100006_seed_sample_models.sql

lib/db/
├── schema.ts          # TypeScript types matching DB schema
└── seed.ts            # Programmatic seed functions
```

---

## ✅ ACCEPTANCE CRITERIA

- [ ] pgvector extension enabled in Supabase
- [ ] All tables created with proper indexes
- [ ] RLS policies applied to new tables
- [ ] Machines seeded with 25+ standard stations
- [ ] At least 3 sample models with full station configs
- [ ] TypeScript types exported for all tables
- [ ] Can query similarity using vector operations

---

## 🧪 VERIFICATION QUERIES

```sql
-- Check pgvector works
SELECT '[1,2,3]'::vector;

-- Check machines count
SELECT category, COUNT(*) FROM machines GROUP BY category;

-- Check model with stations
SELECT 
  m.code,
  ms.board_type,
  mc.code as station,
  ms.manpower
FROM models m
JOIN model_stations ms ON ms.model_id = m.id
JOIN machines mc ON mc.id = ms.machine_id
WHERE m.code = 'POCO-X6-PRO-MAIN'
ORDER BY ms.board_type, ms.sequence;
```

---

## 🚀 HOW TO RUN MIGRATIONS

```bash
# Using Supabase CLI
npx supabase db push

# Or manually via Supabase Dashboard SQL Editor
# Copy each migration file content and execute
```
