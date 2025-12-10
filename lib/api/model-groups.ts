// lib/api/model-groups.ts
// API functions for model groups (parent-child relationship)

import { createClient } from '@/lib/supabase/client';

// ============================================================================
// Types
// ============================================================================

export interface BoardVariant {
  id: string;
  code: string;
  name: string;
  boardType: string;
  emmcSize: string | null;
  ramSize: string | null;
  investment: number;
  stationCount: number;
  totalManpower: number;
  uph: number | null;
  displayOrder: number;
}

export interface ModelGroup {
  id: string;
  typeModel: string;
  name: string | null;
  description: string | null;
  status: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  totalBoards: number;
  totalStations: number;
  totalManpower: number;
  totalInvestment: number;
  createdAt: string;
  updatedAt: string;
  boards: BoardVariant[];
}

export interface ModelGroupListItem {
  id: string;
  typeModel: string;
  name: string | null;
  status: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  totalBoards: number;
  totalStations: number;
  totalManpower: number;
  totalInvestment: number;
  boardTypes: string[];  // List of board type names for badges
}

export interface PaginatedModelGroups {
  data: ModelGroupListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get paginated list of model groups
 */
export async function getModelGroupsList(
  page: number = 1,
  pageSize: number = 18,
  filters?: {
    search?: string;
    customer?: string;
    status?: string;
  }
): Promise<PaginatedModelGroups> {
  const supabase = createClient();
  
  // Calculate offset
  const offset = (page - 1) * pageSize;
  
  // Build query
  let query = supabase
    .from('model_groups')
    .select(`
      id,
      type_model,
      name,
      status,
      customer_id,
      total_boards,
      total_stations,
      total_manpower,
      total_investment,
      customers!inner (
        code,
        name
      ),
      models (
        board_type
      )
    `, { count: 'exact' })
    .eq('status', 'active');

  // Apply filters
  if (filters?.search) {
    query = query.or(`type_model.ilike.%${filters.search}%,name.ilike.%${filters.search}%`);
  }
  
  if (filters?.customer) {
    query = query.eq('customer_id', filters.customer);
  }
  
  if (filters?.status && filters.status !== 'All') {
    query = query.eq('status', filters.status);
  }

  // Apply pagination and ordering
  const { data, error, count } = await query
    .order('type_model', { ascending: true })
    .range(offset, offset + pageSize - 1);

  if (error) {
    console.error('Error fetching model groups:', error);
    throw new Error(error.message);
  }

  // Transform data
  const groups: ModelGroupListItem[] = (data || []).map((group: any) => ({
    id: group.id,
    typeModel: group.type_model,
    name: group.name,
    status: group.status,
    customerId: group.customer_id,
    customerCode: group.customers?.code || '',
    customerName: group.customers?.name || '',
    totalBoards: group.total_boards || 0,
    totalStations: group.total_stations || 0,
    totalManpower: group.total_manpower || 0,
    totalInvestment: group.total_investment || 0,
    boardTypes: Array.from(new Set((group.models || []).map((m: any) => m.board_type).filter(Boolean))),
  }));

  const total = count || 0;
  
  return {
    data: groups,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Get single model group with all board variants
 */
export async function getModelGroupById(id: string): Promise<ModelGroup | null> {
  const supabase = createClient();
  
  // Get model group
  const { data: group, error: groupError } = await supabase
    .from('model_groups')
    .select(`
      id,
      type_model,
      name,
      description,
      status,
      customer_id,
      total_boards,
      total_stations,
      total_manpower,
      total_investment,
      created_at,
      updated_at,
      customers (
        code,
        name
      )
    `)
    .eq('id', id)
    .single();

  if (groupError || !group) {
    console.error('Error fetching model group:', groupError);
    return null;
  }

  // Get board variants (models)
  const { data: boards, error: boardsError } = await supabase
    .from('models')
    .select(`
      id,
      code,
      name,
      board_type,
      emmc_size,
      ram_size,
      investment,
      uph,
      display_order
    `)
    .eq('group_id', id)
    .order('display_order', { ascending: true });

  if (boardsError) {
    console.error('Error fetching boards:', boardsError);
  }

  // Get station counts for each board
  const boardsWithCounts = await Promise.all(
    (boards || []).map(async (board: any) => {
      const { count: stationCount } = await supabase
        .from('model_stations')
        .select('*', { count: 'exact', head: true })
        .eq('model_id', board.id);

      const { data: mpData } = await supabase
        .from('model_stations')
        .select('manpower')
        .eq('model_id', board.id);

      const totalManpower = (mpData || []).reduce((sum: number, s: any) => sum + (s.manpower || 0), 0);

      return {
        id: board.id,
        code: board.code,
        name: board.name,
        boardType: board.board_type || 'Main Board',
        emmcSize: board.emmc_size,
        ramSize: board.ram_size,
        investment: board.investment || 0,
        stationCount: stationCount || 0,
        totalManpower,
        uph: board.uph,
        displayOrder: board.display_order || 0,
      };
    })
  );

  return {
    id: group.id,
    typeModel: group.type_model,
    name: group.name,
    description: group.description,
    status: group.status,
    customerId: group.customer_id,
    customerCode: (group.customers as any)?.code || '',
    customerName: (group.customers as any)?.name || '',
    totalBoards: group.total_boards || 0,
    totalStations: group.total_stations || 0,
    totalManpower: group.total_manpower || 0,
    totalInvestment: group.total_investment || 0,
    createdAt: group.created_at,
    updatedAt: group.updated_at,
    boards: boardsWithCounts,
  };
}

/**
 * Get stations for a specific board (model)
 */
export async function getBoardStations(boardId: string) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('model_stations')
    .select(`
      id,
      station_code,
      sequence,
      manpower,
      board_type,
      area,
      station_master:station_code (
        name,
        category,
        typical_cycle_time
      )
    `)
    .eq('model_id', boardId)
    .order('sequence', { ascending: true });

  if (error) {
    console.error('Error fetching board stations:', error);
    throw new Error(error.message);
  }

  return (data || []).map((s: any) => ({
    id: s.id,
    stationCode: s.station_code,
    stationName: s.station_master?.name || s.station_code,
    category: s.station_master?.category,
    sequence: s.sequence,
    manpower: s.manpower || 1,
    cycleTime: s.station_master?.typical_cycle_time,
    area: s.area,
  }));
}

/**
 * Format currency to IDR
 */
export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format short number (e.g., 1.2M, 500K)
 */
export function formatShortNumber(value: number): string {
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return value.toString();
}
