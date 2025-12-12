/*
  # Fix RLS Policies for Anon Users
  
  Problem: AI Agent uses anon key but RLS only allows authenticated users
  Solution: Add policies to allow anon users read access
  
  Run this in Supabase SQL Editor to fix database access errors
*/

-- Drop existing policies first (if any)
DROP POLICY IF EXISTS "Anon users can read customers" ON customers;
DROP POLICY IF EXISTS "Anon users can read models" ON models;
DROP POLICY IF EXISTS "Anon users can read model_stations" ON model_stations;
DROP POLICY IF EXISTS "Anon users can read station_master" ON station_master;
DROP POLICY IF EXISTS "Anon users can read station_aliases" ON station_aliases;

-- Create new policies for anon users
CREATE POLICY "Anon users can read customers"
  ON customers FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon users can read models"
  ON models FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon users can read model_stations"
  ON model_stations FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon users can read station_master"
  ON station_master FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon users can read station_aliases"
  ON station_aliases FOR SELECT
  TO anon
  USING (true);

-- Verify policies created
SELECT tablename, policyname, roles 
FROM pg_policies 
WHERE tablename IN ('customers', 'models', 'model_stations', 'station_master', 'station_aliases')
  AND 'anon' = ANY(roles)
ORDER BY tablename;
