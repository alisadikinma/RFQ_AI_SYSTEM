/*
  # Create RFQ Tables

  1. New Tables
    - `rfq_requests`
      - `id` (uuid, primary key)
      - `customer_id` (uuid, foreign key to customers)
      - `model_name` (text) - Requested model name
      - `reference_model_id` (uuid, nullable, foreign key to models)
      - `target_uph` (integer, nullable) - Target units per hour
      - `target_volume` (integer, nullable) - Target production volume
      - `notes` (text, nullable)
      - `status` (text) - draft, processing, completed, failed
      - `input_method` (text) - manual, upload, copy
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `completed_at` (timestamptz, nullable)

    - `rfq_stations`
      - `id` (uuid, primary key)
      - `rfq_id` (uuid, foreign key to rfq_requests)
      - `board_type` (text)
      - `station_code` (text)
      - `sequence` (integer)
      - `created_at` (timestamptz)

    - `rfq_results`
      - `id` (uuid, primary key)
      - `rfq_id` (uuid, foreign key to rfq_requests)
      - `matched_model_id` (uuid, nullable, foreign key to models)
      - `similarity_score` (numeric)
      - `matched_stations` (jsonb)
      - `missing_stations` (jsonb)
      - `investment_breakdown` (jsonb)
      - `manpower_estimate` (jsonb)
      - `risk_assessment` (jsonb)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage data
*/

-- Create rfq_requests table
CREATE TABLE IF NOT EXISTS rfq_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  model_name text NOT NULL,
  reference_model_id uuid REFERENCES models(id) ON DELETE SET NULL,
  target_uph integer,
  target_volume integer,
  notes text,
  status text DEFAULT 'draft',
  input_method text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE rfq_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read rfq_requests"
  ON rfq_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert rfq_requests"
  ON rfq_requests FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update rfq_requests"
  ON rfq_requests FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete rfq_requests"
  ON rfq_requests FOR DELETE
  TO authenticated
  USING (true);

-- Create rfq_stations table
CREATE TABLE IF NOT EXISTS rfq_stations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id uuid REFERENCES rfq_requests(id) ON DELETE CASCADE NOT NULL,
  board_type text NOT NULL,
  station_code text NOT NULL,
  sequence integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rfq_stations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read rfq_stations"
  ON rfq_stations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert rfq_stations"
  ON rfq_stations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update rfq_stations"
  ON rfq_stations FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete rfq_stations"
  ON rfq_stations FOR DELETE
  TO authenticated
  USING (true);

-- Create rfq_results table
CREATE TABLE IF NOT EXISTS rfq_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rfq_id uuid REFERENCES rfq_requests(id) ON DELETE CASCADE NOT NULL,
  matched_model_id uuid REFERENCES models(id) ON DELETE SET NULL,
  similarity_score numeric,
  matched_stations jsonb DEFAULT '[]',
  missing_stations jsonb DEFAULT '[]',
  investment_breakdown jsonb DEFAULT '{}',
  manpower_estimate jsonb DEFAULT '{}',
  risk_assessment jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rfq_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read rfq_results"
  ON rfq_results FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert rfq_results"
  ON rfq_results FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update rfq_results"
  ON rfq_results FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete rfq_results"
  ON rfq_results FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_rfq_requests_customer_id ON rfq_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_rfq_requests_status ON rfq_requests(status);
CREATE INDEX IF NOT EXISTS idx_rfq_requests_reference_model_id ON rfq_requests(reference_model_id);
CREATE INDEX IF NOT EXISTS idx_rfq_stations_rfq_id ON rfq_stations(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_results_rfq_id ON rfq_results(rfq_id);
CREATE INDEX IF NOT EXISTS idx_rfq_results_matched_model_id ON rfq_results(matched_model_id);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for rfq_requests updated_at
DROP TRIGGER IF EXISTS update_rfq_requests_updated_at ON rfq_requests;
CREATE TRIGGER update_rfq_requests_updated_at
  BEFORE UPDATE ON rfq_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
