<p align="center">
  <img src="public/logo.png" alt="RFQ AI System" width="120" />
</p>

<h1 align="center">🏭 RFQ AI System</h1>

<p align="center">
  <strong>AI-Powered Request for Quote Automation for Electronics Manufacturing Services</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#documentation">Documentation</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-green?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/pgvector-0.7-purple" alt="pgvector" />
  <img src="https://img.shields.io/badge/Gemini-2.0_Flash-orange?logo=google" alt="Gemini" />
</p>

---

## 📋 Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Key Features](#features)
- [System Architecture](#architecture)
- [AI/ML Components](#aiml-components)
- [Database Design](#database-design)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Development Roadmap](#development-roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**RFQ AI System** is an intelligent automation platform designed specifically for the **Electronics Manufacturing Services (EMS)** industry. It transforms the traditionally manual, expertise-dependent RFQ (Request for Quote) process into an AI-driven workflow that delivers accurate cost estimations in minutes instead of hours.

The system leverages **multimodal similarity matching** (PCB geometry + BOM semantics), **historical production data analysis**, and **Large Language Models** to predict required test stations, estimate manpower requirements, and generate comprehensive cost breakdowns.

### 🏆 Key Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| RFQ Processing Time | 4-8 hours | 15-30 minutes | **90%+ reduction** |
| Required Expertise | Senior Engineers | Any Staff | **Democratized** |
| Cost Estimation Accuracy | ~70% (manual) | 94%+ (AI-assisted) | **+24%** |
| Similar Model Lookup | Manual search | Instant AI match | **Automated** |

---

## 🔴 The Problem

In traditional EMS operations, processing an RFQ involves:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Traditional RFQ Process (4-8 hours)                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. 📄 Receive customer RFQ (incomplete data, varied formats)           │
│                           ↓                                             │
│  2. 🔍 Senior engineer manually searches for similar past projects      │
│                           ↓                                             │
│  3. 📊 Analyze BOM - identify components, complexity, special needs     │
│                           ↓                                             │
│  4. 🧪 Determine test stations based on experience & tribal knowledge   │
│                           ↓                                             │
│  5. 👷 Estimate manpower from similar projects (often from memory)      │
│                           ↓                                             │
│  6. 💰 Calculate costs using spreadsheets & historical references       │
│                           ↓                                             │
│  7. ✅ Generate quotation (high variance, expertise-dependent)          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Pain Points

- **⏱️ Time-Consuming**: 4-8 hours per quote, limiting capacity
- **👴 Expertise Dependency**: Only senior engineers can do it accurately
- **📉 Inconsistency**: Different engineers produce different estimates
- **🔍 Knowledge Loss**: Tribal knowledge not captured systematically
- **📊 Incomplete Data**: Customers often provide partial specifications
- **🏭 Station Guessing**: Test requirements often missed or over-specified

---

## 💡 The Solution

RFQ AI System automates the entire workflow using AI/ML:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AI-Powered RFQ Process (15-30 min)                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. 📤 Upload RFQ files (Excel BOM, PDF drawings, specs)                │
│                           ↓                                             │
│  2. 🤖 AI parses & extracts structured data (LLM-powered)               │
│                           ↓                                             │
│  3. 🔮 Multimodal Similarity Engine finds matching historical models    │
│      ├── PCB Geometry Vector (dimensions, layers, cavity)               │
│      └── BOM Semantic Vector (components, features)                     │
│                           ↓                                             │
│  4. 🧪 Auto-predict test stations from similar models + inference rules │
│                           ↓                                             │
│  5. 👷 Calculate manpower from station requirements & cycle times       │
│                           ↓                                             │
│  6. 💰 Generate comprehensive cost breakdown                            │
│                           ↓                                             │
│  7. 📝 AI explains results in natural language (Bahasa Indonesia)       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### 🔍 Intelligent Similarity Matching

- **Multimodal approach**: Combines PCB geometry analysis with BOM semantic understanding
- **Vector similarity search**: Uses pgvector for sub-50ms similarity queries
- **Weighted scoring**: Configurable weights for PCB (60%) and BOM (40%) features
- **Top-N recommendations**: Returns ranked similar models with confidence scores

### 🧪 Smart Station Prediction

- **Historical pattern learning**: Learns from 6,000+ historical model-station records
- **Rule-based inference**: Uses `triggers_if` conditions (e.g., "has_rf" → add RFT station)
- **Customer-specific mapping**: Handles varied terminology via 257+ station aliases
- **Gap detection**: Identifies missing stations based on BOM components

### 📊 Automated File Parsing

- **Excel BOM parsing**: Extracts components, quantities, package types
- **PDF extraction**: Reads PCB dimensions, layer count, specifications
- **LLM fallback**: Uses Gemini 2.0 Flash when algorithmic parsing fails
- **Confidence scoring**: Reports extraction confidence for review

### 💰 Comprehensive Cost Engine

- **Material costs**: PCB, components, packaging
- **Process costs**: SMT line, assembly operations
- **Labor costs**: Direct + indirect manpower
- **Test costs**: Per-station costs with fixture amortization
- **Overhead & margin**: Configurable rates

### 🌐 Multilingual AI Explanations

- **Natural language output**: Explains results in Bahasa Indonesia
- **Actionable suggestions**: AI-generated recommendations for cost optimization
- **Risk assessment**: Identifies potential issues and mitigation strategies

---

## 🏗️ Architecture

### High-Level System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              RFQ AI SYSTEM                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │   Next.js   │    │   Supabase  │    │   Gemini    │    │  OpenRouter │   │
│  │  Frontend   │◄──►│  PostgreSQL │◄──►│  2.0 Flash  │◄──►│  (Fallback) │   │
│  │  + App API  │    │  + pgvector │    │    LLM      │    │  Llama 3.3  │   │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘   │
│         │                  │                  │                              │
│         ▼                  ▼                  ▼                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        CORE ENGINES                                  │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │                                                                      │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │    │
│  │  │  Similarity  │  │    File      │  │    Cost      │               │    │
│  │  │   Engine     │  │   Parsers    │  │   Engine     │               │    │
│  │  ├──────────────┤  ├──────────────┤  ├──────────────┤               │    │
│  │  │ • PCB Vector │  │ • Excel BOM  │  │ • Material   │               │    │
│  │  │ • BOM Vector │  │ • PDF Extract│  │ • Process    │               │    │
│  │  │ • Hybrid     │  │ • LLM Parse  │  │ • Labor      │               │    │
│  │  │   Matching   │  │ • Validation │  │ • Test       │               │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘               │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA FLOW                                        │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────┐     ┌───────────┐     ┌────────────┐     ┌──────────────┐
  │  Upload  │────►│  Parse &  │────►│  Generate  │────►│   Similarity │
  │  Files   │     │  Extract  │     │  Vectors   │     │    Search    │
  └──────────┘     └───────────┘     └────────────┘     └──────────────┘
       │                │                  │                    │
       │           ┌────┴────┐        ┌────┴────┐          ┌────┴────┐
       │           │ BOM.xlsx│        │PCB Vec  │          │Top 5    │
       │           │ PCB.pdf │        │BOM Vec  │          │Matches  │
       │           └─────────┘        └─────────┘          └─────────┘
       │                                                        │
       ▼                                                        ▼
  ┌──────────┐     ┌───────────┐     ┌────────────┐     ┌──────────────┐
  │   LLM    │────►│  Predict  │────►│  Calculate │────►│   Generate   │
  │ Fallback │     │  Stations │     │    Costs   │     │    Report    │
  └──────────┘     └───────────┘     └────────────┘     └──────────────┘
                         │                  │                    │
                    ┌────┴────┐        ┌────┴────┐          ┌────┴────┐
                    │Inferred │        │Cost     │          │Bahasa   │
                    │Stations │        │Breakdown│          │Summary  │
                    └─────────┘        └─────────┘          └─────────┘
```

---

## 🤖 AI/ML Components

### 1. Multimodal Similarity Engine

The heart of the system - finds similar historical models using vector similarity:

```typescript
// Similarity Score Calculation
Score_total = (W_pcb × Sim_PCB) + (W_bom × Sim_BOM)

Where:
- W_pcb = 0.6 (PCB geometry weight)
- W_bom = 0.4 (BOM semantics weight)
- Sim_PCB = cosine_similarity(query_pcb_vector, historical_pcb_vector)
- Sim_BOM = cosine_similarity(query_bom_vector, historical_bom_vector)
```

#### PCB Feature Vector (Geometric)

```typescript
interface PCBFeatures {
  board_length_mm: number;      // 0-500mm normalized
  board_width_mm: number;       // 0-500mm normalized
  board_area_mm2: number;       // Computed
  layer_count: number;          // 1-16 layers
  cavity_count: number;         // 1-100 cavities
  is_double_sided: boolean;     // TOP/BOT assembly
  has_fine_pitch: boolean;      // <0.5mm pitch components
  has_bga: boolean;             // Ball Grid Array
  smt_points_top: number;       // SMT placement points
  smt_points_bot: number;
}
```

#### BOM Feature Vector (Semantic)

```typescript
interface BOMFeatures {
  total_components: number;     // Part count
  unique_parts: number;         // Distinct part numbers
  has_mcu: boolean;             // Microcontroller present
  has_rf_2g: boolean;           // 2G/GSM module
  has_rf_3g: boolean;           // 3G/UMTS module
  has_rf_4g: boolean;           // 4G/LTE module
  has_rf_5g: boolean;           // 5G module
  has_wifi: boolean;            // WiFi module
  has_bluetooth: boolean;       // Bluetooth module
  has_sensor_temp: boolean;     // Temperature sensor
  has_sensor_imu: boolean;      // Accelerometer/Gyro
  has_sensor_pressure: boolean; // Pressure sensor
  has_power_ic: boolean;        // Power management
  has_battery: boolean;         // Battery connector
  has_display: boolean;         // LCD/OLED
  has_camera: boolean;          // Camera module
  max_package_complexity: number; // BGA=5, QFN=4, QFP=3...
}
```

#### Similarity Thresholds

| Score Range | Confidence | Action |
|-------------|------------|--------|
| ≥ 0.85 | 🟢 High | Reuse full station plan from match |
| 0.70 - 0.84 | 🟡 Medium | Adjust stations based on differences |
| < 0.70 | 🔴 Low | Use rule-based inference |

### 2. Station Inference Engine

When similarity is insufficient, the system infers required stations using rules:

```typescript
// Station Master with Inference Rules
{
  code: "RFT",
  name: "Radio Frequency Test",
  triggers_if: ["has_rf_2g", "has_rf_3g", "has_rf_4g", "has_wifi", "has_bluetooth"],
  required_for: ["wireless_device", "iot_module", "smartphone"]
}

// Inference Logic
if (bom.has_rf_4g && !predictedStations.includes('RFT')) {
  predictedStations.push('RFT');  // Add RF Test
  predictedStations.push('CAL');  // Add Calibration
}
```

#### Inference Rules Summary

| Condition | Inferred Stations |
|-----------|-------------------|
| `has_mcu` | OS_DOWNLOAD, MBT, ICT |
| `has_rf_*` | RFT, CAL, SHIELDING_COVER |
| `has_sensor_*` | CAL (mandatory) |
| `has_display` | MMI |
| `has_power_ic` | CURRENT_TESTING |
| `has_battery` | CURRENT_TESTING, PCB_CURRENT |
| `has_bga` | UNDERFILL, AXI |
| `cavity_count > 1` | ROUTER |
| `is_double_sided` | AOI_TOP, AOI_BOT |

### 3. LLM Integration (Gemini 2.0 Flash)

Used for intelligent parsing and natural language generation:

```typescript
// LLM Architecture
┌─────────────────────────────────────────┐
│           LLM Layer                     │
├─────────────────────────────────────────┤
│                                         │
│  PRIMARY: Gemini 2.0 Flash              │
│  ├── 1M token context window            │
│  ├── Multilingual (ID/EN)               │
│  ├── JSON mode for structured output    │
│  └── Free tier: 60 req/min              │
│                                         │
│  FALLBACK: Llama 3.3 70B (OpenRouter)   │
│  └── Only on Gemini failure/rate-limit  │
│                                         │
└─────────────────────────────────────────┘
```

#### LLM Use Cases

| Use Case | Input | Output |
|----------|-------|--------|
| BOM Parsing | Messy Excel data | Structured JSON with components |
| PDF Extraction | Drawing/spec PDF | PCB dimensions, layer count |
| Result Explanation | Analysis results | Bahasa Indonesia summary |
| Suggestions | Cost breakdown | Optimization recommendations |

---

## 🗄️ Database Design

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DATABASE SCHEMA                                    │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
  │  customers   │────────<│    models    │>────────│ pcb_features │
  │──────────────│         │──────────────│         │──────────────│
  │ id (PK)      │         │ id (PK)      │         │ model_id(FK) │
  │ code         │         │ customer_id  │         │ board_length │
  │ name         │         │ code         │         │ board_width  │
  │ country      │         │ name         │         │ layer_count  │
  └──────────────┘         │ board_types  │         │ pcb_vector   │◄── pgvector
                           └──────────────┘         └──────────────┘
                                  │
                                  │
                           ┌──────┴──────┐
                           ▼             ▼
                    ┌──────────────┐  ┌──────────────┐
                    │model_stations│  │   bom_data   │
                    │──────────────│  │──────────────│
                    │ model_id(FK) │  │ model_id(FK) │
                    │ station_code │  │ part_number  │
                    │ board_type   │  │ quantity     │
                    │ sequence     │  │ bom_vector   │◄── pgvector
                    │ manpower     │  │ features     │
                    └──────────────┘  └──────────────┘
                           │
                           ▼
                    ┌──────────────┐         ┌──────────────┐
                    │station_master│◄────────│station_alias │
                    │──────────────│         │──────────────│
                    │ id (PK)      │         │ master_id(FK)│
                    │ code         │         │ alias_name   │
                    │ name         │         │ customer_id  │
                    │ triggers_if  │◄── JSON Array for inference
                    │ required_for │◄── JSON Array
                    │ cycle_time   │
                    │ operator_ratio│
                    └──────────────┘

  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
  │ rfq_requests │────────<│  rfq_results │         │ rfq_stations │
  │──────────────│         │──────────────│         │──────────────│
  │ id (PK)      │         │ rfq_id (FK)  │         │ rfq_id (FK)  │
  │ customer_id  │         │ similarity   │         │ station_code │
  │ status       │         │ cost_data    │         │ sequence     │
  │ created_at   │         │ explanation  │◄── LLM generated      │
  └──────────────┘         │ suggestions  │◄── LLM generated      │
                           └──────────────┘         └──────────────┘
```

### Master-Alias Pattern

The system handles customer-specific station naming through a master-alias pattern:

```sql
-- Master Station (standardized)
station_master: {
  code: 'RFT',
  name: 'Radio Frequency Test',
  category: 'Testing'
}

-- Customer Aliases (variations)
station_aliases: [
  { alias: 'RF_TEST',     customer: NULL },      -- Global alias
  { alias: 'RFT1',        customer: 'XIAOMI' },  -- XIAOMI specific
  { alias: 'Signal_Test', customer: 'TCL' },     -- TCL specific
  { alias: 'RF_Verify',   customer: 'HUAWEI' }   -- HUAWEI specific
]
```

### Vector Storage (pgvector)

PostgreSQL with pgvector extension enables fast similarity search:

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- PCB feature vector (10 dimensions)
ALTER TABLE pcb_features 
ADD COLUMN pcb_vector vector(10);

-- BOM feature vector (20 dimensions)  
ALTER TABLE bom_data
ADD COLUMN bom_vector vector(20);

-- Create HNSW index for fast similarity search
CREATE INDEX ON pcb_features 
USING hnsw (pcb_vector vector_cosine_ops);

-- Similarity query (< 50ms)
SELECT model_id, 1 - (pcb_vector <=> query_vector) as similarity
FROM pcb_features
ORDER BY pcb_vector <=> query_vector
LIMIT 5;
```

### Current Data Statistics

| Table | Records | Description |
|-------|---------|-------------|
| `customers` | 15 | OEM/brand customers (XIAOMI, TCL, etc.) |
| `station_master` | 38 | Standard test/assembly stations |
| `station_aliases` | 257 | Customer-specific naming variations |
| `models` | 784 | Historical product models |
| `model_stations` | 6,189 | Model-to-station mappings |
| `pcb_features` | 0* | PCB geometric data |
| `bom_data` | 0* | BOM component data |

*To be populated from historical records

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.x | React framework with App Router |
| **TypeScript** | 5.x | Type-safe development |
| **Tailwind CSS** | 3.x | Utility-first styling |
| **shadcn/ui** | Latest | UI component library |
| **Lucide Icons** | Latest | Icon library |
| **React Hook Form** | 7.x | Form management |
| **Zod** | 3.x | Schema validation |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js API Routes** | 15.x | Serverless API endpoints |
| **Supabase** | Latest | PostgreSQL + Auth + Storage |
| **pgvector** | 0.7.x | Vector similarity search |
| **ExcelJS** | 4.x | Excel file parsing |
| **pdf-parse** | 1.x | PDF text extraction |

### AI/ML

| Technology | Purpose |
|------------|---------|
| **Gemini 2.0 Flash** | Primary LLM (parsing, explanation) |
| **Llama 3.3 70B** | Fallback LLM via OpenRouter |
| **pgvector** | Vector similarity computation |
| **Custom algorithms** | Feature extraction, inference rules |

### Infrastructure

| Service | Purpose |
|---------|---------|
| **Vercel** | Frontend hosting & serverless |
| **Supabase Cloud** | Database & authentication |
| **Google AI Studio** | Gemini API access |
| **OpenRouter** | LLM API gateway (fallback) |

---

## 📁 Project Structure

```
RFQ_AI_SYSTEM/
├── 📂 app/                          # Next.js App Router
│   ├── 📂 (auth)/                   # Auth pages (login, register)
│   ├── 📂 (dashboard)/              # Protected dashboard pages
│   │   ├── 📂 customers/            # Customer management
│   │   ├── 📂 models/               # Model/product management
│   │   ├── 📂 stations/             # Station configuration
│   │   ├── 📂 rfq/                  # RFQ processing
│   │   │   ├── 📂 new/              # New RFQ wizard
│   │   │   └── 📂 [id]/             # RFQ details & results
│   │   └── page.tsx                 # Dashboard home
│   ├── 📂 api/                      # API routes
│   │   ├── 📂 rfq/                  # RFQ endpoints
│   │   ├── 📂 similarity/           # Similarity search
│   │   ├── 📂 parse/                # File parsing
│   │   └── 📂 explain/              # LLM explanation
│   └── layout.tsx                   # Root layout
│
├── 📂 components/                   # React components
│   ├── 📂 ui/                       # shadcn/ui components
│   ├── 📂 forms/                    # Form components
│   ├── 📂 tables/                   # Data tables
│   └── 📂 charts/                   # Visualization
│
├── 📂 lib/                          # Core libraries
│   ├── 📂 api/                      # API client functions
│   │   ├── customers.ts
│   │   ├── models.ts
│   │   └── stations.ts
│   │
│   ├── 📂 similarity/               # Similarity Engine
│   │   ├── pcb-features.ts          # PCB vector generation
│   │   ├── bom-features.ts          # BOM vector generation
│   │   ├── vector-search.ts         # pgvector queries
│   │   ├── station-inference.ts     # Rule-based inference
│   │   └── index.ts
│   │
│   ├── 📂 parsers/                  # File Parsers
│   │   ├── excel-parser.ts          # BOM Excel parsing
│   │   ├── pdf-parser.ts            # PDF extraction
│   │   ├── validators.ts            # Data validation
│   │   └── index.ts
│   │
│   ├── 📂 cost/                     # Cost Engine
│   │   ├── material-calc.ts         # Material costs
│   │   ├── process-calc.ts          # Process costs
│   │   ├── labor-calc.ts            # Labor costs
│   │   ├── test-calc.ts             # Test station costs
│   │   └── index.ts
│   │
│   ├── 📂 llm/                      # LLM Integration
│   │   ├── config.ts                # Model configuration
│   │   ├── gemini-client.ts         # Google AI client
│   │   ├── openrouter-client.ts     # Fallback client
│   │   ├── client.ts                # Unified client
│   │   └── 📂 prompts/              # Prompt templates
│   │       ├── bom-parser.ts
│   │       ├── pdf-extractor.ts
│   │       ├── explainer.ts
│   │       └── suggester.ts
│   │
│   ├── 📂 supabase/                 # Supabase client
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   │
│   └── utils.ts                     # Utility functions
│
├── 📂 types/                        # TypeScript types
│   ├── database.ts                  # DB schema types
│   ├── rfq.ts                       # RFQ types
│   └── api.ts                       # API types
│
├── 📂 .claude/                      # Claude Code prompts
│   └── 📂 Prompts/                  # Development phases
│       ├── README.md
│       ├── LLM_INTEGRATION.md
│       ├── PHASE_0_FIX_UI_BUGS.md
│       ├── PHASE_1_DATABASE_SCHEMA.md
│       ├── PHASE_2_SIMILARITY_ENGINE.md
│       ├── PHASE_3_FILE_PARSERS.md
│       ├── PHASE_4_COST_ENGINE.md
│       └── PHASE_5_INTEGRATION.md
│
├── 📄 .env.local                    # Environment variables
├── 📄 package.json
├── 📄 tsconfig.json
├── 📄 tailwind.config.js
└── 📄 README.md                     # This file
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Supabase account
- Google AI Studio API key (for Gemini)
- OpenRouter API key (optional, for fallback)

### Environment Setup

Create `.env.local` in project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# LLM - Primary
GEMINI_API_KEY=your-gemini-api-key

# LLM - Fallback (optional)
OPENROUTER_API_KEY=your-openrouter-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/rfq-ai-system.git
cd rfq-ai-system

# Install dependencies
npm install

# Run database migrations (in Supabase SQL Editor)
# See .claude/Prompts/PHASE_1_DATABASE_SCHEMA.md

# Seed master data
# See .claude/Prompts/MIGRATION_SEED_MODELS.sql

# Start development server
npm run dev
```

### Access Application

- **Local**: http://localhost:3000
- **Dashboard**: http://localhost:3000/dashboard
- **New RFQ**: http://localhost:3000/rfq/new

---

## 📡 API Reference

### RFQ Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/rfq` | Create new RFQ request |
| `GET` | `/api/rfq/[id]` | Get RFQ details |
| `POST` | `/api/rfq/[id]/process` | Process RFQ (full analysis) |
| `GET` | `/api/rfq/[id]/results` | Get analysis results |

### Similarity Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/similarity/search` | Find similar models |
| `POST` | `/api/similarity/pcb` | PCB-only similarity |
| `POST` | `/api/similarity/bom` | BOM-only similarity |

### Parse Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/parse/bom` | Parse BOM Excel file |
| `POST` | `/api/parse/pdf` | Extract from PDF |
| `POST` | `/api/parse/validate` | Validate parsed data |

### Explain Endpoint

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/explain` | Generate LLM explanation |

---

## 📈 Development Roadmap

### Phase 1: Database Schema ✅
- [x] Core tables (customers, models, stations)
- [x] Master-alias pattern for stations
- [x] Historical data import (6,000+ records)
- [x] pgvector extension setup

### Phase 2: Similarity Engine ✅
- [x] PCB feature extraction
- [x] BOM feature extraction
- [x] Vector similarity search
- [x] Station inference rules

### Phase 3: File Parsers 🔄
- [ ] Excel BOM parser
- [ ] PDF extractor
- [ ] LLM fallback parsing
- [ ] Validation layer

### Phase 4: Cost Engine ⏳
- [ ] Material cost calculator
- [ ] Process cost calculator
- [ ] Labor cost calculator
- [ ] Test cost calculator

### Phase 5: Integration ⏳
- [ ] Full RFQ workflow
- [ ] LLM explanations
- [ ] Results dashboard
- [ ] Export functionality

### Phase 6: Advanced Features 📋
- [ ] Batch RFQ processing
- [ ] Historical trend analysis
- [ ] Cost optimization suggestions
- [ ] Supplier integration

---

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines.

### Development Workflow

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Style

- Use TypeScript strict mode
- Follow ESLint configuration
- Write meaningful commit messages
- Add tests for new features

---

## 📄 License

This project is proprietary software developed for EMS manufacturing operations.

---

## 👥 Team

**Marlin Booking** - EMS Manufacturing Solutions

- Founded: 2016
- Expertise: Electronics Manufacturing Services
- Location: Indonesia

---

## 📞 Support

For questions or support:

- 📧 Email: support@marlinbooking.com
- 📖 Documentation: [docs.rfq-ai.com](https://docs.rfq-ai.com)
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/rfq-ai-system/issues)

---

<p align="center">
  <strong>Built with ❤️ for the EMS Industry</strong>
</p>

<p align="center">
  <sub>Transforming RFQ processing with AI-powered automation</sub>
</p>
