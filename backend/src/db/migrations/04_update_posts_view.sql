-- Drop the view first to allow column changes
DROP VIEW IF EXISTS posts_with_stats;

CREATE OR REPLACE VIEW posts_with_stats AS
SELECT
  p.*,
  COALESCE(c.total_claps, 0) as clap_count,
  COALESCE(v.view_count, 0) as view_count,
  COALESCE(cm.comment_count, 0) as comment_count,
  -- Reading time: ~200 words per minute
  GREATEST(1, ROUND(jsonb_array_length(p.content) * 0.5)) as reading_time
FROM posts p
LEFT JOIN (SELECT post_id, SUM(count) as total_claps FROM claps GROUP BY post_id) c ON p.id = c.post_id
LEFT JOIN (SELECT post_id, COUNT(*) as view_count FROM post_views GROUP BY post_id) v ON p.id = v.post_id
LEFT JOIN (SELECT post_id, COUNT(*) as comment_count FROM comments WHERE deleted_at IS NULL GROUP BY post_id) cm ON p.id = cm.post_id;
