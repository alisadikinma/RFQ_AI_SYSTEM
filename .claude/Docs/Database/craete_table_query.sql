CREATE TABLE additional_processes (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  name_id TEXT,
  name_cn TEXT,
  category TEXT DEFAULT 'assembly'::text,
  typical_cycle_time_sec INTEGER,
  base_manpower NUMERIC(3,2),
  equipment_cost_usd INTEGER,
  fixture_cost_usd INTEGER,
  is_common BOOLEAN DEFAULT true,
  requires_fixture BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE board_types (
  id INTEGER NOT NULL DEFAULT nextval('board_types_id_seq'::regclass),
  code VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  display_order INTEGER DEFAULT 0,
  icon VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE bom_data (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  model_id UUID,
  board_type TEXT NOT NULL,
  total_line_items INTEGER DEFAULT 0,
  ic_count INTEGER DEFAULT 0,
  passive_count INTEGER DEFAULT 0,
  connector_count INTEGER DEFAULT 0,
  mcu_part_numbers TEXT[] DEFAULT '{}'::text[],
  rf_module_parts TEXT[] DEFAULT '{}'::text[],
  sensor_parts TEXT[] DEFAULT '{}'::text[],
  power_ic_parts TEXT[] DEFAULT '{}'::text[],
  bom_text_concat TEXT,
  bom_embedding VECTOR,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  files JSONB DEFAULT '[]'::jsonb,
  extracted_stations JSONB,
  similar_models JSONB,
  cost_summary JSONB,
  processing_time_ms INTEGER,
  model_used TEXT,
  confidence NUMERIC(3,2),
  sequence INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE chat_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID,
  title TEXT NOT NULL DEFAULT 'New Chat'::text,
  preview TEXT,
  status TEXT DEFAULT 'active'::text,
  message_count INTEGER DEFAULT 0,
  station_count INTEGER DEFAULT 0,
  model_count INTEGER DEFAULT 0,
  rfq_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE customers (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE knowledge_chunks (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding VECTOR,
  source_file TEXT NOT NULL,
  section_title TEXT,
  chunk_index INTEGER NOT NULL,
  token_count INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE model_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  model_id UUID,
  material_cost NUMERIC(10,2) DEFAULT 0,
  process_cost NUMERIC(10,2) DEFAULT 0,
  labor_cost NUMERIC(10,2) DEFAULT 0,
  overhead_cost NUMERIC(10,2) DEFAULT 0,
  test_cost NUMERIC(10,2) DEFAULT 0,
  fixture_cost NUMERIC(10,2) DEFAULT 0,
  router_cost NUMERIC(10,2) DEFAULT 0,
  shipment_cost NUMERIC(10,2) DEFAULT 0,
  total_cost NUMERIC(10,2),
  actual_uph INTEGER,
  actual_fpy NUMERIC(10,2),
  production_volume INTEGER,
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_to DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE model_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  customer_id UUID,
  type_model VARCHAR(100) NOT NULL,
  name VARCHAR(255),
  description TEXT,
  total_boards INTEGER DEFAULT 0,
  total_stations INTEGER DEFAULT 0,
  total_manpower INTEGER DEFAULT 0,
  total_investment NUMERIC(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active'::character varying,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE model_stations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL,
  board_type TEXT NOT NULL,
  machine_id UUID NOT NULL,
  sequence INTEGER NOT NULL,
  manpower NUMERIC(4,2) DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE models (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  customer_id UUID,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'active'::text,
  board_types TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  group_id UUID,
  board_type VARCHAR(50) DEFAULT 'Main Board'::character varying,
  emmc_size VARCHAR(20),
  ram_size VARCHAR(20),
  description_model TEXT,
  investment NUMERIC(15,2) DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  uph INTEGER DEFAULT 0
);

CREATE TABLE pcb_features (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  model_id UUID,
  board_type TEXT NOT NULL,
  length_mm NUMERIC(10,2),
  width_mm NUMERIC(10,2),
  area_mm2 NUMERIC(10,2),
  layer_count INTEGER DEFAULT 2,
  cavity_count INTEGER DEFAULT 1,
  side_count INTEGER DEFAULT 2,
  smt_component_count INTEGER DEFAULT 0,
  bga_count INTEGER DEFAULT 0,
  fine_pitch_count INTEGER DEFAULT 0,
  has_rf BOOLEAN DEFAULT false,
  has_power_stage BOOLEAN DEFAULT false,
  has_sensors BOOLEAN DEFAULT false,
  has_display_connector BOOLEAN DEFAULT false,
  has_battery_connector BOOLEAN DEFAULT false,
  feature_vector VECTOR,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rfq_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  customer_id UUID,
  model_name TEXT NOT NULL,
  reference_model_id UUID,
  target_uph INTEGER,
  target_volume INTEGER,
  status TEXT DEFAULT 'draft'::text,
  input_method TEXT,
  pcb_features JSONB,
  bom_summary JSONB,
  stations_input JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rfq_results (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  rfq_id UUID,
  matched_model_id UUID,
  similarity_score NUMERIC(10,2),
  matched_stations JSONB,
  missing_stations JSONB,
  inferred_stations JSONB,
  investment_breakdown JSONB,
  cost_per_unit JSONB,
  risk_assessment JSONB,
  risk_score INTEGER,
  recommendation JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE rfq_stations (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  rfq_id UUID,
  board_type TEXT NOT NULL,
  station_code TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  manpower INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE station_aliases (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  alias_name TEXT NOT NULL,
  master_station_id UUID,
  customer_id UUID,
  confidence TEXT DEFAULT 'high'::text,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE station_data_staging (
  id INTEGER NOT NULL DEFAULT nextval('station_data_staging_id_seq'::regclass),
  customer_name TEXT,
  model_no TEXT,
  station_name TEXT,
  area TEXT,
  sequence_no INTEGER,
  type_board TEXT,
  type_model TEXT,
  description_model TEXT,
  emmc_size TEXT,
  ram TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE station_master (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  typical_cycle_time_sec INTEGER,
  typical_uph INTEGER,
  operator_ratio NUMERIC(10,2) DEFAULT 1.0,
  triggers_if TEXT[],
  required_for TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);