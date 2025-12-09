# IPC Standards Reference Guide for EMS (2025 Edition)

**Prepared by:** Certified Master IPC Trainer (MIT)
**Effective Date:** December 2025
**Applicability:** Electronics Manufacturing Services (EMS), OEM, and Supply Chain

## Executive Summary
As of late 2025, the electronics assembly industry operates under the **"J" Revision** of the primary soldering standards (IPC-A-610J and J-STD-001J) and the **"M" Revision** of the bare board acceptability standard (IPC-A-600M).

The most significant shift in this generation of standards is the move away from "rose testing" as a standalone cleanliness qualifier (instituted in Rev H and reinforced in Rev J) and the strict alignment of X-ray voiding criteria for BTC/BGA components.

***

## 1. IPC-A-610 Rev J (Acceptability of Electronic Assemblies)

**Current Revision:** **IPC-A-610J** (Released March 2024)
**Scope:** Visual acceptance criteria (Post-assembly inspection).

### 1.1 Class Definitions
The class of the product is defined by the customer (User) or the design drawing. It dictates the stringency of inspection.

*   **Class 1 – General Electronic Products**
    *   *Definition:* Products suitable for applications where the major requirement is the function of the completed assembly.
    *   *Examples:* Toys, cheap consumer electronics, disposable devices, non-critical lighting.
    *   *Key Characteristic:* "Function is king." Cosmetic imperfections are largely acceptable.

*   **Class 2 – Dedicated Service Electronic Products**
    *   *Definition:* Products with continued performance and extended life requirements, and for which uninterrupted service is desired but not critical.
    *   *Examples:* Laptops, microwaves, general industrial controls, telecom infrastructure.
    *   *Key Characteristic:* "Reliability is key." Process indicators are allowed, but defects are not.

*   **Class 3 – High Reliability Electronic Products**
    *   *Definition:* Products where continued high performance or performance-on-demand is critical, equipment downtime cannot be tolerated, or end-use environment may be uncommonly harsh.
    *   *Examples:* Automotive safety systems (ADAS), aerospace, medical life support, military.
    *   *Key Characteristic:* "Perfection is required." Visual anomalies are often defects.

*   **Class 3/A – Space and Military Avionics**
    *   *Definition:* The highest tier, specifically for spaceflight hardware.
    *   *Note:* Often requires the Space Addendum (IPC-A-610J-Space).

### 1.2 Solder Joint Acceptance Criteria (Rev J)

#### Through-Hole Solder Joints (Supported Holes)
*Note: A "Supported Hole" has plating through the barrel (PTH).*

| Criteria | Class 2 Requirement | Class 3 Requirement |
| :--- | :--- | :--- |
| **Vertical Fill (Primary Side)** | **75%** fill required. *(Exception: 50% allowed if thermal plane connected and lead visible)* | **75%** fill required. **(No exceptions)** |
| **Vertical Fill (Secondary Side)** | 100% (360° wetting) | 100% (360° wetting) |
| **Circumferential Wetting** | 270° (Primary side) / 360° (Secondary) | 330° (Primary side) / 360° (Secondary) |
| **Pin Protrusion (L)** | Min: Visible in solder<br>Max: 2.5mm | Min: Visible in solder<br>Max: 1.5mm |

#### Surface Mount - Chip Components (Rectangular)
*Applicable to: Resistors, Capacitors (0402, 0603, etc.)*
*W = Width of component termination / P = Pad width*

| Criteria | Class 2 Requirement | Class 3 Requirement |
| :--- | :--- | :--- |
| **Side Overhang (A)** | Max **50%** of Lead Width (W) | Max **25%** of Lead Width (W) |
| **End Overhang (B)** | Not permitted | Not permitted |
| **End Joint Width (C)** | Min **50%** of Lead Width (W) | Min **75%** of Lead Width (W) |
| **Side Joint Length (D)** | Evidence of wetting | Min **25%** of termination height |
| **Fillet Height (F)** | Evidence of wetting | Min **25%** of termination height (G) + solder thickness |

#### Surface Mount - Gull Wing Leads
*Applicable to: SOIC, QFP, SOT-23*

| Criteria | Class 2 Requirement | Class 3 Requirement |
| :--- | :--- | :--- |
| **Side Overhang** | Max **50%** of Lead Width (W) | Max **25%** of Lead Width (W) |
| **Toe Overhang** | Allowed (if joint length satisfied) | Not permitted |
| **Minimum Heel Fillet** | Evidence of wetting | Equal to lead thickness (T) |
| **Side Joint Length** | Min **50%** of Lead Width (W) | Min **Lead Width (W)** (or 0.5mm) |

#### BGA/CSP & Bottom Termination Components (BTC)
*Referencing IPC-7095D (Design & Assembly Process Implementation for BGAs)*

*   **Voiding Criteria (X-Ray):**
    *   **Class 1, 2, 3:** Voids in the solder ball area shall not exceed **25%** of the ball's X-ray image area.
    *   *Note:* While 25% is the standard limit, many Class 3 Automotive contracts impose a strict **<15%** limit via "As Agreed" documentation.
*   **Head-in-Pillow (HiP):** Always a **Defect** (incomplete wetting between ball and paste).

### 1.3 Changes in Revision J (vs Rev H)
*   **Target Condition Removal:** Continued from Rev H, the "Target" (perfect) condition is gone. Inspectors must only judge "Acceptable" vs "Defect". "Target" is a process control goal, not a pass/fail criteria.
*   **Jumper Wires:** Chapter 13 (Wire and Terminal Connections) and the specific Jumper Wire criteria have been refined to better address "glue staking" requirements for vibration resistance.
*   **Synergy with 001J:** Stronger alignment on cleanliness; visual residues that are potentially corrosive are defects unless qualified by objective evidence (see Section 2).

***

## 2. J-STD-001 Rev J (Requirements for Soldered Assemblies)

**Current Revision:** **J-STD-001J** (Released March 2024)
**Scope:** Material and Process Requirements (How to build it).

### 2.1 Scope vs IPC-A-610
*   **J-STD-001** is a *manufacturing* standard. It dictates the flux type, the alloy, the temperature profiles, and the cleaning process.
*   **IPC-A-610** is an *inspection* standard. It dictates what the final result looks like.
*   *Rule of Thumb:* If you are setting up a reflow oven, use J-STD-001. If you are inspecting a finished board under a microscope, use IPC-A-610.

### 2.2 Material Requirements
*   **Solder Alloys:**
    *   **Sn63/Pb37:** Standard for legacy Military/Space.
    *   **SAC305 (Sn96.5/Ag3.0/Cu0.5):** Industry standard Lead-Free.
    *   **Low Temp (SnBi):** Gaining traction in 2025; specific appendices now address low-temp alloys.
*   **Flux Classifications (J-STD-004):**
    *   **L0 (Low Activity, Halide Free):** Mandatory for many Class 3 No-Clean processes (e.g., ROL0, REL0).
    *   **L1 / M0 / M1:** Often require cleaning for Class 3.
    *   **H (High Activity):** Requires full wash (Aqueous/Solvent).

### 2.3 The "Cleanliness" Paradigm Shift (Section 8)
This is the most critical update for EMS providers in 2024-2025.

*   **The Change:** The old "ROSE Test" (Resistivity of Solvent Extract) limit of 1.56 µg/cm² NaCl equivalent is **no longer accepted** as proof of cleanliness for qualifying a process.
*   **New Requirement:** Manufacturers must provide **"Objective Evidence"** that their specific combination of Flux + Solder + Wash + Board does not cause electrochemical migration.
*   **How to Comply:**
    1.  Perform Surface Insulation Resistance (SIR) testing (per IPC-TM-650 2.6.3.7) on a representative B-52 test coupon.
    2.  Use Ion Chromatography (IC) to define a baseline of "acceptable" ionic residues for *your* specific line.
    3.  ROSE testing can *only* be used for process monitoring once the baseline is established via SIR/IC.

### 2.4 Operator Training (Rev J)
*   **Vision:** Visual acuity (Snellen 20/20 or Jaeger 1) and Color Vision tests are mandatory.
*   **Retraining:** Certification is valid for **2 years**.
*   **Modules:**
    *   Module 1: General (Mandatory)
    *   Module 2: Wires & Terminals
    *   Module 3: Through-Hole
    *   Module 4: Surface Mount
    *   Module 5: Inspection
    *   Module 6: Space Addendum (Optional)

***

## 3. IPC-7711/7721 Rev D (Rework, Modification and Repair)

**Current Revision:** **IPC-7711/7721D** (Released Jan 2024)
**Scope:** Procedures for removing/replacing components and repairing bare boards.

### 3.1 Definitions
*   **Rework:** Restoring an assembly to its original drawing/schematic. (e.g., Replacing a tombstoned resistor). *Does not usually require customer permission.*
*   **Repair:** Restoring functionality to a defective assembly that does not fully conform to original print. (e.g., Fixing a lifted pad with epoxy and a wire). *Always requires customer permission (MRB action).*
*   **Modification:** Changing the assembly to a new revision. (e.g., Adding a jumper wire for a design change).

### 3.2 Rework Best Practices (2025)
*   **Convection vs Contact:** Rev D emphasizes hot air (convection) over soldering irons (conductive) for SMT removal to prevent thermal shock to ceramic capacitors.
*   **Preheating:** Mandatory for multilayer boards (Class 2/3) to prevent barrel cracking. Minimum 100°C bottom-side preheat recommended.

### 3.3 Pad Repair (IPC-7721 Method)
For Class 2 and 3 (with customer approval):
1.  **Epoxy Method:** Lifted lands are bonded back using two-part aerospace-grade epoxy.
2.  **Replacement Method:** The damaged track is excised, and a new dry-film adhesive backed copper track is bonded in place.
3.  **Acceptance:** The repaired area must meet the adhesion strength requirements of the original board.

***

## 4. IPC-A-600 Rev M (Acceptability of Printed Boards)

**Current Revision:** **IPC-A-600M** (Released mid-2025)
**Scope:** Inspection of the bare PCB *before* assembly.

### 4.1 Key Acceptance Criteria
*   **Annular Ring (External):**
    *   **Class 2:** 90° breakout allowed (hole drills slightly out of pad), provided the junction is not broken.
    *   **Class 3:** 0.05mm (2 mil) minimum annular ring required. NO breakout allowed.
*   **Plating Thickness (Average):**
    *   **Class 2:** 20 µm (0.79 mil)
    *   **Class 3:** 25 µm (0.98 mil)

### 4.2 Surface Finish Reqs (Typical)
*   **ENIG (Electroless Nickel Immersion Gold):**
    *   Nickel: 3 - 6 µm
    *   Gold: 0.05 - 0.15 µm (Thicker gold causes "Black Pad" / embrittlement).
*   **HASL (Hot Air Solder Level):** Thickness varies, but must be wettable.

***

## 5. Related Standards (2025 Current)

### 5.1 J-STD-020F (Moisture Sensitivity)
*   Defines MSL Levels (1 to 6).
*   **MSL 3:** 168 hours floor life at 30°C/60% RH.
*   **MSL 5A:** 24 hours floor life.
*   *Update:* Rev F refined the classification reflow temperatures to align with modern high-density package thermal mass.

### 5.2 J-STD-033D (Handling)
*   **Baking:** If floor life is exceeded, parts must be baked.
*   *Rule:* Standard bake is 125°C for 24 hours (for trays). Tape & Reel parts cannot be baked at 125°C (melts the tape) unless transferred to high-temp reels; low temp bake (40°C) takes weeks.

### 5.3 IPC-6012F (Qualification for Rigid PCBs)
*   Defines "Types" of boards:
    *   **Type 3:** Multilayer (with through-holes).
    *   **Type 4:** Multilayer (with blind/buried vias).
    *   **Type 5/6:** HDI (High Density Interconnect) with microvias.

***

## 6. Automotive Specifics (IATF / AEC)

While IPC provides the baseline, Automotive (Class 3) often overlays stricter requirements via **IATF 16949**.

### 6.1 AEC-Q100
*   Component stress test qualification. An IPC Class 3 board must be built with AEC-Q qualified components to be considered "Automotive Grade."

### 6.2 The "Zero Defect" Reality
In 2025 automotive manufacturing:
*   **IPC Class 3 allows** "Process Indicators" (cosmetic oddities that are not defects).
*   **Automotive Customers reject** Process Indicators.
*   *Tip:* Always clarify in the Quality Contract if "IPC Class 3" means "Strict IPC Class 3" or "IPC Class 3 + Cosmetic Perfection."

***

## 7. Practical Implementation Checklist

### 7.1 Incoming Inspection (IPC-A-600M)
*   [ ] Check date codes on PCBs (Solderability shelf life: 6 months for OSP/ImmAg, 12 months for ENIG/HASL).
*   [ ] Measure bow and twist (Max 0.75% for SMT).

### 7.2 In-Process (SPI & AOI)
*   [ ] **SPI:** Solder Paste Inspection is now mandatory for Class 3. Volume limits: 70% - 130% of stencil aperture.
*   [ ] **Reflow:** Verify profile matches J-STD-001J specs (Time Above Liquidus: 60-90 sec typical).

### 7.3 Final Inspection (IPC-A-610J)
*   [ ] Magnification:
    *   Small SMT (<0402): 20x - 40x microscope.
    *   General SMT: 10x - 20x.
    *   **Warning:** Do not use >40x for acceptance; high mag makes acceptable graininess look like defects.

### 7.4 Common Disputes
*   **"Cold Solder" vs "Grainy Solder":** Lead-free solder is naturally grainy/dull. This is acceptable in IPC-A-610J unless there is non-wetting.
*   **Flux Residue:** In No-Clean processes, visible flux is **Acceptable** (Class 1, 2, 3) unless it obscures the joint or inhibits electrical test, OR if objective evidence (Section 8) fails.

[1](https://www.electronics.org/news-release/ipc-releases-new-h-revision-two-leading-standards-electronics-assembly-ipc-j-std-001)
[2](https://www.emsnow.com/ipc-releases-two-new-standards-ipc-a-610h-and-ipc-j-std-001h/)
[3](https://store.accuristech.com/products/preview/2901328)
[4](https://smttoday.com/2025/06/17/a-r-t-ltd-supports-release-of-ipc-a-600m/)
[5](https://www.ipc.org/TOC/IPC-7711D-7721D_TOC.pdf)
[6](https://www.protoexpress.com/blog/h-revisions-ipc-j-std-001-and-ipc-a-610-soldering-standards/)
[7](https://piektraining.com/en/ipc-new-release-ipc-a-610h-acceptability-of-electronic-assemblies/)
[8](https://www.ipc.org/TOC/IPC-J-STD-001J_TOC.pdf)
[9](https://www.electronicspecifier.com/news/latest/a-r-t-supports-release-of-ipc-a-600m/)
[10](https://ship.ie/glossary/ipc-7711-7721/)
[11](https://www.youtube.com/watch?v=9n7j0nriUeE)
[12](https://www.protoexpress.com/blog/ipc-class-2-vs-class-3-different-design-rules/)
[13](http://www.ipctraining.org/demos/pdf/drm-smt-g.pdf)
[14](https://www.raypcb.com/ipc-a-600/)
[15](https://www.superengineer.net/blog/ipc-a-610)
[16](https://www.electronics.org/TOC/IPC-A-610J_TOC.pdf)
[17](https://blog.samtec.com/post/understanding-ipc-class-2-vs-class-3-for-a-gull-wing-lead/)
[18](https://www.youtube.com/watch?v=T-i9pY60MdE)
[19](https://nepp.nasa.gov/files/24348/What%E2%80%99s%20new%20in%20J-STD-001ES%20032113.pdf)
[20](https://www.youtube.com/watch?v=6-0LBenTpt4)
[21](https://piektraining.com/en/offer/ipc-610-program/)
[22](https://www.circuitinsight.com/pdf/sir_test_method_developing_objective_evidence_production_assembly_smta.pdf)
[23](https://tstronic.eu/en/understanding-ipc-a-610-the-global-standard-for-the-acceptability-of-electronic-assemblies-ipc/)
[24](https://www.wevolver.com/article/mastering-ipc-standards-the-definitive-guide-for-electronics-engineers-and-pcb-designers)