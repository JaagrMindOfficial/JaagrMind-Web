-- Add is_staff_pick column to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_staff_pick BOOLEAN DEFAULT FALSE;

-- Index for faster querying
CREATE INDEX IF NOT EXISTS idx_posts_staff_pick ON posts(is_staff_pick) WHERE is_staff_pick = TRUE;

-- Update view to include is_staff_pick
DROP VIEW IF EXISTS posts_with_stats;
CREATE OR REPLACE VIEW posts_with_stats AS
SELECT
  p.*,
  COALESCE(c.total_claps, 0) as clap_count,
  COALESCE(v.view_count, 0) as view_count,
  COALESCE(cm.comment_count, 0) as comment_count
FROM posts p
LEFT JOIN (SELECT post_id, SUM(count) as total_claps FROM claps GROUP BY post_id) c ON p.id = c.post_id
LEFT JOIN (SELECT post_id, COUNT(*) as view_count FROM post_views GROUP BY post_id) v ON p.id = v.post_id
LEFT JOIN (SELECT post_id, COUNT(*) as comment_count FROM comments WHERE deleted_at IS NULL GROUP BY post_id) cm ON p.id = cm.post_id;
