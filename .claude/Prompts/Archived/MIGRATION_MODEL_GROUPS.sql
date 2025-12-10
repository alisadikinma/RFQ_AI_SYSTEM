-- ============================================================================
-- MIGRATION: Model Groups Schema
-- Purpose: Implement parent-child relationship for models by type_model
-- Date: 2024-12-10
-- ============================================================================

-- ============================================================================
-- STEP 1: Create model_groups table (PARENT)
-- ============================================================================
-- This groups models by type_model (e.g., N16, C3S, ZS660KL)
-- One model_group can have multiple models (Main Board, Sub Board, LED Board, etc.)

CREATE TABLE IF NOT EXISTS model_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Group identification
    type_model VARCHAR(100) NOT NULL,           -- e.g., "N16", "C3S", "ZS660KL"
    name VARCHAR(255),                          -- Display name if different from type_model
    description TEXT,                           -- Product description
    
    -- Aggregated stats (updated by trigger)
    total_boards INTEGER DEFAULT 0,             -- Count of different board types
    total_stations INTEGER DEFAULT 0,           -- Sum of all stations across boards
    total_manpower INTEGER DEFAULT 0,           -- Sum of all manpower across boards
    total_investment DECIMAL(15,2) DEFAULT 0,   -- Sum of investments from all boards
    
    -- Status & metadata
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint: one type_model per customer
ALTER TABLE model_groups 
ADD CONSTRAINT unique_customer_type_model 
UNIQUE (customer_id, type_model);

-- Indexes for performance
CREATE INDEX idx_model_groups_customer ON model_groups(customer_id);
CREATE INDEX idx_model_groups_type_model ON model_groups(type_model);
CREATE INDEX idx_model_groups_status ON model_groups(status);

-- ============================================================================
-- STEP 2: Add columns to existing models table (CHILD)
-- ============================================================================

-- Add group_id foreign key
ALTER TABLE models 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES model_groups(id) ON DELETE SET NULL;

-- Add board type classification
ALTER TABLE models 
ADD COLUMN IF NOT EXISTS board_type VARCHAR(50) DEFAULT 'Main Board';

-- Add hardware specs (for variant differentiation)
ALTER TABLE models 
ADD COLUMN IF NOT EXISTS emmc_size VARCHAR(20);
ALTER TABLE models 
ADD COLUMN IF NOT EXISTS ram_size VARCHAR(20);
ALTER TABLE models 
ADD COLUMN IF NOT EXISTS description_model TEXT;

-- Add investment per board
ALTER TABLE models 
ADD COLUMN IF NOT EXISTS investment DECIMAL(15,2) DEFAULT 0;

-- Add sequence for display order within group
ALTER TABLE models 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_models_group_id ON models(group_id);
CREATE INDEX IF NOT EXISTS idx_models_board_type ON models(board_type);

-- ============================================================================
-- STEP 3: Create board_types lookup table
-- ============================================================================

CREATE TABLE IF NOT EXISTS board_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,           -- e.g., "main_board", "sub_board"
    name VARCHAR(100) NOT NULL,                 -- e.g., "Main Board", "Sub Board"
    display_order INTEGER DEFAULT 0,            -- For sorting in UI
    icon VARCHAR(50),                           -- Icon name for UI
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default board types
INSERT INTO board_types (code, name, display_order, icon) VALUES
    ('main_board', 'Main Board', 1, 'cpu'),
    ('sub_board', 'Sub Board', 2, 'circuit-board'),
    ('led_board', 'LED Board', 3, 'lightbulb'),
    ('usb_board', 'USB Board', 4, 'usb'),
    ('sub_ant_board', 'SUB_ANT Board', 5, 'antenna'),
    ('power_board', 'Power Board', 6, 'battery'),
    ('display_board', 'Display Board', 7, 'monitor'),
    ('sensor_board', 'Sensor Board', 8, 'activity'),
    ('rf_board', 'RF Board', 9, 'radio'),
    ('other', 'Other Board', 99, 'box')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- STEP 4: Create triggers for aggregation
-- ============================================================================

-- Function to update model_groups aggregates
CREATE OR REPLACE FUNCTION update_model_group_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update stats for the affected group
    UPDATE model_groups mg
    SET 
        total_boards = (
            SELECT COUNT(DISTINCT board_type) 
            FROM models 
            WHERE group_id = COALESCE(NEW.group_id, OLD.group_id)
        ),
        total_stations = (
            SELECT COALESCE(SUM(
                (SELECT COUNT(*) FROM model_stations ms WHERE ms.model_id = m.id)
            ), 0)
            FROM models m
            WHERE m.group_id = COALESCE(NEW.group_id, OLD.group_id)
        ),
        total_investment = (
            SELECT COALESCE(SUM(investment), 0)
            FROM models 
            WHERE group_id = COALESCE(NEW.group_id, OLD.group_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.group_id, OLD.group_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on models table
DROP TRIGGER IF EXISTS trg_update_model_group_stats ON models;
CREATE TRIGGER trg_update_model_group_stats
AFTER INSERT OR UPDATE OR DELETE ON models
FOR EACH ROW
EXECUTE FUNCTION update_model_group_stats();

-- Function to update total_manpower from model_stations
CREATE OR REPLACE FUNCTION update_group_manpower()
RETURNS TRIGGER AS $$
DECLARE
    v_group_id UUID;
BEGIN
    -- Get the group_id for the affected model
    SELECT group_id INTO v_group_id
    FROM models 
    WHERE id = COALESCE(NEW.model_id, OLD.model_id);
    
    IF v_group_id IS NOT NULL THEN
        UPDATE model_groups
        SET total_manpower = (
            SELECT COALESCE(SUM(ms.manpower), 0)
            FROM model_stations ms
            JOIN models m ON m.id = ms.model_id
            WHERE m.group_id = v_group_id
        ),
        updated_at = NOW()
        WHERE id = v_group_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on model_stations
DROP TRIGGER IF EXISTS trg_update_group_manpower ON model_stations;
CREATE TRIGGER trg_update_group_manpower
AFTER INSERT OR UPDATE OR DELETE ON model_stations
FOR EACH ROW
EXECUTE FUNCTION update_group_manpower();

-- ============================================================================
-- STEP 5: Create view for easier querying
-- ============================================================================

CREATE OR REPLACE VIEW v_model_groups_summary AS
SELECT 
    mg.id,
    mg.type_model,
    mg.name,
    mg.description,
    mg.status,
    mg.total_boards,
    mg.total_stations,
    mg.total_manpower,
    mg.total_investment,
    mg.created_at,
    mg.updated_at,
    c.id AS customer_id,
    c.code AS customer_code,
    c.name AS customer_name,
    (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', m.id,
                'code', m.code,
                'board_type', m.board_type,
                'emmc_size', m.emmc_size,
                'ram_size', m.ram_size,
                'investment', m.investment,
                'station_count', (SELECT COUNT(*) FROM model_stations ms WHERE ms.model_id = m.id),
                'total_manpower', (SELECT COALESCE(SUM(ms.manpower), 0) FROM model_stations ms WHERE ms.model_id = m.id),
                'uph', m.uph
            )
        )
        FROM models m
        WHERE m.group_id = mg.id
        ORDER BY m.display_order
    ) AS boards
FROM model_groups mg
JOIN customers c ON c.id = mg.customer_id
WHERE mg.status = 'active';

-- ============================================================================
-- STEP 6: RLS Policies (if using Supabase Auth)
-- ============================================================================

ALTER TABLE model_groups ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users
CREATE POLICY "Users can view model_groups" ON model_groups
    FOR SELECT USING (true);

-- Policy for anon access (development)
CREATE POLICY "Anon can view model_groups" ON model_groups
    FOR SELECT TO anon USING (true);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check tables created
-- SELECT 'model_groups' as table_name, COUNT(*) as count FROM model_groups
-- UNION ALL
-- SELECT 'board_types', COUNT(*) FROM board_types;

-- Check columns added to models
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'models' 
-- AND column_name IN ('group_id', 'board_type', 'emmc_size', 'ram_size', 'investment');

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
