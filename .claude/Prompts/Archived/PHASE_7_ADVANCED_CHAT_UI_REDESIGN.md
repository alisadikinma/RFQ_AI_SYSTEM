# Phase 7: Advanced Chat UI Redesign - Claude-Style Interface

## 🎯 OBJECTIVE
Redesign the RFQ Chat Interface to be a **premium, intelligent AI assistant** similar to Claude's UI. Focus on exceptional UX, visual polish, and WOW effects.

---

## 📋 REQUIREMENTS OVERVIEW

| # | Feature | Priority |
|---|---------|----------|
| 1 | Claude-style layout (sidebar + main chat) | HIGH |
| 2 | LLM model selector (OpenRouter + Auto) | HIGH |
| 3 | Image preview on paste/upload | HIGH |
| 4 | Extracted data in table format | HIGH |
| 5 | Similar models in 3 interactive cards | HIGH |
| 6 | Model detail modal with comparison | HIGH |
| 7 | WOW effect animations throughout | HIGH |

---

## 🏗️ ARCHITECTURE

### New File Structure
```
components/rfq/chat-v2/
├── layout/
│   ├── ChatLayout.tsx           # Main 2-column layout
│   ├── Sidebar.tsx              # Left sidebar with history
│   ├── ChatHistoryItem.tsx      # Single history item
│   └── NewChatButton.tsx        # Create new chat
├── main/
│   ├── ChatMain.tsx             # Right side main area
│   ├── MessageList.tsx          # Scrollable messages
│   ├── MessageBubble.tsx        # Single message (user/assistant)
│   └── WelcomeScreen.tsx        # Empty state
├── input/
│   ├── ChatInputArea.tsx        # Bottom input section
│   ├── ModelSelector.tsx        # LLM dropdown
│   └── ImagePreview.tsx         # Pasted image preview
├── results/
│   ├── ExtractedDataTable.tsx   # Station table display
│   ├── SimilarModelCards.tsx    # 3 cards container
│   ├── ModelCard.tsx            # Single model card
│   └── ModelDetailModal.tsx     # Full comparison modal
├── animations/
│   └── motion-variants.ts       # Framer Motion configs
└── index.tsx                    # Main export
```

---

## 1️⃣ CLAUDE-STYLE LAYOUT

### Design Specs
```
┌─────────────────────────────────────────────────────────────────┐
│                         HEADER (optional)                        │
├────────────────┬────────────────────────────────────────────────┤
│                │                                                 │
│   SIDEBAR      │              MAIN CHAT AREA                    │
│   (280px)      │                                                 │
│                │  ┌─────────────────────────────────────────┐   │
│  [+ New Chat]  │  │                                         │   │
│                │  │         MESSAGE LIST                     │   │
│  ─────────────  │  │         (scrollable)                    │   │
│                │  │                                         │   │
│  Today         │  │  [User message]                         │   │
│  ├─ Chat 1     │  │  [Assistant response]                   │   │
│  ├─ Chat 2     │  │  [Extracted Table]                      │   │
│                │  │  [Similar Model Cards]                  │   │
│  Yesterday     │  │                                         │   │
│  ├─ Chat 3     │  └─────────────────────────────────────────┘   │
│                │                                                 │
│                │  ┌─────────────────────────────────────────┐   │
│                │  │  [Image Preview] [Input Area]     [Send]│   │
│                │  │  [Model: Auto ▼]                        │   │
│                │  └─────────────────────────────────────────┘   │
│                │                                                 │
└────────────────┴────────────────────────────────────────────────┘
```

### Sidebar Component
```tsx
// components/rfq/chat-v2/layout/Sidebar.tsx

interface ChatHistory {
  id: string;
  title: string;           // Auto-generated from first message
  preview: string;         // First 50 chars
  createdAt: Date;
  modelCount?: number;     // Similar models found
  stationCount?: number;   // Stations extracted
}

// Features:
// - Grouped by: Today, Yesterday, Previous 7 Days, Older
// - Hover effect with subtle highlight
// - Active chat highlighted with accent color
// - Right-click context menu (Rename, Delete)
// - Collapsible on mobile (hamburger menu)
```

### Storage
```tsx
// Use localStorage for chat history persistence
// Key: 'rfq_chat_history'
// Structure: ChatHistory[]

// Each chat's messages stored separately
// Key: 'rfq_chat_{id}'
// Structure: ChatMessage[]
```

---

## 2️⃣ LLM MODEL SELECTOR

### Available Models (OpenRouter)
```tsx
interface LLMModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  costPer1k: number;      // Cost indicator
  speed: 'fast' | 'medium' | 'slow';
  capabilities: string[];
}

const AVAILABLE_MODELS: LLMModel[] = [
  {
    id: 'auto',
    name: 'Auto (Recommended)',
    provider: 'System',
    description: 'Automatically selects best model for the task',
    costPer1k: 0,
    speed: 'fast',
    capabilities: ['vision', 'function_calling', 'long_context'],
  },
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash',
    provider: 'Google',
    description: 'Fast, free, great for vision',
    costPer1k: 0,
    speed: 'fast',
    capabilities: ['vision', 'function_calling'],
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    description: 'Best reasoning and analysis',
    costPer1k: 0.003,
    speed: 'medium',
    capabilities: ['vision', 'function_calling', 'long_context'],
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    description: 'Open source, good balance',
    costPer1k: 0.0004,
    speed: 'medium',
    capabilities: ['function_calling'],
  },
  {
    id: 'qwen/qwen-2.5-72b-instruct',
    name: 'Qwen 2.5 72B',
    provider: 'Alibaba',
    description: 'Strong multilingual support',
    costPer1k: 0.0004,
    speed: 'medium',
    capabilities: ['function_calling'],
  },
];
```

### Model Selector UI
```tsx
// components/rfq/chat-v2/input/ModelSelector.tsx

// Design:
// - Dropdown with model icons
// - Show provider logo
// - Speed indicator (⚡ fast, 🔄 medium, 🐢 slow)
// - Cost indicator (FREE, $, $$, $$$)
// - Capabilities badges (👁️ vision, 🔧 tools)
// - Selected model persisted in localStorage
```

### Auto Mode Logic
```tsx
// When 'auto' is selected, system chooses based on:
// 1. Has image? → Use vision-capable model (Gemini 2.0 Flash)
// 2. Complex analysis? → Use Claude 3.5 Sonnet
// 3. Simple query? → Use Llama 3.3 (cost-effective)
// 4. Chinese text? → Use Qwen 2.5
```

---

## 3️⃣ IMAGE PREVIEW ON PASTE/UPLOAD

### Requirements
- Show actual image thumbnail (not just filename)
- Support paste from clipboard (Ctrl+V)
- Support drag & drop
- Support file picker
- Multiple images allowed
- Remove button on each image
- Click to view full size

### Component
```tsx
// components/rfq/chat-v2/input/ImagePreview.tsx

interface ImagePreviewProps {
  images: ImageFile[];
  onRemove: (index: number) => void;
  onViewFull: (image: ImageFile) => void;
}

interface ImageFile {
  id: string;
  file: File;
  preview: string;  // Data URL for preview
  name: string;
  size: number;
}

// Design:
// - Horizontal scroll container above input
// - Thumbnail size: 80x80px with rounded corners
// - Hover: slight scale + shadow
// - X button on top-right corner
// - Click: open in lightbox modal
// - Drag handle for reordering (optional)
```

### Paste Handler
```tsx
// In ChatInputArea.tsx
const handlePaste = async (e: ClipboardEvent) => {
  const items = e.clipboardData?.items;
  if (!items) return;
  
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) {
        const preview = await fileToDataURL(file);
        addImage({ file, preview, name: file.name, size: file.size });
      }
    }
  }
};
```

---

## 4️⃣ EXTRACTED DATA TABLE

### When to Show
- After AI extracts stations from image/text
- Inline in the chat (not separate panel)
- Editable before proceeding

### Table Design
```tsx
// components/rfq/chat-v2/results/ExtractedDataTable.tsx

interface ExtractedStation {
  id: string;
  code: string;
  name?: string;
  section?: string;
  sequence: number;
  isValid: boolean;      // Matched in station_master
  suggestedCode?: string; // If invalid, suggest closest match
}

// Features:
// - Zebra striping
// - Status indicator (✅ valid, ⚠️ needs review, ❌ unknown)
// - Inline edit capability
// - Drag to reorder
// - Delete row button
// - Add row button
// - "Confirm & Search" button at bottom
```

### Visual Design
```
┌─────────────────────────────────────────────────────────────┐
│  📋 Extracted Stations (11 found)                    [Edit] │
├─────┬─────────────────────┬──────────────┬─────────────────┤
│  #  │  Station Code       │  Section     │  Status         │
├─────┼─────────────────────┼──────────────┼─────────────────┤
│  1  │  MBT                │  Testing     │  ✅ Valid       │
│  2  │  CAL1               │  Testing     │  ✅ Valid       │
│  3  │  RF_TEST            │  Testing     │  ⚠️ → RFT      │
│  4  │  UNKNOWN_STATION    │  -           │  ❌ Not found   │
├─────┴─────────────────────┴──────────────┴─────────────────┤
│  [+ Add Station]              [🔍 Find Similar Models]      │
└─────────────────────────────────────────────────────────────┘
```

---

## 5️⃣ SIMILAR MODEL CARDS (WOW EFFECT)

### Display Condition
- Show after user confirms stations and clicks "Find Similar"
- Maximum 3 cards (top matches)
- Animated entrance (stagger effect)

### Card Design
```tsx
// components/rfq/chat-v2/results/ModelCard.tsx

interface ModelCardProps {
  model: SimilarModel;
  rank: 1 | 2 | 3;
  isSelected: boolean;
  onClick: () => void;
}

// Visual Elements:
// - Rank badge (🥇 🥈 🥉) with glow effect
// - Customer logo/avatar
// - Model code (large, bold)
// - Similarity score (circular progress ring)
// - Quick stats row: stations | manpower | UPH
// - Match preview: "8/11 stations match"
// - Hover: lift + glow + expand slightly
// - Click: ripple effect → open modal
```

### Card Layout
```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   🥇                          🥈                         🥉       │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  │   ╭───────╮     │    │   ╭───────╮     │    │   ╭───────╮     │
│  │   │  91%  │     │    │   │  82%  │     │    │   │  73%  │     │
│  │   ╰───────╯     │    │   ╰───────╯     │    │   ╰───────╯     │
│  │                 │    │                 │    │                 │
│  │  XIAOMI         │    │  HUAWEI         │    │  TCL            │
│  │  5G_PRO_V2      │    │  4G_PLUS_V1     │    │  TABLET_5G      │
│  │                 │    │                 │    │                 │
│  │  📊 11 stations │    │  📊 9 stations  │    │  📊 10 stations │
│  │  👷 8 manpower  │    │  👷 7 manpower  │    │  👷 9 manpower  │
│  │  ⚡ 120 UPH     │    │  ⚡ 150 UPH     │    │  ⚡ 100 UPH     │
│  │                 │    │                 │    │                 │
│  │  [View Details] │    │  [View Details] │    │  [View Details] │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Animation Specs (Framer Motion)
```tsx
// Entrance animation
const cardVariants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.15,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94], // easeOutQuad
    },
  }),
};

// Hover animation
const hoverVariants = {
  hover: {
    y: -8,
    scale: 1.02,
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    transition: { duration: 0.2 },
  },
};

// Score ring animation
// Animate from 0 to actual percentage with countup
```

---

## 6️⃣ MODEL DETAIL MODAL (WOW EFFECT)

### Trigger
- Click on any model card
- Animated modal entrance

### Modal Sections

#### Header
```
┌─────────────────────────────────────────────────────────────────┐
│  ╭─────────────────────────────────────────────────────────────╮│
│  │  🥇  XIAOMI 5G_PRO_V2                                       ││
│  │      91% Match                          [Close X]           ││
│  ╰─────────────────────────────────────────────────────────────╯│
```

#### Comparison Table
```
┌─────────────────────────────────────────────────────────────────┐
│  STATION COMPARISON                                             │
├─────────────────────┬─────────────────┬─────────────────────────┤
│  Your Stations      │  Model Stations │  Status                 │
├─────────────────────┼─────────────────┼─────────────────────────┤
│  MBT                │  MBT            │  ✅ Match               │
│  CAL1               │  CAL1           │  ✅ Match               │
│  CAL2               │  CAL2           │  ✅ Match               │
│  RFT1               │  RFT1           │  ✅ Match               │
│  RFT2               │  RFT2           │  ✅ Match               │
│  WIFIBT             │  WIFIBT         │  ✅ Match               │
│  4G_INSTRUMENT      │  4G_INSTRUMENT  │  ✅ Match               │
│  5G_INSTRUMENT      │  5G_INSTRUMENT  │  ✅ Match               │
│  MAINBOARD_MMI      │  MAINBOARD_MMI  │  ✅ Match               │
│  SUBBOARD_MMI       │  -              │  ❌ Missing in model    │
│  PACKING            │  PACKING        │  ✅ Match               │
│  -                  │  NFC            │  ➕ Extra in model      │
│  -                  │  CAMERA         │  ➕ Extra in model      │
├─────────────────────┴─────────────────┴─────────────────────────┤
│  Summary: 9 matched, 1 missing, 2 extra                         │
└─────────────────────────────────────────────────────────────────┘
```

#### Investment Summary
```
┌─────────────────────────────────────────────────────────────────┐
│  💰 INVESTMENT SUMMARY                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  MANPOWER   │  │    UPH      │  │  CYCLE TIME │             │
│  │             │  │             │  │             │             │
│  │     12      │  │    150      │  │    240s     │             │
│  │   persons   │  │  units/hr   │  │   total     │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Estimated Monthly Cost                                     ││
│  │  ────────────────────────────────────────────────────────── ││
│  │  Labor Cost (12 × Rp 4.2M)              Rp  50,400,000     ││
│  │  Equipment Depreciation                  Rp  15,000,000     ││
│  │  Utilities & Overhead                    Rp   8,500,000     ││
│  │  ────────────────────────────────────────────────────────── ││
│  │  TOTAL                                   Rp  73,900,000     ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  [📄 Export PDF]  [📊 Export Excel]  [✅ Use This Model]       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Animation Specs
```tsx
// Modal entrance
const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 },
  },
};

// Stats counter animation
// Numbers count up from 0 to final value
// Use react-countup or custom implementation

// Comparison table rows
// Stagger entrance from top to bottom
```

---

## 7️⃣ ADDITIONAL WOW EFFECTS

### Glassmorphism
```css
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

### Gradient Accents
```css
.score-high { /* 80%+ */
  background: linear-gradient(135deg, #10b981, #059669);
}
.score-medium { /* 60-79% */
  background: linear-gradient(135deg, #f59e0b, #d97706);
}
.score-low { /* <60% */
  background: linear-gradient(135deg, #ef4444, #dc2626);
}
```

### Micro-interactions
- Button press: scale down slightly
- Input focus: glow border
- Card select: pulse effect
- Loading: skeleton shimmer
- Success: confetti burst (optional)

### Dark Mode Optimized
- All components must look great in dark mode
- Use Tailwind's dark: variants
- Subtle gradients for depth

---

## 📦 DEPENDENCIES TO ADD

```bash
npm install framer-motion react-countup @radix-ui/react-dialog
```

---

## 🔌 API CHANGES

### Update `/api/rfq/chat/route.ts`
```tsx
// Add model parameter
interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  customerId?: string;
  existingStations?: string[];
  image?: string;
  model?: string;  // NEW: Selected LLM model ID
}

// Pass model to processAgentMessage
```

### Update `lib/llm/agent-v2.ts`
```tsx
// Support dynamic model selection
export async function processAgentMessage(
  message: string,
  history: AgentMessage[],
  context?: {
    customerId?: string;
    existingStations?: string[];
    image?: string;
    model?: string;  // NEW
  }
)
```

---

## 🧪 TEST SCENARIOS

1. **New Chat Flow**
   - Click "+ New Chat" → Empty state shown
   - Type message → Response appears
   - Chat saved to history

2. **Image Upload**
   - Paste screenshot → Preview shown
   - Send → AI extracts stations
   - Table displayed inline

3. **Find Similar Models**
   - Confirm stations → Click "Find Similar"
   - 3 cards animate in
   - Hover shows lift effect

4. **Model Detail**
   - Click card → Modal opens with animation
   - Comparison table rendered
   - Numbers count up
   - Close → Modal exits smoothly

5. **Model Selection**
   - Change model in dropdown
   - Preference saved
   - Auto mode selects appropriate model

---

## ⏱️ ESTIMATED EFFORT

| Component | Time |
|-----------|------|
| Layout (Sidebar + Main) | 2-3 hours |
| Model Selector | 1-2 hours |
| Image Preview | 1-2 hours |
| Extracted Data Table | 2-3 hours |
| Model Cards | 3-4 hours |
| Model Detail Modal | 3-4 hours |
| Animations & Polish | 2-3 hours |
| Integration & Testing | 2-3 hours |
| **TOTAL** | **16-24 hours** |

---

## 📁 FILES TO CREATE/MODIFY

### New Files
```
components/rfq/chat-v2/layout/ChatLayout.tsx
components/rfq/chat-v2/layout/Sidebar.tsx
components/rfq/chat-v2/layout/ChatHistoryItem.tsx
components/rfq/chat-v2/main/ChatMain.tsx
components/rfq/chat-v2/main/MessageList.tsx
components/rfq/chat-v2/main/WelcomeScreen.tsx
components/rfq/chat-v2/input/ChatInputArea.tsx
components/rfq/chat-v2/input/ModelSelector.tsx
components/rfq/chat-v2/input/ImagePreview.tsx
components/rfq/chat-v2/results/ExtractedDataTable.tsx
components/rfq/chat-v2/results/SimilarModelCards.tsx
components/rfq/chat-v2/results/ModelCard.tsx
components/rfq/chat-v2/results/ModelDetailModal.tsx
components/rfq/chat-v2/animations/motion-variants.ts
components/rfq/chat-v2/index.tsx
lib/llm/models.ts  (model definitions)
hooks/useChatHistory.ts
hooks/useLocalStorage.ts
```

### Modified Files
```
app/rfq/new/page.tsx (use new ChatLayout)
app/api/rfq/chat/route.ts (add model param)
lib/llm/agent-v2.ts (support model selection)
```

---

## 🎨 DESIGN TOKENS

```tsx
// Use consistent design tokens
const designTokens = {
  // Spacing
  sidebar: { width: '280px', padding: '16px' },
  card: { padding: '24px', radius: '16px', gap: '16px' },
  
  // Colors (dark mode)
  surface: {
    primary: 'hsl(222.2 84% 4.9%)',
    secondary: 'hsl(217.2 32.6% 17.5%)',
    tertiary: 'hsl(215 20.2% 25.1%)',
  },
  accent: {
    primary: 'hsl(210 40% 98%)',
    success: 'hsl(142.1 76.2% 36.3%)',
    warning: 'hsl(38 92% 50%)',
    error: 'hsl(0 84.2% 60.2%)',
  },
  
  // Typography
  font: {
    heading: 'font-semibold tracking-tight',
    body: 'font-normal',
    mono: 'font-mono text-sm',
  },
  
  // Animation
  transition: {
    fast: '150ms ease',
    normal: '250ms ease',
    slow: '400ms ease',
  },
};
```

---

## ✅ ACCEPTANCE CRITERIA

- [ ] Sidebar shows chat history grouped by date
- [ ] New chat creates fresh conversation
- [ ] Model selector shows 5+ models with capabilities
- [ ] Auto mode intelligently selects model
- [ ] Image paste shows actual preview thumbnail
- [ ] Extracted stations shown in editable table
- [ ] Find Similar returns top 3 models as cards
- [ ] Cards have smooth entrance animation
- [ ] Cards lift on hover with shadow
- [ ] Click card opens detail modal
- [ ] Modal shows comparison table
- [ ] Modal shows investment summary with animated numbers
- [ ] All animations smooth (60fps)
- [ ] Dark mode looks polished
- [ ] Mobile responsive (sidebar collapsible)
- [ ] Chat history persisted in localStorage

---

## 🚀 IMPLEMENTATION ORDER

1. **Phase 7A**: Layout + Sidebar + Chat History
2. **Phase 7B**: Model Selector + API Integration  
3. **Phase 7C**: Image Preview + Paste Handler
4. **Phase 7D**: Extracted Data Table
5. **Phase 7E**: Similar Model Cards + Animations
6. **Phase 7F**: Model Detail Modal + Comparison
7. **Phase 7G**: Polish + Testing + Mobile

---

## 📝 NOTES FOR IMPLEMENTER

1. **Use Framer Motion** for all animations - it's the industry standard
2. **Keep components small** - max 200 lines per file
3. **Use TypeScript strictly** - no `any` types
4. **Test on dark mode first** - it's the default
5. **Mobile-first responsive** - sidebar becomes drawer
6. **Performance matters** - lazy load heavy components
7. **Accessibility** - keyboard navigation, ARIA labels

---

**END OF PROMPT**
