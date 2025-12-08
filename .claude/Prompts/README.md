# RFQ AI System - Backend Development Prompts

## 📋 Overview

This folder contains phased development prompts for Claude Code to complete the RFQ AI System backend.

**Project:** RFQ AI System for EMS Manufacturing  
**Location:** `D:\Projects\RFQ_AI_SYSTEM`  
**Stack:** Next.js 13 + TypeScript + Supabase + pgvector + shadcn/ui

---

## 🎯 Phase Summary

| Phase | Focus | Status | Est. Time |
|-------|-------|--------|-----------|
| **Phase 0** | Fix UI Bugs (Machines, Models, RFQ History) | 🔴 TODO | 2-3 hrs |
| **Phase 1** | Database Schema + pgvector + Seed Data | 🔴 TODO | 2-3 hrs |
| **Phase 2** | Similarity Engine (PCB + BOM matching) | 🔴 TODO | 4-5 hrs |
| **Phase 3** | File Parsers (Excel BOM, PDF) | 🔴 TODO | 3-4 hrs |
| **Phase 4** | Cost Calculation Engine | 🔴 TODO | 3-4 hrs |
| **Phase 5** | Integration & E2E Testing | 🔴 TODO | 4-5 hrs |

**Total Estimated:** 18-24 hours of development

---

## 🚀 How to Use These Prompts

### For Claude Code:

1. **Start with Phase 0** - Fix broken pages first
2. **Read the full prompt** before starting each phase
3. **Follow acceptance criteria** to verify completion
4. **Run tests** after each phase
5. **Commit frequently** with descriptive messages

### Execution Command:

```bash
cd D:\Projects\RFQ_AI_SYSTEM
# Read each PHASE_X_*.md file and implement
```

---

## 📁 Prompt Files

```
.claude/Prompts/
├── README.md                    # This file
├── PHASE_0_FIX_UI_BUGS.md      # Fix Machines, Models, RFQ History pages
├── PHASE_1_DATABASE_SCHEMA.md  # pgvector, tables, seed data
├── PHASE_2_SIMILARITY_ENGINE.md # PCB + BOM similarity matching
├── PHASE_3_FILE_PARSERS.md     # Excel BOM & PDF parsing
├── PHASE_4_COST_ENGINE.md      # Investment, MP, cost calculation
└── PHASE_5_INTEGRATION.md      # API routes, wiring, E2E testing
```

---

## ⚠️ Prerequisites

Before starting, ensure:

1. **Supabase project** is created and credentials in `.env`
2. **Node.js 18+** installed
3. **npm packages** installed (`npm install`)
4. **pgvector extension** can be enabled in Supabase

---

## 🔑 Key Reference Documents

- `EMS_Test_Line_Reference_Guide.md` - Station codes, cycle times, costs
- Existing code in `lib/api/` - API patterns to follow
- `components/` - UI components already built

---

## ✅ Definition of Done

Project is complete when:

1. All pages load without errors
2. CRUD operations work for Machines, Models, RFQ
3. New RFQ wizard saves to database
4. Similarity engine finds matching models
5. File upload extracts BOM/PCB data
6. Cost breakdown calculates correctly
7. Results page shows real AI recommendations
8. `npm run build` passes with no errors

---

## 💡 Tips for Claude Code

1. **Check existing code patterns** in `lib/api/` before creating new files
2. **Use Supabase client** from `lib/supabase/client.ts`
3. **Follow TypeScript** - no `any` types unless necessary
4. **Toast notifications** for all user actions (success/error)
5. **Loading states** for all async operations
6. **Error boundaries** for graceful failures

---

## 📞 Support

If stuck on any phase:
1. Check the prompt's "Test Cases" section
2. Verify database schema matches expected
3. Check browser console for errors
4. Review Supabase logs for API issues

---

**Last Updated:** December 8, 2024  
**Author:** Ali Sadikin (CEO, Marlin Booking)
