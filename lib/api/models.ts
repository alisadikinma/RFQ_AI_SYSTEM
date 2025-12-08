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
      cycle_time: number;
    };
  })[];
}

export type ModelInput = Omit<Model, 'id' | 'created_at' | 'updated_at'>;
export type ModelStationInput = Omit<ModelStation, 'id' | 'created_at'>;

export const getModels = async () => {
  const { data, error } = await supabase
    .from('models')
    .select(`
      *,
      customer:customers(code, name),
      stations:model_stations(
        *,
        machine:machines(id, code, name, typical_uph, cycle_time)
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
        machine:machines(id, code, name, description, typical_uph, cycle_time)
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
