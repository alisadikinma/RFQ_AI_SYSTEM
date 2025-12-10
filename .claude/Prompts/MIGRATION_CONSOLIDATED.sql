-- ============================================================================
-- CONSOLIDATED MIGRATION: RFQ AI System Database (FIXED)
-- ============================================================================
-- Run this in Supabase SQL Editor
-- Date: 2024-12-10 (Fixed version)
-- ============================================================================


-- ############################################################################
-- PART 1: MODEL GROUPS SCHEMA
-- ############################################################################

-- 1.1: Create model_groups table
CREATE TABLE IF NOT EXISTS model_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    type_model VARCHAR(100) NOT NULL,
    name VARCHAR(255),
    description TEXT,
    total_boards INTEGER DEFAULT 0,
    total_stations INTEGER DEFAULT 0,
    total_manpower INTEGER DEFAULT 0,
    total_investment DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
    ALTER TABLE model_groups ADD CONSTRAINT unique_customer_type_model UNIQUE (customer_id, type_model);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_model_groups_customer ON model_groups(customer_id);
CREATE INDEX IF NOT EXISTS idx_model_groups_type_model ON model_groups(type_model);

-- 1.2: Add columns to models table
ALTER TABLE models ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES model_groups(id) ON DELETE SET NULL;
ALTER TABLE models ADD COLUMN IF NOT EXISTS board_type VARCHAR(50) DEFAULT 'Main Board';
ALTER TABLE models ADD COLUMN IF NOT EXISTS emmc_size VARCHAR(20);
ALTER TABLE models ADD COLUMN IF NOT EXISTS ram_size VARCHAR(20);
ALTER TABLE models ADD COLUMN IF NOT EXISTS description_model TEXT;
ALTER TABLE models ADD COLUMN IF NOT EXISTS investment DECIMAL(15,2) DEFAULT 0;
ALTER TABLE models ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
ALTER TABLE models ADD COLUMN IF NOT EXISTS uph INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_models_group_id ON models(group_id);
CREATE INDEX IF NOT EXISTS idx_models_board_type ON models(board_type);

-- 1.3: Create board_types lookup table
CREATE TABLE IF NOT EXISTS board_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    display_order INTEGER DEFAULT 0,
    icon VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- 1.4: Triggers for aggregation
CREATE OR REPLACE FUNCTION update_model_group_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE model_groups mg
    SET 
        total_boards = (SELECT COUNT(DISTINCT board_type) FROM models WHERE group_id = COALESCE(NEW.group_id, OLD.group_id)),
        total_stations = (
            SELECT COUNT(*) FROM model_stations ms 
            JOIN models m ON m.id = ms.model_id 
            WHERE m.group_id = COALESCE(NEW.group_id, OLD.group_id)
        ),
        total_investment = (SELECT COALESCE(SUM(investment), 0) FROM models WHERE group_id = COALESCE(NEW.group_id, OLD.group_id)),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.group_id, OLD.group_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_model_group_stats ON models;
CREATE TRIGGER trg_update_model_group_stats
AFTER INSERT OR UPDATE OR DELETE ON models
FOR EACH ROW EXECUTE FUNCTION update_model_group_stats();

CREATE OR REPLACE FUNCTION update_group_manpower()
RETURNS TRIGGER AS $$
DECLARE v_group_id UUID;
BEGIN
    SELECT group_id INTO v_group_id FROM models WHERE id = COALESCE(NEW.model_id, OLD.model_id);
    IF v_group_id IS NOT NULL THEN
        UPDATE model_groups SET 
            total_manpower = (
                SELECT COALESCE(SUM(ms.manpower), 0)
                FROM model_stations ms JOIN models m ON m.id = ms.model_id
                WHERE m.group_id = v_group_id
            ),
            updated_at = NOW()
        WHERE id = v_group_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_group_manpower ON model_stations;
CREATE TRIGGER trg_update_group_manpower
AFTER INSERT OR UPDATE OR DELETE ON model_stations
FOR EACH ROW EXECUTE FUNCTION update_group_manpower();

-- 1.5: View for easier querying (FIXED - ORDER BY inside jsonb_agg)
CREATE OR REPLACE VIEW v_model_groups_summary AS
SELECT 
    mg.id, mg.type_model, mg.name, mg.description, mg.status,
    mg.total_boards, mg.total_stations, mg.total_manpower, mg.total_investment,
    mg.created_at, mg.updated_at,
    c.id AS customer_id, c.code AS customer_code, c.name AS customer_name,
    (SELECT jsonb_agg(jsonb_build_object(
        'id', m.id, 'code', m.code, 'board_type', m.board_type,
        'emmc_size', m.emmc_size, 'ram_size', m.ram_size, 'investment', m.investment,
        'station_count', (SELECT COUNT(*) FROM model_stations ms WHERE ms.model_id = m.id),
        'uph', m.uph
    ) ORDER BY m.display_order) FROM models m WHERE m.group_id = mg.id) AS boards
FROM model_groups mg
JOIN customers c ON c.id = mg.customer_id
WHERE mg.status = 'active';

-- 1.6: RLS Policies
ALTER TABLE model_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all model_groups" ON model_groups;
CREATE POLICY "Allow all model_groups" ON model_groups FOR ALL USING (true) WITH CHECK (true);


-- ############################################################################
-- PART 2: CHAT HISTORY TABLES
-- ############################################################################

CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    title TEXT NOT NULL DEFAULT 'New Chat',
    preview TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
    message_count INTEGER DEFAULT 0,
    station_count INTEGER DEFAULT 0,
    model_count INTEGER DEFAULT 0,
    rfq_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    files JSONB DEFAULT '[]'::jsonb,
    extracted_stations JSONB,
    similar_models JSONB,
    cost_summary JSONB,
    processing_time_ms INTEGER,
    model_used TEXT,
    confidence DECIMAL(3,2),
    sequence INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all chat_sessions" ON chat_sessions;
CREATE POLICY "Allow all chat_sessions" ON chat_sessions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all chat_messages" ON chat_messages;
CREATE POLICY "Allow all chat_messages" ON chat_messages FOR ALL USING (true) WITH CHECK (true);

-- Chat triggers
CREATE OR REPLACE FUNCTION update_chat_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_chat_session_timestamp ON chat_sessions;
CREATE TRIGGER trigger_update_chat_session_timestamp
BEFORE UPDATE ON chat_sessions FOR EACH ROW
EXECUTE FUNCTION update_chat_session_timestamp();

CREATE OR REPLACE FUNCTION update_session_on_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_sessions SET 
        message_count = message_count + 1,
        last_message_at = NEW.created_at,
        preview = CASE WHEN NEW.role = 'user' THEN LEFT(NEW.content, 100) ELSE preview END
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_session_on_message ON chat_messages;
CREATE TRIGGER trigger_update_session_on_message
AFTER INSERT ON chat_messages FOR EACH ROW
EXECUTE FUNCTION update_session_on_message();


-- ############################################################################
-- PART 3: DATA MIGRATION
-- ############################################################################

-- 3.1: Create model_groups from existing models
INSERT INTO model_groups (customer_id, type_model, name, status)
SELECT DISTINCT 
    m.customer_id,
    CASE 
        WHEN m.name ~ 'N[0-9]+[A-Z]?' THEN regexp_replace(m.name, '.*?(N[0-9]+[A-Z]?).*', '\1')
        WHEN m.name ~ 'C[0-9]+[A-Z]?' THEN regexp_replace(m.name, '.*?(C[0-9]+[A-Z][0-9]?).*', '\1')
        ELSE split_part(m.code, '-', 1)
    END as type_model,
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

-- 3.2: Link existing models to groups
UPDATE models m
SET group_id = mg.id
FROM model_groups mg
WHERE m.customer_id = mg.customer_id
AND m.group_id IS NULL
AND (
    (m.name ~ 'N[0-9]+[A-Z]?' AND mg.type_model = regexp_replace(m.name, '.*?(N[0-9]+[A-Z]?).*', '\1'))
    OR (m.name ~ 'C[0-9]+[A-Z]?' AND mg.type_model = regexp_replace(m.name, '.*?(C[0-9]+[A-Z][0-9]?).*', '\1'))
    OR mg.type_model = split_part(m.code, '-', 1)
);

-- 3.3: Calculate investment (FIXED - JOIN station_master via machine_id)
UPDATE models m
SET investment = subq.total_investment
FROM (
    SELECT ms.model_id,
        SUM(CASE 
            WHEN sm.code ILIKE '%RFT%' OR sm.code ILIKE '%RF%' THEN 120000000
            WHEN sm.code ILIKE '%5G%' THEN 150000000
            WHEN sm.code ILIKE '%4G%' OR sm.code ILIKE '%LTE%' THEN 100000000
            WHEN sm.code ILIKE '%CAL%' THEN 100000000
            WHEN sm.code ILIKE '%MMI%' THEN 80000000
            WHEN sm.code ILIKE '%WIFI%' OR sm.code ILIKE '%BT%' THEN 90000000
            WHEN sm.code ILIKE '%CURRENT%' THEN 60000000
            WHEN sm.code ILIKE '%VISUAL%' THEN 40000000
            WHEN sm.code ILIKE '%ROUTER%' THEN 50000000
            WHEN sm.code ILIKE '%MBT%' THEN 40000000
            WHEN sm.code ILIKE '%UNDERFILL%' THEN 70000000
            WHEN sm.code ILIKE '%DOWNLOAD%' OR sm.code ILIKE '%OS%' THEN 60000000
            ELSE 40000000
        END) as total_investment
    FROM model_stations ms
    JOIN station_master sm ON sm.id = ms.machine_id
    GROUP BY ms.model_id
) subq
WHERE m.id = subq.model_id AND (m.investment IS NULL OR m.investment = 0);

-- 3.4: Refresh model_groups aggregates
UPDATE model_groups mg SET 
    total_boards = (SELECT COUNT(DISTINCT board_type) FROM models WHERE group_id = mg.id),
    total_stations = (SELECT COUNT(*) FROM model_stations ms JOIN models m ON m.id = ms.model_id WHERE m.group_id = mg.id),
    total_manpower = (SELECT COALESCE(SUM(ms.manpower), 0) FROM model_stations ms JOIN models m ON m.id = ms.model_id WHERE m.group_id = mg.id),
    total_investment = (SELECT COALESCE(SUM(investment), 0) FROM models WHERE group_id = mg.id),
    updated_at = NOW();


-- ############################################################################
-- VERIFICATION
-- ############################################################################

SELECT 'model_groups' as tbl, COUNT(*) as cnt FROM model_groups
UNION ALL SELECT 'board_types', COUNT(*) FROM board_types
UNION ALL SELECT 'chat_sessions', COUNT(*) FROM chat_sessions;

SELECT COUNT(*) as total_models, COUNT(group_id) as linked FROM models;