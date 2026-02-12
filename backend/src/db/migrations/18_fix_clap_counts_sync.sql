-- Recalculate claps_count for all posts to ensure sync with claps table
UPDATE posts p
SET claps_count = (
    SELECT COALESCE(SUM(count), 0)
    FROM claps c
    WHERE c.post_id = p.id
);

-- Ensure the trigger is definitely enabled and correct
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_claps_count ON claps;
CREATE TRIGGER trg_update_claps_count
AFTER INSERT OR UPDATE OR DELETE ON claps
FOR EACH ROW EXECUTE FUNCTION update_post_claps_count();
