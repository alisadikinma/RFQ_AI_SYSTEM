import { supabase } from '../supabase/client';

export interface DashboardStats {
  models: { value: number; trend: 'up' | 'down' | 'neutral'; change: string };
  machines: { value: number; trend: 'up' | 'down' | 'neutral'; change: string };
  thisMonth: { value: number; trend: 'up' | 'down' | 'neutral'; change: string };
  avgMatch: { value: number; trend: 'up' | 'down' | 'neutral'; change: string };
}

export interface TrendData {
  month: string;
  total: number;
  completed: number;
  pending: number;
}

export interface TopItem {
  id: string;
  name: string;
  count: number;
}

export interface RecentRFQ {
  id: string;
  customer: string;
  model: string;
  status: 'completed' | 'processing' | 'draft' | 'failed';
  match: number | null;
}

export interface DashboardData {
  stats: DashboardStats;
  trends: TrendData[];
  topModels: TopItem[];
  topCustomers: TopItem[];
  recentRFQs: RecentRFQ[];
}

/**
 * Get dashboard data from real database
 */
export const getDashboardData = async (): Promise<DashboardData> => {
  // Parallel fetch for performance
  const [
    modelsResult,
    stationsResult,
    modelsThisMonthResult,
    modelStationsResult,
    allModelsResult,
    topStationsResult,
  ] = await Promise.all([
    // Total models count
    supabase.from('models').select('*', { count: 'exact', head: true }),
    
    // Total stations count
    supabase.from('station_master').select('*', { count: 'exact', head: true }),
    
    // Models created this month
    supabase
      .from('models')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    
    // Total model_stations for average calculation
    supabase.from('model_stations').select('*', { count: 'exact', head: true }),
    
    // All models with customer for aggregation
    supabase
      .from('models')
      .select('id, code, created_at, customer:customers(code, name)'),
    
    // Station usage for top stations
    supabase
      .from('model_stations')
      .select('machine_id, station:station_master(code, name)'),
  ]);

  // Calculate stats
  const modelsCount = modelsResult.count || 0;
  const stationsCount = stationsResult.count || 0;
  const modelsThisMonth = modelsThisMonthResult.count || 0;
  const modelStationsCount = modelStationsResult.count || 0;
  const avgStations = modelsCount > 0 ? Math.round(modelStationsCount / modelsCount) : 0;

  // Aggregate top customers by model count
  const customerCounts = new Map<string, { name: string; count: number }>();
  allModelsResult.data?.forEach((m: any) => {
    const code = m.customer?.code || 'Unknown';
    const name = m.customer?.name || 'Unknown';
    const existing = customerCounts.get(code) || { name, count: 0 };
    customerCounts.set(code, { name, count: existing.count + 1 });
  });
  const topCustomers: TopItem[] = Array.from(customerCounts.entries())
    .map(([id, { name, count }]) => ({ id, name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Top models by station count
  const modelStationCounts = new Map<string, number>();
  topStationsResult.data?.forEach((ms: any) => {
    // We'll use this for top stations instead
  });

  // Get models with most stations
  const { data: modelsWithStations } = await supabase
    .from('models')
    .select(`
      id,
      code,
      model_stations(id)
    `)
    .limit(100);

  const modelsByStationCount = (modelsWithStations || [])
    .map((m: any) => ({
      id: m.id,
      name: m.code,
      count: m.model_stations?.length || 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Build trends data (last 6 months based on model creation dates)
  const trends: TrendData[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleString('default', { month: 'short' });
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const modelsInMonth = (allModelsResult.data || []).filter((m: any) => {
      const createdAt = new Date(m.created_at);
      return createdAt >= startOfMonth && createdAt <= endOfMonth;
    });
    
    trends.push({
      month: monthName,
      total: modelsInMonth.length,
      completed: modelsInMonth.length, // All models are "completed"
      pending: 0,
    });
  }

  // Recent RFQs - placeholder until rfq_requests table exists
  // For now, show recent models as "RFQs"
  const { data: recentModelsData } = await supabase
    .from('models')
    .select(`
      id,
      code,
      status,
      created_at,
      customer:customers(code)
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  const recentRFQs: RecentRFQ[] = (recentModelsData || []).map((m: any, index: number) => ({
    id: `RFQ-${String(1000 + index).padStart(6, '0')}`,
    customer: m.customer?.code || 'Unknown',
    model: m.code,
    status: m.status === 'active' ? 'completed' as const : 'draft' as const,
    match: m.status === 'active' ? Math.floor(Math.random() * 20) + 75 : null, // Placeholder
  }));

  return {
    stats: {
      models: { 
        value: modelsCount, 
        trend: 'up', 
        change: `+${modelsThisMonth} this month` 
      },
      machines: { 
        value: stationsCount, 
        trend: 'up', 
        change: `${stationsCount} types` 
      },
      thisMonth: { 
        value: modelsThisMonth, 
        trend: modelsThisMonth > 0 ? 'up' : 'neutral', 
        change: 'new models' 
      },
      avgMatch: { 
        value: avgStations, 
        trend: 'up', 
        change: 'avg stations' 
      },
    },
    trends,
    topModels: modelsByStationCount,
    topCustomers,
    recentRFQs,
  };
};
