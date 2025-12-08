import { supabase } from '../supabase/client';

export interface Customer {
  id: string;
  code: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export type CustomerInput = Omit<Customer, 'id' | 'created_at' | 'updated_at'>;

export const getCustomers = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('code', { ascending: true });

  if (error) throw error;
  return data as Customer[];
};

export const getCustomerById = async (id: string) => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data as Customer | null;
};

export const createCustomer = async (customer: CustomerInput) => {
  const { data, error } = await supabase
    .from('customers')
    .insert({
      ...customer,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data as Customer;
};
