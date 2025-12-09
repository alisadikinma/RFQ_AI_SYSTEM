/**
 * AI Agent Tools
 * Function definitions for Gemini Function Calling
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { searchKnowledge } from '@/lib/rag/search';

// Lazy-initialized Supabase client
let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }
    
    _supabase = createClient(supabaseUrl, supabaseKey);
  }
  return _supabase;
}

/**
 * Tool definitions for Gemini Function Calling
 */
export const AGENT_TOOLS = [
  {
    name: 'search_knowledge',
    description: 'Search the EMS knowledge base for information about manufacturing processes, testing methods, cost structures, troubleshooting, IPC standards, and industry best practices. USE THIS TOOL for any technical or educational questions about EMS, SMT, testing, inspection, or manufacturing.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query. Be specific about what information you need (e.g., "SMT process steps", "ICT testing purpose", "AOI inspection")',
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results to return (default: 5)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'find_similar_models',
    description: 'Find similar historical models based on a list of stations. Returns top matching models with similarity scores, station comparisons, and production data. USE THIS after extracting stations from an image or when user provides a station list.',
    parameters: {
      type: 'object',
      properties: {
        stations: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of station codes to match (e.g., ["RFT", "CAL", "MMI", "MBT"])',
        },
        customer_filter: {
          type: 'string',
          description: 'Optional: filter by customer name',
        },
        min_similarity: {
          type: 'number',
          description: 'Minimum similarity score (0-100, default: 50)',
        },
        limit: {
          type: 'number',
          description: 'Number of results to return (default: 5)',
        },
      },
      required: ['stations'],
    },
  },
  {
    name: 'get_model_details',
    description: 'Get detailed information about a specific model including all stations, manpower, cycle times, and production history.',
    parameters: {
      type: 'object',
      properties: {
        model_id: {
          type: 'string',
          description: 'Model ID (UUID) or model code',
        },
      },
      required: ['model_id'],
    },
  },
  {
    name: 'get_customer_stations',
    description: 'Get the test stations historically used by a specific customer/brand. Returns actual production data from the database.',
    parameters: {
      type: 'object',
      properties: {
        customer_name: {
          type: 'string',
          description: 'Customer/brand name (e.g., XIAOMI, TCL, HUAWEI)',
        },
      },
      required: ['customer_name'],
    },
  },
  {
    name: 'get_station_details',
    description: 'Get detailed information about a specific test station including cycle time, manpower requirements, and purpose.',
    parameters: {
      type: 'object',
      properties: {
        station_code: {
          type: 'string',
          description: 'Station code (e.g., RFT, CAL, MMI, OS_DOWNLOAD)',
        },
      },
      required: ['station_code'],
    },
  },
  {
    name: 'list_available_stations',
    description: 'List all available test and assembly stations in the system with their categories.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

/**
 * Execute a tool call
 */
export async function executeTool(
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  console.log(`⚡ Executing tool: ${toolName}`, args);
  
  try {
    switch (toolName) {
      case 'search_knowledge':
        return await toolSearchKnowledge(args.query as string, args.max_results as number);
      
      case 'find_similar_models':
        return await toolFindSimilarModels(
          args.stations as string[],
          args.customer_filter as string,
          args.min_similarity as number,
          args.limit as number
        );
      
      case 'get_model_details':
        return await toolGetModelDetails(args.model_id as string);
      
      case 'get_customer_stations':
        return await toolGetCustomerStations(args.customer_name as string);
      
      case 'get_station_details':
        return await toolGetStationDetails(args.station_code as string);
      
      case 'list_available_stations':
        return await toolListStations();
      
      default:
        return { success: false, error: `Unknown tool: ${toolName}` };
    }
  } catch (error) {
    console.error(`Tool ${toolName} error:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Tool execution failed' 
    };
  }
}

/**
 * Tool: Search knowledge base
 */
async function toolSearchKnowledge(query: string, maxResults: number = 5) {
  console.log(`🔍 Searching knowledge base: "${query}"`);
  
  try {
    const results = await searchKnowledge(query, { maxResults, minSimilarity: 0.3 });
    
    console.log(`📚 Found ${results.length} results`);
    
    if (results.length === 0) {
      return {
        success: true,
        results: [],
        message: 'No relevant information found in knowledge base',
      };
    }
    
    return {
      success: true,
      results: results.map(r => ({
        content: r.content,
        source: r.source_file.replace('.md', '').replace('EMS_', ''),
        section: r.section_title || 'General',
        relevance: Math.round(r.similarity * 100) + '%',
      })),
    };
  } catch (error) {
    console.error('Knowledge search error:', error);
    return { success: false, error: 'Knowledge search failed', results: [] };
  }
}

/**
 * Tool: Find similar models based on station list
 * Uses Jaccard similarity on station codes
 */
async function toolFindSimilarModels(
  stations: string[],
  customerFilter?: string,
  minSimilarity: number = 50,
  limit: number = 5
) {
  console.log(`🔎 Finding similar models for stations:`, stations);
  
  const supabase = getSupabase();
  
  try {
    // Normalize station codes
    const normalizedStations = stations.map(s => 
      s.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '')
    ).filter(s => s.length > 0);
    
    if (normalizedStations.length === 0) {
      return { success: false, error: 'No valid stations provided' };
    }
    
    // Build query - join model_stations with station_master to get station codes
    let query = supabase
      .from('models')
      .select(`
        id,
        code,
        name,
        status,
        customer:customers(id, code, name),
        model_stations(
          id,
          machine_id,
          board_type,
          sequence,
          manpower,
          machine:station_master(
            id,
            code,
            name,
            category
          )
        )
      `)
      .eq('status', 'active')
      .limit(200);
    
    // Filter by customer if specified
    if (customerFilter) {
      const { data: cust } = await supabase
        .from('customers')
        .select('id')
        .or(`code.ilike.%${customerFilter}%,name.ilike.%${customerFilter}%`)
        .limit(1)
        .single();
      
      if (cust) {
        query = query.eq('customer_id', cust.id);
      }
    }
    
    const { data: models, error } = await query;
    
    if (error) {
      console.error('Database query error:', error);
      throw error;
    }
    
    if (!models || models.length === 0) {
      return {
        success: true,
        query_stations: normalizedStations,
        total_searched: 0,
        matches: [],
        message: 'No models found in database',
      };
    }
    
    // Calculate Jaccard similarity for each model
    const results = models.map(model => {
      // Extract station codes from joined data
      const modelStationRows = (model.model_stations as any[]) || [];
      const modelStations = modelStationRows
        .map(ms => (ms.machine as any)?.code?.toUpperCase())
        .filter(Boolean);
      const uniqueModelStations = [...new Set(modelStations)];
      
      // Jaccard similarity with fuzzy matching
      const intersection = normalizedStations.filter(queryStation => 
        uniqueModelStations.some(modelStation => 
          modelStation === queryStation ||
          modelStation.includes(queryStation) || 
          queryStation.includes(modelStation)
        )
      );
      
      const union = new Set([...normalizedStations, ...uniqueModelStations]);
      const similarity = union.size > 0 ? (intersection.length / union.size) * 100 : 0;
      
      // Station overlap details
      const matchedStations = intersection;
      const missingStations = normalizedStations.filter(queryStation => 
        !uniqueModelStations.some(modelStation => 
          modelStation === queryStation ||
          modelStation.includes(queryStation) || 
          queryStation.includes(modelStation)
        )
      );
      const extraStations = uniqueModelStations.filter(modelStation =>
        !normalizedStations.some(queryStation => 
          modelStation === queryStation ||
          modelStation.includes(queryStation) || 
          queryStation.includes(modelStation)
        )
      );
      
      // Calculate total manpower
      const totalManpower = modelStationRows.reduce(
        (sum, s) => sum + (s.manpower || 0), 0
      );
      
      return {
        id: model.id,
        code: model.code,
        name: model.name,
        customer: (model.customer as any)?.name || 'Unknown',
        customer_code: (model.customer as any)?.code || '',
        similarity: Math.round(similarity),
        total_stations: uniqueModelStations.length,
        total_manpower: totalManpower,
        matched_stations: matchedStations,
        missing_stations: missingStations,
        extra_stations: extraStations.slice(0, 10), // Limit for readability
        all_stations: uniqueModelStations,
      };
    });
    
    // Filter by minimum similarity and sort
    const filtered = results
      .filter(r => r.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
    console.log(`✅ Found ${filtered.length} similar models (>= ${minSimilarity}%)`);
    
    return {
      success: true,
      query_stations: normalizedStations,
      total_searched: models.length,
      matches: filtered,
      message: filtered.length > 0 
        ? `Found ${filtered.length} similar models`
        : 'No models found with similarity >= ' + minSimilarity + '%',
    };
  } catch (error) {
    console.error('Find similar models error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Search failed',
      query_stations: stations,
      matches: [],
    };
  }
}

/**
 * Tool: Get detailed model information
 */
async function toolGetModelDetails(modelId: string) {
  console.log(`📋 Getting model details: ${modelId}`);
  
  const supabase = getSupabase();
  
  try {
    // Try by ID first, then by code
    let query = supabase
      .from('models')
      .select(`
        id,
        code,
        name,
        board_types,
        customer:customers(id, code, name),
        model_stations(
          id,
          machine_id,
          board_type,
          sequence,
          manpower,
          machine:station_master(
            code,
            name,
            category,
            description,
            typical_cycle_time_sec
          )
        )
      `);
    
    // Check if modelId is UUID or code
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(modelId);
    
    if (isUUID) {
      query = query.eq('id', modelId);
    } else {
      query = query.ilike('code', `%${modelId}%`);
    }
    
    const { data: model, error } = await query.limit(1).single();
    
    if (error || !model) {
      return { success: false, error: `Model "${modelId}" not found` };
    }
    
    // Group stations by board type
    const stationsByBoard: Record<string, any[]> = {};
    let totalManpower = 0;
    let totalCycleTime = 0;
    
    for (const ms of (model.model_stations as any[]) || []) {
      const boardType = ms.board_type || 'Main';
      if (!stationsByBoard[boardType]) {
        stationsByBoard[boardType] = [];
      }
      const machine = ms.machine as any;
      stationsByBoard[boardType].push({
        code: machine?.code || 'Unknown',
        name: machine?.name || machine?.code || 'Unknown',
        category: machine?.category || 'Other',
        sequence: ms.sequence,
        manpower: ms.manpower || 0,
        cycle_time: machine?.typical_cycle_time_sec || 0,
      });
      totalManpower += ms.manpower || 0;
      totalCycleTime += machine?.typical_cycle_time_sec || 0;
    }
    
    // Sort by sequence
    for (const board in stationsByBoard) {
      stationsByBoard[board].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
    }
    
    return {
      success: true,
      model: {
        id: model.id,
        code: model.code,
        name: model.name,
        customer: (model.customer as any)?.name,
        customer_code: (model.customer as any)?.code,
        board_types: model.board_types || Object.keys(stationsByBoard),
      },
      summary: {
        total_stations: (model.model_stations as any[])?.length || 0,
        total_manpower: totalManpower,
        total_cycle_time: totalCycleTime,
        board_count: Object.keys(stationsByBoard).length,
      },
      stations_by_board: stationsByBoard,
    };
  } catch (error) {
    console.error('Get model details error:', error);
    return { success: false, error: 'Failed to get model details' };
  }
}

/**
 * Tool: Get customer stations from database
 */
async function toolGetCustomerStations(customerName: string) {
  console.log(`🏢 Getting stations for customer: ${customerName}`);
  
  const supabase = getSupabase();
  
  try {
    const { data: customer } = await supabase
      .from('customers')
      .select('id, code, name')
      .or(`code.ilike.%${customerName}%,name.ilike.%${customerName}%`)
      .limit(1)
      .single();
    
    if (!customer) {
      return { success: false, error: `Customer "${customerName}" not found` };
    }
    
    // Get stations via model_stations joined with station_master
    const { data: modelStations } = await supabase
      .from('model_stations')
      .select(`
        machine_id,
        machine:station_master(code, name),
        model:models!inner(id, customer_id)
      `)
      .eq('model.customer_id', customer.id);
    
    const stationCounts: Record<string, { code: string; name: string; count: number }> = {};
    for (const row of modelStations || []) {
      const machine = row.machine as any;
      const code = machine?.code || 'Unknown';
      if (!stationCounts[code]) {
        stationCounts[code] = { code, name: machine?.name || code, count: 0 };
      }
      stationCounts[code].count++;
    }
    
    const sortedStations = Object.values(stationCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    
    return {
      success: true,
      customer: customer.name,
      total_models: new Set((modelStations || []).map(s => (s.model as any)?.id)).size,
      stations: sortedStations,
    };
  } catch (error) {
    console.error('Get customer stations error:', error);
    return { success: false, error: 'Database query failed' };
  }
}

/**
 * Tool: Get station details from database
 */
async function toolGetStationDetails(stationCode: string) {
  console.log(`📋 Getting station details: ${stationCode}`);
  
  const supabase = getSupabase();
  
  try {
    const { data: station } = await supabase
      .from('station_master')
      .select('*')
      .eq('code', stationCode.toUpperCase())
      .single();
    
    if (!station) {
      const { data: alias } = await supabase
        .from('station_aliases')
        .select('master_station_id, station_master(*)')
        .ilike('alias_name', `%${stationCode}%`)
        .limit(1)
        .single();
      
      if (alias?.station_master) {
        return {
          success: true,
          station: alias.station_master,
          note: `Matched via alias "${stationCode}"`,
        };
      }
      
      return { success: false, error: `Station "${stationCode}" not found` };
    }
    
    return { success: true, station };
  } catch (error) {
    return { success: false, error: 'Station lookup failed' };
  }
}

/**
 * Tool: List all available stations
 */
async function toolListStations() {
  console.log('📝 Listing all stations');
  
  const supabase = getSupabase();
  
  try {
    const { data: stations } = await supabase
      .from('station_master')
      .select('code, name, category, description')
      .order('category')
      .order('code');
    
    const byCategory: Record<string, any[]> = {};
    for (const station of stations || []) {
      const cat = station.category || 'Other';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push({
        code: station.code,
        name: station.name,
        description: station.description,
      });
    }
    
    return {
      success: true,
      total: stations?.length || 0,
      by_category: byCategory,
    };
  } catch (error) {
    return { success: false, error: 'Failed to list stations' };
  }
}
