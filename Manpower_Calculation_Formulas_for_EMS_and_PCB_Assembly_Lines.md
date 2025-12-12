# Manpower Calculation Formulas for EMS and PCB Assembly Lines

**The fundamental formula for calculating manpower in electronics manufacturing is Manpower = Cycle Time ÷ Takt Time × (1/Efficiency)**, where takt time represents the production pace required to meet customer demand. For a practical example: if machine cycle time is 60 seconds and target UPH is 100 units/hour, takt time equals 36 seconds, requiring **1.67 operators (rounded to 2 stations)** at 100% efficiency, or approximately 2 parallel machines/operators. The industry-standard efficiency factor of **85%** accounts for changeovers, minor stops, and quality-related delays.

---

## 1. Core Formulas

### 1.1 Basic Relationships

```
UPH = 3600 ÷ Cycle Time (seconds)
Cycle Time = 3600 ÷ UPH

Takt Time = 3600 ÷ Target UPH
```

| UPH | Cycle Time | Speed |
|-----|-----------|-------|
| 40 | 90 sec | Slow (bottleneck) |
| 60 | 60 sec | Medium |
| 120 | 30 sec | Fast |
| 240 | 15 sec | Very Fast |

### 1.2 Manpower Calculation

```
Manpower Required = Cycle Time ÷ Takt Time × (1 ÷ Efficiency)

Where:
- Cycle Time = Station's processing time per unit (seconds)
- Takt Time = 3600 ÷ Target UPH (seconds)
- Efficiency = 0.85 (85% industry standard)
```

**Example:**
- Target UPH: 100 units/hour
- Station Cycle Time: 60 seconds
- Takt Time: 3600 ÷ 100 = 36 seconds
- MP = 60 ÷ 36 × (1 ÷ 0.85) = 1.96 ≈ **2 operators**

### 1.3 Alternative Formula (Direct from UPH)

```
Manpower = (Station Cycle Time × Target UPH) ÷ (3600 × Efficiency)

Or simplified:
Manpower = Target UPH ÷ Station UPH × (1 ÷ Efficiency)
```

---

## 2. Fractional Manpower (Operator Ratio)

Fractional manpower indicates how many machines one operator can handle simultaneously.

### 2.1 Formula

```
Machines per Operator = Auto-Test Time ÷ (Load Time + Unload Time)
Operator Ratio = 1 ÷ Machines per Operator
```

### 2.2 Standard Operator Ratios

| Operator Ratio | Meaning | Station Types |
|----------------|---------|---------------|
| 0.1 | 1 operator handles 10 machines | BURN_IN (long auto-time) |
| 0.2 | 1 operator handles 5 machines | Fully automated AOI, Reflow |
| 0.25 | 1 operator handles 4 machines | ICT, BAKING, automated test |
| 0.33 | 1 operator handles 3 machines | Semi-automated FCT |
| 0.5 | 1 operator handles 2 machines | ROUTER, CURING, RFT with fixtures |
| 1.0 | 1 operator per machine | Manual stations (VISUAL, MBT, PACKING) |

### 2.3 Multi-Fixture Example

For a test station with:
- Auto-test time: 55 seconds
- Load/unload time: 10 seconds

```
Machines per Operator = 55 ÷ 10 = 5.5 → 5 fixtures
Operator Ratio = 1 ÷ 5 = 0.2

One operator managing 5 FCT fixtures at 10-second intervals:
Throughput = 3600 ÷ 10 = 360 UPH (vs 65 UPH with single fixture)
```

---

## 3. Investment Calculation

### 3.1 Formula (Batam, Indonesia - 2025)

```
Investment per Station = Manpower × Monthly Wage × Investment Factor

Where:
- Monthly Wage = Rp 4,500,000 (Batam UMK 2025)
- Investment Factor = 3 (Equipment + Space + Utilities)

Investment = MP × 4,500,000 × 3 = MP × Rp 13,500,000
```

### 3.2 Quick Reference

| MP | Investment (IDR) | Investment (USD ~) |
|----|------------------|-------------------|
| 0.25 | Rp 3.4M | $210 |
| 0.5 | Rp 6.75M | $420 |
| 1.0 | Rp 13.5M | $840 |
| 2.0 | Rp 27M | $1,680 |
| 5.0 | Rp 67.5M | $4,200 |
| 10.0 | Rp 135M | $8,400 |

### 3.3 Total Line Investment

```
Total Investment = Σ (Station MP × 13,500,000)
```

---

## 4. Complete Calculation Examples

### Example 1: Simple Line Calculation

**Given:**
- Target UPH: 100 units/hour
- Stations: RFT (60s), CAL (45s), VISUAL (30s), PACKING (15s)

**Calculation:**
```
Takt Time = 3600 ÷ 100 = 36 seconds

RFT:     MP = 60 ÷ 36 ÷ 0.85 = 1.96 → 2 operators
CAL:     MP = 45 ÷ 36 ÷ 0.85 = 1.47 → 2 operators  
VISUAL:  MP = 30 ÷ 36 ÷ 0.85 = 0.98 → 1 operator
PACKING: MP = 15 ÷ 36 ÷ 0.85 = 0.49 → 1 operator

Total MP: 6 operators
Total Investment: 6 × Rp 13.5M = Rp 81M
```

### Example 2: With Fractional MP (Automated Stations)

**Given:**
- Target UPH: 150 units/hour
- Stations with operator ratios from station_master

**Calculation:**
```
Takt Time = 3600 ÷ 150 = 24 seconds

Station     | Cycle | Raw MP | Op Ratio | Actual MP
------------|-------|--------|----------|----------
ROUTER      | 12s   | 0.59   | 0.5      | 0.5 (1 op/2 machines)
ICT         | 3s    | 0.15   | 0.25     | 0.25 (1 op/4 machines)
FCT         | 45s   | 2.21   | 1.0      | 3 operators
RFT         | 60s   | 2.94   | 1.0      | 3 operators
VISUAL      | 20s   | 0.98   | 1.0      | 1 operator
PACKING     | 15s   | 0.74   | 1.0      | 1 operator

Total MP: 0.5 + 0.25 + 3 + 3 + 1 + 1 = 8.75
Total Investment: 8.75 × Rp 13.5M = Rp 118.1M
```

### Example 3: Bottleneck Identification

**Rule:** The station with lowest UPH determines line throughput.

```
Station     | Cycle Time | UPH    | Status
------------|------------|--------|--------
OS_DOWNLOAD | 30s        | 120    | OK
CAL         | 45s        | 80     | OK
RFT         | 90s        | 40     | ⚠️ BOTTLENECK
MMI         | 30s        | 120    | OK
VISUAL      | 20s        | 180    | OK

Line UPH = 40 (limited by RFT bottleneck)
```

**To increase throughput to 80 UPH:**
- Add parallel RFT station (2× capacity)
- Or reduce RFT cycle time to 45s

---

## 5. Station Master Reference

### 5.1 Standard Stations with Typical Values

| Code | Name | Cycle (s) | UPH | Op Ratio | Category |
|------|------|-----------|-----|----------|----------|
| ROUTER | PCB Router/Depaneling | 12 | 300 | 0.5 | Process |
| ICT | In-Circuit Test | 3 | 1200 | 0.25 | Testing |
| FCT | Functional Test | 45-120 | 30-80 | 1.0 | Testing |
| RFT | RF Test | 60-90 | 40-60 | 1.0 | Testing |
| CAL | Calibration | 45 | 80 | 1.0 | Testing |
| MMI | Man-Machine Interface | 30 | 120 | 1.0 | Testing |
| VISUAL | Visual Inspection | 20 | 180 | 1.0 | QC |
| AOI | Automated Optical Inspection | 25 | 144 | 0.25 | QC |
| OS_DOWNLOAD | Firmware Download | 30 | 120 | 0.5 | Programming |
| PACKING | Packing | 15 | 240 | 1.0 | Assembly |
| BURN_IN | Burn-in Test | 3600 | 1 | 0.1 | Testing |
| BAKING | Baking/Curing Oven | 120 | 30 | 0.25 | Process |

### 5.2 Inference Rules

```
IF target_uph > station_uph THEN
  parallel_stations = CEIL(target_uph / station_uph)
  actual_mp = parallel_stations × operator_ratio

IF station has auto-time > 30s AND load_time < 15s THEN
  consider multi-fixture operation
  operator_ratio = load_time / (auto_time + load_time)
```

---

## 6. Line Balancing

### 6.1 Line Efficiency Formula

```
Line Efficiency = (Sum of Task Times) ÷ (Stations × Bottleneck Cycle) × 100%
```

**Example:**
- Stations: 45s, 25s, 60s, 55s, 40s (total 225s)
- Bottleneck: 60s
- Stations: 5

```
Efficiency = 225 ÷ (5 × 60) × 100% = 75%
Balance Delay = 25% (room for improvement)
```

### 6.2 Optimal Balance

- **Target:** >85% line efficiency
- **Action:** Redistribute work or add parallel stations at bottleneck

---

## 7. Quick Calculation Cheatsheet

### For User Questions:

**Q: "I have machine X with UPH Y, how many operators needed for target Z?"**

```
Answer Formula:
MP = Target UPH ÷ Machine UPH ÷ 0.85

Example: Target 100 UPH, Machine UPH 40
MP = 100 ÷ 40 ÷ 0.85 = 2.94 → 3 operators (or 3 parallel machines)
```

**Q: "What's the investment for N manpower?"**

```
Answer Formula:
Investment = N × Rp 13,500,000

Example: 5 MP
Investment = 5 × 13.5M = Rp 67.5M
```

**Q: "What's my line's maximum UPH?"**

```
Answer: Find the station with LOWEST UPH (bottleneck)
Line UPH = Bottleneck Station UPH × Number of Parallel Units
```

---

## 8. Database Integration

### 8.1 Key Tables

- `station_master`: Contains `typical_uph`, `typical_cycle_time_sec`, `operator_ratio`
- `model_stations`: Contains `manpower` per station assignment
- Investment calculated dynamically: `SUM(manpower) × 13,500,000`

### 8.2 SQL Examples

```sql
-- Get total MP and investment for a model
SELECT 
  m.code,
  SUM(ms.manpower) as total_mp,
  SUM(ms.manpower) * 13500000 as investment_idr
FROM models m
JOIN model_stations ms ON m.id = ms.model_id
WHERE m.code = 'MODEL_ABC'
GROUP BY m.id, m.code;

-- Find bottleneck station for a model
SELECT 
  sm.code,
  sm.typical_uph,
  sm.typical_cycle_time_sec
FROM model_stations ms
JOIN station_master sm ON ms.machine_id = sm.id
WHERE ms.model_id = 'xxx'
ORDER BY sm.typical_uph ASC
LIMIT 1;
```

---

## Document Metadata

**Version:** 2.0  
**Last Updated:** December 2024  
**Location:** Batam, Indonesia  
**Currency:** IDR (Indonesian Rupiah)  
**Wage Reference:** UMK Batam 2025 = Rp 4,500,000/month  
**Efficiency Standard:** 85%  
**Investment Factor:** 3× (Equipment + Space + Utilities)
