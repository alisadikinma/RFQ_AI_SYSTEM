/**
 * React Query Hooks for Data Fetching with Caching
 * 
 * Benefits:
 * - Data di-cache selama 5 menit (staleTime)
 * - Navigasi antar menu = instant (pakai cache)
 * - Background refetch jika data stale
 * - Deduplication (1 request meskipun banyak komponen butuh data sama)
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabase/client';

// ============================================
// QUERY KEYS - Centralized for easy invalidation
// ============================================
export const queryKeys = {
  // Customers
  customers: ['customers'] as const,
  customer: (id: string) => ['customers', id] as const,
  customerOptions: ['customers', 'options'] as const,
  
  // Models
  models: ['models'] as const,
  modelsList: (params: { page: number; search?: string; customer?: string; status?: string }) => 
    ['models', 'list', params] as const,
  model: (id: string) => ['models', id] as const,
  modelStations: (id: string) => ['models', id, 'stations'] as const,
  
  // Stations/Machines
  stations: ['stations'] as const,
  station: (code: string) => ['stations', code] as const,
  stationAliases: ['stations', 'aliases'] as const,
  
  // Dashboard stats
  dashboardStats: ['dashboard', 'stats'] as const,
};

// ============================================
// CUSTOMER HOOKS
// ============================================
export function useCustomers() {
  return useQuery({
    queryKey: queryKeys.customers,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('code');
      
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - customers rarely change
  });
}

export function useCustomerOptions() {
  return useQuery({
    queryKey: queryKeys.customerOptions,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, code, name')
        .order('code');
      
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============================================
// MODELS HOOKS
// ============================================
interface ModelsListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  customer?: string;
  status?: string;
}

export function useModelsList(params: ModelsListParams = {}) {
  const { page = 1, pageSize = 18, search, customer, status } = params;
  
  return useQuery({
    queryKey: queryKeys.modelsList({ page, search, customer, status }),
    queryFn: async () => {
      let query = supabase
        .from('models')
        .select(`
          id, code, name, status, board_types, created_at,
          customer:customers(id, code, name),
          model_stations(id)
        `, { count: 'exact' });
      
      if (search) {
        query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`);
      }
      
      if (customer && customer !== 'All') {
        query = query.eq('customer_id', customer);
      }
      
      if (status && status !== 'All') {
        query = query.eq('status', status);
      }
      
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query = query.order('created_at', { ascending: false }).range(from, to);
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return {
        data: data?.map(m => ({
          ...m,
          stationCount: (m.model_stations as any[])?.length || 0,
        })) || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for lists
  });
}

export function useModel(id: string) {
  return useQuery({
    queryKey: queryKeys.model(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('models')
        .select(`
          *,
          customer:customers(id, code, name)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useModelStations(modelId: string) {
  return useQuery({
    queryKey: queryKeys.modelStations(modelId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('model_stations')
        .select(`
          id, board_type, sequence, manpower, cycle_time, notes,
          machine:station_master(id, code, name, category)
        `)
        .eq('model_id', modelId)
        .order('board_type')
        .order('sequence');
      
      if (error) throw error;
      return data;
    },
    enabled: !!modelId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================
// STATIONS HOOKS
// ============================================
export function useStations() {
  return useQuery({
    queryKey: queryKeys.stations,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('station_master')
        .select('*')
        .order('category')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - stations rarely change
  });
}

export function useStationsPaginated(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
} = {}) {
  const { page = 1, pageSize = 15, search, category } = params;
  
  return useQuery({
    queryKey: ['stations', 'paginated', { page, search, category }],
    queryFn: async () => {
      let query = supabase
        .from('station_master')
        .select('*', { count: 'exact' });
      
      if (search) {
        query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`);
      }
      
      if (category && category !== 'All') {
        query = query.eq('category', category);
      }
      
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      query = query.order('category').order('name').range(from, to);
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return {
        data: data || [],
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useStationCategories() {
  return useQuery({
    queryKey: ['stations', 'categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('station_master')
        .select('category')
        .order('category');
      
      if (error) throw error;
      
      // Get unique categories
      const categories = [...new Set(data?.map(d => d.category).filter(Boolean))];
      return categories as string[];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useStation(code: string) {
  return useQuery({
    queryKey: queryKeys.station(code),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('station_master')
        .select('*')
        .eq('code', code.toUpperCase())
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!code,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

// ============================================
// DASHBOARD STATS HOOK
// ============================================
export function useDashboardStats() {
  return useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: async () => {
      // Parallel queries for dashboard stats
      const [
        { count: totalModels },
        { count: totalCustomers },
        { count: totalStations },
        { count: totalModelStations },
      ] = await Promise.all([
        supabase.from('models').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('customers').select('*', { count: 'exact', head: true }),
        supabase.from('station_master').select('*', { count: 'exact', head: true }),
        supabase.from('model_stations').select('*', { count: 'exact', head: true }),
      ]);
      
      return {
        totalModels: totalModels || 0,
        totalCustomers: totalCustomers || 0,
        totalStations: totalStations || 0,
        totalModelStations: totalModelStations || 0,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Full dashboard data with all sections
export function useDashboardData() {
  return useQuery({
    queryKey: ['dashboard', 'full'],
    queryFn: async () => {
      // Import the existing function to avoid duplication
      const { getDashboardData } = await import('@/lib/api/dashboard');
      return getDashboardData();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============================================
// CACHE INVALIDATION HELPERS
// ============================================
export function useInvalidateModels() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.models });
  };
}

export function useInvalidateCustomers() {
  const queryClient = useQueryClient();
  
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.customers });
  };
}

// ============================================
// PREFETCH HELPERS - Preload data on hover
// ============================================
export function usePrefetchModel() {
  const queryClient = useQueryClient();
  
  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.model(id),
      queryFn: async () => {
        const { data, error } = await supabase
          .from('models')
          .select(`*, customer:customers(id, code, name)`)
          .eq('id', id)
          .single();
        
        if (error) throw error;
        return data;
      },
      staleTime: 5 * 60 * 1000,
    });
  };
}
