-- Add counts to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;

-- Function to update counts on follow/unfollow
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- Increment following_count for the follower
    UPDATE profiles 
    SET following_count = following_count + 1 
    WHERE user_id = NEW.follower_id;

    -- Increment followers_count for the target (following)
    UPDATE profiles 
    SET followers_count = followers_count + 1 
    WHERE user_id = NEW.following_id;
    
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    -- Decrement following_count for the follower
    UPDATE profiles 
    SET following_count = GREATEST(0, following_count - 1) 
    WHERE user_id = OLD.follower_id;

    -- Decrement followers_count for the target (following)
    UPDATE profiles 
    SET followers_count = GREATEST(0, followers_count - 1) 
    WHERE user_id = OLD.following_id;
    
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
DROP TRIGGER IF EXISTS on_follow_change ON follows;
CREATE TRIGGER on_follow_change
AFTER INSERT OR DELETE ON follows
FOR EACH ROW
EXECUTE FUNCTION update_follow_counts();

-- Backfill existing counts (in case there's data already)
WITH follower_counts AS (
  SELECT following_id, COUNT(*) as count 
  FROM follows 
  GROUP BY following_id
)
UPDATE profiles p
SET followers_count = fc.count
FROM follower_counts fc
WHERE p.user_id = fc.following_id;

WITH following_counts AS (
  SELECT follower_id, COUNT(*) as count 
  FROM follows 
  GROUP BY follower_id
)
UPDATE profiles p
SET following_count = fc.count
FROM following_counts fc
WHERE p.user_id = fc.follower_id;
