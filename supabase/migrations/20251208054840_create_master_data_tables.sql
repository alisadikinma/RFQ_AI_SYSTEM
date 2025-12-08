/*
  # Create Master Data Tables

  1. New Tables
    - `customers`
      - `id` (uuid, primary key)
      - `code` (text, unique) - Customer code (e.g., XIAOMI, TCL)
      - `name` (text) - Customer name
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `machines`
      - `id` (uuid, primary key)
      - `code` (text, unique) - Machine code (e.g., MBT, CAL)
      - `name` (text) - Machine name
      - `description` (text, nullable) - Description
      - `category` (text) - Category (Testing, Assembly, Inspection)
      - `typical_uph` (integer) - Typical units per hour
      - `cycle_time` (integer) - Cycle time in seconds
      - `operator_ratio` (numeric) - Operators per station
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `models`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key to customers)
      - `code` (text, unique) - Model code
      - `name` (text) - Model name
      - `status` (text) - active or inactive
      - `board_types` (text[]) - Array of board types
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `model_stations`
      - `id` (uuid, primary key)
      - `model_id` (uuid, foreign key to models)
      - `board_type` (text) - Board type this station belongs to
      - `machine_id` (uuid, foreign key to machines)
      - `sequence` (integer) - Order in the flow
      - `manpower` (integer) - Number of operators
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage data
*/

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete customers"
  ON customers FOR DELETE
  TO authenticated
  USING (true);

-- Create machines table
CREATE TABLE IF NOT EXISTS machines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  category text NOT NULL,
  typical_uph integer NOT NULL DEFAULT 0,
  cycle_time integer NOT NULL DEFAULT 0,
  operator_ratio numeric DEFAULT 1.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE machines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read machines"
  ON machines FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert machines"
  ON machines FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update machines"
  ON machines FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete machines"
  ON machines FOR DELETE
  TO authenticated
  USING (true);

-- Create models table
CREATE TABLE IF NOT EXISTS models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  status text DEFAULT 'active',
  board_types text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read models"
  ON models FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert models"
  ON models FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update models"
  ON models FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete models"
  ON models FOR DELETE
  TO authenticated
  USING (true);

-- Create model_stations table
CREATE TABLE IF NOT EXISTS model_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid REFERENCES models(id) ON DELETE CASCADE NOT NULL,
  board_type text NOT NULL,
  machine_id uuid REFERENCES machines(id) ON DELETE CASCADE NOT NULL,
  sequence integer NOT NULL,
  manpower integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE model_stations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read model_stations"
  ON model_stations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert model_stations"
  ON model_stations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update model_stations"
  ON model_stations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete model_stations"
  ON model_stations FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_models_customer_id ON models(customer_id);
CREATE INDEX IF NOT EXISTS idx_model_stations_model_id ON model_stations(model_id);
CREATE INDEX IF NOT EXISTS idx_model_stations_machine_id ON model_stations(machine_id);

-- Insert mock data for customers
INSERT INTO customers (code, name) VALUES
  ('XIAOMI', 'Xiaomi Corporation'),
  ('TCL', 'TCL Electronics'),
  ('REALME', 'Realme Mobile'),
  ('OPPO', 'OPPO Electronics'),
  ('VIVO', 'Vivo Mobile')
ON CONFLICT (code) DO NOTHING;

-- Insert mock data for machines
INSERT INTO machines (code, name, description, category, typical_uph, cycle_time, operator_ratio) VALUES
  ('MBT', 'Manual Bench Test', 'Manual rework and bench-level testing station', 'Testing', 150, 24, 1.0),
  ('CAL', 'Calibration', 'Sensor and display calibration', 'Testing', 200, 18, 1.0),
  ('RFT', 'RF Test', 'Radio frequency testing', 'Testing', 90, 40, 1.0),
  ('RFT1', 'RF Test Station 1', 'Primary RF testing station', 'Testing', 90, 40, 1.0),
  ('FQC', 'Final Quality Control', 'Final inspection before packaging', 'Inspection', 120, 30, 1.0),
  ('BLMMI', 'BL MMI Test', 'Backlight and MMI testing', 'Testing', 144, 25, 1.0),
  ('T_GREASE', 'Thermal Grease', 'Thermal paste application', 'Assembly', 240, 15, 1.0),
  ('SHIELD', 'Shielding Cover', 'EMI shielding installation', 'Assembly', 180, 20, 1.0),
  ('VISUAL', 'Visual Inspection', 'Visual quality check', 'Inspection', 180, 20, 1.0),
  ('OQC', 'Outgoing QC', 'Final outgoing quality control', 'Inspection', 144, 25, 1.0),
  ('ROUTER', 'Testing Router', 'Router assembly and testing', 'Assembly', 300, 12, 1.0),
  ('AOI', 'Auto Optical Inspection', 'Automated optical inspection', 'Inspection', 240, 15, 0.5)
ON CONFLICT (code) DO NOTHING;
