# Gemini Deep Research Prompt 1: SMT Process Fundamentals

## Instructions
1. Copy the prompt below
2. Paste into Gemini/Perplexity (Deep Research mode)
3. Save output as `01_smt_process_fundamentals.md`

---

## PROMPT (Copy from here)

```
You are an expert technical writer for Electronics Manufacturing Services (EMS). Create a comprehensive reference document about Surface Mount Technology (SMT) processes.

## CRITICAL REQUIREMENTS:
- **All data must be current as of 2025**
- Equipment costs: 2024-2025 market prices in USD
- Include specific numbers, tolerances, and industry standards
- Reference latest equipment models and specifications
- Target audience: EMS engineers and AI systems needing factual data
- Format: Markdown with clear headers
- Length: 3000-5000 words

## Topics to Cover:

### 1. SMT Line Overview
- Complete SMT line equipment sequence (loader → printer → SPI → pick&place → reflow → AOI → unloader)
- Line configurations (single-sided, double-sided)
- Typical line speeds and throughput benchmarks (CPH - components per hour)
- Line balancing concepts
- **2025 equipment costs** for complete SMT line setup

### 2. Solder Paste Printing
- Stencil design parameters:
  - Aperture size vs pad size (typically 90% of pad)
  - Area ratio formula: (L×W)/(2×T×(L+W)), target >0.66
  - Stencil thickness (100-150μm typical)
- Printing parameters:
  - Print speed (20-80mm/s)
  - Squeegee pressure (0.3-0.5 kg/cm)
  - Separation speed (1-3mm/s)
- Paste types (2025 common formulations):
  - SAC305 (Sn96.5/Ag3.0/Cu0.5) - most common lead-free
  - SAC387, SAC405 alternatives
  - Low-temperature alternatives (SnBi)
  - Paste mesh sizes (Type 3, 4, 5, 6 for ultra-fine pitch)
- Common defects and causes
- SPI (Solder Paste Inspection) - latest 3D SPI capabilities

### 3. Pick and Place (2025 Equipment Specs)
- Machine types with **current 2025 specifications**:
  - Chip shooter: Speed ranges, component capability
  - Flexible/Multi-head: Current models and specs
  - Multi-function: Odd-form capable machines
- Placement accuracy specifications (latest achievable)
- Component feeding methods including intelligent feeders
- Nozzle selection for current component sizes (01005, 008004)
- Latest placement sequence optimization techniques

### 4. Reflow Soldering
- Reflow profile zones and parameters
- Temperature profiles for lead-free (SAC305)
- Vacuum reflow for void reduction (latest technology)
- Nitrogen atmosphere benefits and cost tradeoffs
- Common defects and prevention
- **2025 reflow oven features** (IoT connectivity, Industry 4.0)

### 5. Wave Soldering (for through-hole)
- Wave types (Lambda, Chip wave)
- Selective soldering (2025 technology advances)
- Lead-free process parameters
- When to use wave vs selective vs hand soldering

### 6. BGA/CSP/Advanced Package Assembly
- Ball Grid Array challenges and solutions
- Voiding limits per IPC-A-610 Rev H (current)
- Head-in-pillow prevention techniques
- X-ray inspection requirements
- Package-on-Package (PoP) assembly
- **Latest advanced packaging trends** (2.5D, 3D, chiplets)

### 7. Quality Metrics (Industry Benchmarks 2025)
- First Pass Yield (FPY) benchmarks - current industry standards
- DPMO targets for world-class manufacturing
- Process capability (Cpk) requirements
- OEE (Overall Equipment Effectiveness) benchmarks

### 8. Equipment Vendors & Costs (2025 Market)
- Solder paste printers: DEK/ASM, MPM/ITW, Ekra, GKG, Yamaha
- Pick and place: Fuji, Panasonic, Yamaha, ASM, Juki, Samsung, Hanwha
- Reflow ovens: Heller, BTU, Vitronics, Rehm, Tamura
- SPI: Koh Young, CyberOptics, Mirtec, Parmi
- AOI: Koh Young, Omron, Mirtec, Viscom
- **Include approximate 2025 price ranges for each category**

Include practical tips, industry best practices, and common mistakes to avoid.
```

---

## Expected Output
- Comprehensive markdown document (~4000 words)
- Current 2025 data and specifications
- Equipment costs in USD
- Clear section headers for RAG chunking
