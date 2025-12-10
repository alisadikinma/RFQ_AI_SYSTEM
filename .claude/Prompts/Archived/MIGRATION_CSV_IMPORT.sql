-- ============================================================================
-- CSV DATA IMPORT: Full import from dataStationList.csv
-- Purpose: Import with correct type_model, emmc_size, ram_size, board_type
-- Run AFTER: MIGRATION_MODEL_GROUPS.sql
-- ============================================================================

-- ============================================================================
-- STEP 1: Create temporary staging table
-- ============================================================================

DROP TABLE IF EXISTS staging_station_list;
CREATE TABLE staging_station_list (
    customer_name VARCHAR(255),
    model_no VARCHAR(255),
    station_name VARCHAR(255),
    area VARCHAR(100),
    sequence_no INTEGER,
    type_board VARCHAR(100),
    type_model VARCHAR(100),
    description_model TEXT,
    emmc_size VARCHAR(20),
    ram_size VARCHAR(20)
);

-- ============================================================================
-- STEP 2: Import CSV data
-- Note: Run this from your application or use Supabase CSV import
-- ============================================================================

-- If using psql:
-- \COPY staging_station_list FROM 'dataStationList.csv' WITH CSV HEADER;

-- If using Supabase, upload CSV to storage then:
-- Or insert manually (sample rows shown below)

-- Sample data insert for testing (remove in production)
INSERT INTO staging_station_list VALUES
('ASUS', '60AI0010-MB4300', 'MBT', 'TESTING', 1, 'Main Board', 'ZS660KL', 'ZS660KL MB._8G/855-5|R2.0C (SAM_128G/CN)/SAM/AC', '256G', '12G'),
('ASUS', '60AI0010-MB4300', 'CAL', 'TESTING', 2, 'Main Board', 'ZS660KL', 'ZS660KL MB._8G/855-5|R2.0C (SAM_128G/CN)/SAM/AC', '256G', '12G'),
('ASUS', '60AI0010-SU2021', 'Curing_In', 'TESTING', 1, 'Sub Board', 'ZS660KL SB', 'ZS660KL SUB_BD.|R2.0C (CN/COMPEQ)', '-', '-'),
('XIAOMI', 'SMC5210N1650000M1', 'Testing_Router', 'TESTING', 12, 'Main Board', 'N16', 'N16 (8G+256G) MB', '256G', '8G'),
('XIAOMI', 'SMC5210N1660000M1', 'Testing_Router', 'TESTING', 12, 'Main Board', 'N16', 'N16 (12G+256G) MB', '256G', '12G'),
('XIAOMI', 'SMC5220N1620000M1', 'Testing_Router', 'TESTING', 12, 'USB Board', 'N16', 'N16 SB USB', '0GB', '0GB'),
('XIAOMI', 'SMC5240N1610000M1', 'Testing_Router', 'TESTING', 2, 'LED Board', 'N16', 'SUB BOARD_LED_100_N16', '0GB', '0GB'),
('XIAOMI', 'SMC5270C3SD0000M1', 'Testing_Router', 'TESTING', 12, 'Main Board', 'C3S', 'MB C3S (2GB + 32GB) (MB)', '32G', '2G'),
('XIAOMI', 'SMC5270C3SE0000M1', 'Testing_Router', 'TESTING', 12, 'Main Board', 'C3S', 'MB C3S (3GB + 32GB) (MB)', '32G', '3G');

-- ============================================================================
-- STEP 3: Create/Update customers from staging
-- ============================================================================

INSERT INTO customers (code, name, status)
SELECT DISTINCT 
    UPPER(REPLACE(customer_name, ' ', '_')) as code,
    customer_name as name,
    'active'
FROM staging_station_list s
WHERE NOT EXISTS (
    SELECT 1 FROM customers c 
    WHERE UPPER(c.name) = UPPER(s.customer_name)
)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- STEP 4: Create model_groups from staging (grouped by customer + type_model)
-- ============================================================================

INSERT INTO model_groups (customer_id, type_model, name, description, status)
SELECT DISTINCT 
    c.id,
    s.type_model,
    -- Clean name: remove size info for group name
    regexp_replace(s.type_model, '\s*(SB|MB|SUB_BD).*', '', 'i') as name,
    MIN(s.description_model) as description,
    'active'
FROM staging_station_list s
JOIN customers c ON UPPER(c.name) = UPPER(s.customer_name)
GROUP BY c.id, s.type_model
ON CONFLICT (customer_id, type_model) DO UPDATE SET
    description = EXCLUDED.description,
    updated_at = NOW();

-- ============================================================================
-- STEP 5: Create or update models from staging
-- ============================================================================

-- First, insert new models
INSERT INTO models (
    customer_id, 
    code, 
    name, 
    board_type,
    emmc_size,
    ram_size,
    description_model,
    group_id,
    status
)
SELECT DISTINCT
    c.id as customer_id,
    s.model_no as code,
    s.description_model as name,
    s.type_board as board_type,
    NULLIF(s.emmc_size, '-') as emmc_size,
    NULLIF(s.ram_size, '-') as ram_size,
    s.description_model,
    mg.id as group_id,
    'active'
FROM staging_station_list s
JOIN customers c ON UPPER(c.name) = UPPER(s.customer_name)
JOIN model_groups mg ON mg.customer_id = c.id AND mg.type_model = s.type_model
WHERE NOT EXISTS (
    SELECT 1 FROM models m WHERE m.code = s.model_no
)
GROUP BY c.id, s.model_no, s.description_model, s.type_board, s.emmc_size, s.ram_size, mg.id
ON CONFLICT DO NOTHING;

-- Update existing models with new fields
UPDATE models m
SET 
    board_type = COALESCE(m.board_type, s.type_board),
    emmc_size = COALESCE(m.emmc_size, NULLIF(s.emmc_size, '-')),
    ram_size = COALESCE(m.ram_size, NULLIF(s.ram_size, '-')),
    description_model = COALESCE(m.description_model, s.description_model),
    group_id = COALESCE(m.group_id, mg.id)
FROM (
    SELECT DISTINCT model_no, type_board, emmc_size, ram_size, description_model, type_model, customer_name
    FROM staging_station_list
) s
JOIN customers c ON UPPER(c.name) = UPPER(s.customer_name)
JOIN model_groups mg ON mg.customer_id = c.id AND mg.type_model = s.type_model
WHERE m.code = s.model_no;

-- ============================================================================
-- STEP 6: Insert/Update model_stations from staging
-- ============================================================================

-- First, resolve station_code to station_master
INSERT INTO model_stations (model_id, station_code, board_type, sequence, area)
SELECT DISTINCT
    m.id as model_id,
    -- Normalize station name to match station_master
    COALESCE(sm.code, sa.station_master_id::text, 
        UPPER(REPLACE(REPLACE(s.station_name, '_', ''), ' ', ''))) as station_code,
    s.type_board as board_type,
    s.sequence_no as sequence,
    s.area
FROM staging_station_list s
JOIN models m ON m.code = s.model_no
LEFT JOIN station_master sm ON UPPER(sm.code) = UPPER(REPLACE(REPLACE(s.station_name, '_', ''), ' ', ''))
LEFT JOIN station_aliases sa ON UPPER(sa.alias_name) = UPPER(s.station_name)
WHERE NOT EXISTS (
    SELECT 1 FROM model_stations ms 
    WHERE ms.model_id = m.id 
    AND ms.sequence = s.sequence_no
    AND ms.board_type = s.type_board
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 7: Recalculate investments using proper formula
-- ============================================================================

-- Update investment per model based on station fixture costs
UPDATE models m
SET investment = subq.total_investment
FROM (
    SELECT 
        ms.model_id,
        SUM(
            CASE 
                WHEN ms.station_code ILIKE '%RFT%' OR ms.station_code ILIKE '%RF%TEST%' THEN 120000000
                WHEN ms.station_code ILIKE '%5G%' THEN 150000000
                WHEN ms.station_code ILIKE '%4G%' OR ms.station_code ILIKE '%LTE%' THEN 100000000
                WHEN ms.station_code ILIKE '%CAL%' THEN 100000000
                WHEN ms.station_code ILIKE '%MMI%' THEN 80000000
                WHEN ms.station_code ILIKE '%WIFI%' OR ms.station_code ILIKE '%BT%' THEN 90000000
                WHEN ms.station_code ILIKE '%CURRENT%' THEN 60000000
                WHEN ms.station_code ILIKE '%VISUAL%' THEN 40000000
                WHEN ms.station_code ILIKE '%OQC%' OR ms.station_code ILIKE '%FQC%' THEN 30000000
                WHEN ms.station_code ILIKE '%ROUTER%' THEN 50000000
                WHEN ms.station_code ILIKE '%MBT%' THEN 40000000
                WHEN ms.station_code ILIKE '%UNDERFILL%' THEN 70000000
                WHEN ms.station_code ILIKE '%THERMAL%' OR ms.station_code ILIKE '%GREASE%' THEN 30000000
                WHEN ms.station_code ILIKE '%SHIELDING%' THEN 25000000
                WHEN ms.station_code ILIKE '%DOWNLOAD%' OR ms.station_code ILIKE '%OS%' THEN 60000000
                WHEN ms.station_code ILIKE '%CURING%' THEN 35000000
                WHEN ms.station_code ILIKE '%BAKING%' THEN 40000000
                WHEN ms.station_code ILIKE '%PCB%LINK%' THEN 45000000
                WHEN ms.station_code ILIKE '%SUBMMI%' THEN 50000000
                ELSE 40000000  -- Default
            END
        ) as total_investment
    FROM model_stations ms
    GROUP BY ms.model_id
) subq
WHERE m.id = subq.model_id;

-- ============================================================================
-- STEP 8: Refresh model_groups aggregates
-- ============================================================================

UPDATE model_groups mg
SET 
    total_boards = (
        SELECT COUNT(DISTINCT board_type) 
        FROM models 
        WHERE group_id = mg.id
    ),
    total_stations = (
        SELECT COUNT(*) 
        FROM model_stations ms
        JOIN models m ON m.id = ms.model_id
        WHERE m.group_id = mg.id
    ),
    total_manpower = (
        SELECT COALESCE(SUM(ms.manpower), 0)
        FROM model_stations ms
        JOIN models m ON m.id = ms.model_id
        WHERE m.group_id = mg.id
    ),
    total_investment = (
        SELECT COALESCE(SUM(investment), 0)
        FROM models 
        WHERE group_id = mg.id
    ),
    updated_at = NOW();

-- ============================================================================
-- STEP 9: Clean up staging table
-- ============================================================================

-- Uncomment to drop staging table after verification
-- DROP TABLE IF EXISTS staging_station_list;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Show model groups with multiple boards
SELECT 
    mg.type_model,
    c.name as customer,
    mg.total_boards,
    mg.total_stations,
    mg.total_manpower,
    TO_CHAR(mg.total_investment, 'FM999,999,999,999') || ' IDR' as investment,
    (
        SELECT string_agg(DISTINCT m.board_type || 
            CASE WHEN m.emmc_size IS NOT NULL AND m.emmc_size != '0GB' 
                 THEN ' (' || m.ram_size || '/' || m.emmc_size || ')' 
                 ELSE '' 
            END, ', ' ORDER BY m.board_type)
        FROM models m
        WHERE m.group_id = mg.id
    ) as board_variants
FROM model_groups mg
JOIN customers c ON c.id = mg.customer_id
WHERE mg.total_boards > 1
ORDER BY mg.total_investment DESC
LIMIT 20;

-- Show Main Board variants with different RAM/eMMC
SELECT 
    mg.type_model,
    m.code,
    m.board_type,
    m.emmc_size,
    m.ram_size,
    TO_CHAR(m.investment, 'FM999,999,999,999') || ' IDR' as investment,
    (SELECT COUNT(*) FROM model_stations ms WHERE ms.model_id = m.id) as stations
FROM models m
JOIN model_groups mg ON mg.id = m.group_id
WHERE m.board_type = 'Main Board'
AND mg.total_boards > 1
ORDER BY mg.type_model, m.ram_size, m.emmc_size
LIMIT 30;

-- ============================================================================
-- END OF CSV IMPORT
-- ============================================================================
