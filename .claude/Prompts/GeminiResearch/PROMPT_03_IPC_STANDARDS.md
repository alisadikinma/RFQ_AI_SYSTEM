# Gemini Deep Research Prompt 3: IPC Standards & Quality

## Instructions
1. Copy the prompt below
2. Paste into Gemini/Perplexity (Deep Research mode)
3. Save output as `03_ipc_standards_quality.md`

---

## PROMPT (Copy from here)

```
You are an IPC-certified Master Instructor with 20+ years experience. Create a comprehensive reference document about IPC standards relevant to EMS manufacturing.

## CRITICAL REQUIREMENTS:
- **Reference CURRENT revisions as of 2025**
- IPC-A-610: Revision H (or later if available)
- J-STD-001: Revision H (or later if available)
- Include specific acceptance criteria with measurements
- Note any recent changes from previous revisions
- Format: Markdown with clear headers and tables
- Length: 3500-4500 words

## Topics to Cover:

### 1. IPC-A-610 Rev H (Acceptability of Electronic Assemblies)

#### 1.1 Class Definitions (Current)
- **Class 1 - General Electronic Products**
  - Consumer products
  - Function is main requirement
  - Examples: TV remotes, toys, basic appliances

- **Class 2 - Dedicated Service Electronic Products**
  - Extended life, uninterrupted service desired
  - Examples: Telecom equipment, industrial controls, computers

- **Class 3 - High Reliability Electronic Products**
  - Continued performance critical
  - Examples: Medical life support, aerospace, military, automotive safety

- **Class 3/A - Space and Military Avionics** (if applicable in current rev)

#### 1.2 Solder Joint Acceptance Criteria (Current Rev H)

##### Through-Hole Solder Joints
| Criteria | Class 1 | Class 2 | Class 3 |
|----------|---------|---------|---------|
| Minimum fill (primary side) | X% | X% | X% |
| Minimum fill (secondary side) | X% | X% | X% |
| Fillet required | ? | ? | ? |
| Wetting angle | X° | X° | X° |

##### Surface Mount - Chip Components (0402, 0603, 0805, etc.)
| Criteria | Class 1 | Class 2 | Class 3 |
|----------|---------|---------|---------|
| Side overhang (A) | X% W | X% W | X% W |
| End overhang (B) | X% | X% | Not allowed |
| Minimum fillet height (F) | X% H | X% H | X% H |
| Maximum rotation | X° | X° | X° |

##### BGA/CSP Joints (Per IPC-7095 current rev)
- Ball shape requirements
- Voiding limits by class
- Head-in-pillow criteria
- X-ray inspection requirements

##### Fine Pitch (QFP, TQFP) Criteria
- Heel fillet requirements
- Side fillet requirements
- Lifted lead limits
- Bridging defect criteria

#### 1.3 Component Mounting Criteria (Current)
- Chip component alignment tolerances
- Tombstoning acceptance (if any)
- Component damage acceptance

#### 1.4 Cleanliness Requirements (Current)
- Visual cleanliness criteria
- Ionic contamination limits by class
- Test methods (ROSE, IC)

#### 1.5 Changes from Previous Revision
- **What changed from Rev G to Rev H**
- New criteria added
- Criteria modified
- Industry impact of changes

### 2. J-STD-001 Rev H (Requirements for Soldered Assemblies)

#### 2.1 Scope vs IPC-A-610
- J-STD-001: Process requirements (how to do it)
- IPC-A-610: Acceptance requirements (pass/fail)
- How they work together

#### 2.2 Material Requirements (Current)
- Solder alloy specifications
- Flux classifications per J-STD-004:
  - ROL0, ROL1 (rosin, low activity)
  - REM0, REM1 (rosin, medium activity)
  - OR, OF (organic)
- Flux residue requirements by class

#### 2.3 Process Control Requirements
- Soldering iron temperature control
- Reflow profile documentation
- Wave solder parameters
- First article inspection requirements

#### 2.4 Operator Training & Certification
- Vision requirements
- Training requirements by class
- Certification validity period
- Recertification requirements

### 3. IPC-7711/7721 (Rework, Modification and Repair)

#### 3.1 Definitions
- Rework vs Repair vs Modification
- When each is appropriate
- Customer approval requirements

#### 3.2 Rework Procedures (Current Best Practices)
- SMT component removal techniques
- SMT component installation
- BGA rework procedures
- Through-hole rework

#### 3.3 Rework Limits by Class
- Maximum rework cycles allowed
- Documentation requirements
- Inspection requirements post-rework

#### 3.4 Pad Repair Procedures
- Lifted pad repair methods
- Conductor repair
- Acceptance criteria for repairs

### 4. IPC-A-600 (Acceptability of Printed Boards)

#### 4.1 Key Acceptance Criteria (Current)
- Conductor width tolerances
- Annular ring requirements by class
- Plating thickness minimums
- Laminate quality requirements

#### 4.2 Surface Finish Specifications
- HASL thickness
- ENIG thickness (Ni and Au)
- OSP thickness
- Immersion silver/tin

### 5. Related Standards (2025 Current Revisions)

#### 5.1 J-STD-020 (Moisture Sensitivity)
- MSL level definitions (1-6)
- Floor life by MSL level
- Current revision requirements

#### 5.2 J-STD-033 (Handling Moisture Sensitive Devices)
- Dry pack requirements
- Baking procedures and times
- HIC interpretation

#### 5.3 IPC-6012 (Qualification for Rigid PCBs)
- Type definitions (1-6)
- Class requirements
- HDI requirements

#### 5.4 IPC-2221/2222 (PCB Design Standards)
- Conductor spacing requirements
- Thermal relief design
- Test point guidelines
- Current revision updates

### 6. Automotive-Specific (IATF 16949 / AEC Standards)

#### 6.1 AEC-Q100/Q101/Q104
- Component qualification requirements
- Stress test requirements
- How they relate to IPC

#### 6.2 Automotive Quality Requirements
- PPAP requirements
- APQP process
- Zero-defect expectations

### 7. Practical Application Guide

#### 7.1 Incoming Inspection Checklist
- PCB inspection per IPC-A-600
- Component inspection
- Material verification

#### 7.2 In-Process Inspection
- SPI verification criteria
- Placement verification
- Post-reflow inspection per IPC-A-610

#### 7.3 Final Inspection
- Visual inspection checklist
- Cleanliness testing
- Documentation requirements

#### 7.4 Common Interpretation Issues
- Edge cases and disputes
- "As agreed" items
- Class selection guidance

### 8. Certification & Training

#### 8.1 IPC Certification Programs (2025)
- CIS (Certified IPC Specialist)
- CIT (Certified IPC Trainer)
- MIT (Master IPC Trainer)
- Current certification requirements

#### 8.2 Training Resources
- Official IPC training
- Online options
- Certification costs

Include specific acceptance criteria numbers, practical examples, and tips for production implementation.
```

---

## Expected Output
- Comprehensive IPC standards reference (~4000 words)
- Current revision (Rev H) criteria
- Specific acceptance measurements
- Practical application guidance
