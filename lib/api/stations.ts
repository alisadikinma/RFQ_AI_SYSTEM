import { supabase } from '../supabase/client';

// Station Master interface (matches station_master table)
export interface StationMaster {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: 'Testing' | 'Assembly' | 'Inspection' | 'Programming';
  typical_cycle_time_sec: number;
  typical_uph: number;
  operator_ratio: number;
  triggers_if: string[];
  required_for: string[];
  created_at: string;
  updated_at?: string;
}

export type StationMasterInput = Omit<StationMaster, 'id' | 'created_at' | 'updated_at'>;

// Alias for backward compatibility (deprecated - use StationMaster)
export type Machine = StationMaster;
export type MachineInput = StationMasterInput;

/**
 * Get all stations from station_master table
 */
export const getStations = async () => {
  const { data, error } = await supabase
    .from('station_master')
    .select('*')
    .order('category', { ascending: true })
    .order('code', { ascending: true });

  if (error) throw error;
  return data as StationMaster[];
};

// Alias for backward compatibility
export const getMachines = getStations;

/**
 * Get single station by ID
 */
export const getStationById = async (id: string) => {
  const { data, error } = await supabase
    .from('station_master')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as StationMaster | null;
};

// Alias for backward compatibility
export const getMachineById = getStationById;

/**
 * Get station by code
 */
export const getStationByCode = async (code: string) => {
  const { data, error } = await supabase
    .from('station_master')
    .select('*')
    .eq('code', code.toUpperCase())
    .maybeSingle();

  if (error) throw error;
  return data as StationMaster | null;
};

/**
 * Create new station
 */
export const createStation = async (station: StationMasterInput) => {
  const { data, error } = await supabase
    .from('station_master')
    .insert({
      ...station,
      code: station.code.toUpperCase(),
      triggers_if: station.triggers_if || [],
      required_for: station.required_for || [],
    })
    .select()
    .single();

  if (error) throw error;
  return data as StationMaster;
};

// Alias for backward compatibility
export const createMachine = createStation;

/**
 * Update station
 */
export const updateStation = async (id: string, station: Partial<StationMasterInput>) => {
  const updateData: any = { ...station };
  if (station.code) {
    updateData.code = station.code.toUpperCase();
  }

  const { data, error } = await supabase
    .from('station_master')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as StationMaster;
};

// Alias for backward compatibility
export const updateMachine = updateStation;

/**
 * Delete station (checks if used in model_stations first)
 */
export const deleteStation = async (id: string) => {
  // Check if station is used
  const usageCount = await getStationUsageCount(id);
  if (usageCount > 0) {
    throw new Error(`Cannot delete: Station is used in ${usageCount} model(s)`);
  }

  const { error } = await supabase
    .from('station_master')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Alias for backward compatibility
export const deleteMachine = deleteStation;

/**
 * Get count of models using this station
 */
export const getStationUsageCount = async (stationId: string) => {
  const { count, error } = await supabase
    .from('model_stations')
    .select('*', { count: 'exact', head: true })
    .eq('machine_id', stationId);

  if (error) throw error;
  return count || 0;
};

// Alias for backward compatibility
export const getMachineUsageCount = getStationUsageCount;

/**
 * Get all aliases for a station
 */
export const getStationAliases = async (stationId: string) => {
  const { data, error } = await supabase
    .from('station_aliases')
    .select(`
      *,
      customer:customers(code, name)
    `)
    .eq('master_station_id', stationId)
    .order('alias_name');

  if (error) throw error;
  return data;
};

/**
 * Get stations by category
 */
export const getStationsByCategory = async (category: string) => {
  const { data, error } = await supabase
    .from('station_master')
    .select('*')
    .eq('category', category)
    .order('code');

  if (error) throw error;
  return data as StationMaster[];
};

/**
 * Get stations that match trigger conditions
 */
export const getStationsByTrigger = async (trigger: string) => {
  const { data, error } = await supabase
    .from('station_master')
    .select('*')
    .contains('triggers_if', [trigger]);

  if (error) throw error;
  return data as StationMaster[];
};
