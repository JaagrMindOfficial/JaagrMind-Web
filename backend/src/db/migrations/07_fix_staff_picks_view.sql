-- Ensure column exists (idempotent)
ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_staff_pick BOOLEAN DEFAULT FALSE;

-- Drop and recreate view to ensure new column is included
DROP VIEW IF EXISTS posts_with_stats;

CREATE OR REPLACE VIEW posts_with_stats AS
SELECT
  p.id,
  p.author_id,
  p.publication_id,
  p.title,
  p.subtitle,
  p.slug,
  p.content,
  p.cover_url,
  p.status,
  p.published_at,
  p.created_at,
  p.updated_at,
  p.deleted_at,
  p.reading_time,
  p.is_staff_pick, -- Explicitly including the new column
  COALESCE(c.total_claps, 0) as clap_count,
  COALESCE(v.view_count, 0) as view_count,
  COALESCE(cm.comment_count, 0) as comment_count
FROM posts p
LEFT JOIN (SELECT post_id, SUM(count) as total_claps FROM claps GROUP BY post_id) c ON p.id = c.post_id
LEFT JOIN (SELECT post_id, COUNT(*) as view_count FROM post_views GROUP BY post_id) v ON p.id = v.post_id
LEFT JOIN (SELECT post_id, COUNT(*) as comment_count FROM comments WHERE deleted_at IS NULL GROUP BY post_id) cm ON p.id = cm.post_id;
