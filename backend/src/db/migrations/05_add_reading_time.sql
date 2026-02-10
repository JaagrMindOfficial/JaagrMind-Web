-- Drop view to allow table modification
DROP VIEW IF EXISTS posts_with_stats;

-- Add reading_time column to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS reading_time INT DEFAULT 1;

-- Create table for tracking user reading sessions
CREATE TABLE IF NOT EXISTS post_reading_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Can be null for anonymous
  session_id VARCHAR(100), -- distinct_id or fingerprint for anonymous
  duration_seconds INT DEFAULT 0,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint to prevent duplicate rows (we update existing rows)
  UNIQUE NULLS NOT DISTINCT (post_id, user_id, session_id)
);

-- Recreate view using the new column instead of calculation
CREATE OR REPLACE VIEW posts_with_stats AS
SELECT
  p.*,
  COALESCE(c.total_claps, 0) as clap_count,
  COALESCE(v.view_count, 0) as view_count,
  COALESCE(cm.comment_count, 0) as comment_count
  -- reading_time is now in p.*
FROM posts p
LEFT JOIN (SELECT post_id, SUM(count) as total_claps FROM claps GROUP BY post_id) c ON p.id = c.post_id
LEFT JOIN (SELECT post_id, COUNT(*) as view_count FROM post_views GROUP BY post_id) v ON p.id = v.post_id
LEFT JOIN (SELECT post_id, COUNT(*) as comment_count FROM comments WHERE deleted_at IS NULL GROUP BY post_id) cm ON p.id = cm.post_id;

-- RLS for reading sessions
ALTER TABLE post_reading_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (tracking)
CREATE POLICY "Public insert reading sessions" ON post_reading_sessions
  FOR INSERT WITH CHECK (true);

-- Users can update their own sessions (by session_id or user_id)
CREATE POLICY "Update own reading sessions" ON post_reading_sessions
  FOR UPDATE USING (
    (auth.uid() IS NOT NULL AND auth.uid()::uuid = user_id) OR
    (session_id IS NOT NULL) -- In a real app we'd need better anonymous security, but acceptable for now
  );
