<p align="center">
  <img src="public/logo.png" alt="RFQ AI System" width="120" />
</p>

<h1 align="center">🏭 RFQ AI System</h1>

<p align="center">
  <strong>AI-Powered Request for Quote Automation for Electronics Manufacturing Services</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#ai-agent">AI Agent</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-13.5-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.2-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/React-18.2-61dafb?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Gemini-2.0_Flash-4285f4?logo=google" alt="Gemini" />
  <img src="https://img.shields.io/badge/AI_Agent-Function_Calling-ef4444" alt="AI Agent" />
</p>

---

## 📋 Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Key Features](#features)
- [AI Agent](#-ai-agent)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)

---

## 🎯 Overview

**RFQ AI System** is an intelligent automation platform for the **Electronics Manufacturing Services (EMS)** industry. It transforms the traditionally manual RFQ (Request for Quote) process into an AI-driven workflow that delivers accurate cost estimations in minutes instead of hours.

The system uses **Native Function Calling**, **multimodal similarity matching**, and **Large Language Models** to predict required test stations, estimate manpower requirements, and generate comprehensive cost breakdowns.

### 🏆 Key Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| RFQ Processing Time | 4-8 hours | 15-30 minutes | **90%+ reduction** |
| Required Expertise | Senior Engineers | Any Staff | **Democratized** |
| Cost Estimation Accuracy | ~70% (manual) | 94%+ (AI-assisted) | **+24%** |
| Similar Model Lookup | Manual search | Instant AI match | **Automated** |

---

## 🔴 The Problem

Traditional EMS RFQ processing:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Traditional RFQ Process (4-8 hours)                  │
├─────────────────────────────────────────────────────────────────────────┤
│  1. 📄 Receive customer RFQ (PCB specs, station list, qty, target UPH)  │
│                           ↓                                             │
│  2. 🔍 Senior engineer manually searches for similar past projects      │
│                           ↓                                             │
│  3. 🧪 Determine test stations based on experience & tribal knowledge   │
│                           ↓                                             │
│  4. 👷 Estimate manpower from similar projects (often from memory)      │
│                           ↓                                             │
│  5. 💰 Calculate costs using spreadsheets & historical references       │
│                           ↓                                             │
│  6. ✅ Generate quotation (high variance, expertise-dependent)          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Pain Points

- **⏱️ Time-Consuming**: 4-8 hours per quote
- **👴 Expertise Dependency**: Only senior engineers can do it accurately
- **📉 Inconsistency**: Different engineers produce different estimates
- **🔍 Knowledge Loss**: Tribal knowledge not captured systematically
- **📊 Incomplete Data**: Customers often provide partial specifications

---

## 💡 The Solution

AI-powered workflow:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AI-Powered RFQ Process (15-30 min)                   │
├─────────────────────────────────────────────────────────────────────────┤
│  1. 📤 Input via Chat: Type stations, upload image, or paste Excel      │
│                           ↓                                             │
│  2. 🤖 AI Agent automatically detects intent & extracts data            │
│                           ↓                                             │
│  3. 🔮 Similarity Engine finds matching historical models (< 50ms)      │
│                           ↓                                             │
│  4. 🧪 Auto-predict stations + calculate manpower with formulas         │
│                           ↓                                             │
│  5. 💰 Generate cost breakdown with investment estimates                │
│                           ↓                                             │
│  6. 📝 AI explains results in natural language (ID/EN/中文)             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### 🔍 Intelligent Similarity Matching
- **Jaccard Similarity** on station patterns
- **Sub-50ms queries** using optimized database
- **Top-N recommendations** with confidence scores

### 🧪 Smart Station Prediction
- **Historical pattern learning**: 784+ models, 6,189 station mappings
- **Customer-specific mapping**: 257+ station aliases across 15 customers
- **Master-Alias pattern**: Maps customer terminology to standard codes

### 🧮 Automated Calculations
- **Manpower formula**: `MP = CT ÷ Takt Time × (1/Efficiency)`
- **Investment estimates**: Based on UMK Batam 2025 (Rp 4,989,600/month)
- **Multi-fixture support**: Fractional MP for parallel machine operation
- **Detailed cost breakdown**: Labor, fixture, overhead

### 🌐 Multilingual AI
- **Bahasa Indonesia**: Primary response language
- **English**: Technical terms preserved
- **中文 (Chinese)**: Full support for Chinese queries

### 🖼️ Multimodal Input
- **Text**: Natural language queries
- **Images**: Upload station list screenshots
- **Excel Paste**: Smart detection of tabular data

---

## 🤖 AI Agent

The AI Agent uses **Native Function Calling** (not LangChain/n8n) for better control and debugging.

### Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         RFQ AI AGENT ARCHITECTURE                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│    USER INPUT                    AI BRAIN                    TOOLS           │
│    ───────────                   ────────                    ─────           │
│    ┌─────────┐                                                               │
│    │  Text   │──┐               ┌──────────────┐            ┌────────────┐  │
│    │  Image  │──┼──────────────►│   Gemini     │───────────►│find_similar│  │
│    │  Excel  │──┘               │   2.0 Flash  │            │query_db    │  │
│    └─────────┘                  │  (OpenRouter)│            │search_kb   │  │
│                                 └──────────────┘            │calculate   │  │
│                                        │                    └────────────┘  │
│                                        ▼                                     │
│                                 ┌──────────────┐                             │
│                                 │   Response   │                             │
│                                 │  + UI Cards  │                             │
│                                 └──────────────┘                             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Available Tools

| Tool | Purpose | Input |
|------|---------|-------|
| `find_similar_models` | Find similar historical models | Station list, optional customer filter |
| `query_database` | Query customers, models, stations | Intent + filters |
| `search_knowledge` | Search RAG knowledge base | Natural language query |
| `calculate_manpower` | Calculate MP & investment | Stations + CT + UPH |

### Example: Finding Similar Models

```
👤 User: "Cari model mirip dengan station MBT, CAL, RFT, WIFIBT, MMI"

🤖 AI Process:
   1. Detect intent → find_similar_models
   2. Extract stations: ["MBT", "CAL", "RFT", "WIFIBT", "MMI"]
   3. Execute Jaccard similarity search
   4. Return ranked results

🤖 Response:
   "Ditemukan 3 model serupa:"
   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
   │  📦 L83C5    │ │  📦 M2012K   │ │  📦 2201117  │
   │  XIAOMI      │ │  XIAOMI      │ │  TCL         │
   │  78% match   │ │  72% match   │ │  65% match   │
   └──────────────┘ └──────────────┘ └──────────────┘
```

### Example: Manpower Calculation

```
👤 User: "Hitung MP: MBT 45s, CAL 60s, RFT 90s. Target 120 UPH"

🤖 Calculation:
   Takt Time = 3600 / 120 = 30 seconds
   MP_MBT = 45 / 30 × (1/0.85) = 1.76 → 2
   MP_CAL = 60 / 30 × (1/0.85) = 2.35 → 3
   MP_RFT = 90 / 30 × (1/0.85) = 3.53 → 4
   Total = 9 MP

🤖 Response:
   | Station | CT | MP Raw | MP Final |
   |---------|-------|--------|----------|
   | MBT     | 45s   | 1.76   | 2        |
   | CAL     | 60s   | 2.35   | 3        |
   | RFT     | 90s   | 3.53   | 4        |
   | **Total**|      |        | **9 MP** |
   
   💰 Investment: Rp 121,500,000/month
```

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              RFQ AI SYSTEM                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                      │
│  │   Next.js   │    │   Supabase  │    │  OpenRouter │                      │
│  │  13.5 App   │◄──►│  PostgreSQL │◄──►│   Gemini    │                      │
│  │   Router    │    │             │    │  2.0 Flash  │                      │
│  └─────────────┘    └─────────────┘    └─────────────┘                      │
│         │                  │                  │                              │
│         ▼                  ▼                  ▼                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        CORE ENGINES                                  │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │    │
│  │  │  Similarity  │  │     RAG      │  │     Cost     │  │   File   │ │    │
│  │  │   Engine     │  │  Knowledge   │  │    Engine    │  │  Parser  │ │    │
│  │  ├──────────────┤  ├──────────────┤  ├──────────────┤  ├──────────┤ │    │
│  │  │ • Jaccard    │  │ • EMS Guide  │  │ • Manpower   │  │ • Excel  │ │    │
│  │  │ • Station    │  │ • MP Formula │  │ • Investment │  │ • PDF    │ │    │
│  │  │   matching   │  │ • IPC Stds   │  │ • Fixture    │  │ • Image  │ │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘ │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

| Package | Version | Purpose |
|---------|---------|---------|
| Next.js | 13.5.1 | React framework with App Router |
| React | 18.2.0 | UI library |
| TypeScript | 5.2.2 | Type-safe development |
| Tailwind CSS | 3.3.3 | Utility-first styling |
| shadcn/ui | latest | UI component library |
| React Query | 5.x | Data fetching & caching |
| Framer Motion | 12.x | Animations |
| Recharts | 2.x | Charts & visualization |

### Backend

| Package | Version | Purpose |
|---------|---------|---------|
| Supabase JS | 2.58.0 | Database client |
| xlsx | 0.18.5 | Excel parsing |
| pdf-parse | 1.1.1 | PDF extraction |

### AI/ML

| Technology | Purpose |
|------------|---------|
| **Gemini 2.0 Flash** | Primary LLM via OpenRouter |
| **Native Function Calling** | Tool execution (no LangChain) |
| **RAG Pipeline** | Knowledge retrieval |

### Form & Validation

| Package | Version | Purpose |
|---------|---------|---------|
| React Hook Form | 7.x | Form management |
| Zod | 3.x | Schema validation |

---

## 📁 Project Structure

```
RFQ_AI_SYSTEM/
├── 📂 app/                          # Next.js App Router
│   ├── 📂 (auth)/                   # Auth pages
│   ├── 📂 (dashboard)/              # Protected pages
│   │   ├── 📂 chat/                 # AI Chat interface
│   │   │   └── 📂 [id]/             # Chat sessions
│   │   ├── 📂 dashboard/            # Dashboard home
│   │   ├── 📂 models/               # Model management
│   │   ├── 📂 machines/             # Station management
│   │   ├── 📂 rfq/                  # RFQ processing
│   │   └── 📂 settings/             # Settings
│   ├── 📂 api/                      # API routes
│   │   ├── 📂 cost/                 # Cost calculation
│   │   ├── 📂 explain/              # LLM explanation
│   │   ├── 📂 models/               # Model CRUD
│   │   ├── 📂 parse/                # File parsing
│   │   ├── 📂 rag/                  # RAG queries
│   │   ├── 📂 rfq/                  # RFQ endpoints
│   │   └── 📂 similarity/           # Similarity search
│   └── layout.tsx
│
├── 📂 components/                   # React components
│   ├── 📂 auth/                     # Auth components
│   ├── 📂 dashboard/                # Dashboard widgets
│   ├── 📂 layout/                   # Layout components
│   ├── 📂 rfq/                      # RFQ components
│   ├── 📂 shared/                   # Shared components
│   └── 📂 ui/                       # shadcn/ui components
│
├── 📂 lib/                          # Core libraries
│   ├── 📂 api/                      # API client functions
│   ├── 📂 cost/                     # Cost calculation engine
│   │   ├── capacity-calc.ts
│   │   ├── cost-breakdown.ts
│   │   ├── fixture-cost.ts
│   │   ├── investment-calc.ts
│   │   └── manpower-calc.ts
│   ├── 📂 llm/                      # LLM integration
│   │   ├── agent-v2.ts              # Main AI Agent
│   │   ├── gemini-client.ts         # Direct Gemini client
│   │   ├── tools.ts                 # Function definitions
│   │   └── 📂 prompts/              # Prompt templates
│   ├── 📂 parsers/                  # File parsers
│   ├── 📂 rag/                      # RAG system
│   │   ├── chunking.ts
│   │   ├── embeddings.ts
│   │   └── search.ts
│   ├── 📂 rfq/                      # RFQ processing
│   │   ├── paste-detector.ts
│   │   ├── similarity-engine.ts
│   │   └── station-resolver.ts
│   ├── 📂 similarity/               # Similarity engine
│   │   ├── bom-similarity.ts
│   │   ├── db-queries.ts
│   │   ├── inference-engine.ts
│   │   ├── pcb-similarity.ts
│   │   └── station-matcher.ts
│   ├── 📂 supabase/                 # Supabase client
│   └── utils.ts
│
├── 📂 hooks/                        # Custom React hooks
│   ├── useChatHistory.ts
│   ├── useDataQueries.ts
│   └── useLocalStorage.ts
│
├── 📂 knowledge_base/               # RAG knowledge files
│
├── 📂 types/                        # TypeScript types
│   └── rfq.ts
│
├── 📂 scripts/                      # Utility scripts
│   └── index-knowledge.ts           # RAG indexer
│
├── 📄 .env                          # Environment variables
├── 📄 package.json
├── 📄 tailwind.config.ts
└── 📄 tsconfig.json
```

---

## 🗄️ Database Design

### Core Tables

| Table | Records | Description |
|-------|---------|-------------|
| `customers` | 15 | OEM customers (XIAOMI, TCL, HUAWEI, etc.) |
| `station_master` | 38 | Standard test/assembly stations |
| `station_aliases` | 257 | Customer-specific naming variations |
| `models` | 784 | Historical product models |
| `model_stations` | 6,189 | Model-to-station relationships |

### Master-Alias Pattern

```sql
-- Master Station (standardized)
station_master: { code: 'RFT', name: 'Radio Frequency Test' }

-- Customer Aliases
station_aliases: [
  { alias: 'RF_TEST', customer: NULL },      -- Global
  { alias: 'RFT1', customer: 'XIAOMI' },     -- XIAOMI
  { alias: 'Signal_Test', customer: 'TCL' }  -- TCL
]
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Supabase account
- OpenRouter API key

### Environment Setup

```env
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# LLM (via OpenRouter)
OPENROUTER_API_KEY=your-openrouter-key

# Optional: Direct Gemini
GEMINI_API_KEY=your-gemini-key
```

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/rfq-ai-system.git
cd rfq-ai-system

# Install dependencies
npm install

# Start development server
npm run dev
```

### Access

- **Dashboard**: http://localhost:3000/dashboard
- **AI Chat**: http://localhost:3000/chat

---

## 📡 API Reference

### Chat Endpoint

```
POST /api/rfq/agent
Content-Type: application/json

{
  "messages": [
    { "role": "user", "content": "Cari model dengan station MBT, RFT" }
  ],
  "images": []  // Optional: base64 images
}

Response: Server-Sent Events (streaming)
```

### Similarity Search

```
POST /api/similarity/search

{
  "stations": ["MBT", "CAL", "RFT"],
  "customer_code": "XIAOMI",  // optional
  "limit": 5
}
```

### Cost Calculation

```
POST /api/cost/investment

{
  "stations": [
    { "name": "MBT", "cycle_time": 45 },
    { "name": "RFT", "cycle_time": 90 }
  ],
  "target_uph": 120,
  "efficiency": 0.85
}
```

### RAG Query

```
POST /api/rag/query

{
  "query": "Apa itu station RFT?",
  "top_k": 3
}
```

---

## 📈 Development Status

### Completed ✅

- [x] Database schema with 784 models, 6,189 station mappings
- [x] Similarity engine with Jaccard matching
- [x] AI Agent with Native Function Calling
- [x] RAG knowledge base
- [x] Multilingual support (ID/EN/中文)
- [x] Image upload processing
- [x] React Query caching
- [x] Chat history management
- [x] Cost calculation engine
- [x] Investment estimation (UMK Batam 2025)

### In Progress 🔄

- [ ] PDF spec extraction improvements
- [ ] Advanced BOM parsing

### Planned 📋

- [ ] Voice input support
- [ ] Batch RFQ processing
- [ ] Export to Excel/PDF reports

---

## 📊 Key Formulas

### Manpower Calculation

```
Manpower = Cycle Time ÷ Takt Time × (1 / Efficiency)

Where:
- Takt Time = 3600 / Target UPH
- Efficiency = 0.85 (industry standard)
```

### Investment Calculation

```
Monthly Investment = Total MP × Cost per MP

Where:
- Cost per MP = Rp 13,500,000/month (UMK Batam 2025 + benefits)
- UMK Batam 2025 = Rp 4,989,600/month
```

### Jaccard Similarity

```
Similarity = |A ∩ B| / |A ∪ B| × 100%

Where:
- A = Query station set
- B = Historical model station set
```

---

## 📄 License

Proprietary software developed for EMS manufacturing operations.

---

## 👥 Team

**Marlin Booking** - EMS Manufacturing Solutions
- Founded: 2016
- Location: Batam, Indonesia
- Client: PT SATNUSA PERSADA

---

<p align="center">
  <strong>Built with ❤️ for the EMS Industry</strong>
</p>

<p align="center">
  <sub>Transforming RFQ processing with AI-powered automation</sub>
</p>
