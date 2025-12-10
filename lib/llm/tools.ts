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
    name: 'query_database',
    description: `Query the database for any information about models, customers, stations/machines, production data, and statistics. 
    
USE THIS TOOL for questions like:
- "Model mana yang investasi paling besar?" (query_type: models_by_investment)
- "List model yang menggunakan station RFT + CAL" (query_type: models_by_stations, stations: ["RFT", "CAL"])
- "Customer apa saja yang ada?" (query_type: list_customers)
- "Machine/station apa saja?" (query_type: list_stations)
- "Berapa total model untuk XIAOMI?" (query_type: customer_stats, customer: "XIAOMI")
- "Model apa saja dari TCL?" (query_type: models_by_customer, customer: "TCL")
- "Station mana yang paling sering dipakai?" (query_type: station_usage_stats)
- "Model dengan manpower terbanyak?" (query_type: models_by_manpower)

This tool can answer ANY database-related question in Indonesian, English, or Chinese.`,
    parameters: {
      type: 'object',
      properties: {
        query_type: {
          type: 'string',
          enum: [
            'list_customers',
            'list_stations', 
            'list_models',
            'models_by_customer',
            'models_by_stations',
            'models_by_investment',
            'models_by_manpower',
            'customer_stats',
            'station_usage_stats',
            'search_models',
            'custom_query'
          ],
          description: 'Type of database query to execute',
        },
        customer: {
          type: 'string',
          description: 'Customer name filter (for customer-specific queries)',
        },
        stations: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of station codes to filter (for models_by_stations)',
        },
        search_term: {
          type: 'string',
          description: 'Search term for fuzzy matching (for search_models)',
        },
        limit: {
          type: 'number',
          description: 'Maximum results to return (default: 10)',
        },
        order_by: {
          type: 'string',
          enum: ['name', 'manpower', 'stations', 'created'],
          description: 'Sort order for results',
        },
      },
      required: ['query_type'],
    },
  },
  {
    name: 'web_search',
    description: 'Search the internet for current information about companies, products, news, or any topic not in the database. USE THIS for questions about specific companies (like SATNUSA, XIAOMI), current events, or general knowledge.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query - be specific (e.g., "PT SATNUSA PERSADA Indonesia", "XIAOMI smartphone manufacturer")',
        },
      },
      required: ['query'],
    },
  },
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
      case 'query_database':
        return await toolQueryDatabase(args);
      
      case 'web_search':
        return await toolWebSearch(args.query as string);
      
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
      
      case 'get_station_details':
        return await toolGetStationDetails(args.station_code as string);
      
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
 * Tool: Query Database - Powerful flexible database queries
 * Handles Indonesian, English, and Chinese questions
 */
async function toolQueryDatabase(args: Record<string, unknown>) {
  const queryType = args.query_type as string;
  const customer = args.customer as string;
  const stations = args.stations as string[];
  const searchTerm = args.search_term as string;
  const limit = (args.limit as number) || 10;
  const orderBy = args.order_by as string;
  
  console.log(`🗄️ Database query: ${queryType}`, { customer, stations, searchTerm, limit });
  
  const supabase = getSupabase();
  
  try {
    switch (queryType) {
      case 'list_customers': {
        const { data, error } = await supabase
          .from('customers')
          .select('id, code, name, country, created_at')
          .order('name');
        
        if (error) throw error;
        
        return {
          success: true,
          query_type: 'list_customers',
          total: data?.length || 0,
          customers: data?.map(c => ({
            code: c.code,
            name: c.name,
            country: c.country || 'N/A',
          })),
          summary: `Ditemukan ${data?.length || 0} customer dalam database`,
        };
      }
      
      case 'list_stations': {
        const { data, error } = await supabase
          .from('station_master')
          .select('code, name, category, description, typical_cycle_time_sec')
          .order('category')
          .order('name');
        
        if (error) throw error;
        
        // Group by category
        const byCategory: Record<string, any[]> = {};
        for (const s of data || []) {
          const cat = s.category || 'Other';
          if (!byCategory[cat]) byCategory[cat] = [];
          byCategory[cat].push({
            code: s.code,
            name: s.name,
            cycle_time: s.typical_cycle_time_sec ? `${s.typical_cycle_time_sec}s` : '-',
          });
        }
        
        return {
          success: true,
          query_type: 'list_stations',
          total: data?.length || 0,
          stations_by_category: byCategory,
          categories: Object.keys(byCategory),
          summary: `Ditemukan ${data?.length || 0} station dalam ${Object.keys(byCategory).length} kategori`,
        };
      }
      
      case 'list_models': {
        let query = supabase
          .from('models')
          .select(`
            id, code, name, status,
            customer:customers(code, name)
          `)
          .eq('status', 'active')
          .limit(limit);
        
        if (orderBy === 'created') {
          query = query.order('created_at', { ascending: false });
        } else {
          query = query.order('name');
        }
        
        const { data, error } = await query;
        if (error) throw error;
        
        return {
          success: true,
          query_type: 'list_models',
          total: data?.length || 0,
          models: data?.map(m => ({
            code: m.code,
            name: m.name,
            customer: (m.customer as any)?.name || 'Unknown',
          })),
        };
      }
      
      case 'models_by_customer': {
        if (!customer) {
          return { success: false, error: 'Customer name required' };
        }
        
        // Find customer first
        const { data: custData } = await supabase
          .from('customers')
          .select('id, code, name')
          .or(`code.ilike.%${customer}%,name.ilike.%${customer}%`)
          .limit(1)
          .single();
        
        if (!custData) {
          return { success: false, error: `Customer "${customer}" tidak ditemukan` };
        }
        
        // Get models with station count
        const { data: models, error } = await supabase
          .from('models')
          .select(`
            id, code, name,
            model_stations(id, manpower)
          `)
          .eq('customer_id', custData.id)
          .eq('status', 'active')
          .limit(limit);
        
        if (error) throw error;
        
        const modelsWithStats = models?.map(m => {
          const stationRows = (m.model_stations as any[]) || [];
          return {
            code: m.code,
            name: m.name,
            total_stations: stationRows.length,
            total_manpower: stationRows.reduce((sum, s) => sum + (s.manpower || 0), 0),
          };
        }).sort((a, b) => b.total_manpower - a.total_manpower);
        
        return {
          success: true,
          query_type: 'models_by_customer',
          customer: custData.name,
          customer_code: custData.code,
          total: modelsWithStats?.length || 0,
          models: modelsWithStats,
          summary: `${custData.name} memiliki ${modelsWithStats?.length || 0} model aktif`,
        };
      }
      
      case 'models_by_stations': {
        if (!stations || stations.length === 0) {
          return { success: false, error: 'Station list required' };
        }
        
        const normalizedStations = stations.map(s => s.toUpperCase());
        
        // Get all active models with their stations
        const { data: models, error } = await supabase
          .from('models')
          .select(`
            id, code, name,
            customer:customers(code, name),
            model_stations(
              machine:station_master(code, name)
            )
          `)
          .eq('status', 'active');
        
        if (error) throw error;
        
        // Filter models that have ALL specified stations
        const matchingModels = models?.filter(m => {
          const modelStations = ((m.model_stations as any[]) || [])
            .map(ms => (ms.machine as any)?.code?.toUpperCase())
            .filter(Boolean);
          
          return normalizedStations.every(reqStation =>
            modelStations.some(ms => ms === reqStation || ms.includes(reqStation))
          );
        }).map(m => ({
          code: m.code,
          name: m.name,
          customer: (m.customer as any)?.name || 'Unknown',
          stations: ((m.model_stations as any[]) || [])
            .map(ms => (ms.machine as any)?.code)
            .filter(Boolean),
        }));
        
        return {
          success: true,
          query_type: 'models_by_stations',
          required_stations: normalizedStations,
          total_matched: matchingModels?.length || 0,
          models: matchingModels?.slice(0, limit),
          summary: `Ditemukan ${matchingModels?.length || 0} model yang menggunakan station: ${normalizedStations.join(', ')}`,
        };
      }
      
      case 'models_by_investment':
      case 'models_by_manpower': {
        // Get models with total manpower (as proxy for investment)
        const { data: models, error } = await supabase
          .from('models')
          .select(`
            id, code, name,
            customer:customers(code, name),
            model_stations(manpower)
          `)
          .eq('status', 'active');
        
        if (error) throw error;
        
        const modelsWithManpower = models?.map(m => {
          const stationRows = (m.model_stations as any[]) || [];
          return {
            code: m.code,
            name: m.name,
            customer: (m.customer as any)?.name || 'Unknown',
            total_stations: stationRows.length,
            total_manpower: stationRows.reduce((sum, s) => sum + (s.manpower || 0), 0),
          };
        })
        .sort((a, b) => b.total_manpower - a.total_manpower)
        .slice(0, limit);
        
        return {
          success: true,
          query_type: queryType,
          total: modelsWithManpower?.length || 0,
          models: modelsWithManpower,
          summary: `Top ${limit} model dengan investasi/manpower terbesar`,
          note: 'Sorted by total manpower (proxy for investment)',
        };
      }
      
      case 'customer_stats': {
        if (!customer) {
          // Return stats for all customers
          const { data: customers, error } = await supabase
            .from('customers')
            .select(`
              id, code, name,
              models(id)
            `);
          
          if (error) throw error;
          
          const stats = customers?.map(c => ({
            code: c.code,
            name: c.name,
            total_models: (c.models as any[])?.length || 0,
          })).sort((a, b) => b.total_models - a.total_models);
          
          return {
            success: true,
            query_type: 'customer_stats',
            total_customers: stats?.length || 0,
            customers: stats,
            summary: `Statistik untuk ${stats?.length || 0} customer`,
          };
        }
        
        // Stats for specific customer
        const { data: custData } = await supabase
          .from('customers')
          .select(`
            id, code, name, country,
            models(id, code, name)
          `)
          .or(`code.ilike.%${customer}%,name.ilike.%${customer}%`)
          .limit(1)
          .single();
        
        if (!custData) {
          return { success: false, error: `Customer "${customer}" tidak ditemukan` };
        }
        
        const modelCount = (custData.models as any[])?.length || 0;
        
        return {
          success: true,
          query_type: 'customer_stats',
          customer: {
            code: custData.code,
            name: custData.name,
            country: custData.country,
          },
          total_models: modelCount,
          models: (custData.models as any[])?.slice(0, 10).map(m => ({
            code: m.code,
            name: m.name,
          })),
          summary: `${custData.name} memiliki ${modelCount} model dalam database`,
        };
      }
      
      case 'station_usage_stats': {
        // Get usage count for each station
        const { data: stationData, error } = await supabase
          .from('model_stations')
          .select(`
            machine:station_master(code, name, category)
          `);
        
        if (error) throw error;
        
        const usageCounts: Record<string, { code: string; name: string; category: string; count: number }> = {};
        
        for (const row of stationData || []) {
          const machine = row.machine as any;
          const code = machine?.code;
          if (!code) continue;
          
          if (!usageCounts[code]) {
            usageCounts[code] = {
              code,
              name: machine.name || code,
              category: machine.category || 'Other',
              count: 0,
            };
          }
          usageCounts[code].count++;
        }
        
        const sorted = Object.values(usageCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, limit);
        
        return {
          success: true,
          query_type: 'station_usage_stats',
          total_unique_stations: Object.keys(usageCounts).length,
          top_stations: sorted,
          summary: `Top ${limit} station yang paling sering digunakan`,
        };
      }
      
      case 'search_models': {
        if (!searchTerm) {
          return { success: false, error: 'Search term required' };
        }
        
        const { data: models, error } = await supabase
          .from('models')
          .select(`
            id, code, name,
            customer:customers(code, name)
          `)
          .or(`code.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
          .eq('status', 'active')
          .limit(limit);
        
        if (error) throw error;
        
        return {
          success: true,
          query_type: 'search_models',
          search_term: searchTerm,
          total: models?.length || 0,
          models: models?.map(m => ({
            code: m.code,
            name: m.name,
            customer: (m.customer as any)?.name || 'Unknown',
          })),
        };
      }
      
      default:
        return { success: false, error: `Unknown query type: ${queryType}` };
    }
  } catch (error) {
    console.error('Database query error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Database query failed',
    };
  }
}

/**
 * Tool: Web Search using Tavily API
 */
async function toolWebSearch(query: string) {
  console.log(`🌐 Web search: "${query}"`);
  
  const apiKey = process.env.TAVILY_API_KEY;
  
  if (!apiKey) {
    return {
      success: false,
      error: 'Web search not configured. TAVILY_API_KEY missing.',
    };
  }
  
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: 'basic',
        include_answer: true,
        max_results: 5,
      }),
    });
    
    if (!response.ok) {
      return { success: false, error: `Web search failed: ${response.status}` };
    }
    
    const data = await response.json();
    
    return {
      success: true,
      query: query,
      answer: data.answer || null,
      results: (data.results || []).map((r: any) => ({
        title: r.title,
        url: r.url,
        content: r.content?.substring(0, 500),
      })),
    };
  } catch (error) {
    return { success: false, error: 'Web search failed' };
  }
}

/**
 * Tool: Search knowledge base
 */
async function toolSearchKnowledge(query: string, maxResults: number = 5) {
  console.log(`🔍 Searching knowledge base: "${query}"`);
  
  try {
    const results = await Promise.race([
      searchKnowledge(query, { maxResults, minSimilarity: 0.3 }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      )
    ]);
    
    return {
      success: true,
      results: results.map(r => ({
        content: r.content,
        source: r.source_file.replace('.md', ''),
        section: r.section_title || 'General',
        relevance: Math.round(r.similarity * 100) + '%',
      })),
    };
  } catch (error) {
    return { 
      success: true, 
      results: [],
      message: 'Knowledge base tidak tersedia',
    };
  }
}

/**
 * Tool: Find similar models based on station list
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
    const normalizedStations = stations.map(s => 
      s.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '')
    ).filter(s => s.length > 0);
    
    if (normalizedStations.length === 0) {
      return { success: false, error: 'No valid stations provided' };
    }
    
    let query = supabase
      .from('models')
      .select(`
        id, code, name, status,
        customer:customers(id, code, name),
        model_stations(
          id, board_type, sequence, manpower,
          machine:station_master(id, code, name, category)
        )
      `)
      .eq('status', 'active')
      .limit(200);
    
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
    if (error) throw error;
    
    const results = models?.map(model => {
      const modelStationRows = (model.model_stations as any[]) || [];
      const modelStations = modelStationRows
        .map(ms => (ms.machine as any)?.code?.toUpperCase())
        .filter(Boolean);
      const uniqueModelStations = Array.from(new Set(modelStations));
      
      const intersection = normalizedStations.filter(qs => 
        uniqueModelStations.some(ms => ms === qs || ms.includes(qs) || qs.includes(ms))
      );
      
      const union = new Set([...normalizedStations, ...uniqueModelStations]);
      const similarity = union.size > 0 ? (intersection.length / union.size) * 100 : 0;
      
      const totalManpower = modelStationRows.reduce((sum, s) => sum + (s.manpower || 0), 0);
      
      return {
        id: model.id,
        code: model.code,
        name: model.name,
        customer: (model.customer as any)?.name || 'Unknown',
        similarity: Math.round(similarity),
        total_stations: uniqueModelStations.length,
        total_manpower: totalManpower,
        matched_stations: intersection,
        all_stations: uniqueModelStations,
      };
    }) || [];
    
    const filtered = results
      .filter(r => r.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
    
    return {
      success: true,
      query_stations: normalizedStations,
      total_searched: models?.length || 0,
      matches: filtered,
    };
  } catch (error) {
    return { success: false, error: 'Search failed' };
  }
}

/**
 * Tool: Get detailed model information
 */
async function toolGetModelDetails(modelId: string) {
  const supabase = getSupabase();
  
  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(modelId);
    
    let query = supabase
      .from('models')
      .select(`
        id, code, name, board_types,
        customer:customers(id, code, name),
        model_stations(
          board_type, sequence, manpower,
          machine:station_master(code, name, category, typical_cycle_time_sec)
        )
      `);
    
    if (isUUID) {
      query = query.eq('id', modelId);
    } else {
      query = query.ilike('code', `%${modelId}%`);
    }
    
    const { data: model, error } = await query.limit(1).single();
    
    if (error || !model) {
      return { success: false, error: `Model "${modelId}" not found` };
    }
    
    const stationsByBoard: Record<string, any[]> = {};
    let totalManpower = 0;
    
    for (const ms of (model.model_stations as any[]) || []) {
      const boardType = ms.board_type || 'Main';
      if (!stationsByBoard[boardType]) stationsByBoard[boardType] = [];
      const machine = ms.machine as any;
      stationsByBoard[boardType].push({
        code: machine?.code,
        name: machine?.name,
        category: machine?.category,
        sequence: ms.sequence,
        manpower: ms.manpower || 0,
      });
      totalManpower += ms.manpower || 0;
    }
    
    return {
      success: true,
      model: {
        id: model.id,
        code: model.code,
        name: model.name,
        customer: (model.customer as any)?.name,
      },
      summary: {
        total_stations: (model.model_stations as any[])?.length || 0,
        total_manpower: totalManpower,
      },
      stations_by_board: stationsByBoard,
    };
  } catch (error) {
    return { success: false, error: 'Failed to get model details' };
  }
}

/**
 * Tool: Get station details
 */
async function toolGetStationDetails(stationCode: string) {
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
        .select('station_master(*)')
        .ilike('alias_name', `%${stationCode}%`)
        .limit(1)
        .single();
      
      if (alias?.station_master) {
        return { success: true, station: alias.station_master };
      }
      
      return { success: false, error: `Station "${stationCode}" not found` };
    }
    
    return { success: true, station };
  } catch (error) {
    return { success: false, error: 'Station lookup failed' };
  }
}
