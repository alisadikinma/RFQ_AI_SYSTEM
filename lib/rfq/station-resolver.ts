/**
 * Station Resolver
 * 3-Level intelligent station name resolution:
 * 1. Exact match against station_master
 * 2. Alias lookup from station_aliases
 * 3. Semantic match using LLM
 */

import { supabase } from '@/lib/supabase/client';
import { callLLMJSON, isLLMAvailable } from '@/lib/llm/client';
import type {
  StationInput,
  ResolvedStation,
  ResolutionResult,
  ResolutionSummary,
  ConfidenceLevel,
  MatchMethod,
} from './types';

// Types for database entities
interface MasterStation {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
}

interface StationAliasRecord {
  id: string;
  alias_name: string;
  master_station_id: string;
  customer_id: string | null;
  confidence: 'high' | 'medium' | 'low';
  master?: MasterStation;
}

// Raw alias record from Supabase (master can be array or object)
interface RawAliasRecord {
  id: string;
  alias_name: string;
  master_station_id: string;
  customer_id: string | null;
  confidence: string;
  master: MasterStation | MasterStation[] | null;
}

/**
 * Transform raw alias records from Supabase to typed records
 */
function transformAliases(rawAliases: RawAliasRecord[] | null): StationAliasRecord[] {
  if (!rawAliases) return [];

  return rawAliases.map(alias => ({
    id: alias.id,
    alias_name: alias.alias_name,
    master_station_id: alias.master_station_id,
    customer_id: alias.customer_id,
    confidence: (alias.confidence as 'high' | 'medium' | 'low') || 'high',
    master: Array.isArray(alias.master) ? alias.master[0] : alias.master || undefined,
  }));
}

/**
 * Resolve multiple station inputs to standard codes
 * Uses 3-level resolution: exact → alias → semantic
 */
export async function resolveStations(
  inputs: StationInput[],
  customerId?: string
): Promise<ResolutionResult> {
  // Load master stations from station_master table
  // Falls back to machines table if station_master doesn't exist
  let masterStations: MasterStation[] = [];
  let masterError: any = null;

  // Try station_master first (preferred)
  const { data: stationMasterData, error: stationMasterError } = await supabase
    .from('station_master')
    .select('id, code, name, description, category')
    .order('code');

  if (!stationMasterError && stationMasterData) {
    masterStations = stationMasterData;
  } else {
    // Fall back to machines table
    const { data: machinesData, error: machinesError } = await supabase
      .from('machines')
      .select('id, code, name, description, category')
      .order('code');

    if (machinesError) {
      masterError = machinesError;
    } else {
      masterStations = machinesData || [];
    }
  }

  if (masterError) {
    console.error('Failed to load master stations:', masterError);
    throw new Error('Failed to load master stations');
  }

  // Load aliases (references station_master)
  let aliasQuery = supabase
    .from('station_aliases')
    .select(`
      id,
      alias_name,
      master_station_id,
      customer_id,
      confidence,
      master:station_master(id, code, name, description, category)
    `);

  if (customerId) {
    aliasQuery = aliasQuery.or(`customer_id.eq.${customerId},customer_id.is.null`);
  } else {
    aliasQuery = aliasQuery.is('customer_id', null);
  }

  const { data: rawAliases, error: aliasError } = await aliasQuery;

  if (aliasError) {
    console.error('Failed to load aliases:', aliasError);
    // Continue without aliases if they fail to load
  }

  // Transform aliases to typed records
  const aliases = transformAliases(rawAliases as RawAliasRecord[] | null);

  // Resolve each station
  const resolved: ResolvedStation[] = [];
  const methodCounts = { exact: 0, alias: 0, semantic: 0, unresolved: 0 };

  for (const input of inputs) {
    const result = await resolveStation(
      input,
      masterStations || [],
      aliases,
      customerId
    );
    resolved.push(result);
    methodCounts[result.matchMethod]++;
  }

  // Build summary
  const uniqueCodes = Array.from(new Set(
    resolved
      .filter(r => r.resolvedCode)
      .map(r => r.resolvedCode!)
  ));

  const summary: ResolutionSummary = {
    total: resolved.length,
    resolved: resolved.filter(r => r.resolvedCode).length,
    unresolved: resolved.filter(r => !r.resolvedCode).length,
    uniqueCodes,
    byMethod: methodCounts,
  };

  return { stations: resolved, summary };
}

/**
 * Resolve a single station input
 */
async function resolveStation(
  input: StationInput,
  masterStations: MasterStation[],
  aliases: StationAliasRecord[],
  customerId?: string
): Promise<ResolvedStation> {
  const name = input.name.trim();

  // LEVEL 1: Exact match against master stations
  const exactMatch = masterStations.find(
    s => s.code.toUpperCase() === name.toUpperCase()
  );

  if (exactMatch) {
    return {
      input: name,
      inputDescription: input.description,
      inputBoardType: input.boardType,
      resolvedCode: exactMatch.code,
      resolvedName: exactMatch.name,
      confidence: 'high',
      matchMethod: 'exact',
    };
  }

  // LEVEL 2: Alias lookup
  const aliasMatch = findAliasMatch(name, aliases, customerId);

  if (aliasMatch) {
    return {
      input: name,
      inputDescription: input.description,
      inputBoardType: input.boardType,
      resolvedCode: aliasMatch.master?.code || null,
      resolvedName: aliasMatch.master?.name || null,
      confidence: aliasMatch.confidence || 'high',
      matchMethod: 'alias',
    };
  }

  // LEVEL 3: Semantic match using LLM
  if (isLLMAvailable()) {
    const semanticResult = await semanticMatch(input, masterStations);
    if (semanticResult) {
      return {
        input: name,
        inputDescription: input.description,
        inputBoardType: input.boardType,
        resolvedCode: semanticResult.code,
        resolvedName: semanticResult.name,
        confidence: semanticResult.confidence,
        matchMethod: 'semantic',
        reasoning: semanticResult.reasoning,
      };
    }
  }

  // Unresolved
  return {
    input: name,
    inputDescription: input.description,
    inputBoardType: input.boardType,
    resolvedCode: null,
    resolvedName: null,
    confidence: 'none',
    matchMethod: 'unresolved',
  };
}

/**
 * Find alias match using various strategies
 */
function findAliasMatch(
  name: string,
  aliases: StationAliasRecord[],
  customerId?: string
): StationAliasRecord | null {
  const normalizedName = name.replace(/[\s_\-]/g, '').toUpperCase();

  // Strategy 1: Exact match (case-insensitive)
  for (const alias of aliases) {
    if (alias.alias_name.toUpperCase() === name.toUpperCase()) {
      // Prefer customer-specific alias
      if (customerId && alias.customer_id === customerId) {
        return alias;
      }
      if (!alias.customer_id) {
        return alias;
      }
    }
  }

  // Strategy 2: Normalized match (remove spaces, underscores, hyphens)
  for (const alias of aliases) {
    const normalizedAlias = alias.alias_name.replace(/[\s_\-]/g, '').toUpperCase();
    if (normalizedAlias === normalizedName) {
      return alias;
    }
  }

  // Strategy 3: Numbered variant match (e.g., CAL1 → CAL, RFT1 → RFT)
  const baseNameMatch = name.match(/^([A-Za-z]+)\d*$/);
  if (baseNameMatch) {
    const baseName = baseNameMatch[1].toUpperCase();
    for (const alias of aliases) {
      if (alias.master?.code.toUpperCase() === baseName) {
        return alias;
      }
    }
  }

  // Strategy 4: Partial match
  for (const alias of aliases) {
    const aliasLower = alias.alias_name.toLowerCase();
    const nameLower = name.toLowerCase();
    if (aliasLower.includes(nameLower) || nameLower.includes(aliasLower)) {
      return alias;
    }
  }

  return null;
}

/**
 * Semantic match using LLM
 */
async function semanticMatch(
  input: StationInput,
  masterStations: MasterStation[]
): Promise<{
  code: string;
  name: string;
  confidence: ConfidenceLevel;
  reasoning: string;
} | null> {
  const stationList = masterStations
    .map(s => `${s.code} | ${s.name} | ${s.description || 'No description'}`)
    .join('\n');

  const systemPrompt = `You are a station name resolver for an EMS (Electronics Manufacturing Services) factory.
You MUST understand Chinese (中文), English, and Indonesian.

Your task is to match customer station names to standard station codes.

Standard Stations (code | name | description):
${stationList}

Common Chinese terms:
- 测试 = test, 仪表 = instrument, 主板 = mainboard, 副板 = sub-board
- 抽检 = spot check, 物料取放 = material handling, 装盘入库 = packing
- 板测 = board test, 整机 = final assembly

Rules:
1. Match by function/meaning, not just spelling
2. Handle numbered variants: CAL1→CAL, RFT1→RFT, TEST2→TEST
3. Compound names (WIFIBT) → match to primary function
4. Return null if no reasonable match (confidence too low)`;

  const userPrompt = `Match this station to a standard code:

Station Name: "${input.name}"
Description: "${input.description || 'N/A'}"
Board Type: "${input.boardType || 'N/A'}"

Respond in JSON format only:
{
  "matchedCode": "CODE" or null,
  "confidence": "medium" or "low",
  "reasoning": "brief explanation in English"
}`;

  try {
    const response = await callLLMJSON<{
      matchedCode: string | null;
      confidence: 'medium' | 'low';
      reasoning: string;
    }>([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ], {
      temperature: 0.1,
      max_tokens: 256,
    });

    if (response.matchedCode) {
      const station = masterStations.find(
        s => s.code.toUpperCase() === response.matchedCode!.toUpperCase()
      );

      if (station) {
        return {
          code: station.code,
          name: station.name,
          confidence: response.confidence || 'medium',
          reasoning: response.reasoning,
        };
      }
    }
  } catch (error) {
    console.error('Semantic match failed:', error);
  }

  return null;
}

/**
 * Batch resolve stations for better performance
 * Groups stations and resolves similar ones together
 */
export async function batchResolveStations(
  inputs: StationInput[],
  customerId?: string
): Promise<ResolutionResult> {
  // For small batches, use regular resolution
  if (inputs.length <= 5) {
    return resolveStations(inputs, customerId);
  }

  // Load master stations and aliases once
  // Try station_master first, fall back to machines
  let masterStations: MasterStation[] = [];
  const { data: stationMasterData } = await supabase
    .from('station_master')
    .select('id, code, name, description, category')
    .order('code');

  if (stationMasterData) {
    masterStations = stationMasterData;
  } else {
    const { data: machinesData } = await supabase
      .from('machines')
      .select('id, code, name, description, category')
      .order('code');
    masterStations = machinesData || [];
  }

  let aliasQuery = supabase
    .from('station_aliases')
    .select(`
      id,
      alias_name,
      master_station_id,
      customer_id,
      confidence,
      master:station_master(id, code, name, description, category)
    `);

  if (customerId) {
    aliasQuery = aliasQuery.or(`customer_id.eq.${customerId},customer_id.is.null`);
  }

  const { data: rawAliases } = await aliasQuery;

  // Transform aliases to typed records
  const aliases = transformAliases(rawAliases as RawAliasRecord[] | null);

  // Deduplicate inputs by name
  const uniqueNames = new Map<string, StationInput>();
  for (const input of inputs) {
    const key = input.name.trim().toUpperCase();
    if (!uniqueNames.has(key)) {
      uniqueNames.set(key, input);
    }
  }

  // Resolve unique names
  const resolvedMap = new Map<string, ResolvedStation>();

  for (const input of Array.from(uniqueNames.values())) {
    const result = await resolveStation(
      input,
      masterStations || [],
      aliases,
      customerId
    );
    resolvedMap.set(input.name.trim().toUpperCase(), result);
  }

  // Map back to original inputs
  const resolved: ResolvedStation[] = inputs.map(input => {
    const key = input.name.trim().toUpperCase();
    const result = resolvedMap.get(key)!;
    return {
      ...result,
      inputDescription: input.description || result.inputDescription,
      inputBoardType: input.boardType || result.inputBoardType,
    };
  });

  // Build summary
  const methodCounts = { exact: 0, alias: 0, semantic: 0, unresolved: 0 };
  for (const r of resolved) {
    methodCounts[r.matchMethod]++;
  }

  const uniqueCodes = Array.from(new Set(
    resolved.filter(r => r.resolvedCode).map(r => r.resolvedCode!)
  ));

  return {
    stations: resolved,
    summary: {
      total: resolved.length,
      resolved: resolved.filter(r => r.resolvedCode).length,
      unresolved: resolved.filter(r => !r.resolvedCode).length,
      uniqueCodes,
      byMethod: methodCounts,
    },
  };
}

/**
 * Quick check if a station name is resolvable
 * Only checks exact and alias matches (no LLM)
 */
export async function quickResolve(
  name: string,
  customerId?: string
): Promise<ResolvedStation | null> {
  // Check exact match - try station_master first, then machines
  let exactMatch: { id: string; code: string; name: string } | null = null;

  const { data: stationMasterMatch } = await supabase
    .from('station_master')
    .select('id, code, name')
    .ilike('code', name)
    .maybeSingle();

  if (stationMasterMatch) {
    exactMatch = stationMasterMatch;
  } else {
    const { data: machinesMatch } = await supabase
      .from('machines')
      .select('id, code, name')
      .ilike('code', name)
      .maybeSingle();
    exactMatch = machinesMatch;
  }

  if (exactMatch) {
    return {
      input: name,
      resolvedCode: exactMatch.code,
      resolvedName: exactMatch.name,
      confidence: 'high',
      matchMethod: 'exact',
    };
  }

  // Check alias match
  let aliasQuery = supabase
    .from('station_aliases')
    .select(`
      alias_name,
      confidence,
      master:station_master(code, name)
    `)
    .ilike('alias_name', name);

  if (customerId) {
    aliasQuery = aliasQuery.or(`customer_id.eq.${customerId},customer_id.is.null`);
  }

  const { data: aliasMatch } = await aliasQuery.limit(1).maybeSingle();

  if (aliasMatch?.master) {
    const master = aliasMatch.master as unknown as { code: string; name: string };
    return {
      input: name,
      resolvedCode: master.code,
      resolvedName: master.name,
      confidence: aliasMatch.confidence as ConfidenceLevel || 'high',
      matchMethod: 'alias',
    };
  }

  return null;
}
