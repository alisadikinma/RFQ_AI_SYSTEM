-- =====================================================
-- QUICK INSERT: Similarity Test Data (FIXED v4)
-- Based on actual schema from lib/api/*.ts
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Add station_master entries (if not exist)
-- Columns: code, name, category, description, typical_cycle_time_sec, typical_uph, operator_ratio
INSERT INTO station_master (code, name, category, description, typical_cycle_time_sec, typical_uph, operator_ratio)
VALUES 
  ('MBT', 'Manual Bench Test', 'Testing', 'MBT testing', 60, 60, 1.0),
  ('CAL1', 'Calibration 1', 'Testing', 'CAL1 testing', 45, 80, 1.0),
  ('CAL2', 'Calibration 2', 'Testing', 'CAL2 testing', 45, 80, 1.0),
  ('RFT1', 'RF Test 1', 'Testing', 'RF1 testing', 60, 60, 1.0),
  ('RFT2', 'RF Test 2', 'Testing', 'RF2 testing', 60, 60, 1.0),
  ('WIFIBT', 'WiFi Bluetooth Test', 'Testing', 'WIFIBT testing', 45, 80, 1.0),
  ('4G_INSTRUMENT', '4G Instrumentation', 'Testing', '4G instrument testing', 90, 40, 1.0),
  ('5G_INSTRUMENT', '5G Instrumentation', 'Testing', '5G instrument testing', 90, 40, 1.0),
  ('MAINBOARD_MMI', 'Mainboard MMI', 'Testing', 'Mainboard MMI test', 30, 120, 1.0),
  ('SUBBOARD_MMI', 'Sub-board MMI', 'Testing', 'Sub-board MMI test', 30, 120, 1.0),
  ('PACKING', 'Packing Station', 'Assembly', 'Packing and storage', 20, 180, 1.0),
  ('NFC', 'NFC Test', 'Testing', 'NFC testing', 30, 120, 1.0),
  ('CAMERA', 'Camera Test', 'Testing', 'Camera testing', 90, 40, 1.0),
  ('ICT', 'In-Circuit Test', 'Testing', 'ICT testing', 30, 120, 0.5),
  ('FCT', 'Functional Test', 'Testing', 'FCT testing', 60, 60, 1.0),
  ('BURN_IN', 'Burn-in Test', 'Testing', 'Burn-in testing', 3600, 1, 0.1),
  ('FINGERPRINT', 'Fingerprint Test', 'Testing', 'Fingerprint testing', 45, 80, 1.0),
  ('WIRELESS_CHARGING', 'Wireless Charging', 'Testing', 'Wireless charging test', 60, 60, 1.0)
ON CONFLICT (code) DO NOTHING;

-- Step 2: Insert models with varied similarity
DO $$
DECLARE
  v_xiaomi_id UUID;
  v_tcl_id UUID;
  v_huawei_id UUID;
  v_model_id UUID;
  -- Station IDs
  v_mbt_id UUID;
  v_cal1_id UUID;
  v_cal2_id UUID;
  v_rft1_id UUID;
  v_rft2_id UUID;
  v_wifibt_id UUID;
  v_4g_id UUID;
  v_5g_id UUID;
  v_mainboard_mmi_id UUID;
  v_subboard_mmi_id UUID;
  v_packing_id UUID;
  v_nfc_id UUID;
  v_camera_id UUID;
  v_ict_id UUID;
  v_fct_id UUID;
  v_burn_in_id UUID;
  v_fingerprint_id UUID;
  v_wireless_charging_id UUID;
BEGIN
  -- Get customer IDs
  SELECT id INTO v_xiaomi_id FROM customers WHERE code = 'XIAOMI' LIMIT 1;
  SELECT id INTO v_tcl_id FROM customers WHERE code = 'TCL' LIMIT 1;
  SELECT id INTO v_huawei_id FROM customers WHERE code = 'HUAWEI' LIMIT 1;
  
  -- If customers don't exist, create them
  IF v_xiaomi_id IS NULL THEN
    INSERT INTO customers (code, name) VALUES ('XIAOMI', 'Xiaomi Corporation') RETURNING id INTO v_xiaomi_id;
  END IF;
  IF v_tcl_id IS NULL THEN
    INSERT INTO customers (code, name) VALUES ('TCL', 'TCL Electronics') RETURNING id INTO v_tcl_id;
  END IF;
  IF v_huawei_id IS NULL THEN
    INSERT INTO customers (code, name) VALUES ('HUAWEI', 'Huawei Technologies') RETURNING id INTO v_huawei_id;
  END IF;

  -- Get station IDs (machine_id references)
  SELECT id INTO v_mbt_id FROM station_master WHERE code = 'MBT';
  SELECT id INTO v_cal1_id FROM station_master WHERE code = 'CAL1';
  SELECT id INTO v_cal2_id FROM station_master WHERE code = 'CAL2';
  SELECT id INTO v_rft1_id FROM station_master WHERE code = 'RFT1';
  SELECT id INTO v_rft2_id FROM station_master WHERE code = 'RFT2';
  SELECT id INTO v_wifibt_id FROM station_master WHERE code = 'WIFIBT';
  SELECT id INTO v_4g_id FROM station_master WHERE code = '4G_INSTRUMENT';
  SELECT id INTO v_5g_id FROM station_master WHERE code = '5G_INSTRUMENT';
  SELECT id INTO v_mainboard_mmi_id FROM station_master WHERE code = 'MAINBOARD_MMI';
  SELECT id INTO v_subboard_mmi_id FROM station_master WHERE code = 'SUBBOARD_MMI';
  SELECT id INTO v_packing_id FROM station_master WHERE code = 'PACKING';
  SELECT id INTO v_nfc_id FROM station_master WHERE code = 'NFC';
  SELECT id INTO v_camera_id FROM station_master WHERE code = 'CAMERA';
  SELECT id INTO v_ict_id FROM station_master WHERE code = 'ICT';
  SELECT id INTO v_fct_id FROM station_master WHERE code = 'FCT';
  SELECT id INTO v_burn_in_id FROM station_master WHERE code = 'BURN_IN';
  SELECT id INTO v_fingerprint_id FROM station_master WHERE code = 'FINGERPRINT';
  SELECT id INTO v_wireless_charging_id FROM station_master WHERE code = 'WIRELESS_CHARGING';

  -- =====================================================
  -- MODEL 1: EXACT MATCH (100%)
  -- 11/11 stations = 100%
  -- =====================================================
  INSERT INTO models (customer_id, code, name, status, board_types)
  VALUES (v_xiaomi_id, 'PHONE_5G_PRO_V1', '5G Pro Phone - Full Test', 'active', ARRAY['Mainboard', 'Sub-board'])
  RETURNING id INTO v_model_id;
  
  INSERT INTO model_stations (model_id, machine_id, board_type, sequence, manpower)
  VALUES
    (v_model_id, v_mbt_id, 'Mainboard', 1, 2),
    (v_model_id, v_cal1_id, 'Mainboard', 2, 1),
    (v_model_id, v_cal2_id, 'Mainboard', 3, 1),
    (v_model_id, v_rft1_id, 'Mainboard', 4, 1),
    (v_model_id, v_rft2_id, 'Mainboard', 5, 1),
    (v_model_id, v_wifibt_id, 'Mainboard', 6, 1),
    (v_model_id, v_4g_id, 'Mainboard', 7, 1),
    (v_model_id, v_5g_id, 'Mainboard', 8, 1),
    (v_model_id, v_mainboard_mmi_id, 'Mainboard', 9, 1),
    (v_model_id, v_subboard_mmi_id, 'Sub-board', 10, 1),
    (v_model_id, v_packing_id, 'Mainboard', 11, 1);

  RAISE NOTICE '✅ Model 1: PHONE_5G_PRO_V1 - 11 stations (Expected: 100%%)';

  -- =====================================================
  -- MODEL 2: VERY HIGH SIMILARITY (~91%)
  -- 10/11 stations (missing SUBBOARD_MMI only)
  -- =====================================================
  INSERT INTO models (customer_id, code, name, status, board_types)
  VALUES (v_huawei_id, 'PHONE_5G_ELITE', '5G Elite Premium - Single Board', 'active', ARRAY['Mainboard'])
  RETURNING id INTO v_model_id;
  
  INSERT INTO model_stations (model_id, machine_id, board_type, sequence, manpower)
  VALUES
    (v_model_id, v_mbt_id, 'Mainboard', 1, 2),
    (v_model_id, v_cal1_id, 'Mainboard', 2, 1),
    (v_model_id, v_cal2_id, 'Mainboard', 3, 1),
    (v_model_id, v_rft1_id, 'Mainboard', 4, 1),
    (v_model_id, v_rft2_id, 'Mainboard', 5, 1),
    (v_model_id, v_wifibt_id, 'Mainboard', 6, 1),
    (v_model_id, v_4g_id, 'Mainboard', 7, 1),
    (v_model_id, v_5g_id, 'Mainboard', 8, 1),
    (v_model_id, v_mainboard_mmi_id, 'Mainboard', 9, 1),
    -- NO SUBBOARD_MMI (missing 1)
    (v_model_id, v_packing_id, 'Mainboard', 10, 1);

  RAISE NOTICE '✅ Model 2: PHONE_5G_ELITE - 10 stations (Expected: ~91%%)';

  -- =====================================================
  -- MODEL 3: HIGH SIMILARITY (~82%)
  -- 9/11 stations (missing 5G_INSTRUMENT & SUBBOARD_MMI)
  -- =====================================================
  INSERT INTO models (customer_id, code, name, status, board_types)
  VALUES (v_xiaomi_id, 'PHONE_4G_PLUS_V1', '4G Plus Phone - No 5G', 'active', ARRAY['Mainboard'])
  RETURNING id INTO v_model_id;
  
  INSERT INTO model_stations (model_id, machine_id, board_type, sequence, manpower)
  VALUES
    (v_model_id, v_mbt_id, 'Mainboard', 1, 2),
    (v_model_id, v_cal1_id, 'Mainboard', 2, 1),
    (v_model_id, v_cal2_id, 'Mainboard', 3, 1),
    (v_model_id, v_rft1_id, 'Mainboard', 4, 1),
    (v_model_id, v_rft2_id, 'Mainboard', 5, 1),
    (v_model_id, v_wifibt_id, 'Mainboard', 6, 1),
    (v_model_id, v_4g_id, 'Mainboard', 7, 1),
    -- NO 5G_INSTRUMENT
    (v_model_id, v_mainboard_mmi_id, 'Mainboard', 8, 1),
    -- NO SUBBOARD_MMI
    (v_model_id, v_packing_id, 'Mainboard', 9, 1);

  RAISE NOTICE '✅ Model 3: PHONE_4G_PLUS_V1 - 9 stations (Expected: ~82%%)';

  -- =====================================================
  -- MODEL 4: EXTENDED VERSION (~73%)
  -- 11 match + 4 extra = 11/15 union
  -- =====================================================
  INSERT INTO models (customer_id, code, name, status, board_types)
  VALUES (v_xiaomi_id, 'PHONE_5G_ULTRA', '5G Ultra Flagship', 'active', ARRAY['Mainboard', 'Sub-board', 'Camera'])
  RETURNING id INTO v_model_id;
  
  INSERT INTO model_stations (model_id, machine_id, board_type, sequence, manpower)
  VALUES
    (v_model_id, v_mbt_id, 'Mainboard', 1, 3),
    (v_model_id, v_cal1_id, 'Mainboard', 2, 1),
    (v_model_id, v_cal2_id, 'Mainboard', 3, 1),
    (v_model_id, v_rft1_id, 'Mainboard', 4, 1),
    (v_model_id, v_rft2_id, 'Mainboard', 5, 1),
    (v_model_id, v_wifibt_id, 'Mainboard', 6, 1),
    (v_model_id, v_4g_id, 'Mainboard', 7, 1),
    (v_model_id, v_5g_id, 'Mainboard', 8, 1),
    (v_model_id, v_mainboard_mmi_id, 'Mainboard', 9, 1),
    (v_model_id, v_subboard_mmi_id, 'Sub-board', 10, 1),
    (v_model_id, v_packing_id, 'Mainboard', 11, 1),
    -- Extra 4 stations
    (v_model_id, v_camera_id, 'Camera', 12, 2),
    (v_model_id, v_nfc_id, 'Mainboard', 13, 1),
    (v_model_id, v_fingerprint_id, 'Mainboard', 14, 1),
    (v_model_id, v_wireless_charging_id, 'Mainboard', 15, 1);

  RAISE NOTICE '✅ Model 4: PHONE_5G_ULTRA - 15 stations (Expected: ~73%%)';

  -- =====================================================
  -- MODEL 5: MEDIUM-HIGH (~62%)
  -- 8 match + 2 extra = 8/13 union
  -- =====================================================
  INSERT INTO models (customer_id, code, name, status, board_types)
  VALUES (v_tcl_id, 'TABLET_5G_V1', '5G Tablet with NFC', 'active', ARRAY['Mainboard', 'Display'])
  RETURNING id INTO v_model_id;
  
  INSERT INTO model_stations (model_id, machine_id, board_type, sequence, manpower)
  VALUES
    (v_model_id, v_mbt_id, 'Mainboard', 1, 2),
    (v_model_id, v_cal1_id, 'Mainboard', 2, 1),
    -- NO CAL2
    (v_model_id, v_rft1_id, 'Mainboard', 3, 1),
    (v_model_id, v_rft2_id, 'Mainboard', 4, 1),
    (v_model_id, v_wifibt_id, 'Mainboard', 5, 1),
    -- NO 4G_INSTRUMENT
    (v_model_id, v_5g_id, 'Mainboard', 6, 1),
    (v_model_id, v_mainboard_mmi_id, 'Display', 7, 2),
    -- NO SUBBOARD_MMI
    (v_model_id, v_packing_id, 'Mainboard', 8, 1),
    -- Extra stations
    (v_model_id, v_nfc_id, 'Mainboard', 9, 1),
    (v_model_id, v_camera_id, 'Mainboard', 10, 1);

  RAISE NOTICE '✅ Model 5: TABLET_5G_V1 - 10 stations (Expected: ~62%%)';

  -- =====================================================
  -- MODEL 6: MEDIUM (~50%)
  -- 6 match + 1 extra = 6/12 union = 50%
  -- =====================================================
  INSERT INTO models (customer_id, code, name, status, board_types)
  VALUES (v_huawei_id, 'PHONE_4G_BASIC', '4G Basic Phone Entry Level', 'active', ARRAY['Mainboard'])
  RETURNING id INTO v_model_id;
  
  INSERT INTO model_stations (model_id, machine_id, board_type, sequence, manpower)
  VALUES
    (v_model_id, v_mbt_id, 'Mainboard', 1, 1),
    (v_model_id, v_cal1_id, 'Mainboard', 2, 1),
    -- NO CAL2
    (v_model_id, v_rft1_id, 'Mainboard', 3, 1),
    -- NO RFT2
    (v_model_id, v_wifibt_id, 'Mainboard', 4, 1),
    (v_model_id, v_4g_id, 'Mainboard', 5, 1),
    -- NO 5G_INSTRUMENT
    -- NO MAINBOARD_MMI
    -- NO SUBBOARD_MMI
    (v_model_id, v_packing_id, 'Mainboard', 6, 1),
    -- Extra station
    (v_model_id, v_ict_id, 'Mainboard', 7, 1);

  RAISE NOTICE '✅ Model 6: PHONE_4G_BASIC - 7 stations (Expected: ~50%%)';

  -- =====================================================
  -- MODEL 7: LOW (~29%)
  -- 4 match + 3 extra = 4/14 union
  -- =====================================================
  INSERT INTO models (customer_id, code, name, status, board_types)
  VALUES (v_xiaomi_id, 'IOT_GATEWAY_V2', 'IoT Gateway Device', 'active', ARRAY['Mainboard'])
  RETURNING id INTO v_model_id;
  
  INSERT INTO model_stations (model_id, machine_id, board_type, sequence, manpower)
  VALUES
    (v_model_id, v_mbt_id, 'Mainboard', 1, 1),
    (v_model_id, v_cal1_id, 'Mainboard', 2, 1),
    -- Only 2 more matches
    (v_model_id, v_wifibt_id, 'Mainboard', 3, 1),
    (v_model_id, v_packing_id, 'Mainboard', 4, 1),
    -- Extra stations (not in query)
    (v_model_id, v_ict_id, 'Mainboard', 5, 1),
    (v_model_id, v_fct_id, 'Mainboard', 6, 1),
    (v_model_id, v_burn_in_id, 'Mainboard', 7, 0);

  RAISE NOTICE '✅ Model 7: IOT_GATEWAY_V2 - 7 stations (Expected: ~29%%)';

  -- =====================================================
  -- MODEL 8: VERY LOW (~23%)
  -- 3 match + 2 extra = 3/13 union
  -- =====================================================
  INSERT INTO models (customer_id, code, name, status, board_types)
  VALUES (v_tcl_id, 'SMARTWATCH_V3', 'Smart Watch Fitness Edition', 'active', ARRAY['Mainboard'])
  RETURNING id INTO v_model_id;
  
  INSERT INTO model_stations (model_id, machine_id, board_type, sequence, manpower)
  VALUES
    (v_model_id, v_mbt_id, 'Mainboard', 1, 1),
    (v_model_id, v_wifibt_id, 'Mainboard', 2, 1),
    (v_model_id, v_packing_id, 'Mainboard', 3, 1),
    -- Extra (not in query)
    (v_model_id, v_fct_id, 'Mainboard', 4, 1),
    (v_model_id, v_camera_id, 'Mainboard', 5, 1);

  RAISE NOTICE '✅ Model 8: SMARTWATCH_V3 - 5 stations (Expected: ~23%%)';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ALL 8 MODELS CREATED SUCCESSFULLY!';
  RAISE NOTICE '========================================';

END $$;

-- =====================================================
-- VERIFY: Check inserted data
-- =====================================================
SELECT 
  m.code,
  c.name as customer,
  COUNT(ms.id) as stations,
  SUM(ms.manpower) as total_mp,
  ARRAY_AGG(sm.code ORDER BY ms.sequence) as station_list
FROM models m
JOIN customers c ON m.customer_id = c.id
JOIN model_stations ms ON m.id = ms.model_id
JOIN station_master sm ON ms.machine_id = sm.id
WHERE m.code IN (
  'PHONE_5G_PRO_V1', 'PHONE_5G_ELITE', 'PHONE_4G_PLUS_V1', 
  'PHONE_5G_ULTRA', 'TABLET_5G_V1', 'PHONE_4G_BASIC', 
  'IOT_GATEWAY_V2', 'SMARTWATCH_V3'
)
GROUP BY m.code, c.name
ORDER BY stations DESC;
