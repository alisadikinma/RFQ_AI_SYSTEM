# PHASE 1: Database Schema (UPDATED)

## 🎯 OBJECTIVE
Verify and complete database schema. Most tables already created via Supabase SQL Editor.

---

## 📋 CURRENT STATE (Already Created)

| Table | Status | Records |
|-------|--------|---------|
| customers | ✅ Done | 15 |
| station_master | ✅ Done | 38 |
| station_aliases | ✅ Done | 257 |
| station_data_staging | ✅ Done | 6,212 |
| models | ⏳ Needs data | - |
| model_stations | ⏳ Needs data | - |

---

## 🗄️ EXISTING SCHEMA (Reference)

### station_master (Standard EMS Stations)
```sql
CREATE TABLE station_master (
  id uuid PRIMARY KEY,
  code text UNIQUE NOT NULL,           -- Standard code: MBT, CAL, RFT
  name text NOT NULL,                   -- Full name
  description text NOT NULL,            -- What this station does
  category text NOT NULL,               -- Testing, Assembly, Inspection, Programming
  typical_cycle_time_sec integer,       -- Default cycle time
  typical_uph integer,                  -- Default UPH
  operator_ratio numeric DEFAULT 1.0,   -- Operators per station
  triggers_if text[],                   -- AI inference triggers
  required_for text[],                  -- Product types needing this
  created_at timestamptz DEFAULT now()
);
```

### station_aliases (Customer Names → Standard)
```sql
CREATE TABLE station_aliases (
  id uuid PRIMARY KEY,
  alias_name text NOT NULL,             -- Customer's term: "RFT1", "RF_Test"
  master_station_id uuid REFERENCES station_master(id),
  customer_id uuid REFERENCES customers(id),  -- NULL = global
  confidence text DEFAULT 'high',       -- high, medium, low
  UNIQUE(alias_name, customer_id)
);
```

---

## 🔧 REMAINING MIGRATIONS

### Migration 1: Enable pgvector
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### Migration 2: PCB Features Table
```sql
CREATE TABLE IF NOT EXISTS pcb_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES models(id) ON DELETE CASCADE,
  board_type text NOT NULL,
  
  -- Dimensions
  length_mm numeric NOT NULL,
  width_mm numeric NOT NULL,
  area_mm2 numeric GENERATED ALWAYS AS (length_mm * width_mm) STORED,
  layer_count integer DEFAULT 2,
  cavity_count integer DEFAULT 1,
  side_count integer DEFAULT 2,
  
  -- Component counts
  smt_component_count integer DEFAULT 0,
  bga_count integer DEFAULT 0,
  fine_pitch_count integer DEFAULT 0,
  
  -- Flags for AI inference
  has_rf boolean DEFAULT false,
  has_power_stage boolean DEFAULT false,
  has_sensors boolean DEFAULT false,
  has_display_connector boolean DEFAULT false,
  has_battery_connector boolean DEFAULT false,
  
  -- Vector embedding
  feature_vector vector(384),
  
  created_at timestamptz DEFAULT now(),
  UNIQUE(model_id, board_type)
);

ALTER TABLE pcb_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated" ON pcb_features FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow read anon" ON pcb_features FOR SELECT TO anon USING (true);
```

### Migration 3: BOM Data Table
```sql
CREATE TABLE IF NOT EXISTS bom_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES models(id) ON DELETE CASCADE,
  board_type text NOT NULL,
  
  -- Counts
  total_line_items integer DEFAULT 0,
  ic_count integer DEFAULT 0,
  passive_count integer DEFAULT 0,
  connector_count integer DEFAULT 0,
  
  -- Key parts (arrays)
  mcu_part_numbers text[],
  rf_module_parts text[],
  sensor_parts text[],
  
  -- Embedding
  bom_embedding vector(384),
  
  created_at timestamptz DEFAULT now(),
  UNIQUE(model_id, board_type)
);

ALTER TABLE bom_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated" ON bom_data FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow read anon" ON bom_data FOR SELECT TO anon USING (true);
```

### Migration 4: Model Costs Table
```sql
CREATE TABLE IF NOT EXISTS model_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES models(id) ON DELETE CASCADE,
  
  -- Cost breakdown (USD)
  material_cost numeric DEFAULT 0,
  process_cost numeric DEFAULT 0,
  labor_cost numeric DEFAULT 0,
  overhead_cost numeric DEFAULT 0,
  test_cost numeric DEFAULT 0,
  fixture_cost numeric DEFAULT 0,
  
  total_cost numeric GENERATED ALWAYS AS (
    material_cost + process_cost + labor_cost + overhead_cost + test_cost + fixture_cost
  ) STORED,
  
  -- Metrics
  actual_uph integer,
  actual_fpy numeric,
  production_volume integer,
  
  created_at timestamptz DEFAULT now()
);

ALTER TABLE model_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated" ON model_costs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow read anon" ON model_costs FOR SELECT TO anon USING (true);
```

### Migration 5: RFQ Tables
```sql
CREATE TABLE IF NOT EXISTS rfq_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id),
  model_name text NOT NULL,
  target_uph integer,
  target_volume integer,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rfq_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id uuid REFERENCES rfq_requests(id) ON DELETE CASCADE,
  matched_model_id uuid REFERENCES models(id),
  similarity_score numeric,
  matched_stations jsonb,
  missing_stations jsonb,
  inferred_stations jsonb,
  investment_breakdown jsonb,
  risk_assessment jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rfq_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfq_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all authenticated" ON rfq_requests FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all authenticated" ON rfq_results FOR ALL TO authenticated USING (true);
```

---

## 🌱 SEED MODELS FROM STAGING

```sql
-- Extract unique models from staging → models table
INSERT INTO models (customer_id, code, name, status, board_types)
SELECT 
  c.id as customer_id,
  s.model_no as code,
  COALESCE(s.type_model, s.model_no) as name,
  'active' as status,
  ARRAY_AGG(DISTINCT s.type_board) as board_types
FROM station_data_staging s
JOIN customers c ON UPPER(REPLACE(REPLACE(s.customer_name, ' ', '_'), '.', '')) = c.code
WHERE s.model_no IS NOT NULL AND s.model_no != ''
GROUP BY c.id, s.model_no, s.type_model
ON CONFLICT (code) DO UPDATE SET
  board_types = EXCLUDED.board_types,
  updated_at = now();

-- Create model_stations using station_master (not machines)
INSERT INTO model_stations (model_id, board_type, machine_id, sequence, manpower)
SELECT DISTINCT
  m.id as model_id,
  s.type_board as board_type,
  sm.id as machine_id,  -- References station_master
  s.sequence_no as sequence,
  1 as manpower
FROM station_data_staging s
JOIN models m ON s.model_no = m.code
JOIN station_aliases sa ON s.station_name = sa.alias_name
JOIN station_master sm ON sa.master_station_id = sm.id
WHERE s.model_no IS NOT NULL AND s.station_name IS NOT NULL
ON CONFLICT DO NOTHING;
```

---

## 📁 FILES TO UPDATE

```
lib/db/
├── types.ts           # Add StationMaster, StationAlias types
└── queries.ts         # Add getStationByAlias(), getMasterStations()
```

---

## ✅ ACCEPTANCE CRITERIA

- [ ] pgvector extension enabled
- [ ] pcb_features, bom_data, model_costs tables created
- [ ] rfq_requests, rfq_results tables created
- [ ] Models populated from staging (~600 models)
- [ ] model_stations linked via station_master
- [ ] TypeScript types match schema

---

## 🧪 VERIFICATION

```sql
-- Check model count
SELECT COUNT(*) FROM models;  -- Expected: ~600

-- Check model with stations via master
SELECT 
  m.code as model,
  ms.board_type,
  sm.code as station_code,
  sm.name as station_name,
  sm.category
FROM models m
JOIN model_stations ms ON ms.model_id = m.id
JOIN station_master sm ON ms.machine_id = sm.id
WHERE m.code LIKE 'SMC521%'
LIMIT 20;
```
