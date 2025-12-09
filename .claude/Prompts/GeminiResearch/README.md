# Gemini Deep Research - EMS Knowledge Base (v2 - 2025 Updated)

## 📋 Overview

6 prompt files untuk generate comprehensive EMS knowledge base menggunakan Gemini Deep Research atau Perplexity Pro.

**⚠️ IMPORTANT: All prompts updated to require 2025 current data**

---

## 🎯 Output Target

| # | Output File | Topic | Focus |
|---|------------|-------|-------|
| 1 | `01_smt_process_fundamentals.md` | SMT Process | 2025 equipment specs & costs |
| 2 | `02_testing_inspection.md` | Testing & Inspection | 2025 equipment & fixture costs |
| 3 | `03_ipc_standards_quality.md` | IPC Standards | Current Rev H standards |
| 4 | `04_troubleshooting_defects.md` | Troubleshooting | 2025 diagnostic tools |
| 5 | `05_cost_engineering.md` | Cost Engineering | **Batam/SEA focus, 2025 rates** |
| 6 | `06_industry_trends.md` | Industry Trends | **Dec 2025 current** |

**Total**: ~27,000-30,000 words → ~250-350 chunks untuk RAG

---

## 🔑 Key Updates (v2)

### All Prompts Now Include:
- ✅ Explicit "2025 current data" requirement
- ✅ 2024-2025 equipment pricing
- ✅ Latest technology capabilities

### Prompt 05 (Cost Engineering) - Special:
- ✅ **Batam, Indonesia primary focus**
- ✅ UMK Batam 2025: Rp 4,989,600/month
- ✅ Southeast Asia regional comparison
- ✅ FTZ benefits explained
- ✅ IDR and USD currencies

### Prompt 06 (Industry Trends) - Special:
- ✅ December 2025 current
- ✅ 2024-2025 developments
- ✅ Southeast Asia perspective
- ✅ Post-chip shortage landscape

---

## 🚀 How to Use

### Recommended: Perplexity Pro
Better for current data with citations. See main README for comparison.

### Step 1: Open Research Tool
- **Perplexity**: https://perplexity.ai (Pro recommended)
- **Gemini**: https://gemini.google.com (Deep Research mode)

### Step 2: Run Each Prompt
1. Open prompt file (e.g., `PROMPT_01_SMT_PROCESS.md`)
2. Copy text inside the \`\`\` code block
3. Paste into research tool
4. Wait for comprehensive response
5. Copy output

### Step 3: Save Output
```
D:\Projects\RFQ_AI_SYSTEM\knowledge_base\
├── 01_smt_process_fundamentals.md
├── 02_testing_inspection.md
├── 03_ipc_standards_quality.md
├── 04_troubleshooting_defects.md
├── 05_cost_engineering.md
└── 06_industry_trends.md
```

### Step 4: Review & Validate
- Ali reviews each document
- Verify 2025 data accuracy
- Add proprietary insights
- Mark any corrections needed

### Step 5: Process into RAG (Phase 7)
1. Chunk documents
2. Generate embeddings
3. Load into Supabase pgvector

---

## ⏱️ Time Estimate

| Task | Time |
|------|------|
| Run 6 prompts | ~45-90 min |
| Review outputs | ~2-4 hours |
| Add proprietary data | ~1-2 hours |
| Process into RAG | ~1-2 hours |
| **Total** | **~5-8 hours** |

---

## 💡 Tips for Best Results

### For Perplexity:
1. Use **Pro Search** mode
2. If output seems short, ask "Please expand with more detail"
3. Ask follow-up questions for missing sections
4. Save citations for verification

### For Gemini:
1. Use **Deep Research** mode if available
2. May need to run in parts if too long
3. Ask for specific sections if incomplete

### General:
- Run one prompt at a time
- Verify equipment costs are 2025
- Check labor rates match UMK 2025
- Save immediately after generation

---

## ✅ Checklist

### Generation:
- [ ] PROMPT_01 → 01_smt_process_fundamentals.md
- [ ] PROMPT_02 → 02_testing_inspection.md
- [ ] PROMPT_03 → 03_ipc_standards_quality.md
- [ ] PROMPT_04 → 04_troubleshooting_defects.md
- [ ] PROMPT_05 → 05_cost_engineering.md (verify Batam data)
- [ ] PROMPT_06 → 06_industry_trends.md (verify 2025 current)

### Review:
- [ ] All files contain 2025 data
- [ ] Equipment costs are realistic
- [ ] Labor rates match UMK Batam 2025
- [ ] No outdated information
- [ ] Ali technical review complete

### Ready for RAG:
- [ ] All 6 files validated
- [ ] Proprietary insights added
- [ ] Ready for Phase 7 processing

---

## 📊 Data Verification Checklist

### Cost Data to Verify:
| Item | Expected 2025 Value |
|------|---------------------|
| UMK Batam | Rp 4,989,600/month |
| SMT Line (entry) | $600K-$1M |
| SMT Line (high-speed) | $2M-$4M |
| ICT Equipment | $120K-$350K |
| ICT Fixture | $8K-$35K |
| 3D AOI | $150K-$350K |

### Regional Comparison:
| Country | Monthly Wage (approx) |
|---------|----------------------|
| Batam | $310-320 |
| Vietnam | $250-350 |
| Malaysia | $400-500 |
| China (coast) | $500-700 |

---

## 📁 File Structure

```
D:\Projects\RFQ_AI_SYSTEM\.claude\Prompts\GeminiResearch\
├── README.md                       # This file
├── PROMPT_01_SMT_PROCESS.md        # Updated with 2025
├── PROMPT_02_TESTING_INSPECTION.md # Updated with 2025
├── PROMPT_03_IPC_STANDARDS.md      # Updated with Rev H
├── PROMPT_04_TROUBLESHOOTING.md    # Updated with 2025 tools
├── PROMPT_05_COST_ENGINEERING.md   # Batam/SEA focus
└── PROMPT_06_INDUSTRY_TRENDS.md    # Dec 2025 current
```

---

**Version**: 2.0 (2025-12-09)
**Changes**: All prompts updated for 2025 data, Batam/Indonesia focus added
