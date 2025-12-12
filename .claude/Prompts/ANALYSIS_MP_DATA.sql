-- ============================================================
-- ANALISIS DATA MANPOWER (MP) - RFQ AI SYSTEM
-- ============================================================
-- Formula dari research:
-- MP = Cycle Time ÷ Takt Time × (1/Efficiency)
-- Fractional MP: 0.2 = 1 operator untuk 5 mesin
-- Machines per Operator = Auto-Time ÷ (Load Time + Unload Time)
-- ============================================================

-- ============================================================
-- 1. OVERVIEW: Distribusi MP saat ini
-- ============================================================
SELECT 
  manpower,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM model_stations), 2) as percentage
FROM model_stations
GROUP BY manpower
ORDER BY manpower;

-- ============================================================
-- 2. STATION MASTER: Lihat cycle time dan UPH per station
-- ============================================================
SELECT 
  code,
  name,
  typical_cycle_time_sec,
  typical_uph,
  category,
  -- Hitung expected MP berdasarkan cycle time
  -- Asumsi: Takt Time = 36 detik (100 UPH target), Efficiency = 85%
  ROUND(typical_cycle_time_sec / 36.0 / 0.85, 2) as expected_mp_100uph
FROM station_master
ORDER BY typical_cycle_time_sec DESC;

-- ============================================================
-- 3. ANALISIS: MP di model_stations vs expected dari station_master
-- ============================================================
SELECT 
  ms.station_code,
  sm.name as station_name,
  sm.typical_cycle_time_sec,
  sm.typical_uph,
  ms.manpower as current_mp,
  -- Expected MP untuk 100 UPH (takt = 36s), efficiency 85%
  ROUND(sm.typical_cycle_time_sec / 36.0 / 0.85, 2) as expected_mp,
  COUNT(*) as occurrences,
  -- Flag jika berbeda signifikan
  CASE 
    WHEN ms.manpower > ROUND(sm.typical_cycle_time_sec / 36.0 / 0.85, 2) * 2 THEN 'TOO HIGH'
    WHEN ms.manpower < ROUND(sm.typical_cycle_time_sec / 36.0 / 0.85, 2) * 0.5 THEN 'TOO LOW'
    ELSE 'OK'
  END as status
FROM model_stations ms
JOIN station_master sm ON ms.station_code = sm.code
GROUP BY ms.station_code, sm.name, sm.typical_cycle_time_sec, sm.typical_uph, ms.manpower
ORDER BY ms.station_code, ms.manpower;

-- ============================================================
-- 4. STATISTIK: Min/Max/Avg MP per station_code
-- ============================================================
SELECT 
  ms.station_code,
  sm.name,
  sm.typical_cycle_time_sec,
  MIN(ms.manpower) as min_mp,
  MAX(ms.manpower) as max_mp,
  ROUND(AVG(ms.manpower), 2) as avg_mp,
  COUNT(*) as total_records,
  -- Expected MP
  ROUND(sm.typical_cycle_time_sec / 36.0 / 0.85, 2) as expected_mp_100uph
FROM model_stations ms
JOIN station_master sm ON ms.station_code = sm.code
GROUP BY ms.station_code, sm.name, sm.typical_cycle_time_sec
ORDER BY sm.typical_cycle_time_sec DESC;

-- ============================================================
-- 5. ANOMALY DETECTION: MP = 0 atau MP sangat tinggi
-- ============================================================
SELECT 
  ms.id,
  m.code as model_code,
  ms.station_code,
  ms.board_type,
  ms.manpower,
  sm.typical_cycle_time_sec,
  'ANOMALY: MP=0' as issue
FROM model_stations ms
JOIN models m ON ms.model_id = m.id
JOIN station_master sm ON ms.station_code = sm.code
WHERE ms.manpower = 0

UNION ALL

SELECT 
  ms.id,
  m.code as model_code,
  ms.station_code,
  ms.board_type,
  ms.manpower,
  sm.typical_cycle_time_sec,
  'ANOMALY: MP > 10' as issue
FROM model_stations ms
JOIN models m ON ms.model_id = m.id
JOIN station_master sm ON ms.station_code = sm.code
WHERE ms.manpower > 10

ORDER BY issue, station_code;

-- ============================================================
-- 6. TOP MODELS: Model dengan total MP tertinggi
-- ============================================================
SELECT 
  m.code as model_code,
  m.name as model_name,
  c.name as customer,
  COUNT(ms.id) as station_count,
  SUM(ms.manpower) as total_mp,
  ROUND(AVG(ms.manpower), 2) as avg_mp_per_station
FROM models m
JOIN customers c ON m.customer_id = c.id
JOIN model_stations ms ON m.model_id = ms.model_id
GROUP BY m.id, m.code, m.name, c.name
ORDER BY total_mp DESC
LIMIT 20;

-- ============================================================
-- 7. SAMPLE DATA: Lihat beberapa record untuk validasi
-- ============================================================
SELECT 
  m.code as model_code,
  ms.board_type,
  ms.station_code,
  ms.sequence,
  ms.manpower,
  sm.typical_cycle_time_sec,
  sm.typical_uph
FROM model_stations ms
JOIN models m ON ms.model_id = m.id
JOIN station_master sm ON ms.station_code = sm.code
WHERE m.code LIKE 'L83%' -- Ganti dengan model code yang ingin dilihat
ORDER BY ms.board_type, ms.sequence
LIMIT 50;

-- ============================================================
-- 8. FORMULA REFERENCE: Cara hitung MP yang benar
-- ============================================================
/*
FORMULA MANPOWER (dari research):

1. Basic Formula:
   MP = Cycle Time ÷ Takt Time × (1/Efficiency)
   
   Dimana:
   - Takt Time = 3600 / Target UPH
   - Efficiency = 0.85 (85%)

2. Contoh:
   - Target UPH = 100
   - Takt Time = 3600 / 100 = 36 detik
   - Cycle Time = 60 detik
   - MP = 60 / 36 / 0.85 = 1.96 ≈ 2 operator

3. Fractional MP (untuk automated station):
   - MP 0.2 = 1 operator handle 5 mesin
   - MP 0.33 = 1 operator handle 3 mesin
   - MP 0.5 = 1 operator handle 2 mesin
   - MP 1.0 = 1 operator per mesin

4. Multi-fixture calculation:
   Machines per Operator = Auto-Time / (Load + Unload Time)
   Contoh: Auto 55s, Handle 10s → 1 op handle 5 mesin → MP = 0.2

5. Station Type Guidelines:
   - Fully Automated (AOI, Reflow): MP 0.2-0.33
   - Semi-Automated (FCT, ICT): MP 0.5-1.0
   - Manual (Visual, MBT): MP 1.0
*/

-- ============================================================
-- 9. PATCH QUERY TEMPLATE: Update MP berdasarkan formula
-- ============================================================
-- PREVIEW dulu (DRY RUN):
SELECT 
  ms.id,
  ms.station_code,
  ms.manpower as old_mp,
  -- New MP calculation: cycle_time / 36 / 0.85, rounded to 1 decimal
  ROUND(GREATEST(0.2, sm.typical_cycle_time_sec / 36.0 / 0.85), 1) as new_mp,
  sm.typical_cycle_time_sec
FROM model_stations ms
JOIN station_master sm ON ms.station_code = sm.code
WHERE ms.manpower != ROUND(GREATEST(0.2, sm.typical_cycle_time_sec / 36.0 / 0.85), 1)
LIMIT 100;

-- ACTUAL UPDATE (jalankan setelah preview OK):
/*
UPDATE model_stations ms
SET manpower = ROUND(GREATEST(0.2, sm.typical_cycle_time_sec / 36.0 / 0.85), 1)
FROM station_master sm
WHERE ms.station_code = sm.code;
*/

-- ============================================================
-- 10. VERIFY: Setelah patch, cek ulang distribusi
-- ============================================================
-- Jalankan query #1 lagi untuk verify
