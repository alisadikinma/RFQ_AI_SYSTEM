import { supabase } from '../supabase/client';

export interface Model {
  id: string;
  customer_id: string;
  code: string;
  name: string;
  status: 'active' | 'inactive';
  board_types: string[];
  created_at: string;
  updated_at: string;
}

export interface ModelStation {
  id: string;
  model_id: string;
  board_type: string;
  machine_id: string;
  sequence: number;
  manpower: number;
  created_at: string;
}

export interface ModelWithDetails extends Model {
  customer: {
    code: string;
    name: string;
  };
  stations: (ModelStation & {
    machine: {
      id: string;
      code: string;
      name: string;
      description?: string;
      typical_uph: number;
      typical_cycle_time_sec: number;
    };
  })[];
}

// Lightweight model for list view (no stations detail)
export interface ModelListItem extends Model {
  customer: {
    code: string;
    name: string;
  };
  station_count: number;
  total_manpower: number;
  min_uph: number;
}

export type ModelInput = Omit<Model, 'id' | 'created_at' | 'updated_at'>;
export type ModelStationInput = Omit<ModelStation, 'id' | 'created_at'>;

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// New: Lightweight paginated list (FAST - recommended for list view)
export const getModelsList = async (
  page: number = 1,
  pageSize: number = 20,
  filters?: {
    search?: string;
    customer?: string;
    status?: string;
  }
): Promise<PaginatedResult<ModelListItem>> => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('models')
    .select(`
      *,
      customer:customers(code, name)
    `, { count: 'exact' });

  // Apply filters
  if (filters?.search) {
    query = query.or(`code.ilike.%${filters.search}%,name.ilike.%${filters.search}%`);
  }
  if (filters?.customer && filters.customer !== 'All') {
    query = query.eq('customer_id', filters.customer);
  }
  if (filters?.status && filters.status !== 'All') {
    query = query.eq('status', filters.status);
  }

  const { data, error, count } = await query
    .order('code', { ascending: true })
    .range(from, to);

  if (error) throw error;

  // Get station aggregates in a single query
  const modelIds = data?.map(m => m.id) || [];
  
  if (modelIds.length === 0) {
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }

  // Get stations with machine data for aggregation
  const { data: stationsData } = await supabase
    .from('model_stations')
    .select(`
      model_id,
      manpower,
      machine:station_master(typical_uph)
    `)
    .in('model_id', modelIds);

  // Aggregate per model
  const aggregates = new Map<string, { count: number; manpower: number; minUph: number }>();
  
  stationsData?.forEach(s => {
    const existing = aggregates.get(s.model_id) || { count: 0, manpower: 0, minUph: Infinity };
    const machineUph = (s.machine as any)?.typical_uph || Infinity;
    
    aggregates.set(s.model_id, {
      count: existing.count + 1,
      manpower: existing.manpower + (s.manpower || 0),
      minUph: Math.min(existing.minUph, machineUph),
    });
  });

  const models = (data || []).map(m => {
    const agg = aggregates.get(m.id) || { count: 0, manpower: 0, minUph: 0 };
    return {
      ...m,
      station_count: agg.count,
      total_manpower: agg.manpower,
      min_uph: agg.minUph === Infinity ? 0 : agg.minUph,
    };
  }) as ModelListItem[];

  return {
    data: models,
    total: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
};

// Original: Full details with stations (use only for single model view)
export const getModels = async () => {
  const { data, error } = await supabase
    .from('models')
    .select(`
      *,
      customer:customers(code, name),
      stations:model_stations(
        *,
        machine:station_master(id, code, name, typical_uph, typical_cycle_time_sec)
      )
    `)
    .order('code', { ascending: true });

  if (error) throw error;
  return data as unknown as ModelWithDetails[];
};

export const getModelById = async (id: string) => {
  const { data, error } = await supabase
    .from('models')
    .select(`
      *,
      customer:customers(code, name),
      stations:model_stations(
        *,
        machine:station_master(id, code, name, description, typical_uph, typical_cycle_time_sec)
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as ModelWithDetails | null;
};

export const createModel = async (model: ModelInput, stations: ModelStationInput[]) => {
  const { data: modelData, error: modelError } = await supabase
    .from('models')
    .insert({
      ...model,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (modelError) throw modelError;

  if (stations.length > 0) {
    const stationsWithModelId = stations.map(station => ({
      ...station,
      model_id: modelData.id,
    }));

    const { error: stationsError } = await supabase
      .from('model_stations')
      .insert(stationsWithModelId);

    if (stationsError) throw stationsError;
  }

  return modelData as Model;
};

export const updateModel = async (
  id: string,
  model: Partial<ModelInput>,
  stations?: ModelStationInput[]
) => {
  const { data, error } = await supabase
    .from('models')
    .update({
      ...model,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  if (stations) {
    await supabase
      .from('model_stations')
      .delete()
      .eq('model_id', id);

    if (stations.length > 0) {
      const stationsWithModelId = stations.map(station => ({
        ...station,
        model_id: id,
      }));

      const { error: stationsError } = await supabase
        .from('model_stations')
        .insert(stationsWithModelId);

      if (stationsError) throw stationsError;
    }
  }

  return data as Model;
};

export const deleteModel = async (id: string) => {
  const { error } = await supabase
    .from('models')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Get unique customers for filter dropdown
export const getCustomerOptions = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('id, code, name')
    .order('code');
  
  if (error) throw error;
  return data;
};
