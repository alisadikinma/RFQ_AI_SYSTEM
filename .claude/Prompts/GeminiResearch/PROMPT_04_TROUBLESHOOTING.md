# Gemini Deep Research Prompt 4: Troubleshooting & Defect Analysis

## Instructions
1. Copy the prompt below
2. Paste into Gemini/Perplexity (Deep Research mode)
3. Save output as `04_troubleshooting_defects.md`

---

## PROMPT (Copy from here)

```
You are a senior process engineer with 20 years of EMS (Electronics Manufacturing Services) experience. Create a comprehensive troubleshooting guide for common manufacturing defects.

## CRITICAL REQUIREMENTS:
- **Include 2025 best practices and latest diagnostic tools**
- Reference current equipment capabilities (AI-assisted AOI, etc.)
- Practical, actionable troubleshooting steps
- Root causes ranked by probability
- Format: Consistent structure for each defect
- Length: 5000-7000 words

## Format for Each Defect:
1. Description and visual characteristics
2. Root causes (ranked by probability %)
3. Diagnostic steps (checklist)
4. Corrective actions (immediate and long-term)
5. Prevention strategies
6. **2025 tools/technology that helps detect/prevent**

---

## Section 1: SMT Solder Defects

### 1.1 Solder Bridging

**Description:**
Unintended solder connection between adjacent pads or leads.

**Visual Characteristics:**
- Continuous solder between two or more pads
- Most common on fine-pitch components (<0.5mm pitch)
- Often occurs between gull-wing leads

**Root Causes (by probability):**
1. (35%) Excessive solder paste volume
2. (25%) Stencil aperture design issues
3. (20%) Misaligned component placement
4. (10%) Reflow profile problems
5. (10%) Pad design issues

**Diagnostic Steps:**
[Detailed checklist]

**Corrective Actions:**
[Immediate, short-term, long-term]

**Prevention:**
[Design rules, process controls]

**2025 Detection/Prevention:**
- 3D SPI with AI-based prediction
- AOI with deep learning classification

---

### 1.2 Insufficient Solder / Starved Joints

[Same detailed format]

---

### 1.3 Tombstoning (Manhattan Effect)

[Same detailed format - include latest understanding of causes]

---

### 1.4 Solder Balls

[Same detailed format]

---

### 1.5 Cold Solder Joints

[Same detailed format]

---

### 1.6 Head-in-Pillow (HiP) - BGA Specific

**Description:**
BGA ball makes contact with paste but does not fully coalesce.

**Root Causes:**
1. BGA warpage during reflow
2. Oxidation of ball or paste
3. Insufficient flux activity
4. Reflow profile mismatch
5. Excessive paste volume

**2025 Prevention Technologies:**
- Vacuum reflow for void/HiP reduction
- Nitrogen atmosphere with <100ppm O2
- Advanced flux formulations

---

### 1.7 BGA Voiding

**IPC Limits (Current IPC-A-610 Rev H):**
- Class 2: <25% void area
- Class 3: <10% void area per joint

**2025 Void Reduction Technologies:**
- Vacuum reflow (reduces voiding by 50-80%)
- Optimized paste formulations
- Via-in-pad design with proper fill

---

### 1.8 Non-Wetting / De-wetting

[Detailed format]

---

### 1.9 Solder Balling (Different from Solder Balls)

[Detailed format - paste-related issue]

---

### 1.10 Grainy/Dull Solder Joints

[Detailed format - lead-free specific]

---

## Section 2: Component Placement Defects

### 2.1 Missing Components

**Root Causes:**
1. Feeder pick failure
2. Nozzle issues
3. Vision system errors
4. Component stuck in tape

**2025 Diagnostic Tools:**
- Machine data analytics
- Predictive maintenance alerts
- AI-based feeder monitoring

---

### 2.2 Wrong Component / Wrong Polarity

[Detailed format]

---

### 2.3 Component Shift/Skew

[Detailed format - pre-reflow vs post-reflow analysis]

---

### 2.4 Damaged Components

[Detailed format - handling, placement force, thermal]

---

### 2.5 Billboarding (Component Standing on Edge)

[Detailed format]

---

## Section 3: PCB-Related Issues

### 3.1 Board Warpage

**IPC Limits:**
- Max warpage: 0.75% of diagonal (Class 2)
- Max warpage: 0.5% of diagonal (Class 3)

**Root Causes:**
1. Copper imbalance between layers
2. Reflow thermal stress
3. Moisture absorption
4. Material selection

**2025 Solutions:**
- Board support systems in reflow
- Pre-bake protocols
- Advanced laminate materials

---

### 3.2 Pad Cratering / Pad Lift

[Detailed format - critical for lead-free]

---

### 3.3 Delamination

[Detailed format]

---

### 3.4 CAF (Conductive Anodic Filament)

[Detailed format - long-term reliability issue]

---

## Section 4: Test Failure Analysis

### 4.1 ICT False Failures

**Common Causes:**
1. Probe contact issues
2. Guard point problems
3. Component tolerance variations
4. Test limits too tight

**2025 Solutions:**
- Adaptive test limits
- Statistical process monitoring
- Probe wear prediction

---

### 4.2 FCT Intermittent Failures

[Detailed format with thermal cycling diagnostic]

---

### 4.3 RF Test Failures

**Common Causes:**
1. Antenna/matching network issues
2. Shield can grounding
3. Component value drift
4. Calibration drift

**2025 RF Diagnostic Tools:**
- Vector network analyzer patterns
- Time domain reflectometry
- Near-field scanning

---

### 4.4 High Current / Short Circuit Failures

[Detailed format]

---

## Section 5: Process Troubleshooting Quick Reference

### 5.1 Solder Paste Printing Issues

| Symptom | Likely Cause | Action |
|---------|--------------|--------|
| Smearing | Paste too wet | Check paste age |
| Insufficient | Blocked apertures | Clean stencil |
| Bridging | Excessive pressure | Reduce pressure |
| Poor release | Low area ratio | Modify aperture |
| Slumping | Paste temperature | Check storage |

---

### 5.2 Reflow Profile Issues

| Symptom | Likely Cause | Action |
|---------|--------------|--------|
| Tombstoning | Thermal gradient | Check oven uniformity |
| Voiding | Rapid outgassing | Extend soak zone |
| Cold joints | Insufficient TAL | Increase peak/time |
| Delamination | Excessive temp | Reduce peak |
| Component damage | Peak too high | Lower peak temp |

---

### 5.3 Pick & Place Issues

| Symptom | Likely Cause | Action |
|---------|--------------|--------|
| Pick failures | Nozzle contamination | Clean/replace nozzle |
| Placement offset | Vision calibration | Run calibration |
| Component rotation | Feeder alignment | Check feeder setup |
| Damaged components | Placement force | Adjust force settings |

---

## Section 6: Systematic Problem Solving

### 6.1 Pareto Analysis Approach
- Track defects by type (weekly)
- Calculate DPMO for each
- Prioritize top 3 for improvement
- Implement countermeasures
- Verify with data

### 6.2 8D / CAPA Process
1. **Contain**: Quarantine affected product
2. **Define**: Describe the problem clearly
3. **Analyze**: Root cause (5 Why, Fishbone, FMEA)
4. **Correct**: Implement fix
5. **Prevent**: Systemic changes
6. **Verify**: Confirm with data
7. **Recognize**: Team acknowledgment
8. **Close**: Documentation complete

### 6.3 Statistical Tools (2025 Software)
- SPC software packages
- Real-time monitoring dashboards
- AI-based anomaly detection
- Predictive quality analytics

---

## Section 7: Industry Benchmarks (2025)

### Defect Rates by Process Step
| Process | World Class | Good | Average |
|---------|-------------|------|---------|
| SMT Placement | <50 DPMO | <200 | <500 |
| Reflow | <100 DPMO | <300 | <1000 |
| Wave Solder | <200 DPMO | <500 | <1500 |
| Overall Assembly | <500 DPMO | <1500 | <3000 |

### First Pass Yield Benchmarks
| Assembly Type | World Class | Good | Average |
|---------------|-------------|------|---------|
| Simple PCB | >99% | >98% | >95% |
| Complex PCB | >97% | >95% | >90% |
| RF Products | >95% | >92% | >85% |
| Automotive | >99.5% | >99% | >98% |

Include specific examples, decision trees, and practical recommendations throughout.
```

---

## Expected Output
- Comprehensive troubleshooting guide (~6000 words)
- 20+ defect types covered in detail
- 2025 diagnostic tools and prevention technology
- Quick reference tables
- Industry benchmarks
