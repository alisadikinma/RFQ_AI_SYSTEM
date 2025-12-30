DROP VIEW IF EXISTS v_model_groups_summary;

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
                'station_count', (
                    SELECT count(*) 
                    FROM model_stations ms
                    WHERE ms.model_id = m.id
                ),
                'uph', m.uph
            ) ORDER BY m.display_order
        )
        FROM models m
        WHERE m.group_id = mg.id
    ) AS boards
FROM model_groups mg
JOIN customers c ON c.id = mg.customer_id
WHERE mg.status::text = 'active'::text;