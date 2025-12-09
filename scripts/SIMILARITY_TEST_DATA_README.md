# Similarity Test Data Summary (REVISED)

## Query Stations (from uploaded image)
```
MBT, CAL1, CAL2, RFT1, RFT2, WIFIBT, 4G_INSTRUMENT, 5G_INSTRUMENT, MAINBOARD_MMI, SUBBOARD_MMI, PACKING
```
**Total: 11 stations**

---

## Test Models & Expected Similarity (Jaccard)

| Rank | Model | Customer | Stations | Match | Miss | Extra | Jaccard |
|------|-------|----------|----------|-------|------|-------|---------|
| 🥇 | PHONE_5G_PRO_V1 | XIAOMI | 11 | 11 | 0 | 0 | **100%** |
| 🥈 | PHONE_5G_ELITE | HUAWEI | 10 | 10 | 1 | 0 | **91%** |
| 🥉 | PHONE_4G_PLUS_V1 | XIAOMI | 9 | 9 | 2 | 0 | **82%** |
| 4 | PHONE_5G_ULTRA | XIAOMI | 15 | 11 | 0 | 4 | **73%** |
| 5 | TABLET_5G_V1 | TCL | 10 | 8 | 3 | 2 | **62%** |
| 6 | PHONE_4G_BASIC | HUAWEI | 7 | 6 | 5 | 1 | **50%** |
| 7 | IOT_GATEWAY_V2 | XIAOMI | 7 | 4 | 7 | 3 | **29%** |
| 8 | SMARTWATCH_V3 | TCL | 5 | 3 | 8 | 2 | **23%** |

---

## Jaccard Similarity Formula

```
Similarity = |A ∩ B| / |A ∪ B|

Where:
- A = Query stations (11)
- B = Model stations
- ∩ = Intersection (matching)
- ∪ = Union (all unique)
```

---

## Station Details Per Model

### 🥇 Model 1: PHONE_5G_PRO_V1 (XIAOMI) - 100%
```
✅ MBT, CAL1, CAL2, RFT1, RFT2, WIFIBT, 4G_INSTRUMENT, 
   5G_INSTRUMENT, MAINBOARD_MMI, SUBBOARD_MMI, PACKING
```
**11 match / 11 union = 100%**

---

### 🥈 Model 2: PHONE_5G_ELITE (HUAWEI) - 91%
```
✅ MBT, CAL1, CAL2, RFT1, RFT2, WIFIBT, 4G_INSTRUMENT, 
   5G_INSTRUMENT, MAINBOARD_MMI, PACKING
❌ Missing: SUBBOARD_MMI
```
**10 match / 11 union = 91%**

---

### 🥉 Model 3: PHONE_4G_PLUS_V1 (XIAOMI) - 82%
```
✅ MBT, CAL1, CAL2, RFT1, RFT2, WIFIBT, 4G_INSTRUMENT, 
   MAINBOARD_MMI, PACKING
❌ Missing: 5G_INSTRUMENT, SUBBOARD_MMI
```
**9 match / 11 union = 82%**

---

### Model 4: PHONE_5G_ULTRA (XIAOMI) - 73%
```
✅ MBT, CAL1, CAL2, RFT1, RFT2, WIFIBT, 4G_INSTRUMENT, 
   5G_INSTRUMENT, MAINBOARD_MMI, SUBBOARD_MMI, PACKING
➕ Extra: CAMERA, NFC, FINGERPRINT, WIRELESS_CHARGING
```
**11 match / 15 union = 73%**

---

### Model 5: TABLET_5G_V1 (TCL) - 62%
```
✅ MBT, CAL1, RFT1, RFT2, WIFIBT, 5G_INSTRUMENT, MAINBOARD_MMI, PACKING
❌ Missing: CAL2, 4G_INSTRUMENT, SUBBOARD_MMI
➕ Extra: NFC, CAMERA
```
**8 match / 13 union = 62%**

---

### Model 6: PHONE_4G_BASIC (HUAWEI) - 50%
```
✅ MBT, CAL1, RFT1, WIFIBT, 4G_INSTRUMENT, PACKING
❌ Missing: CAL2, RFT2, 5G_INSTRUMENT, MAINBOARD_MMI, SUBBOARD_MMI
➕ Extra: ICT
```
**6 match / 12 union = 50%**

---

### Model 7: IOT_GATEWAY_V2 (XIAOMI) - 29%
```
✅ MBT, CAL1, WIFIBT, PACKING
❌ Missing: CAL2, RFT1, RFT2, 4G_INSTRUMENT, 5G_INSTRUMENT, MAINBOARD_MMI, SUBBOARD_MMI
➕ Extra: ICT, FCT, BURN_IN
```
**4 match / 14 union = 29%**

---

### Model 8: SMARTWATCH_V3 (TCL) - 23%
```
✅ MBT, WIFIBT, PACKING
❌ Missing: CAL1, CAL2, RFT1, RFT2, 4G_INSTRUMENT, 5G_INSTRUMENT, MAINBOARD_MMI, SUBBOARD_MMI
➕ Extra: FCT, CAMERA
```
**3 match / 13 union = 23%**

---

## Expected UI Result

When searching with the 11 stations from image, top 5 should show:

```
📊 Analisis Selesai!

🥇 PHONE_5G_PRO_V1 (XIAOMI) - 100%
   11 stations | 11 MP | Perfect match!

🥈 PHONE_5G_ELITE (HUAWEI) - 91%
   10 stations | 10 MP
   ❌ Missing: SUBBOARD_MMI

🥉 PHONE_4G_PLUS_V1 (XIAOMI) - 82%
   9 stations | 9 MP
   ❌ Missing: 5G_INSTRUMENT, SUBBOARD_MMI

4️⃣ PHONE_5G_ULTRA (XIAOMI) - 73%
   15 stations | 17 MP
   ➕ Extra: CAMERA, NFC, FINGERPRINT, WIRELESS_CHARGING

5️⃣ TABLET_5G_V1 (TCL) - 62%
   10 stations | 11 MP
   ❌ Missing: CAL2, 4G_INSTRUMENT, SUBBOARD_MMI
```

---

## How to Run

1. Open **Supabase Dashboard** → SQL Editor
2. Copy-paste contents of `scripts/seed-test-data-quick.sql`
3. Click **Run** (or Ctrl+Enter)
4. Verify results with the SELECT query at the end

---

## Cleanup (if needed)

```sql
DELETE FROM model_stations WHERE model_id IN (
  SELECT id FROM models WHERE code IN (
    'PHONE_5G_PRO_V1', 'PHONE_5G_ELITE', 'PHONE_4G_PLUS_V1',
    'PHONE_5G_ULTRA', 'TABLET_5G_V1', 'PHONE_4G_BASIC',
    'IOT_GATEWAY_V2', 'SMARTWATCH_V3'
  )
);

DELETE FROM models WHERE code IN (
  'PHONE_5G_PRO_V1', 'PHONE_5G_ELITE', 'PHONE_4G_PLUS_V1',
  'PHONE_5G_ULTRA', 'TABLET_5G_V1', 'PHONE_4G_BASIC',
  'IOT_GATEWAY_V2', 'SMARTWATCH_V3'
);
```
