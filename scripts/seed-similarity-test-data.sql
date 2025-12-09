-- =====================================================
-- DUMMY DATA FOR SIMILARITY SEARCH TESTING
-- Based on uploaded image station list
-- =====================================================

-- First, ensure we have the station_master entries for these stations
-- (Some may already exist, so we use ON CONFLICT DO NOTHING)

INSERT INTO station_master (code, name, category, description, cycle_time_seconds, operator_ratio)
VALUES 
  ('MBT', 'Manual Bench Test', 'Testing', 'MBT testing, material pick and place', 60, 1.0),
  ('CAL1', 'Calibration 1', 'Testing', 'CAL1 testing, material pick and place', 45, 1.0),
  ('CAL2', 'Calibration 2', 'Testing', 'CAL2 testing, material pick and place', 45, 1.0),
  ('RFT1', 'RF Test 1', 'Testing', 'RF1 testing, material pick and place', 60, 1.0),
  ('RFT2', 'RF Test 2', 'Testing', 'RF2 testing, material pick and place', 60, 1.0),
  ('WIFIBT', 'WiFi Bluetooth Test', 'Testing', 'WIFIBT testing, material pick and place', 45, 1.0),
  ('4G_INSTRUMENT', '4G Instrumentation', 'Testing', '4G instrument testing for board testing section', 90, 1.0),
  ('5G_INSTRUMENT', '5G Instrumentation', 'Testing', '5G instrument testing for board testing section', 90, 1.0),
  ('MAINBOARD_MMI', 'Mainboard MMI', 'Testing', 'Spot check of mainboard MMI, material pick and place', 30, 1.0),
  ('SUBBOARD_MMI', 'Sub-board MMI', 'Testing', 'Spot check of sub-board MMI, material pick and place', 30, 1.0),
  ('PACKING', 'Packing Station', 'Assembly', 'Mainboard packed and stored', 20, 1.0)
ON CONFLICT (code) DO NOTHING;

-- Add station aliases for Chinese names
INSERT INTO station_aliases (master_station_id, alias_name, customer_id)
SELECT sm.id, '4G仪表', NULL FROM station_master sm WHERE sm.code = '4G_INSTRUMENT'
ON CONFLICT DO NOTHING;

INSERT INTO station_aliases (master_station_id, alias_name, customer_id)
SELECT sm.id, '5G仪表', NULL FROM station_master sm WHERE sm.code = '5G_INSTRUMENT'
ON CONFLICT DO NOTHING;

INSERT INTO station_aliases (master_station_id, alias_name, customer_id)
SELECT sm.id, '主板MMI', NULL FROM station_master sm WHERE sm.code = 'MAINBOARD_MMI'
ON CONFLICT DO NOTHING;

INSERT INTO station_aliases (master_station_id, alias_name, customer_id)
SELECT sm.id, '副板MMI', NULL FROM station_master sm WHERE sm.code = 'SUBBOARD_MMI'
ON CONFLICT DO NOTHING;

INSERT INTO station_aliases (master_station_id, alias_name, customer_id)
SELECT sm.id, '主板装盘入库', NULL FROM station_master sm WHERE sm.code = 'PACKING'
ON CONFLICT DO NOTHING;

-- =====================================================
-- MODEL 1: EXACT MATCH (100% similarity target)
-- Phone Model with all 11 stations from image
-- =====================================================

INSERT INTO models (id, customer_id, code, name, board_types, created_at)
SELECT 
  'a1000000-0000-0000-0000-000000000001'::uuid,
  c.id,
  'PHONE_5G_PRO_V1',
  '5G Pro Phone Model V1 - Full Test',
  ARRAY['Mainboard', 'Sub-board'],
  NOW()
FROM customers c WHERE c.code = 'XIAOMI'
ON CONFLICT (id) DO NOTHING;

-- Insert all 11 stations for Model 1
INSERT INTO model_stations (model_id, station_code, board_type, sequence, manpower, cycle_time)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'MBT', 'Mainboard', 1, 2, 60),
  ('a1000000-0000-0000-0000-000000000001', 'CAL1', 'Mainboard', 2, 1, 45),
  ('a1000000-0000-0000-0000-000000000001', 'CAL2', 'Mainboard', 3, 1, 45),
  ('a1000000-0000-0000-0000-000000000001', 'RFT1', 'Mainboard', 4, 1, 60),
  ('a1000000-0000-0000-0000-000000000001', 'RFT2', 'Mainboard', 5, 1, 60),
  ('a1000000-0000-0000-0000-000000000001', 'WIFIBT', 'Mainboard', 6, 1, 45),
  ('a1000000-0000-0000-0000-000000000001', '4G_INSTRUMENT', 'Mainboard', 7, 1, 90),
  ('a1000000-0000-0000-0000-000000000001', '5G_INSTRUMENT', 'Mainboard', 8, 1, 90),
  ('a1000000-0000-0000-0000-000000000001', 'MAINBOARD_MMI', 'Mainboard', 9, 1, 30),
  ('a1000000-0000-0000-0000-000000000001', 'SUBBOARD_MMI', 'Sub-board', 10, 1, 30),
  ('a1000000-0000-0000-0000-000000000001', 'PACKING', 'Mainboard', 11, 1, 20)
ON CONFLICT DO NOTHING;

-- =====================================================
-- MODEL 2: HIGH SIMILARITY (~85%) 
-- Missing 5G_INSTRUMENT and SUBBOARD_MMI (9 of 11 stations)
-- =====================================================

INSERT INTO models (id, customer_id, code, name, board_types, created_at)
SELECT 
  'a2000000-0000-0000-0000-000000000002'::uuid,
  c.id,
  'PHONE_4G_PLUS_V1',
  '4G Plus Phone Model V1 - No 5G',
  ARRAY['Mainboard'],
  NOW()
FROM customers c WHERE c.code = 'XIAOMI'
ON CONFLICT (id) DO NOTHING;

INSERT INTO model_stations (model_id, station_code, board_type, sequence, manpower, cycle_time)
VALUES
  ('a2000000-0000-0000-0000-000000000002', 'MBT', 'Mainboard', 1, 2, 60),
  ('a2000000-0000-0000-0000-000000000002', 'CAL1', 'Mainboard', 2, 1, 45),
  ('a2000000-0000-0000-0000-000000000002', 'CAL2', 'Mainboard', 3, 1, 45),
  ('a2000000-0000-0000-0000-000000000002', 'RFT1', 'Mainboard', 4, 1, 60),
  ('a2000000-0000-0000-0000-000000000002', 'RFT2', 'Mainboard', 5, 1, 60),
  ('a2000000-0000-0000-0000-000000000002', 'WIFIBT', 'Mainboard', 6, 1, 45),
  ('a2000000-0000-0000-0000-000000000002', '4G_INSTRUMENT', 'Mainboard', 7, 1, 90),
  ('a2000000-0000-0000-0000-000000000002', 'MAINBOARD_MMI', 'Mainboard', 8, 1, 30),
  ('a2000000-0000-0000-0000-000000000002', 'PACKING', 'Mainboard', 9, 1, 20)
ON CONFLICT DO NOTHING;

-- =====================================================
-- MODEL 3: MEDIUM-HIGH SIMILARITY (~75%)
-- Has 8 matching + 2 extra stations (different product line)
-- =====================================================

INSERT INTO models (id, customer_id, code, name, board_types, created_at)
SELECT 
  'a3000000-0000-0000-0000-000000000003'::uuid,
  c.id,
  'TABLET_5G_V1',
  '5G Tablet Model V1 - With NFC',
  ARRAY['Mainboard', 'Display'],
  NOW()
FROM customers c WHERE c.code = 'TCL'
ON CONFLICT (id) DO NOTHING;

INSERT INTO model_stations (model_id, station_code, board_type, sequence, manpower, cycle_time)
VALUES
  ('a3000000-0000-0000-0000-000000000003', 'MBT', 'Mainboard', 1, 2, 60),
  ('a3000000-0000-0000-0000-000000000003', 'CAL1', 'Mainboard', 2, 1, 45),
  ('a3000000-0000-0000-0000-000000000003', 'RFT1', 'Mainboard', 3, 1, 60),
  ('a3000000-0000-0000-0000-000000000003', 'RFT2', 'Mainboard', 4, 1, 60),
  ('a3000000-0000-0000-0000-000000000003', 'WIFIBT', 'Mainboard', 5, 1, 45),
  ('a3000000-0000-0000-0000-000000000003', '5G_INSTRUMENT', 'Mainboard', 6, 1, 90),
  ('a3000000-0000-0000-0000-000000000003', 'MAINBOARD_MMI', 'Display', 7, 2, 45),
  ('a3000000-0000-0000-0000-000000000003', 'PACKING', 'Mainboard', 8, 1, 20),
  -- Extra stations not in query
  ('a3000000-0000-0000-0000-000000000003', 'NFC', 'Mainboard', 9, 1, 30),
  ('a3000000-0000-0000-0000-000000000003', 'CAMERA', 'Mainboard', 10, 1, 45)
ON CONFLICT DO NOTHING;

-- =====================================================
-- MODEL 4: MEDIUM SIMILARITY (~60%)
-- Basic 4G phone - fewer stations, simpler config
-- =====================================================

INSERT INTO models (id, customer_id, code, name, board_types, created_at)
SELECT 
  'a4000000-0000-0000-0000-000000000004'::uuid,
  c.id,
  'PHONE_4G_BASIC',
  '4G Basic Phone - Entry Level',
  ARRAY['Mainboard'],
  NOW()
FROM customers c WHERE c.code = 'HUAWEI'
ON CONFLICT (id) DO NOTHING;

INSERT INTO model_stations (model_id, station_code, board_type, sequence, manpower, cycle_time)
VALUES
  ('a4000000-0000-0000-0000-000000000004', 'MBT', 'Mainboard', 1, 1, 60),
  ('a4000000-0000-0000-0000-000000000004', 'CAL1', 'Mainboard', 2, 1, 45),
  ('a4000000-0000-0000-0000-000000000004', 'RFT1', 'Mainboard', 3, 1, 60),
  ('a4000000-0000-0000-0000-000000000004', 'WIFIBT', 'Mainboard', 4, 1, 45),
  ('a4000000-0000-0000-0000-000000000004', '4G_INSTRUMENT', 'Mainboard', 5, 1, 90),
  ('a4000000-0000-0000-0000-000000000004', 'MAINBOARD_MMI', 'Mainboard', 6, 1, 30),
  ('a4000000-0000-0000-0000-000000000004', 'PACKING', 'Mainboard', 7, 1, 20)
ON CONFLICT DO NOTHING;

-- =====================================================
-- MODEL 5: LOWER SIMILARITY (~50%)
-- IoT device with some overlapping stations
-- =====================================================

INSERT INTO models (id, customer_id, code, name, board_types, created_at)
SELECT 
  'a5000000-0000-0000-0000-000000000005'::uuid,
  c.id,
  'IOT_GATEWAY_V2',
  'IoT Gateway Device V2',
  ARRAY['Mainboard'],
  NOW()
FROM customers c WHERE c.code = 'XIAOMI'
ON CONFLICT (id) DO NOTHING;

INSERT INTO model_stations (model_id, station_code, board_type, sequence, manpower, cycle_time)
VALUES
  ('a5000000-0000-0000-0000-000000000005', 'MBT', 'Mainboard', 1, 1, 45),
  ('a5000000-0000-0000-0000-000000000005', 'CAL1', 'Mainboard', 2, 1, 30),
  ('a5000000-0000-0000-0000-000000000005', 'WIFIBT', 'Mainboard', 3, 1, 45),
  ('a5000000-0000-0000-0000-000000000005', 'PACKING', 'Mainboard', 4, 1, 15),
  -- Different stations
  ('a5000000-0000-0000-0000-000000000005', 'ICT', 'Mainboard', 5, 1, 30),
  ('a5000000-0000-0000-0000-000000000005', 'FCT', 'Mainboard', 6, 1, 60),
  ('a5000000-0000-0000-0000-000000000005', 'BURN_IN', 'Mainboard', 7, 0, 3600)
ON CONFLICT DO NOTHING;

-- =====================================================
-- MODEL 6: VERY LOW SIMILARITY (~30%)
-- Completely different product - Smart Watch
-- =====================================================

INSERT INTO models (id, customer_id, code, name, board_types, created_at)
SELECT 
  'a6000000-0000-0000-0000-000000000006'::uuid,
  c.id,
  'SMARTWATCH_V3',
  'Smart Watch V3 - Fitness Edition',
  ARRAY['Mainboard'],
  NOW()
FROM customers c WHERE c.code = 'TCL'
ON CONFLICT (id) DO NOTHING;

INSERT INTO model_stations (model_id, station_code, board_type, sequence, manpower, cycle_time)
VALUES
  ('a6000000-0000-0000-0000-000000000006', 'MBT', 'Mainboard', 1, 1, 30),
  ('a6000000-0000-0000-0000-000000000006', 'WIFIBT', 'Mainboard', 2, 1, 30),
  ('a6000000-0000-0000-0000-000000000006', 'PACKING', 'Mainboard', 3, 1, 15),
  -- Unique to watch
  ('a6000000-0000-0000-0000-000000000006', 'HEART_RATE', 'Mainboard', 4, 1, 20),
  ('a6000000-0000-0000-0000-000000000006', 'DISPLAY_CAL', 'Mainboard', 5, 1, 25),
  ('a6000000-0000-0000-0000-000000000006', 'WATERPROOF', 'Mainboard', 6, 1, 60)
ON CONFLICT DO NOTHING;

-- =====================================================
-- MODEL 7: ALMOST EXACT (~95%)
-- Same as Model 1 but from different customer
-- =====================================================

INSERT INTO models (id, customer_id, code, name, board_types, created_at)
SELECT 
  'a7000000-0000-0000-0000-000000000007'::uuid,
  c.id,
  'PHONE_5G_ELITE',
  '5G Elite Phone - Premium Line',
  ARRAY['Mainboard', 'Sub-board'],
  NOW()
FROM customers c WHERE c.code = 'HUAWEI'
ON CONFLICT (id) DO NOTHING;

INSERT INTO model_stations (model_id, station_code, board_type, sequence, manpower, cycle_time)
VALUES
  ('a7000000-0000-0000-0000-000000000007', 'MBT', 'Mainboard', 1, 2, 55),
  ('a7000000-0000-0000-0000-000000000007', 'CAL1', 'Mainboard', 2, 1, 40),
  ('a7000000-0000-0000-0000-000000000007', 'CAL2', 'Mainboard', 3, 1, 40),
  ('a7000000-0000-0000-0000-000000000007', 'RFT1', 'Mainboard', 4, 1, 55),
  ('a7000000-0000-0000-0000-000000000007', 'RFT2', 'Mainboard', 5, 1, 55),
  ('a7000000-0000-0000-0000-000000000007', 'WIFIBT', 'Mainboard', 6, 1, 40),
  ('a7000000-0000-0000-0000-000000000007', '4G_INSTRUMENT', 'Mainboard', 7, 1, 85),
  ('a7000000-0000-0000-0000-000000000007', '5G_INSTRUMENT', 'Mainboard', 8, 1, 85),
  ('a7000000-0000-0000-0000-000000000007', 'MAINBOARD_MMI', 'Mainboard', 9, 1, 25),
  ('a7000000-0000-0000-0000-000000000007', 'SUBBOARD_MMI', 'Sub-board', 10, 1, 25),
  ('a7000000-0000-0000-0000-000000000007', 'PACKING', 'Mainboard', 11, 1, 18)
ON CONFLICT DO NOTHING;

-- =====================================================
-- MODEL 8: EXTENDED VERSION (~80%)
-- All original + extra advanced testing
-- =====================================================

INSERT INTO models (id, customer_id, code, name, board_types, created_at)
SELECT 
  'a8000000-0000-0000-0000-000000000008'::uuid,
  c.id,
  'PHONE_5G_ULTRA',
  '5G Ultra Phone - Flagship with Advanced Testing',
  ARRAY['Mainboard', 'Sub-board', 'Camera'],
  NOW()
FROM customers c WHERE c.code = 'XIAOMI'
ON CONFLICT (id) DO NOTHING;

INSERT INTO model_stations (model_id, station_code, board_type, sequence, manpower, cycle_time)
VALUES
  -- All original 11 stations
  ('a8000000-0000-0000-0000-000000000008', 'MBT', 'Mainboard', 1, 3, 60),
  ('a8000000-0000-0000-0000-000000000008', 'CAL1', 'Mainboard', 2, 1, 45),
  ('a8000000-0000-0000-0000-000000000008', 'CAL2', 'Mainboard', 3, 1, 45),
  ('a8000000-0000-0000-0000-000000000008', 'RFT1', 'Mainboard', 4, 1, 60),
  ('a8000000-0000-0000-0000-000000000008', 'RFT2', 'Mainboard', 5, 1, 60),
  ('a8000000-0000-0000-0000-000000000008', 'WIFIBT', 'Mainboard', 6, 1, 45),
  ('a8000000-0000-0000-0000-000000000008', '4G_INSTRUMENT', 'Mainboard', 7, 1, 90),
  ('a8000000-0000-0000-0000-000000000008', '5G_INSTRUMENT', 'Mainboard', 8, 1, 90),
  ('a8000000-0000-0000-0000-000000000008', 'MAINBOARD_MMI', 'Mainboard', 9, 1, 30),
  ('a8000000-0000-0000-0000-000000000008', 'SUBBOARD_MMI', 'Sub-board', 10, 1, 30),
  ('a8000000-0000-0000-0000-000000000008', 'PACKING', 'Mainboard', 11, 1, 20),
  -- Extra advanced stations
  ('a8000000-0000-0000-0000-000000000008', 'CAMERA', 'Camera', 12, 2, 90),
  ('a8000000-0000-0000-0000-000000000008', 'NFC', 'Mainboard', 13, 1, 30),
  ('a8000000-0000-0000-0000-000000000008', 'FINGERPRINT', 'Mainboard', 14, 1, 45),
  ('a8000000-0000-0000-0000-000000000008', 'WIRELESS_CHARGING', 'Mainboard', 15, 1, 60)
ON CONFLICT DO NOTHING;

-- =====================================================
-- Add more station_master entries for extra stations used
-- =====================================================

INSERT INTO station_master (code, name, category, description, cycle_time_seconds, operator_ratio)
VALUES 
  ('NFC', 'NFC Test', 'Testing', 'Near Field Communication testing', 30, 1.0),
  ('CAMERA', 'Camera Test', 'Testing', 'Camera module testing and calibration', 90, 1.0),
  ('ICT', 'In-Circuit Test', 'Testing', 'In-circuit testing for PCB', 30, 0.5),
  ('FCT', 'Functional Test', 'Testing', 'Functional circuit testing', 60, 1.0),
  ('BURN_IN', 'Burn-in Test', 'Testing', 'Extended reliability burn-in test', 3600, 0.1),
  ('HEART_RATE', 'Heart Rate Sensor', 'Testing', 'Heart rate sensor calibration', 20, 1.0),
  ('DISPLAY_CAL', 'Display Calibration', 'Testing', 'Display color and brightness calibration', 25, 1.0),
  ('WATERPROOF', 'Waterproof Test', 'Testing', 'IP rating waterproof testing', 60, 1.0),
  ('FINGERPRINT', 'Fingerprint Test', 'Testing', 'Fingerprint sensor testing', 45, 1.0),
  ('WIRELESS_CHARGING', 'Wireless Charging Test', 'Testing', 'Qi wireless charging test', 60, 1.0)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- Run these to verify data was inserted correctly
-- =====================================================

-- Check models created
SELECT 
  m.code AS model_code,
  m.name AS model_name,
  c.name AS customer,
  COUNT(ms.id) AS station_count,
  SUM(ms.manpower) AS total_manpower
FROM models m
JOIN customers c ON m.customer_id = c.id
LEFT JOIN model_stations ms ON m.id = ms.model_id
WHERE m.id IN (
  'a1000000-0000-0000-0000-000000000001',
  'a2000000-0000-0000-0000-000000000002',
  'a3000000-0000-0000-0000-000000000003',
  'a4000000-0000-0000-0000-000000000004',
  'a5000000-0000-0000-0000-000000000005',
  'a6000000-0000-0000-0000-000000000006',
  'a7000000-0000-0000-0000-000000000007',
  'a8000000-0000-0000-0000-000000000008'
)
GROUP BY m.id, m.code, m.name, c.name
ORDER BY station_count DESC;

-- Check station details per model
SELECT 
  m.code AS model_code,
  ARRAY_AGG(ms.station_code ORDER BY ms.sequence) AS stations
FROM models m
JOIN model_stations ms ON m.id = ms.model_id
WHERE m.id LIKE 'a%000000-0000-0000-0000-00000000000%'
GROUP BY m.id, m.code
ORDER BY m.code;
