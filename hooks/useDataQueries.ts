'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

// ============================================
// Types
// ============================================
export interface Customer {
  id: string;
  code: string;
  name: string;
  created_at: string;
}

export interface Model {
  id: string;
  code: string;
  name: string;
  status: string;
  board_types: string[];
  customer_id: string;
  customer?: Customer;
  created_at: string;
  _count?: {
    stations: number;
    manpower: number;
  };
}

export interface Station {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string;
  typical_cycle_time_sec?: number;
}

// ============================================
// Query Keys (for cache invalidation)
// ============================================
export const queryKeys = {
  customers: ['customers'] as const,
  customer: (id: string) => ['customers', id] as const,
  
  models: ['models'] as const,
  modelsList: (filters?: { customer?: string; status?: string }) => 
    ['models', 'list', filters] as const,
  model: (id: string) => ['models', id] as const,
  
  stations: ['stations'] as const,
  station: (code: string) => ['stations', code] as const,
  
  modelStations: (modelId: string) => ['models', modelId, 'stations'] as const,
};

// ============================================
// Customers Hooks
// ============================================
export function useCustomers() {
  return useQuery({
    queryKey: queryKeys.customers,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('customers')
        .select('id, code, name, created_at')
        .order('name');
      
      if (error) throw error;
      return data as Customer[];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - customers rarely change
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: queryKeys.customer(id),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as Customer;
    },
    enabled: !!id,
  });
}

// ============================================
// Models Hooks
// ============================================
interface ModelsFilters {
  customer?: string;
  status?: string;
  search?: string;
}

export function useModels(filters?: ModelsFilters) {
  return useQuery({
    queryKey: queryKeys.modelsList(filters),
    queryFn: async () => {
      const supabase = createClient();
      
      let query = supabase
        .from('models')
        .select(`
          id, code, name, status, board_types, created_at,
          customer:customers(id, code, name),
          model_stations(id, manpower)
        `)
        .order('created_at', { ascending: false });
      
      if (filters?.customer) {
        query = query.eq('customer_id', filters.customer);
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.search) {
        query = query.or(`code.ilike.%${filters.search}%,name.ilike.%${filters.search}%`);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Calculate counts
      return (data || []).map(m => ({
        ...m,
        _count: {
          stations: (m.model_stations as any[])?.length || 0,
          manpower: (m.model_stations as any[])?.reduce((sum, s) => sum + (s.manpower || 0), 0) || 0,
        },
      })) as Model[];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useModel(id: string) {
  return useQuery({
    queryKey: queryKeys.model(id),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('models')
        .select(`
          *,
          customer:customers(id, code, name),
          model_stations(
            id, board_type, sequence, manpower, cycle_time_seconds, target_uph,
            machine:station_master(id, code, name, category, description, typical_cycle_time_sec)
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

// ============================================
// Stations Hooks
// ============================================
export function useStations() {
  return useQuery({
    queryKey: queryKeys.stations,
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('station_master')
        .select('id, code, name, category, description, typical_cycle_time_sec')
        .order('category')
        .order('name');
      
      if (error) throw error;
      return data as Station[];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - stations rarely change
  });
}

export function useStation(code: string) {
  return useQuery({
    queryKey: queryKeys.station(code),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('station_master')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();
      
      if (error) throw error;
      return data as Station;
    },
    enabled: !!code,
  });
}

// ============================================
// Model Stations Hook
// ============================================
export function useModelStations(modelId: string) {
  return useQuery({
    queryKey: queryKeys.modelStations(modelId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('model_stations')
        .select(`
          id, board_type, sequence, manpower, cycle_time_seconds, target_uph,
          machine:station_master(id, code, name, category)
        `)
        .eq('model_id', modelId)
        .order('board_type')
        .order('sequence');
      
      if (error) throw error;
      return data;
    },
    enabled: !!modelId,
  });
}

// ============================================
// Prefetch Helpers (for instant navigation)
// ============================================
export function usePrefetchModel() {
  const queryClient = useQueryClient();
  
  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.model(id),
      queryFn: async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('models')
          .select(`
            *,
            customer:customers(id, code, name),
            model_stations(
              id, board_type, sequence, manpower, cycle_time_seconds, target_uph,
              machine:station_master(id, code, name, category)
            )
          `)
          .eq('id', id)
          .single();
        
        if (error) throw error;
        return data;
      },
    });
  };
}

export function usePrefetchModels() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.modelsList(),
      queryFn: async () => {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('models')
          .select(`
            id, code, name, status, board_types, created_at,
            customer:customers(id, code, name),
            model_stations(id, manpower)
          `)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        return data;
      },
    });
  };
}
