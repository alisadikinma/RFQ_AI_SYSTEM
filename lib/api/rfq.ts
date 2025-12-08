import { supabase } from '../supabase/client';

export interface RFQRequest {
  id: string;
  customer_id: string | null;
  model_name: string;
  reference_model_id: string | null;
  target_uph: number | null;
  target_volume: number | null;
  notes: string | null;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  input_method: 'manual' | 'upload' | 'copy' | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface RFQStation {
  id: string;
  rfq_id: string;
  board_type: string;
  station_code: string;
  sequence: number;
  created_at: string;
}

export interface RFQResult {
  id: string;
  rfq_id: string;
  matched_model_id: string | null;
  similarity_score: number | null;
  matched_stations: unknown[];
  missing_stations: unknown[];
  investment_breakdown: Record<string, unknown>;
  manpower_estimate: Record<string, unknown>;
  risk_assessment: Record<string, unknown>;
  created_at: string;
}

export interface RFQWithDetails extends RFQRequest {
  customer: {
    id: string;
    code: string;
    name: string;
  } | null;
  reference_model: {
    id: string;
    code: string;
    name: string;
  } | null;
  stations: RFQStation[];
  results: (RFQResult & {
    matched_model: {
      id: string;
      code: string;
      name: string;
      customer: {
        code: string;
        name: string;
      } | null;
    } | null;
  })[];
}

export type RFQInput = Omit<RFQRequest, 'id' | 'created_at' | 'updated_at' | 'completed_at'>;
export type RFQStationInput = Omit<RFQStation, 'id' | 'rfq_id' | 'created_at'>;
export type RFQResultInput = Omit<RFQResult, 'id' | 'rfq_id' | 'created_at'>;

export const getRFQs = async () => {
  const { data, error } = await supabase
    .from('rfq_requests')
    .select(`
      *,
      customer:customers(id, code, name)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as unknown as (RFQRequest & { customer: { id: string; code: string; name: string } | null })[];
};

export const getRFQById = async (id: string) => {
  const { data, error } = await supabase
    .from('rfq_requests')
    .select(`
      *,
      customer:customers(id, code, name),
      reference_model:models!rfq_requests_reference_model_id_fkey(id, code, name),
      stations:rfq_stations(*),
      results:rfq_results(
        *,
        matched_model:models!rfq_results_matched_model_id_fkey(
          id, code, name,
          customer:customers(code, name)
        )
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as unknown as RFQWithDetails | null;
};

export const createRFQ = async (rfq: RFQInput) => {
  const { data, error } = await supabase
    .from('rfq_requests')
    .insert({
      ...rfq,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as RFQRequest;
};

export const updateRFQ = async (id: string, rfq: Partial<RFQInput>) => {
  const { data, error } = await supabase
    .from('rfq_requests')
    .update({
      ...rfq,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as RFQRequest;
};

export const updateRFQStatus = async (
  id: string,
  status: RFQRequest['status'],
  completedAt?: string | null
) => {
  const updateData: Partial<RFQRequest> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'completed') {
    updateData.completed_at = completedAt || new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('rfq_requests')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as RFQRequest;
};

export const deleteRFQ = async (id: string) => {
  const { error } = await supabase
    .from('rfq_requests')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const saveRFQStations = async (rfqId: string, stations: RFQStationInput[]) => {
  // Delete existing stations first
  await supabase
    .from('rfq_stations')
    .delete()
    .eq('rfq_id', rfqId);

  if (stations.length === 0) return [];

  const stationsWithRfqId = stations.map(station => ({
    ...station,
    rfq_id: rfqId,
  }));

  const { data, error } = await supabase
    .from('rfq_stations')
    .insert(stationsWithRfqId)
    .select();

  if (error) throw error;
  return data as RFQStation[];
};

export const getRFQStations = async (rfqId: string) => {
  const { data, error } = await supabase
    .from('rfq_stations')
    .select('*')
    .eq('rfq_id', rfqId)
    .order('board_type')
    .order('sequence');

  if (error) throw error;
  return data as RFQStation[];
};

export const saveRFQResults = async (rfqId: string, results: RFQResultInput[]) => {
  // Delete existing results first
  await supabase
    .from('rfq_results')
    .delete()
    .eq('rfq_id', rfqId);

  if (results.length === 0) return [];

  const resultsWithRfqId = results.map(result => ({
    ...result,
    rfq_id: rfqId,
  }));

  const { data, error } = await supabase
    .from('rfq_results')
    .insert(resultsWithRfqId)
    .select();

  if (error) throw error;
  return data as RFQResult[];
};

export const getRFQResults = async (rfqId: string) => {
  const { data, error } = await supabase
    .from('rfq_results')
    .select(`
      *,
      matched_model:models!rfq_results_matched_model_id_fkey(
        id, code, name,
        customer:customers(code, name)
      )
    `)
    .eq('rfq_id', rfqId)
    .order('similarity_score', { ascending: false });

  if (error) throw error;
  return data as unknown as (RFQResult & {
    matched_model: {
      id: string;
      code: string;
      name: string;
      customer: {
        code: string;
        name: string;
      } | null;
    } | null;
  })[];
};

export const getTopMatchForRFQ = async (rfqId: string) => {
  const { data, error } = await supabase
    .from('rfq_results')
    .select('similarity_score')
    .eq('rfq_id', rfqId)
    .order('similarity_score', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.similarity_score || null;
};
