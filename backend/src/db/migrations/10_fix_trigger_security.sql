-- Update the function to be SECURITY DEFINER
-- This ensures it runs with the privileges of the function creator (admin),
-- allowing it to update profiles of other users (e.g. incrementing followers_count)
-- even if RLS normally blocks users from updating other profiles.

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
$$ LANGUAGE plpgsql SECURITY DEFINER;
