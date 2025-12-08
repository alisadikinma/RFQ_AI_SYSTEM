/**
 * Database Query Helpers for Similarity Engine
 * Handles station_master and station_aliases lookups
 */

import { supabase } from '@/lib/supabase/client';
import type { StationMaster, StationAlias, FeatureTriggers } from './types';

/**
 * Get all master stations
 */
export async function getMasterStations(): Promise<StationMaster[]> {
  const { data, error } = await supabase
    .from('station_master')
    .select('*')
    .order('category', { ascending: true });

  if (error) throw error;
  return (data || []) as StationMaster[];
}

/**
 * Get a single master station by code
 */
export async function getMasterStationByCode(code: string): Promise<StationMaster | null> {
  const { data, error } = await supabase
    .from('station_master')
    .select('*')
    .eq('code', code.toUpperCase())
    .maybeSingle();

  if (error) throw error;
  return data as StationMaster | null;
}

/**
 * Resolve customer station name to master station using aliases
 * Checks customer-specific aliases first, then global aliases
 */
export async function resolveStationAlias(
  customerTerm: string,
  customerId?: string
): Promise<StationAlias | null> {
  // 1. Try customer-specific alias first (exact match)
  if (customerId) {
    const { data: customerAlias } = await supabase
      .from('station_aliases')
      .select(`
        *,
        master:station_master(*)
      `)
      .eq('alias_name', customerTerm)
      .eq('customer_id', customerId)
      .maybeSingle();

    if (customerAlias) return customerAlias as unknown as StationAlias;
  }

  // 2. Try global alias (customer_id is null) - exact match
  const { data: globalAlias } = await supabase
    .from('station_aliases')
    .select(`
      *,
      master:station_master(*)
    `)
    .eq('alias_name', customerTerm)
    .is('customer_id', null)
    .maybeSingle();

  if (globalAlias) return globalAlias as unknown as StationAlias;

  // 3. Try case-insensitive exact match
  const { data: caseInsensitiveAlias } = await supabase
    .from('station_aliases')
    .select(`
      *,
      master:station_master(*)
    `)
    .ilike('alias_name', customerTerm)
    .limit(1)
    .maybeSingle();

  if (caseInsensitiveAlias) return caseInsensitiveAlias as unknown as StationAlias;

  // 4. Try partial match (contains)
  const { data: partialMatch } = await supabase
    .from('station_aliases')
    .select(`
      *,
      master:station_master(*)
    `)
    .ilike('alias_name', `%${customerTerm}%`)
    .limit(1)
    .maybeSingle();

  return partialMatch as unknown as StationAlias | null;
}

/**
 * Batch resolve multiple station names efficiently
 */
export async function resolveStationAliases(
  terms: string[],
  customerId?: string
): Promise<Map<string, StationAlias>> {
  const result = new Map<string, StationAlias>();

  if (terms.length === 0) return result;

  // Fetch all aliases for this customer + global in one query
  let query = supabase
    .from('station_aliases')
    .select(`
      *,
      master:station_master(*)
    `);

  if (customerId) {
    query = query.or(`customer_id.eq.${customerId},customer_id.is.null`);
  } else {
    query = query.is('customer_id', null);
  }

  const { data: aliases, error } = await query;

  if (error || !aliases) return result;

  // Create lookup map (lowercase for case-insensitive matching)
  const aliasMap = new Map<string, StationAlias>();
  for (const alias of aliases) {
    const key = alias.alias_name.toLowerCase();
    // Prefer customer-specific over global
    if (!aliasMap.has(key) || alias.customer_id) {
      aliasMap.set(key, alias as unknown as StationAlias);
    }
  }

  // Match terms
  for (const term of terms) {
    const normalizedTerm = term.toLowerCase().trim();
    const alias = aliasMap.get(normalizedTerm);
    if (alias) {
      result.set(term, alias);
    } else {
      // Try partial match for unmatched terms
      const entries = Array.from(aliasMap.entries());
      for (const [key, value] of entries) {
        if (key.includes(normalizedTerm) || normalizedTerm.includes(key)) {
          result.set(term, value);
          break;
        }
      }
    }
  }

  return result;
}

/**
 * Get all aliases for a specific master station
 */
export async function getAliasesForStation(
  masterStationId: string
): Promise<StationAlias[]> {
  const { data, error } = await supabase
    .from('station_aliases')
    .select(`
      *,
      master:station_master(*)
    `)
    .eq('master_station_id', masterStationId);

  if (error) throw error;
  return (data || []) as unknown as StationAlias[];
}

/**
 * Get stations that should be inferred based on PCB features
 * Uses triggers_if field from station_master
 */
export async function getInferredStations(
  features: Partial<FeatureTriggers>
): Promise<StationMaster[]> {
  // Get all stations with triggers
  const { data: stations, error } = await supabase
    .from('station_master')
    .select('*')
    .not('triggers_if', 'eq', '{}');

  if (error) throw error;
  if (!stations) return [];

  // Filter stations where any trigger matches
  return (stations as StationMaster[]).filter(station => {
    const triggers = station.triggers_if || [];
    return triggers.some(trigger => {
      const featureKey = trigger as keyof FeatureTriggers;
      return features[featureKey] === true;
    });
  });
}

/**
 * Get all station aliases count for statistics
 */
export async function getAliasCount(): Promise<number> {
  const { count, error } = await supabase
    .from('station_aliases')
    .select('*', { count: 'exact', head: true });

  if (error) throw error;
  return count || 0;
}

/**
 * Search stations by name or code (for autocomplete)
 */
export async function searchStations(query: string): Promise<StationMaster[]> {
  const { data, error } = await supabase
    .from('station_master')
    .select('*')
    .or(`code.ilike.%${query}%,name.ilike.%${query}%`)
    .order('code')
    .limit(10);

  if (error) throw error;
  return (data || []) as StationMaster[];
}
