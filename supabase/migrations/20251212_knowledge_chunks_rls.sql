-- RLS Policies for Knowledge Chunks Table
-- Run this after the main migration

-- Enable RLS
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- Allow anon users FULL access (for development - AI Agent ingest & search)
-- In production, restrict to SELECT only and use service_role for writes
DROP POLICY IF EXISTS "Anon users can read knowledge_chunks" ON knowledge_chunks;
DROP POLICY IF EXISTS "Anon full access knowledge_chunks" ON knowledge_chunks;
CREATE POLICY "Anon full access knowledge_chunks"
  ON knowledge_chunks FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users full access
DROP POLICY IF EXISTS "Authenticated users can manage knowledge_chunks" ON knowledge_chunks;
CREATE POLICY "Authenticated users can manage knowledge_chunks"
  ON knowledge_chunks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow service role full access (for API)
DROP POLICY IF EXISTS "Service role full access to knowledge_chunks" ON knowledge_chunks;
CREATE POLICY "Service role full access to knowledge_chunks"
  ON knowledge_chunks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Verify
SELECT tablename, policyname, roles 
FROM pg_policies 
WHERE tablename = 'knowledge_chunks';
