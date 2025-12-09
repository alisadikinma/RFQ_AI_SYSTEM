# Gemini Deep Research Prompt 5: Cost Engineering & Economics

## Instructions
1. Copy the prompt below
2. Paste into Gemini/Perplexity (Deep Research mode)
3. Save output as `05_cost_engineering.md`

---

## PROMPT (Copy from here)

```
You are an EMS cost engineer and financial analyst specializing in Southeast Asian manufacturing operations. Create a comprehensive reference on manufacturing costs and economics in Electronics Manufacturing Services.

## CRITICAL REQUIREMENTS:
- **All cost data must be current as of 2025**
- **Primary focus: Indonesia (Batam) and Southeast Asia**
- Secondary reference: China, Vietnam, Malaysia, Thailand for comparison
- Equipment costs: 2024-2025 market prices in USD
- Labor costs: 2025 regional rates
- Include currency: USD and IDR (Indonesian Rupiah) where applicable
- Format: Markdown with formulas and tables
- Length: 4000-5500 words

## IMPORTANT CONTEXT:
- Batam, Indonesia is a Free Trade Zone (FTZ) with special tax benefits
- UMK Batam 2025: Rp 4,989,600/month (approximately USD 310-320/month)
- Exchange rate reference: ~Rp 16,000/USD (adjust to current)

---

## Topics to Cover:

### 1. Cost Structure Breakdown

#### 1.1 Manufacturing Cost Components

**Direct Costs:**
| Category | % of Total | Components |
|----------|------------|------------|
| Materials | 60-80% | PCB, components, consumables |
| Direct Labor | 5-15% | Operators, technicians |
| Direct Overhead | 5-10% | Equipment depreciation, utilities |

**Indirect Costs:**
| Category | % of Total | Components |
|----------|------------|------------|
| Indirect Labor | 3-8% | Supervisors, quality, engineering |
| Facility | 2-5% | Rent, utilities, insurance |
| G&A | 2-5% | Management, HR, IT |

#### 1.2 Material Cost Breakdown (2025 Pricing)

**PCB Costs (per square inch) - 2025:**
| Layer Count | Standard FR4 | High-Tg | HDI |
|-------------|--------------|---------|-----|
| 2-layer | $X-X | $X-X | N/A |
| 4-layer | $X-X | $X-X | $X-X |
| 6-layer | $X-X | $X-X | $X-X |
| 8-layer | $X-X | $X-X | $X-X |

**Component Cost Categories (2025):**
- Passive components (R, C, L) pricing trends
- Active components (ICs) market situation
- Connector pricing
- Supply chain considerations post-chip shortage

**Consumables (per board typical):**
- Solder paste cost per board
- Flux and cleaning materials
- Packaging materials

#### 1.3 Labor Cost Models (2025 Southeast Asia Focus)

**Regional Labor Cost Comparison (2025):**
| Country/Region | Monthly Wage (USD) | Hourly Rate | Notes |
|----------------|-------------------|-------------|-------|
| **Batam, Indonesia** | ~$310-320 | ~$1.80-1.90 | UMK 2025: Rp 4,989,600 |
| Jakarta, Indonesia | ~$280-300 | ~$1.70 | Lower than Batam |
| Vietnam (North) | $X | $X | Hanoi region |
| Vietnam (South) | $X | $X | Ho Chi Minh region |
| Malaysia (Penang) | $X | $X | Electronics hub |
| Thailand | $X | $X | Eastern Seaboard |
| China (Shenzhen) | $X | $X | Pearl River Delta |
| China (inland) | $X | $X | Lower cost regions |
| Philippines | $X | $X | CALABARZON region |

**Loaded Labor Cost Calculation:**
```
Loaded Cost = Base Wage × (1 + Benefits Rate) × (1 + Overhead Rate)

Indonesia Example (2025):
- Base: Rp 4,989,600/month ÷ 173 hours = Rp 28,841/hour
- Benefits (BPJS, THR, etc.): +25-35%
- Overhead: +20-30%
- Loaded rate: ~Rp 45,000-50,000/hour (~$2.80-3.10/hour)
```

**Batam FTZ Benefits:**
- Import duty exemptions
- VAT exemptions on imported materials
- Simplified customs procedures
- Impact on total cost structure

#### 1.4 Labor Content Calculation

```
Labor Cost per Unit = Σ (Station Cycle Time × Operator Ratio × Hourly Rate)

Example (Batam 2025):
SMT: 60s × 0.25 operator × Rp 45,000/hr = Rp 188/board
Test: 90s × 1.0 operator × Rp 50,000/hr = Rp 1,250/board
Pack: 30s × 0.5 operator × Rp 40,000/hr = Rp 167/board
Total: Rp 1,605/board (~$0.10)
```

---

### 2. Equipment Investment Analysis (2025 Pricing)

#### 2.1 SMT Line Investment

| Equipment | 2025 Cost Range (USD) | Capacity | Depreciation |
|-----------|----------------------|----------|--------------|
| Loader | $10K-40K | Line speed | 10 years |
| Printer | $80K-300K | 15-30 sec/board | 10 years |
| SPI | $80K-250K | 10-25 sec/board | 10 years |
| Pick & Place (entry) | $150K-350K | 20-40K CPH | 10 years |
| Pick & Place (high-speed) | $400K-900K | 80-150K CPH | 10 years |
| Reflow (10-zone) | $100K-200K | Line speed | 10 years |
| Reflow (vacuum) | $200K-400K | Line speed | 10 years |
| AOI 3D | $150K-350K | 20-60 sec/board | 7 years |
| Unloader | $10K-40K | Line speed | 10 years |

**Complete SMT Line Investment (2025):**
- Entry level: $600K - $1M
- Mid-range: $1M - $2M
- High-speed: $2M - $4M

#### 2.2 Test Equipment Investment (2025)

| Equipment | 2025 Cost Range (USD) | Notes |
|-----------|----------------------|-------|
| ICT System | $120K-350K | Keysight, Teradyne |
| Flying Probe | $180K-500K | Takaya, SPEA |
| FCT System | $50K-200K | Custom, NI-based |
| X-ray 2D | $120K-250K | |
| X-ray 3D CT | $350K-700K | |
| RF Test System | $180K-600K | R&S, Keysight |

#### 2.3 ROI Calculation Methods

**Simple ROI:**
```
ROI = (Annual Benefit - Annual Cost) / Investment × 100%
Payback Period = Investment / Annual Net Benefit
```

**NPV (Net Present Value):**
```
NPV = Σ [CFt / (1 + r)^t] - Initial Investment

Where:
- CFt = Cash flow in year t
- r = Discount rate (typically 10-15% for Indonesia)
```

---

### 3. Test Cost Optimization

#### 3.1 Fixture Cost Amortization (2025 Pricing)

**ICT Fixture Costs:**
| Complexity | 2025 Cost (USD) | Typical Volume |
|------------|-----------------|----------------|
| Simple (<500 pts) | $8K-12K | <50K units |
| Medium (500-1500) | $12K-20K | 50K-200K |
| Complex (>1500 pts) | $18K-35K | >200K |

**FCT Fixture Costs:**
| Type | 2025 Cost (USD) |
|------|-----------------|
| Manual clamshell | $3K-8K |
| Pneumatic | $8K-15K |
| Automated | $15K-30K |

**Amortization Formula:**
```
Per-Unit Fixture Cost = Fixture Cost / Expected Volume

Example:
Fixture: $15,000
Volume: 100,000 units
Per-unit: $0.15
```

#### 3.2 Parallel Testing Economics

**Multi-Site Efficiency:**
```
Effective Test Time = Single Test Time / (Sites × Efficiency)

4-site example:
- Single: 60 seconds
- Efficiency: 85%
- Effective: 60 / (4 × 0.85) = 17.6 seconds
- Throughput gain: 3.4×
```

**When to Invest in Multi-Site:**
- Break-even volume calculation
- Fixture cost vs throughput benefit
- Space and maintenance considerations

---

### 4. Volume Economics

#### 4.1 Learning Curve Effect
```
Unit Cost at Nth unit = First Unit Cost × N^b
Where b = log(learning rate) / log(2)
```

**Typical Learning Curves (2025):**
- Manual assembly: 80-85%
- Semi-automated: 90-92%
- Fully automated: 95-98%

#### 4.2 Setup Cost Amortization
```
Per-Unit Setup Cost = (Setup Time × Line Rate) / Lot Size
```

#### 4.3 MOQ (Minimum Order Quantity) Analysis
- Setup cost recovery point
- Material MOQ constraints
- Typical MOQs by product complexity

---

### 5. NRE (Non-Recurring Engineering) - 2025 Pricing

#### 5.1 NRE Components

| Category | 2025 Cost Range | Description |
|----------|-----------------|-------------|
| DFM Analysis | $500-2,500 | Design review |
| DFT Analysis | $500-2,500 | Testability review |
| Test Program (ICT) | $3K-15K | Development |
| Test Program (FCT) | $5K-25K | Development |
| Test Fixture (ICT) | $8K-35K | Fabrication |
| Test Fixture (FCT) | $3K-30K | Fabrication |
| First Article | $2K-8K | Build and validate |
| Documentation | $1K-3K | Work instructions |

**Total NRE by Complexity (2025):**
- Simple product: $15K-35K
- Medium: $35K-80K
- Complex: $80K-200K

---

### 6. Yield Impact Economics

#### 6.1 Cost of Poor Quality

```
Scrap Cost = Failed Units × Material Cost
Rework Cost = Rework Time × Labor Rate × Failed Units
Test Cost Impact = Retest Rate × Test Cost × Volume
```

#### 6.2 Yield Improvement ROI

```
Annual Savings = Volume × Unit Cost × (New Yield - Old Yield) / Old Yield

Example:
Volume: 100,000 units
Unit cost: $50
Yield: 95% → 98%
Savings: 100,000 × $50 × 0.03/0.95 = $157,895/year
```

---

### 7. Regional Cost Comparison (2025)

#### 7.1 Total Cost of Manufacturing Comparison

| Cost Element | Batam | Vietnam | China (inland) | Malaysia |
|--------------|-------|---------|----------------|----------|
| Direct Labor | $X | $X | $X | $X |
| Overhead | $X | $X | $X | $X |
| Logistics | $X | $X | $X | $X |
| Utilities | $X | $X | $X | $X |
| **Total Index** | 100 | X | X | X |

#### 7.2 Batam Competitive Advantages
- FTZ tax benefits quantified
- Proximity to Singapore
- Skilled workforce availability
- Infrastructure quality
- Currency stability considerations

#### 7.3 Regional Challenges
- Indonesia: Regulatory complexity
- Vietnam: Infrastructure gaps
- China: Rising costs, geopolitical risk
- Malaysia: Labor shortage

---

### 8. Quick Reference Formulas

#### Cost Calculations
```
Material Cost = Σ (Component Cost × Qty × (1 + Attrition))
Labor Cost = Cycle Time (hr) × Loaded Rate × (1 + Rework Factor)
Equipment Cost = Annual Depreciation / Annual Volume
Overhead = Direct Cost × Overhead Rate
Total Cost = Material + Labor + Equipment + Overhead
Selling Price = Total Cost / (1 - Margin%)
```

#### Efficiency Metrics
```
OEE = Availability × Performance × Quality
Utilization = Actual Production / Available Capacity
Line Efficiency = Standard Time / Actual Time
```

---

### 9. 2025 Industry Trends Affecting Costs

- Automation investment trends
- Labor cost inflation in SEA
- Supply chain localization
- Sustainability cost impacts
- Energy cost trends

Include practical examples with actual calculations using 2025 data.
```

---

## Expected Output
- Comprehensive cost reference (~5000 words)
- 2025 pricing for equipment and labor
- Batam/Indonesia focus with regional comparison
- Formulas with worked examples
- Currency in USD and IDR
