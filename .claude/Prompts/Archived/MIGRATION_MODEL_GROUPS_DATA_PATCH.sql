-- ============================================================================
-- DATA PATCHING: Populate model_groups from existing models + CSV data
-- Purpose: Migrate existing data to new parent-child structure
-- Run AFTER: MIGRATION_MODEL_GROUPS.sql
-- ============================================================================

-- ============================================================================
-- STEP 1: Extract unique type_model from model names and create groups
-- ============================================================================

-- First, let's identify patterns in existing model codes to extract type_model
-- Common patterns from CSV:
--   XIAOMI: SMC5210N1650000M1 → N16
--   ASUS:   60AI0010-MB4300  → ZS660KL (from description)
--   TCL:    various patterns

-- Create model_groups from existing models (extract type_model from name pattern)
INSERT INTO model_groups (customer_id, type_model, name, status)
SELECT DISTINCT 
    m.customer_id,
    -- Extract type_model: This is a simplified extraction
    -- Real extraction should use description_model field
    CASE 
        -- If name contains known pattern, extract it
        WHEN m.name ~ 'N[0-9]+[A-Z]?' THEN regexp_replace(m.name, '.*?(N[0-9]+[A-Z]?).*', '\1')
        WHEN m.name ~ 'C[0-9]+[A-Z]?' THEN regexp_replace(m.name, '.*?(C[0-9]+[A-Z][0-9]?).*', '\1')
        -- Default to first part of model code
        ELSE split_part(m.code, '-', 1)
    END as type_model,
    -- Use existing name as group name initially
    MIN(m.name) as name,
    'active'
FROM models m
WHERE m.group_id IS NULL
GROUP BY m.customer_id, 
    CASE 
        WHEN m.name ~ 'N[0-9]+[A-Z]?' THEN regexp_replace(m.name, '.*?(N[0-9]+[A-Z]?).*', '\1')
        WHEN m.name ~ 'C[0-9]+[A-Z]?' THEN regexp_replace(m.name, '.*?(C[0-9]+[A-Z][0-9]?).*', '\1')
        ELSE split_part(m.code, '-', 1)
    END
ON CONFLICT (customer_id, type_model) DO NOTHING;

-- ============================================================================
-- STEP 2: Link existing models to their groups
-- ============================================================================

UPDATE models m
SET group_id = mg.id
FROM model_groups mg
WHERE m.customer_id = mg.customer_id
AND m.group_id IS NULL
AND (
    -- Match by extracted type_model pattern
    (m.name ~ 'N[0-9]+[A-Z]?' AND mg.type_model = regexp_replace(m.name, '.*?(N[0-9]+[A-Z]?).*', '\1'))
    OR (m.name ~ 'C[0-9]+[A-Z]?' AND mg.type_model = regexp_replace(m.name, '.*?(C[0-9]+[A-Z][0-9]?).*', '\1'))
    OR mg.type_model = split_part(m.code, '-', 1)
);

-- ============================================================================
-- STEP 3: Update board_type based on board_types array in models
-- ============================================================================

-- First, set default board_type based on existing board_types column
UPDATE models m
SET board_type = CASE 
    WHEN m.board_types @> '["Main Board"]'::jsonb THEN 'Main Board'
    WHEN m.board_types @> '["Sub Board"]'::jsonb THEN 'Sub Board'
    WHEN m.board_types @> '["LED Board"]'::jsonb THEN 'LED Board'
    WHEN m.board_types @> '["USB Board"]'::jsonb THEN 'USB Board'
    WHEN m.board_types @> '["SUB_ANT Board"]'::jsonb THEN 'SUB_ANT Board'
    ELSE 'Main Board'
END
WHERE board_type IS NULL OR board_type = 'Main Board';

-- ============================================================================
-- STEP 4: Calculate and set investment estimates
-- ============================================================================

-- Investment calculation formula:
-- Base investment = Number of stations × Average fixture cost
-- Average fixture cost assumptions (USD converted to IDR):
--   - Testing station: $5,000 = Rp 80,000,000
--   - Assembly station: $3,000 = Rp 48,000,000
--   - Visual station: $2,000 = Rp 32,000,000

-- Create a function for investment calculation
CREATE OR REPLACE FUNCTION calculate_model_investment(p_model_id UUID)
RETURNS DECIMAL(15,2) AS $$
DECLARE
    v_investment DECIMAL(15,2) := 0;
    v_station_record RECORD;
BEGIN
    FOR v_station_record IN 
        SELECT 
            ms.station_code,
            sm.category,
            sm.fixture_cost
        FROM model_stations ms
        LEFT JOIN station_master sm ON sm.code = ms.station_code
        WHERE ms.model_id = p_model_id
    LOOP
        -- Add investment based on station type
        v_investment := v_investment + COALESCE(v_station_record.fixture_cost, 
            CASE 
                WHEN v_station_record.station_code ILIKE '%RFT%' THEN 120000000  -- RF Test = Rp 120M
                WHEN v_station_record.station_code ILIKE '%CAL%' THEN 100000000  -- Calibration = Rp 100M
                WHEN v_station_record.station_code ILIKE '%MMI%' THEN 80000000   -- MMI = Rp 80M
                WHEN v_station_record.station_code ILIKE '%WIFI%' THEN 90000000  -- WiFi/BT = Rp 90M
                WHEN v_station_record.station_code ILIKE '%5G%' THEN 150000000   -- 5G = Rp 150M
                WHEN v_station_record.station_code ILIKE '%4G%' THEN 100000000   -- 4G = Rp 100M
                WHEN v_station_record.station_code ILIKE '%CURRENT%' THEN 60000000 -- Current = Rp 60M
                WHEN v_station_record.station_code ILIKE '%VISUAL%' THEN 40000000  -- Visual = Rp 40M
                WHEN v_station_record.station_code ILIKE '%OQC%' THEN 30000000   -- OQC = Rp 30M
                WHEN v_station_record.station_code ILIKE '%ROUTER%' THEN 50000000 -- Router = Rp 50M
                WHEN v_station_record.station_code ILIKE '%MBT%' THEN 40000000   -- MBT = Rp 40M
                WHEN v_station_record.station_code ILIKE '%UNDERFILL%' THEN 70000000 -- Underfill = Rp 70M
                WHEN v_station_record.station_code ILIKE '%THERMAL%' THEN 30000000 -- Thermal = Rp 30M
                WHEN v_station_record.station_code ILIKE '%SHIELDING%' THEN 25000000 -- Shielding = Rp 25M
                ELSE 50000000  -- Default = Rp 50M
            END
        );
    END LOOP;
    
    RETURN v_investment;
END;
$$ LANGUAGE plpgsql;

-- Update investment for all models
UPDATE models m
SET investment = calculate_model_investment(m.id)
WHERE investment IS NULL OR investment = 0;

-- ============================================================================
-- STEP 5: Update model_groups aggregates manually (triggers may not fire on batch update)
-- ============================================================================

UPDATE model_groups mg
SET 
    total_boards = (
        SELECT COUNT(DISTINCT board_type) 
        FROM models 
        WHERE group_id = mg.id
    ),
    total_stations = (
        SELECT COALESCE(SUM(
            (SELECT COUNT(*) FROM model_stations ms WHERE ms.model_id = m.id)
        ), 0)
        FROM models m
        WHERE m.group_id = mg.id
    ),
    total_manpower = (
        SELECT COALESCE(SUM(
            (SELECT COALESCE(SUM(ms.manpower), 0) FROM model_stations ms WHERE ms.model_id = m.id)
        ), 0)
        FROM models m
        WHERE m.group_id = mg.id
    ),
    total_investment = (
        SELECT COALESCE(SUM(investment), 0)
        FROM models 
        WHERE group_id = mg.id
    ),
    updated_at = NOW();

-- ============================================================================
-- STEP 6: Verification queries
-- ============================================================================

-- Show model groups with their boards
SELECT 
    mg.type_model,
    c.name as customer,
    mg.total_boards,
    mg.total_stations,
    mg.total_manpower,
    TO_CHAR(mg.total_investment, 'FM999,999,999,999') as investment_idr,
    (
        SELECT string_agg(DISTINCT m.board_type, ', ')
        FROM models m
        WHERE m.group_id = mg.id
    ) as board_types
FROM model_groups mg
JOIN customers c ON c.id = mg.customer_id
ORDER BY c.name, mg.type_model
LIMIT 20;

-- Show models linked to groups
SELECT 
    m.code,
    m.board_type,
    m.emmc_size,
    m.ram_size,
    TO_CHAR(m.investment, 'FM999,999,999,999') as investment_idr,
    mg.type_model as group_type_model,
    (SELECT COUNT(*) FROM model_stations ms WHERE ms.model_id = m.id) as station_count
FROM models m
LEFT JOIN model_groups mg ON mg.id = m.group_id
WHERE mg.id IS NOT NULL
ORDER BY mg.type_model, m.board_type
LIMIT 30;

-- Summary statistics
SELECT 
    'model_groups' as entity,
    COUNT(*) as count,
    COUNT(CASE WHEN total_boards > 1 THEN 1 END) as multi_board_count,
    AVG(total_investment)::BIGINT as avg_investment
FROM model_groups
UNION ALL
SELECT 
    'models',
    COUNT(*),
    COUNT(CASE WHEN group_id IS NOT NULL THEN 1 END),
    AVG(investment)::BIGINT
FROM models;

-- ============================================================================
-- END OF DATA PATCHING
-- ============================================================================
