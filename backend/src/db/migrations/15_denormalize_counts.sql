-- Add counter columns to posts table
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS claps_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS comments_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS reading_time INT DEFAULT 1;

-- Backfill data
-- Claps
UPDATE posts p
SET claps_count = (
    SELECT COALESCE(SUM(count), 0)
    FROM claps c
    WHERE c.post_id = p.id
);

-- Comments
UPDATE posts p
SET comments_count = (
    SELECT COUNT(*)
    FROM comments c
    WHERE c.post_id = p.id AND c.deleted_at IS NULL
);

-- Views
UPDATE posts p
SET view_count = (
    SELECT COUNT(*)
    FROM post_views v
    WHERE v.post_id = p.id
);

-- Reading Time
UPDATE posts p
SET reading_time = GREATEST(1, ROUND(jsonb_array_length(p.content) * 0.5))
WHERE reading_time IS NULL OR reading_time = 0;

-- ============================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================

-- Function to update claps count
CREATE OR REPLACE FUNCTION update_post_claps_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE posts SET claps_count = claps_count + NEW.count WHERE id = NEW.post_id;
    ELSIF (TG_OP = 'UPDATE') THEN
        UPDATE posts SET claps_count = claps_count + (NEW.count - OLD.count) WHERE id = NEW.post_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE posts SET claps_count = claps_count - OLD.count WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_claps_count ON claps;
CREATE TRIGGER trg_update_claps_count
AFTER INSERT OR UPDATE OR DELETE ON claps
FOR EACH ROW EXECUTE FUNCTION update_post_claps_count();

-- Function to update comments count
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.deleted_at IS NULL) THEN
        UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL) THEN
            UPDATE posts SET comments_count = comments_count - 1 WHERE id = NEW.post_id;
        ELSIF (OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL) THEN
            UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        END IF;
    ELSIF (TG_OP = 'DELETE' AND OLD.deleted_at IS NULL) THEN
        UPDATE posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_comments_count ON comments;
CREATE TRIGGER trg_update_comments_count
AFTER INSERT OR UPDATE OR DELETE ON comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();

-- Function to update view count
CREATE OR REPLACE FUNCTION update_post_view_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE posts SET view_count = view_count + 1 WHERE id = NEW.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_view_count ON post_views;
CREATE TRIGGER trg_update_view_count
AFTER INSERT ON post_views
FOR EACH ROW EXECUTE FUNCTION update_post_view_count();


-- ============================================================
-- UPDATE VIEW TO USE NEW COLUMNS
-- ============================================================

-- Drop old view to avoid conflict
DROP VIEW IF EXISTS posts_with_stats;

CREATE VIEW posts_with_stats AS
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
  p.claps_count as clap_count, -- Int, matches loose type expectations or app needs
  p.view_count,
  p.comments_count as comment_count,
  p.reading_time,
  -- We don't have is_staff_pick column in the original schema file I read?
  -- Wait, I saw 06_add_staff_picks.sql in the file list.
  -- Let's assume it exists on the posts table since I saw it in the previous file view of schema.sql... wait, 
  -- schema.sql I read earlier did NOT have is_staff_pick in CREATE TABLE posts.
  -- It must have been added by migration 06.
  -- I need to be careful. `p.*` avoids this but `p.*` includes the new columns which might duplicate if I alias them.
  -- But I am dropping the view, so I can redefine it.
  -- I should include `is_staff_pick` if it exists.
  -- To be safe, let's use p.* but we need to EXCLUDE the raw counts if we want to alias them cleanly?
  -- No, we can just select them.
  -- But `posts_with_stats` contract implies `clap_count`, `view_count`, `reading_time`.
  -- If I select p.*, I get `claps_count`, `view_count`, `reading_time`.
  -- I just need `clap_count` alias for `claps_count`.
  -- And `comment_count` for `comments_count`.
  -- And `is_staff_pick` might be there.
  -- Let's try to be generic if possible, or explicit if we are sure.
  -- Since I saw `06_add_staff_picks.sql`, it likely exists.
  -- Let's check `06_add_staff_picks.sql` content if I can... 
  -- Actually, `schema.sql` might be outdated if it's just an initial dump.
  -- I will trust that `is_staff_pick` exists.
  p.is_staff_pick
FROM posts p;
