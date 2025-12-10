-- =====================================================
-- CHAT HISTORY TABLES FOR RFQ AI SYSTEM
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Chat Sessions Table (stores conversations)
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User info (optional, for multi-user support)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Session metadata
  title TEXT NOT NULL DEFAULT 'New Chat',
  preview TEXT,                              -- First message snippet
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  
  -- Counters
  message_count INTEGER DEFAULT 0,
  station_count INTEGER DEFAULT 0,           -- Extracted stations count
  model_count INTEGER DEFAULT 0,             -- Similar models found
  
  -- RFQ data (optional, links to RFQ if created)
  rfq_id UUID REFERENCES rfq_requests(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Chat Messages Table (stores individual messages)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Parent session
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  
  -- Message content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  
  -- File attachments (JSON array)
  files JSONB DEFAULT '[]'::jsonb,
  -- Example: [{"name": "file.xlsx", "type": "application/...", "size": 1234, "url": "..."}]
  
  -- Extracted data (for assistant messages)
  extracted_stations JSONB DEFAULT NULL,     -- Station list extracted from files
  similar_models JSONB DEFAULT NULL,         -- Similar models found
  cost_summary JSONB DEFAULT NULL,           -- Cost calculation results
  
  -- Message metadata
  processing_time_ms INTEGER,                -- How long AI took to respond
  model_used TEXT,                           -- LLM model used (gemini-2.0-flash, etc)
  confidence DECIMAL(3,2),                   -- AI confidence score
  
  -- Sequence
  sequence INTEGER NOT NULL,                 -- Message order in session
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message ON chat_sessions(last_message_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_role ON chat_messages(role);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sequence ON chat_messages(session_id, sequence);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for chat_sessions
-- Users can only see their own sessions
CREATE POLICY "Users can view own sessions" 
  ON chat_sessions FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" 
  ON chat_sessions FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" 
  ON chat_sessions FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" 
  ON chat_sessions FOR DELETE 
  TO authenticated 
  USING (auth.uid() = user_id);

-- Allow anonymous access for development (remove in production)
CREATE POLICY "Anon can do all - DEV ONLY" 
  ON chat_sessions FOR ALL 
  TO anon 
  USING (true) 
  WITH CHECK (true);

-- Policies for chat_messages
CREATE POLICY "Users can view messages in own sessions" 
  ON chat_messages FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND chat_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in own sessions" 
  ON chat_messages FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_sessions 
      WHERE chat_sessions.id = chat_messages.session_id 
      AND chat_sessions.user_id = auth.uid()
    )
  );

-- Allow anonymous access for development (remove in production)
CREATE POLICY "Anon can do all messages - DEV ONLY" 
  ON chat_messages FOR ALL 
  TO anon 
  USING (true) 
  WITH CHECK (true);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at on chat_sessions
CREATE OR REPLACE FUNCTION update_chat_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chat_session_timestamp
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_session_timestamp();

-- Auto-update message_count and last_message_at when message inserted
CREATE OR REPLACE FUNCTION update_session_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_sessions 
  SET 
    message_count = message_count + 1,
    last_message_at = NEW.created_at,
    preview = CASE 
      WHEN NEW.role = 'user' THEN LEFT(NEW.content, 100)
      ELSE preview
    END
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_on_message
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_session_on_message();

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Uncomment to insert sample data
/*
INSERT INTO chat_sessions (id, title, preview, status) VALUES
  ('00000000-0000-0000-0000-000000000001', 'XIAOMI 5G Pro Analysis', 'Analyze station list for new model...', 'active'),
  ('00000000-0000-0000-0000-000000000002', 'TCL Tablet RFQ', 'Need cost estimate for TCL tablet...', 'active');

INSERT INTO chat_messages (session_id, role, content, sequence) VALUES
  ('00000000-0000-0000-0000-000000000001', 'user', 'Analyze station list for new XIAOMI 5G Pro model', 1),
  ('00000000-0000-0000-0000-000000000001', 'assistant', 'I found 11 stations in your request. Let me search for similar models...', 2),
  ('00000000-0000-0000-0000-000000000002', 'user', 'Need cost estimate for TCL tablet production', 1);
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Run these to verify tables created:
-- SELECT * FROM chat_sessions LIMIT 5;
-- SELECT * FROM chat_messages LIMIT 5;
-- SELECT COUNT(*) FROM chat_sessions;
-- SELECT COUNT(*) FROM chat_messages;
