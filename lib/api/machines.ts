import { supabase } from '../supabase/client';

export interface Machine {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  typical_uph: number;
  cycle_time: number;
  operator_ratio: number;
  created_at: string;
  updated_at: string;
}

export type MachineInput = Omit<Machine, 'id' | 'created_at' | 'updated_at'>;

export const getMachines = async () => {
  const { data, error } = await supabase
    .from('machines')
    .select('*')
    .order('code', { ascending: true });

  if (error) throw error;
  return data as Machine[];
};

export const getMachineById = async (id: string) => {
  const { data, error } = await supabase
    .from('machines')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as Machine | null;
};

export const createMachine = async (machine: MachineInput) => {
  const { data, error } = await supabase
    .from('machines')
    .insert({
      ...machine,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as Machine;
};

export const updateMachine = async (id: string, machine: Partial<MachineInput>) => {
  const { data, error } = await supabase
    .from('machines')
    .update({
      ...machine,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Machine;
};

export const deleteMachine = async (id: string) => {
  const { error } = await supabase
    .from('machines')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const getMachineUsageCount = async (machineId: string) => {
  const { count, error } = await supabase
    .from('model_stations')
    .select('*', { count: 'exact', head: true })
    .eq('machine_id', machineId);

  if (error) throw error;
  return count || 0;
};
