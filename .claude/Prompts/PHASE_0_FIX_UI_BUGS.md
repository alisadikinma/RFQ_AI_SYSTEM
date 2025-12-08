# PHASE 0: Fix UI Bugs & Stabilize Existing Features

## 🎯 OBJECTIVE
Fix broken pages (Stations, Models, RFQ History) and ensure basic CRUD operations work with Supabase.

---

## 📋 CONTEXT

Project: RFQ AI System for EMS Manufacturing
Stack: Next.js 13 (App Router) + TypeScript + Supabase + shadcn/ui
Location: `D:\Projects\RFQ_AI_SYSTEM`

**IMPORTANT:** Use `station_master` table (NOT deprecated `machines` table)

---

## 🔧 TASKS

### Task 1: Fix Stations Page (`/machines` → rename to `/stations`)

**Files:**
- `app/(dashboard)/machines/page.tsx` → `app/(dashboard)/stations/page.tsx`
- `components/machines/*` → `components/stations/*`

**Database:** Uses `station_master` table

**Requirements:**
1. Load stations from `station_master` table
2. Implement Add/Edit/Delete functionality
3. Show loading skeleton while fetching
4. Handle errors with toast notifications
5. Check if station is used in `model_stations` before delete

**Expected UI:**
- Table with columns: Code, Name, Category, UPH, Cycle Time, Operator Ratio, Actions
- Filter by category (Testing, Assembly, Inspection, Programming)
- Add button opens dialog
- Edit/Delete in action column

**Station Schema:**
```typescript
interface StationMaster {
  id: string;
  code: string;
  name: string;
  description: string;
  category: 'Testing' | 'Assembly' | 'Inspection' | 'Programming';
  typical_cycle_time_sec: number;
  typical_uph: number;
  operator_ratio: number;
  triggers_if: string[];
  required_for: string[];
}
```

---

### Task 2: Fix Models Page (`/models`)

**File:** `app/(dashboard)/models/page.tsx`

**Issues:**
- ModelCard component may have issues
- Station relationship not loading properly

**Requirements:**
1. Load models with customer & stations relations from Supabase
2. Each ModelCard shows: Customer, Code, Status, Board Types, Station Count
3. Click card → navigate to `/models/[id]`
4. Add Model → `/models/new` with full wizard

**Relations:**
```sql
models → model_stations → station_master (via machine_id)
models → customers (via customer_id)
```

**Model Detail Page (`/models/[id]`):**
- Show model info + station list per board type
- Station list uses `station_master` join
- Edit/Delete model
- Station management (add/remove/reorder)

---

### Task 3: Fix RFQ History Page (`/rfq`)

**File:** `app/(dashboard)/rfq/page.tsx`

**Requirements:**
1. List all RFQ requests with status badges
2. Click row → navigate to results if completed
3. Filter by status, customer, date range

**RFQ Display Columns:**
- Model Name
- Customer
- Status (draft, processing, completed, failed)
- Target UPH
- Target Volume
- Created At
- Actions (View Results, Delete)

---

### Task 4: Create/Update API Functions

**File:** `lib/api/rfq.ts`

```typescript
import { supabase } from '@/lib/supabase/client';

export interface RFQInput {
  customer_id: string;
  model_name: string;
  reference_model_id?: string;
  target_uph?: number;
  target_volume?: number;
  input_method?: 'manual' | 'excel' | 'pdf';
  pcb_features?: any;
  bom_summary?: any;
}

export interface StationInput {
  board_type: string;
  station_code: string;
  sequence: number;
  manpower?: number;
}

export const createRFQ = async (data: RFQInput) => {
  const { data: rfq, error } = await supabase
    .from('rfq_requests')
    .insert(data)
    .select()
    .single();
  
  if (error) throw error;
  return rfq;
};

export const getRFQs = async () => {
  const { data, error } = await supabase
    .from('rfq_requests')
    .select(`
      *,
      customer:customers(code, name),
      reference_model:models(code, name)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const getRFQById = async (id: string) => {
  const { data, error } = await supabase
    .from('rfq_requests')
    .select(`
      *,
      customer:customers(code, name),
      stations:rfq_stations(*),
      results:rfq_results(
        *,
        matched_model:models(code, name, customer:customers(code))
      )
    `)
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
};

export const updateRFQStatus = async (id: string, status: string) => {
  const { error } = await supabase
    .from('rfq_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  
  if (error) throw error;
};

export const deleteRFQ = async (id: string) => {
  const { error } = await supabase
    .from('rfq_requests')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const saveRFQStations = async (rfqId: string, stations: StationInput[]) => {
  // Delete existing stations first
  await supabase
    .from('rfq_stations')
    .delete()
    .eq('rfq_id', rfqId);
  
  // Insert new stations
  const stationsData = stations.map((s, idx) => ({
    rfq_id: rfqId,
    board_type: s.board_type,
    station_code: s.station_code,
    sequence: s.sequence || idx + 1,
    manpower: s.manpower || 1,
  }));

  const { error } = await supabase
    .from('rfq_stations')
    .insert(stationsData);
  
  if (error) throw error;
};
```

**File:** `lib/api/stations.ts` (NEW)

```typescript
import { supabase } from '@/lib/supabase/client';

export interface StationMasterInput {
  code: string;
  name: string;
  description?: string;
  category: 'Testing' | 'Assembly' | 'Inspection' | 'Programming';
  typical_cycle_time_sec?: number;
  typical_uph?: number;
  operator_ratio?: number;
  triggers_if?: string[];
  required_for?: string[];
}

export const getStations = async () => {
  const { data, error } = await supabase
    .from('station_master')
    .select('*')
    .order('category')
    .order('code');
  
  if (error) throw error;
  return data;
};

export const getStationByCode = async (code: string) => {
  const { data, error } = await supabase
    .from('station_master')
    .select('*')
    .eq('code', code)
    .single();
  
  if (error) throw error;
  return data;
};

export const createStation = async (data: StationMasterInput) => {
  const { data: station, error } = await supabase
    .from('station_master')
    .insert(data)
    .select()
    .single();
  
  if (error) throw error;
  return station;
};

export const updateStation = async (id: string, data: Partial<StationMasterInput>) => {
  const { data: station, error } = await supabase
    .from('station_master')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return station;
};

export const deleteStation = async (id: string) => {
  // Check if used in model_stations
  const { count } = await supabase
    .from('model_stations')
    .select('*', { count: 'exact', head: true })
    .eq('machine_id', id);
  
  if (count && count > 0) {
    throw new Error(`Station is used in ${count} model(s). Cannot delete.`);
  }
  
  const { error } = await supabase
    .from('station_master')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const getStationAliases = async (stationId: string) => {
  const { data, error } = await supabase
    .from('station_aliases')
    .select(`
      *,
      customer:customers(code, name)
    `)
    .eq('master_station_id', stationId);
  
  if (error) throw error;
  return data;
};
```

---

### Task 5: Navigation Update

Update sidebar to use correct routes:

```typescript
// components/layout/Sidebar.tsx or similar
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/rfq', label: 'RFQ', icon: FileText },
  { href: '/rfq/new', label: 'New RFQ', icon: Plus },
  { href: '/models', label: 'Models', icon: Box },
  { href: '/stations', label: 'Stations', icon: Cpu },  // Changed from /machines
  { href: '/customers', label: 'Customers', icon: Users },
];
```

---

## ✅ ACCEPTANCE CRITERIA

- [ ] Stations page loads without errors (uses `station_master`)
- [ ] Can add/edit/delete stations
- [ ] Models page shows cards with correct data
- [ ] Model detail page shows stations grouped by board type
- [ ] RFQ History page lists all requests
- [ ] New RFQ wizard saves to database
- [ ] All CRUD operations show success/error toasts
- [ ] Loading states work correctly
- [ ] No TypeScript errors
- [ ] `npm run build` passes

---

## 🚀 HOW TO START

```bash
cd D:\Projects\RFQ_AI_SYSTEM
npm install
npm run dev
```

1. Fix Stations page first (rename from machines)
2. Fix Models page with station_master join
3. Fix RFQ History page
4. Create API functions
5. Test CRUD operations
6. Run `npm run build` to check for errors

---

## 📁 FILES TO MODIFY/CREATE

```
app/(dashboard)/stations/page.tsx      # Rename from machines
app/(dashboard)/models/page.tsx        # Fix
app/(dashboard)/models/[id]/page.tsx   # Fix
app/(dashboard)/models/new/page.tsx    # Fix
app/(dashboard)/rfq/page.tsx           # Fix
components/stations/StationDialog.tsx  # Rename from machines
components/stations/StationTable.tsx   # Rename from machines
components/models/ModelCard.tsx        # Fix
lib/api/rfq.ts                         # Create/Update
lib/api/stations.ts                    # Create
```
