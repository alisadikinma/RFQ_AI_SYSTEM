# EMS Test Line Reference Guide

## Overview

This reference guide covers standard test station naming conventions, purposes, cycle times, and cost structures used in Electronics Manufacturing Services (EMS) production environments. This document serves as an AI knowledge base for production planning, cost estimation, and line configuration.

---

## 1. Standard Test Station List

### 1.1 Complete Station Sequence

The typical EMS test line includes the following stations in sequence:

| Station Code | Full Name | Primary Purpose |
| :-- | :-- | :-- |
| **OS DOWNLOAD** | Operating System Download | Firmware/software programming and flashing |
| **MBT** | Manual Bench Test | Manual rework, repair, and bench-level testing |
| **CAL** | Calibration | Sensor calibration, voltage/current trimming |
| **RFT** | Radio Frequency Test | RF performance testing (RSSI, RSRP, frequency response) |
| **MMI** | Man-Machine Interface | User interface testing (touchscreen, buttons, display) |
| **CURRENT TESTING** | Current/Power Load Test | Power consumption verification under load conditions |
| **VISUAL** | Visual Inspection | Optical inspection for physical defects, component placement |
| **UNDERFILL** | Underfill Application | Epoxy underfill for BGA/CSP/flip-chip reliability |
| **T-GREASE** | Thermal Grease Application | Thermal interface material (TIM) application for heat dissipation |
| **SHIELDING COVER** | Shielding Assembly | RF shielding and EMI cover installation |
| **CAL/RFT 2G–4G** | Multi-RAT RF Calibration | 2G/3G/4G RF calibration and performance testing |
| **PCB CURRENT** | PCB-Level Current Test | Board-level current draw and power integrity verification |
| **ROUTER** | PCB Router/Depaneling | Separate individual PCBs from panel after SMT |
| **LASER_MARKING** | Laser ISN Printing | Permanent serial number marking via laser engraving |
| **LABEL_PRINTING** | Label/Barcode Printing | Adhesive label with barcode/QR code application |

---

## 2. Alternative Station Names by Customer

Different OEMs and EMS providers may use alternative terminology for the same test functions:

### 2.1 Common Naming Variants

| Standard Name | Alternative Names | Region/Customer Notes |
| :-- | :-- | :-- |
| **RFT** | Signal Verify, RF Performance Test, Radio Test, Wireless Verify | Common in telecom and IoT products |
| **CURRENT TESTING** | Power Load, Load Test, Power Consumption Test, Electrical Load | Power module and battery-powered devices |
| **VISUAL** | AOI (Automated Optical Inspection), Final Visual, Appearance Check, QC Inspection | High-volume SMT lines |
| **OS DOWNLOAD** | SW Download, Firmware Flash, Programming Station, Code Loading | Software-heavy products (smartphones, IoT) |
| **CAL** | Calibration Station, Trim Station, Alignment Station | Sensor and precision devices |
| **MMI** | HMI Test, UI Test, User Interface Validation, Display Test | Consumer electronics with screens |
| **MBT** | Rework Station, Repair Bench, Touch-Up Station | Manual intervention point |
| **UNDERFILL** | Capillary Underfill, No-Flow Underfill, Chip Reinforcement | BGA-heavy assemblies |
| **T-GREASE** | TIM Application, Thermal Paste, Thermal Compound Station | Power electronics, high-performance computing |
| **SHIELDING COVER** | EMI Shield Assembly, RF Cover, Metal Shield Installation | RF and wireless products |
| **ROUTER** | Depaneling, Singulation, PCB Separator, Board Cutter | Multi-cavity PCB panels |
| **LASER_MARKING** | Laser Engraving, ISN Laser, Permanent Marking | Traceability requirements |
| **LABEL_PRINTING** | Barcode Printing, Label Pasting, Sticker Application | Product identification |

---

## 3. Typical Cycle Times and Manpower Ratios

### 3.1 Cycle Time Benchmarks (per unit)

| Station Type | Typical Cycle Time | Notes |
| :-- | :-- | :-- |
| **OS DOWNLOAD** | 10–60 seconds | Depends on firmware size and flash speed |
| **ICT (In-Circuit Test)** | 1–3 seconds | For ~400 test points, highly automated |
| **FCT (Functional Test)** | 15–120 seconds | Product-dependent; complex products take longer |
| **AOI (Automated Optical Inspection)** | 25–115 seconds | Varies by board complexity and resolution |
| **RFT (RF Test)** | 30–180 seconds | Frequency range, multi-band testing extends time |
| **VISUAL (Manual)** | 30–90 seconds | Human inspection, 28 components in 30 sec with AI |
| **CAL (Calibration)** | 20–90 seconds | Sensor type and accuracy requirements |
| **CURRENT TESTING** | 15–60 seconds | Load profile complexity and settling time |
| **UNDERFILL** | 30–120 seconds | Capillary flow + cure time (if in-line curing) |
| **T-GREASE** | 10–30 seconds | Automated dispensing; manual application slower |
| **MMI Test** | 20–90 seconds | Touchscreen, button matrix, display verification |
| **ROUTER** | 15–30 seconds | Depends on cavity count and cut complexity |
| **LASER_MARKING** | 5–12 seconds | Character count and marking depth |
| **LABEL_PRINTING** | 3–8 seconds | Print + apply time |

### 3.2 Manpower Ratios (operators per station)

| Station Configuration | Manpower Ratio | Notes |
| :-- | :-- | :-- |
| **Fully Automated (ICT/AOI/AXI)** | 1 operator : 3–5 stations | Operator loads/unloads and monitors |
| **Semi-Automated (FCT/RFT)** | 1 operator : 1–2 stations | Manual fixture loading required |
| **Manual Stations (Visual/MBT)** | 1 operator : 1 station | Full-time operator engagement |
| **High-Mix Low-Volume** | 1 operator : 1 station | Frequent changeovers increase labor |
| **High-Volume Production** | 1 operator : 4–8 stations | Automation reduces labor per unit |
| **Router Machine** | 1 operator : 2–3 machines | Semi-automated with auto-feed |
| **Laser Marking** | 1 operator : 3–5 machines | Highly automated, operator monitors |
| **Label Printing** | 1 operator : 2–4 machines | Semi-automated application |

---

## 4. Fixture Cost and Amortization Logic

### 4.1 Typical Fixture Costs

| Fixture Type | Initial Cost (USD) | Lifespan | Amortization Method |
| :-- | :-- | :-- | :-- |
| **ICT Bed-of-Nails Fixture** | $10,000–$25,000 | 3–5 years or 500K+ units | Spread across production volume |
| **FCT Custom Fixture** | $8,000–$20,000 | 3–5 years or design lifecycle | Amortized over total units produced |
| **Flying Probe (no fixture)** | $0 (equipment only) | N/A | Higher per-unit test time cost |
| **RF Test Fixture** | $15,000–$30,000 | 3–5 years | High for low-volume; critical for RF products |
| **Multi-Site Fixture (4–8 sites)** | $20,000–$50,000 | 3–5 years | Reduces per-unit cost significantly |
| **Router Fixture/Jig** | $2,000–$8,000 | 2–3 years | Per-model tooling |
| **Laser Marking Fixture** | $1,000–$3,000 | 2–3 years | Simple positioning jig |

### 4.2 Amortization Formula

**Per-Unit Fixture Cost** = (Fixture Cost) / (Expected Production Volume)

**Example:**
- Fixture cost: $15,000
- Expected volume: 50,000 units
- **Per-unit cost: $0.30**

For high-volume products (>100K units), fixture cost becomes negligible (<$0.15/unit).

---

## 5. Parallel Testing and Multi-Site Configuration

### 5.1 Parallel Testing Benefits

| Configuration | Throughput Gain | Cost Efficiency | Typical Use Case |
| :-- | :-- | :-- | :-- |
| **Single-Site** | 1× (baseline) | Lowest capital cost | Prototypes, low volume (<10K/year) |
| **Quad-Site (4×)** | 3.2–3.6× | High efficiency | Medium volume (50K–200K/year) |
| **Octal-Site (8×)** | 5.5–6.5× | Optimal for most | High volume (200K–1M/year) |
| **16-Site** | 9–12× | Diminishing returns | Very high volume (>1M/year) |

### 5.2 Efficiency Factors

**Parallel Efficiency** = (Actual Throughput) / (Theoretical Throughput)

Typical efficiency: **70–90%** due to serialization, site downtime, and test synchronization.

---

## 6. Retest Allowance Factors

### 6.1 First Pass Yield (FPY) and Retest

| Production Stage | Typical FPY | Retest Rate | Retest Cycle Impact |
| :-- | :-- | :-- | :-- |
| **SMT + AOI** | 95–99% | 1–5% | Minimal; mostly solder defects |
| **ICT** | 92–97% | 3–8% | Component placement, opens/shorts |
| **FCT** | 85–95% | 5–15% | Functional failures, parametric issues |
| **RFT (RF products)** | 80–92% | 8–20% | Tuning, shielding, antenna issues |
| **Final QC/Visual** | 97–99.5% | 0.5–3% | Cosmetic defects, labeling |

---

## 7. Inferring Missing Stations by Product Type

### 7.1 Decision Matrix by Product Category

| Product Type | Required Stations | Optional Stations |
| :-- | :-- | :-- |
| **MCU-Based** | OS DOWNLOAD, CAL, CURRENT TESTING, FCT | ICT, VISUAL |
| **RF/Wireless Modules** | RFT, CAL/RFT 2G–4G, SHIELDING COVER | AXI, CURRENT TESTING |
| **Sensor Products** | CAL, Environmental Testing, FCT | ICT, VISUAL |
| **Power Electronics** | CURRENT TESTING, Load Test, T-GREASE | FCT, Thermal Cycling |
| **Consumer Electronics** | MMI, VISUAL, RFT, OS DOWNLOAD, UNDERFILL | All stations |
| **Multi-Cavity PCB** | ROUTER (mandatory after SMT) | - |

### 7.2 Inference Rules

- **IF** product has RF/wireless **→** Add RFT, CAL, SHIELDING_COVER
- **IF** product has MCU **→** Add OS_DOWNLOAD, CAL
- **IF** product has display/touchscreen **→** Add MMI
- **IF** product has sensors **→** Add CAL (mandatory)
- **IF** product has high power dissipation (>5W) **→** Add T-GREASE
- **IF** product has BGA/CSP packages **→** Add UNDERFILL, AXI
- **IF** PCB is multi-cavity panel **→** Add ROUTER (after SMT, before testing)
- **IF** product requires traceability **→** Add LASER_MARKING or LABEL_PRINTING
- **IF** battery-powered **→** Add CURRENT_TESTING

---

## 8. Station Descriptions and Technical Details

### 8.1 OS DOWNLOAD (Operating System Download)

**Purpose:** Flash firmware, bootloader, calibration data, and configuration files to microcontrollers, SoCs, or memory devices.

**Process:**
1. Device connected via JTAG, SWD, UART, or USB
2. Firmware binary transferred and verified
3. Optional: Serial number, MAC address, or product key programmed
4. Checksum verification ensures data integrity

**Cycle Time:** 10–60 seconds (firmware size dependent)
**Equipment:** Programming fixtures, JTAG/SWD debuggers, automated handlers

---

### 8.2 MBT (Manual Bench Test)

**Purpose:** Manual rework, repair, and bench-level troubleshooting for units that failed automated testing.

**Process:**
1. Operator receives failed unit with diagnostic report
2. Visual inspection and multimeter probing
3. Component replacement or solder rework as needed
4. Unit re-enters test flow after repair

**Cycle Time:** 5–30 minutes (failure-dependent)
**Manpower:** 1 operator per station (skilled technician)

---

### 8.3 CAL (Calibration)

**Purpose:** Trim and calibrate sensors, ADCs, DACs, voltage references, and other parametric components to meet specifications.

**Cycle Time:** 20–90 seconds
**Equipment:** Precision references, calibration fixtures, automated test systems

---

### 8.4 RFT (Radio Frequency Test)

**Purpose:** Validate RF performance including transmit power, receive sensitivity, frequency accuracy, and modulation quality.

**Cycle Time:** 30–180 seconds (multi-band testing increases time)
**Equipment:** Spectrum analyzers, signal generators, RF shields, anechoic chambers

---

### 8.5 MMI (Man-Machine Interface)

**Purpose:** Validate user interface elements including touchscreens, buttons, LEDs, displays, and audio.

**Cycle Time:** 20–90 seconds
**Equipment:** Touch panel testers, automated robotic arms, camera-based inspection

---

### 8.6 CURRENT TESTING (Current/Power Load Test)

**Purpose:** Measure power consumption under various operating modes (idle, active, sleep, peak load).

**Cycle Time:** 15–60 seconds
**Equipment:** Electronic loads, programmable power supplies, current probes

---

### 8.7 VISUAL (Visual Inspection)

**Purpose:** Detect cosmetic defects, component placement errors, solder defects, and physical damage.

**Cycle Time:** 30–90 seconds (manual), 25–115 seconds (AOI)
**Equipment:** AOI machines, magnifying lamps, microscopes, AI vision systems

---

### 8.8 UNDERFILL

**Purpose:** Apply epoxy underfill material beneath BGA, CSP, or flip-chip packages to improve mechanical strength and thermal cycling reliability.

**Cycle Time:** 30–120 seconds (excluding cure time if off-line)
**Equipment:** Automated dispensers, UV/thermal cure ovens

---

### 8.9 T-GREASE (Thermal Grease Application)

**Purpose:** Apply thermal interface material (TIM) between heat-generating components and heat sinks.

**Cycle Time:** 10–30 seconds (automated); 1–2 minutes (manual)
**Equipment:** Automated dispensers, stencils, screen printers

---

### 8.10 SHIELDING COVER

**Purpose:** Install EMI/RF shielding covers to reduce electromagnetic interference.

**Cycle Time:** 10–20 seconds
**Equipment:** Automated placement machines, manual assembly tools

---

## 9. Additional Assembly Processes

### 9.1 ROUTER (PCB Depaneling/Singulation)

**Purpose:** Separate individual PCBs from multi-cavity panel after SMT process. This is a CRITICAL process that MUST occur after SMT but BEFORE testing, because test fixtures are designed for individual PCB units, not panels.

**Process Flow Position:**
```
SMT → AOI → ROUTER → Testing (ICT/FCT/RFT) → Assembly → Packing
```

**Why Router Before Testing:**
- Multi-cavity PCB panels from SMT cannot be tested until separated
- Test fixtures are designed for single PCB units
- Individual PCB access required for probe contact and fixture loading

**Process:**
1. Panel loaded into router machine (manual or auto-feed)
2. Routing spindle cuts along pre-defined V-score or tab routes
3. Individual PCBs separated and collected
4. Dust extraction removes debris
5. Optional: Edge inspection for routing quality

**Cycle Time Calculation:**
- **Typical cycle time:** 15–30 seconds per panel
- **Per-unit time:** Panel time ÷ cavity count
- Example: 20s panel time ÷ 4 cavities = 5 seconds per unit

**Manpower Calculation (Target UPH = 100):**
```
Takt Time = 3600 ÷ 100 = 36 seconds
Cycle Time = 25 seconds (typical)
Raw MP = 25 ÷ 36 = 0.69
MP @85% efficiency = 0.69 ÷ 0.85 = 0.82
Rounded = 1.0 MP
```

**Equipment & Investment:**
| Item | Cost (USD) | Notes |
|------|-----------|-------|
| Router Machine | $35,000–$55,000 | Automatic with dust extraction |
| Router Fixture | $2,000–$8,000 | Per-model tooling |
| Spindle Bits | $50–$200 each | Consumable, replace per 10K-50K cuts |

**Alternative Names:** Depaneling, Singulation, PCB Separator, Board Cutter, V-Cut Router

---

### 9.2 LASER_MARKING (Laser ISN Printing)

**Purpose:** Permanently engrave serial numbers (ISN), 2D barcodes, QR codes, or traceability marks directly onto PCB, component, or housing using laser technology.

**Advantages over Labels:**
- Permanent marking (cannot be removed/replaced)
- No consumables (no labels/ribbons)
- Higher precision and smaller character size
- Better for harsh environments

**Process:**
1. PCB/unit positioned in laser marking area
2. Vision system aligns marking position
3. Laser engraves ISN/barcode (fiber or CO2 laser)
4. Verification camera reads and validates marking
5. Data logged to MES/traceability system

**Cycle Time Calculation:**
- **Typical cycle time:** 5–12 seconds
- Depends on: character count, marking depth, material

**Manpower Calculation (Target UPH = 100):**
```
Takt Time = 3600 ÷ 100 = 36 seconds
Cycle Time = 8 seconds (typical)
Raw MP = 8 ÷ 36 = 0.22
MP @85% efficiency = 0.22 ÷ 0.85 = 0.26
Rounded = 0.3 MP (1 operator handles 3-4 machines)
```

**Equipment & Investment:**
| Item | Cost (USD) | Notes |
|------|-----------|-------|
| Fiber Laser Marker | $10,000–$18,000 | 20-50W, most common for electronics |
| CO2 Laser Marker | $8,000–$15,000 | For plastics and organic materials |
| Vision System | $2,000–$5,000 | For alignment and verification |
| Marking Fixture | $500–$2,000 | Simple positioning jig |

**Alternative Names:** Laser Engraving, ISN Laser, Permanent Marking, Laser Etching

---

### 9.3 LABEL_PRINTING (Label/Barcode Printing)

**Purpose:** Print and apply adhesive labels containing serial numbers, barcodes, QR codes, product information, or regulatory marks.

**When to Use Labels vs Laser:**
- Labels: Lower investment, faster setup, suitable for most products
- Laser: When permanence required, harsh environment, premium products

**Process:**
1. Label printer receives data from MES (ISN, model, date code)
2. Thermal transfer or direct thermal printing
3. Label dispensed and applied (manual or auto-applicator)
4. Barcode scanner verifies printed content
5. Data logged to traceability system

**Cycle Time Calculation:**
- **Typical cycle time:** 3–8 seconds
- Print time: 1–3 seconds
- Apply time: 2–5 seconds

**Manpower Calculation (Target UPH = 100):**
```
Takt Time = 3600 ÷ 100 = 36 seconds
Cycle Time = 5 seconds (typical)
Raw MP = 5 ÷ 36 = 0.14
MP @85% efficiency = 0.14 ÷ 0.85 = 0.16
Rounded = 0.2 MP (1 operator handles 5 machines)
```

**Equipment & Investment:**
| Item | Cost (USD) | Notes |
|------|-----------|-------|
| Thermal Transfer Printer | $1,500–$4,000 | Zebra, TSC, SATO brands |
| Auto Label Applicator | $3,000–$8,000 | Optional, for high volume |
| Label Stock (per roll) | $20–$50 | Consumable |
| Ribbon (per roll) | $15–$30 | Consumable for thermal transfer |

**Alternative Names:** Barcode Printing, Label Pasting, Sticker Application, ISN Label

---

### 9.4 SHIPMENT HANDLING

**Purpose:** Prepare finished goods for shipment, either to internal FATP (Final Assembly, Test & Pack) facility or external customer.

#### 9.4.1 Internal Shipment (to FATP/SN Internal)

**Scenario:** PCBA completed at EMS, shipped to internal FATP line for final assembly into complete product.

**Process:**
1. PCBA passed final QC
2. ESD packaging in trays/tubes
3. Lot labeling and documentation
4. Internal logistics transfer
5. MES handoff to FATP system

**Additional Costs:**
- Internal logistics: ~Rp 500,000–1,000,000 per lot
- Packaging materials: ~Rp 200–500 per unit
- Handling manpower: 0.2 MP

**Manpower:** 0.2 MP (shared with packing)

#### 9.4.2 External Shipment (to Customer)

**Scenario:** Finished product shipped to external customer (OEM/brand owner).

**Process:**
1. Final QC and OQC (Outgoing Quality Control)
2. Individual product packaging (box, manual, accessories)
3. Master carton packing
4. Export documentation (packing list, invoice, customs)
5. Freight arrangement (air/sea)

**Additional Costs:**
- Export documentation: ~Rp 500,000–1,500,000 per shipment
- Packaging materials: ~Rp 1,000–5,000 per unit
- Freight (depends on destination and mode)
- Handling manpower: 0.3 MP

**Manpower:** 0.3 MP (dedicated packing operator)

---

## 10. Manpower Calculation Reference

### 10.1 Core Formula

**Manpower = (Cycle Time ÷ Takt Time) ÷ Efficiency**

Where:
- **Takt Time** = Available Time ÷ Target Output = 3600 seconds ÷ Target UPH
- **Efficiency** = 85% (industry standard)

### 10.2 Quick Reference Table (Target UPH = 100)

| Process | Cycle Time (s) | Raw MP | MP @85% | Rounded MP |
|---------|---------------|--------|---------|------------|
| Router | 25 | 0.69 | 0.82 | 1.0 MP |
| Laser Marking | 8 | 0.22 | 0.26 | 0.3 MP |
| Label Printing | 5 | 0.14 | 0.16 | 0.2 MP |
| Underfill | 45 | 1.25 | 1.47 | 1.5 MP |
| Thermal & Glue | 15 | 0.42 | 0.49 | 0.5 MP |
| Visual Inspection | 45 | 1.25 | 1.47 | 1.5 MP |
| Shipment (Internal) | - | - | - | 0.2 MP |
| Shipment (External) | - | - | - | 0.3 MP |

### 10.3 Investment Summary (Additional Processes)

| Process | Equipment (USD) | Fixture (USD) | Total Investment |
|---------|----------------|---------------|------------------|
| Router | $45,000 | $5,000 | $50,000 |
| Laser Marking | $12,000 | $1,500 | $13,500 |
| Label Printing | $2,500 | $500 | $3,000 |
| Underfill | $25,000 | $2,000 | $27,000 |
| Thermal & Glue | $8,000 | $1,000 | $9,000 |
| Visual (Manual) | $2,000 | $500 | $2,500 |

### 10.4 Monthly Labor Cost (Batam 2025)

**UMK Batam 2025:** Rp 4,989,600/month

| MP Value | Monthly Cost (IDR) | Interpretation |
|----------|-------------------|----------------|
| 0.2 MP | Rp 997,920 | 1 operator handles 5 processes |
| 0.3 MP | Rp 1,496,880 | 1 operator handles 3 processes |
| 0.5 MP | Rp 2,494,800 | 1 operator handles 2 processes |
| 1.0 MP | Rp 4,989,600 | Dedicated operator |
| 1.5 MP | Rp 7,484,400 | 1.5 operators (2 stations, 1 floating) |

---

## 11. Cost Model Summary

### 11.1 Total Test Cost Formula

**Total Test Cost per Unit** = Equipment Depreciation + Fixture Cost + Direct Labor + Overhead + Maintenance + Bad Part Cost

### 11.2 Example Calculation

**Assumptions:**
- Equipment cost: $150,000 (5-year depreciation)
- Fixture cost: $15,000 (amortized over 50,000 units)
- Production volume: 10,000 units/month
- Direct labor: Rp 4,989,600/month per MP
- Overhead: 5% of equipment cost/year
- Yield: 90% FPY

---

## 12. Quick Reference Tables

### 12.1 Station Code Lookup

| Code | Station Name | Test Category |
| :-- | :-- | :-- |
| OS | OS Download | Programming |
| MBT | Manual Bench Test | Rework/Repair |
| CAL | Calibration | Parametric |
| RFT | RF Test | RF/Wireless |
| MMI | Man-Machine Interface | Functional |
| CT | Current Testing | Power/Load |
| VI | Visual Inspection | Cosmetic/Physical |
| UF | Underfill | Assembly |
| TG | Thermal Grease | Thermal Management |
| SC | Shielding Cover | EMI/Assembly |
| RTR | Router/Depaneling | PCB Separation |
| LM | Laser Marking | Traceability |
| LP | Label Printing | Traceability |

---

## 13. Glossary of Terms

**AOI** — Automated Optical Inspection
**ATE** — Automated Test Equipment
**BGA** — Ball Grid Array
**CSP** — Chip Scale Package
**DUT** — Device Under Test
**EMS** — Electronics Manufacturing Services
**FATP** — Final Assembly, Test & Pack
**FCT** — Functional Circuit Test
**FPY** — First Pass Yield
**ICT** — In-Circuit Test
**ISN** — Individual Serial Number
**MCU** — Microcontroller Unit
**MES** — Manufacturing Execution System
**OQC** — Outgoing Quality Control
**PCB** — Printed Circuit Board
**PCBA** — Printed Circuit Board Assembly
**RF** — Radio Frequency
**SMT** — Surface Mount Technology
**TIM** — Thermal Interface Material
**UPH** — Units Per Hour

---

## Document Metadata

**Version:** 2.0
**Last Updated:** December 2024
**Additions:** Router, Laser Marking, Label Printing, Shipment Handling processes
**Intended Use:** AI knowledge base for production planning, cost estimation, and RFQ processing

---

**END OF DOCUMENT**
