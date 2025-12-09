# Gemini Deep Research Prompt 2: Testing & Inspection

## Instructions
1. Copy the prompt below
2. Paste into Gemini/Perplexity (Deep Research mode)
3. Save output as `02_testing_inspection.md`

---

## PROMPT (Copy from here)

```
You are an expert in electronics testing and quality inspection for EMS (Electronics Manufacturing Services). Create a comprehensive reference document about testing methodologies in production environments.

## CRITICAL REQUIREMENTS:
- **All data must be current as of 2025**
- Equipment costs: 2024-2025 market prices in USD
- Fixture costs: Current 2025 pricing
- Cycle times: Based on latest equipment capabilities
- Include specific parameters and vendor references
- Format: Markdown with clear headers
- Length: 4000-6000 words

## Topics to Cover:

### 1. In-Circuit Test (ICT) - 2025 State

#### 1.1 Test Principles
- Opens and shorts detection
- Component value measurement (R, C, L)
- Diode and transistor junction testing
- Boundary scan (JTAG) integration
- Power-off vs powered testing

#### 1.2 Bed-of-Nails Fixture (2025 Costs)
- Test point requirements and design rules
- Fixture materials and construction
- Probe types and density options
- **2025 fixture costs by complexity**:
  - Simple (<500 points): $X
  - Medium (500-1500 points): $X
  - Complex (>1500 points): $X

#### 1.3 Performance Metrics
- Cycle times: 1-5 seconds typical
- Throughput: 600-2000 UPH
- Test coverage: 85-95% typical

#### 1.4 Equipment & Costs (2025)
- Keysight (Agilent) - models and pricing
- Teradyne - models and pricing
- SPEA - models and pricing
- **Equipment cost range: $100,000-$400,000**

### 2. Flying Probe Test - 2025 Technology

#### 2.1 Current Capabilities
- Number of probes (4-8 typical, up to 16)
- Positioning accuracy (±10μm or better)
- Dual-side simultaneous testing
- Latest speed improvements

#### 2.2 When to Use (2025 Decision Matrix)
- Volume thresholds
- Cost comparison vs ICT
- Prototypes and NPI
- High-mix low-volume

#### 2.3 Equipment & Costs (2025)
- Vendors: Takaya, SPEA, Seica, ATG Luther & Maelzer
- **Equipment cost range: $150,000-$500,000**

### 3. Functional Circuit Test (FCT) - 2025 Practices

#### 3.1 Test Philosophy
- Black box vs white box testing
- Boundary scan integration
- Test coverage strategies

#### 3.2 Fixture Design (2025 Costs)
- Interface requirements
- Fixture types (clamshell, vacuum, robotic)
- **2025 fixture costs: $5,000-$30,000**

#### 3.3 Test Program Development
- Development time estimates
- Software platforms (NI TestStand, etc.)
- Automation frameworks

#### 3.4 Cycle Times by Product Type
- Simple boards: 15-30 seconds
- Medium complexity: 30-60 seconds
- Complex products: 60-180 seconds
- RF products: 60-300 seconds

### 4. Automated Optical Inspection (AOI) - 2025 Technology

#### 4.1 Technology Evolution
- 2D vs 3D AOI (2025 state)
- AI/ML defect classification (current capabilities)
- Inline vs offline configurations

#### 4.2 Inspection Capabilities
- Component presence/absence
- Solder joint quality (3D measurement)
- Text/marking verification (OCR)
- Foreign material detection

#### 4.3 Performance (2025 Benchmarks)
- Resolution: Current best achievable
- Cycle times by board size
- False call rates with AI optimization

#### 4.4 Equipment & Costs (2025)
- Koh Young (Zenith, Meister series)
- Omron
- Mirtec
- Viscom
- **Equipment cost range: $80,000-$350,000**

### 5. Automated X-Ray Inspection (AXI) - 2025 Technology

#### 5.1 When X-Ray is Required
- BGA/CSP joints
- QFN bottom terminations
- Via fill verification
- Voiding analysis

#### 5.2 Technology Types (2025)
- 2D X-ray capabilities
- 2.5D/Tomosynthesis
- Full 3D CT - current speed improvements
- AI-assisted void analysis

#### 5.3 Equipment & Costs (2025)
- Vendors: Nikon, Nordson (Dage), Viscom, Omron
- **2D systems: $100,000-$250,000**
- **3D CT systems: $300,000-$700,000**

### 6. RF Testing - 2025 Requirements

#### 6.1 Test Parameters
- Transmit power, receive sensitivity
- RSSI, RSRP, EVM measurements
- Frequency accuracy
- Spurious emissions

#### 6.2 Multi-Band Testing (2025 Protocols)
- 5G NR (Sub-6GHz and mmWave)
- WiFi 6E/7 (6GHz band)
- Bluetooth 5.x
- Legacy 2G/3G/4G
- IoT protocols (LoRa, Zigbee, Matter)

#### 6.3 Test Environment
- RF shielded enclosures
- OTA (Over-The-Air) testing trends
- Calibration requirements

#### 6.4 Equipment & Costs (2025)
- Rohde & Schwarz CMW500/CMX500
- Keysight E7515B/UXM
- Anritsu MT8000A
- LitePoint (for WiFi/BT)
- **RF test system cost: $150,000-$600,000**

### 7. Environmental Stress Screening (ESS)

#### 7.1 Burn-in Testing
- Temperature ranges and duration
- Power cycling protocols
- When required (reliability class)

#### 7.2 Temperature Cycling
- Standard profiles (-40°C to +85°C)
- Ramp rates and dwell times
- IPC/JEDEC standards

#### 7.3 HALT/HASS
- Design validation (HALT)
- Production screening (HASS)
- Equipment and chamber costs

### 8. Test Strategy Selection (2025 Decision Framework)

#### 8.1 Volume-Based Recommendations
| Annual Volume | Primary Test | Secondary | Notes |
|---------------|--------------|-----------|-------|
| <1K | Flying Probe | Manual FCT | Minimize NRE |
| 1K-10K | ICT or FP | FCT | ROI calculation |
| 10K-100K | ICT | FCT + AOI | Standard approach |
| >100K | ICT | FCT + 100% AOI | Full automation |

#### 8.2 Cost-Benefit Analysis
- Fixture amortization formulas
- Defect escape cost calculation
- Total cost of test model

#### 8.3 Industry 4.0 Integration
- Real-time data collection
- Predictive quality analytics
- Digital twin for test optimization

Include real-world examples, ROI calculations, and practical decision guides.
```

---

## Expected Output
- Comprehensive testing reference (~5000 words)
- 2025 equipment and fixture costs
- Decision matrices for test strategy
- Vendor and model references
