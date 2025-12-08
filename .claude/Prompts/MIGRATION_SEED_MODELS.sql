-- =====================================================
-- MIGRATION: Update model_stations to use station_master
-- Run this BEFORE seeding models
-- =====================================================

-- Step 1: Drop existing model_stations if any data exists
-- (Skip if table is empty)
TRUNCATE model_stations CASCADE;

-- Step 2: Drop old foreign key constraint
ALTER TABLE model_stations 
DROP CONSTRAINT IF EXISTS model_stations_machine_id_fkey;

-- Step 3: Add new foreign key to station_master
ALTER TABLE model_stations
ADD CONSTRAINT model_stations_station_id_fkey 
FOREIGN KEY (machine_id) REFERENCES station_master(id) ON DELETE CASCADE;

-- Step 4: Rename column for clarity (optional but recommended)
-- ALTER TABLE model_stations RENAME COLUMN machine_id TO station_id;

-- =====================================================
-- SEED: Models from staging data
-- =====================================================

-- Insert unique models
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

-- Insert model_stations using station_aliases → station_master mapping
INSERT INTO model_stations (model_id, board_type, machine_id, sequence, manpower)
SELECT DISTINCT
  m.id as model_id,
  s.type_board as board_type,
  sm.id as machine_id,
  s.sequence_no as sequence,
  1 as manpower
FROM station_data_staging s
JOIN models m ON s.model_no = m.code
JOIN station_aliases sa ON s.station_name = sa.alias_name
JOIN station_master sm ON sa.master_station_id = sm.id
JOIN customers c ON UPPER(REPLACE(REPLACE(s.customer_name, ' ', '_'), '.', '')) = c.code
WHERE s.model_no IS NOT NULL 
  AND s.station_name IS NOT NULL
  AND s.type_board IS NOT NULL
  AND (sa.customer_id = c.id OR sa.customer_id IS NULL)
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFY: Check results
-- =====================================================

-- Count summary
SELECT 
  'models' as table_name, COUNT(*) as count FROM models
UNION ALL
SELECT 'model_stations', COUNT(*) FROM model_stations;

-- Sample model with stations
SELECT 
  c.name as customer,
  m.code as model_code,
  m.name as model_name,
  ms.board_type,
  sm.code as station_code,
  sm.name as station_name,
  sm.category,
  ms.sequence
FROM models m
JOIN customers c ON m.customer_id = c.id
JOIN model_stations ms ON ms.model_id = m.id
JOIN station_master sm ON ms.machine_id = sm.id
WHERE m.code LIKE 'SMC521%'
ORDER BY m.code, ms.board_type, ms.sequence
LIMIT 30;
