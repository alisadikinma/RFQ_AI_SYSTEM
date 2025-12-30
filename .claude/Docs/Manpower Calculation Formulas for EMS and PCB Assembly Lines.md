# Manpower Calculation Formulas for EMS and PCB Assembly Lines

**The fundamental formula for calculating manpower in electronics manufacturing is Manpower = Cycle Time ÷ Takt Time × (1/Efficiency)**, where takt time represents the production pace required to meet customer demand. For a practical example: if machine cycle time is 60 seconds and target UPH is 100 units/hour, takt time equals 36 seconds, requiring **1.67 operators (rounded to 2 stations)** at 100% efficiency, or approximately 2 parallel machines/operators. The industry-standard efficiency factor of **85%** accounts for changeovers, minor stops, and quality-related delays.

## The core manpower equation drives all production planning

The standard manpower formula used across EMS manufacturing takes this form:

**Manpower Required = (n × t) / (w × s × η)**

Where **n** = target output (units per period), **t** = standard time per unit (man-minutes), **w** = available working time per employee (minutes), **s** = number of shifts, and **η** = efficiency factor (typically 0.85). An alternative expression using takt time simplifies to **Manpower = Total Work Content ÷ Takt Time**, where Takt Time = Available Production Time ÷ Customer Demand.

The relationship between cycle time and takt time determines whether production can meet demand. When cycle time exceeds takt time, additional operators or parallel stations become necessary. For instance, with 420 available minutes per shift and demand of 240 units, takt time calculates to **1.75 minutes per unit**—any operation exceeding this duration creates a bottleneck requiring additional resources.

## Fractional manpower enables efficient multi-machine operation

The concept of fractional manpower (expressed as decimals like 0.2 MP or 0.5 MP) indicates how many machines a single operator can manage simultaneously:

| MP Value | Interpretation | Machines per Operator |
|----------|----------------|----------------------|
| 0.2 MP | 1 operator handles 5 machines | 5 |
| 0.33 MP | 1 operator handles 3 machines | 3 |
| 0.5 MP | 1 operator handles 2 machines | 2 |
| 1.0 MP | Dedicated operator per machine | 1 |

The maximum number of machines one operator can manage follows the formula: **Machines per Operator = Machine Auto-Time ÷ (Load Time + Unload Time)**. For a test fixture with 55 seconds of automatic test time and 10 seconds total handling time, one operator can theoretically manage **5.5 fixtures**—effectively 5 stations. This dramatically improves throughput: a single operator managing 5 FCT fixtures at 10-second intervals achieves **360 UPH** compared to just 55 UPH with a single fixture.

The multi-fixture approach works particularly well for test stations where automatic test time dominates. When auto-test time is 120 seconds and load/unload totals 15 seconds, a single operator can efficiently manage **8 test fixtures**, creating substantial labor savings.

## EMS industry benchmarks establish practical staffing ratios

Industry standards for operator-to-machine ratios vary significantly by station type and automation level:

**SMT Line Staffing:** A complete SMT line (screen printer → pick-and-place → reflow oven → AOI) typically requires **2-3 operators** for high-volume production. Screen printers need dedicated operators for setup and solder paste management, while pick-and-place machines require 1-2 operators depending on feeder complexity. Reflow ovens, being fully automated, share operator coverage with adjacent equipment.

**Test Station Ratios:**
- **ICT (In-Circuit Test):** 1 operator per machine, cycle times of 30-90 seconds
- **FCT (Functional Test):** 1 operator per station for complex tests (60-300 second cycles), or 1 operator managing 3-8 fixtures for simpler tests
- **AOI (Automated Optical Inspection):** 1 operator per 1-2 machines, with the operator reviewing flagged defects
- **Flying Probe Test:** 1 operator per 2 machines due to longer cycle times

**Efficiency benchmarks:** World-class OEE reaches **85%+**, though typical electronics manufacturing averages **55-60%**. The standard **85% efficiency factor** in manpower calculations accounts for power failures, material shortages, speed losses, rework, and minor stoppages.

## Worked example demonstrates the complete calculation process

Consider a test area requiring ICT, FCT, and AOI stations with target output of **100 UPH**:

**Given parameters:** 480 minutes per shift (8 hours), 800 units/shift target, ICT cycle time 45 seconds, FCT cycle time 120 seconds, AOI cycle time 20 seconds, 85% efficiency.

**Step 1 - Calculate Takt Time:** 28,800 seconds ÷ 800 units = **36 seconds/unit**

**Step 2 - ICT Requirements:** Raw calculation = 45 ÷ 36 = 1.25 operators. With 85% efficiency = 1.25 ÷ 0.85 = 1.47 → **2 ICT stations with operators**

**Step 3 - FCT Requirements:** Raw calculation = 120 ÷ 36 = 3.33 operators. With efficiency = 3.33 ÷ 0.85 = 3.92 → **4 FCT stations with operators**

**Step 4 - AOI Requirements:** Raw calculation = 20 ÷ 36 = 0.56 → **1 AOI station with 1 operator** (who could potentially support additional AOI capacity)

**Total requirement:** 7 stations requiring 7 operators for 100 UPH throughput.

## Line balancing formulas optimize resource allocation

Line efficiency calculations identify bottlenecks and improvement opportunities:

**Line Efficiency = (Sum of Task Times) ÷ (Number of Stations × Bottleneck Cycle Time) × 100%**

For a test line with stations at 45, 25, 60, 55, and 40 seconds (total 225 seconds, bottleneck 60 seconds, 5 stations): Line Efficiency = 225 ÷ (5 × 60) × 100% = **75%**. The **25% balance delay** represents idle time that could be recovered through workload redistribution.

The theoretical minimum number of workstations follows: **N(min) = Sum of All Task Times ÷ Takt Time**. Round up to determine actual stations required. The **Smoothness Index** measures balance quality: SI = √[Σ(CT_max - CT_i)²], where lower values indicate smoother flow and SI = 0 represents perfect balance.

## Batch processing affects manpower calculations significantly

Panel-level testing (batch processing) versus individual unit testing produces different manpower requirements:

**Panelized PCB example:** A panel containing 4 individual PCBs with 90-second panel test time and target of 400 boards/hour requires: Panels/hour = 400 ÷ 4 = 100 panels. Panel takt time = 36 seconds. Stations needed = 90 ÷ 36 = 2.5 → **3 ICT stations**. Effective throughput = 160 boards/hour per station.

**Individual testing comparison:** Same 400 boards/hour with 30-second individual test time: Takt time = 9 seconds. Stations needed = 30 ÷ 9 = 3.33 → **4 stations**. Panel testing achieves approximately **35% better efficiency** through reduced per-board handling.

## Practical implementation requires multiple adjustment factors

Beyond the core calculations, real-world manpower planning incorporates several adjustment factors:

**Manpower Availability Factor (MAF)** accounts for absences: MAF = (Working Days - Leave Days) ÷ Working Days. With 300 working days and 40 leave days annually, MAF = **86.67%**. Required headcount = Calculated Manpower ÷ MAF, meaning 134 calculated operators becomes **155 actual headcount**.

**Standard Time with Allowances (PFD)** adds personal, fatigue, and delay allowances: Standard Time = Observed Time × Rating Factor × (1 + PFD Allowance). Typical PFD ranges from 15% for light work to 25%+ for heavy work in poor conditions.

**Changeover considerations:** Industry benchmarks target **10-20 minutes** for SMT line changeovers (world-class), while typical performance runs about 1 hour. Over 70% of changeover time can potentially convert from internal to external activities through SMED techniques.

## Conclusion

The manpower calculation framework for EMS production centers on the fundamental relationship **Manpower = Cycle Time ÷ Takt Time**, modified by an **85% efficiency factor** representing industry-standard operating conditions. Fractional manpower values enable efficient multi-machine operation—particularly valuable for test stations where **1 operator managing 5-8 fixtures** can dramatically increase throughput compared to dedicated staffing. 

For the specific example of 60-second cycle time with 100 UPH target: takt time = 36 seconds, raw requirement = 1.67 operators, practical implementation = **2 parallel stations with operators** (accounting for efficiency losses). IPC standards do not prescribe specific staffing ratios but require trained personnel at all assembly and inspection operations. The key insight for production planners: **auto-test time relative to handling time** determines multi-fixture potential, and **line balancing efficiency above 85%** indicates well-optimized resource allocation.