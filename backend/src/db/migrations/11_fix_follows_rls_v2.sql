-- Drop existing policies to avoid conflicts or stale definitions
DROP POLICY IF EXISTS "Public follows are viewable by everyone" ON follows;
DROP POLICY IF EXISTS "Users can follow others" ON follows;
DROP POLICY IF EXISTS "Users can unfollow" ON follows;

-- Ensure RLS is enabled
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Re-create policies with explicit syntax
CREATE POLICY "Public follows are viewable by everyone" 
ON follows FOR SELECT 
USING (true);

-- Allow authenticated users to follow others
-- The WITH CHECK clause ensures that the new row's follower_id matches the authenticated user
CREATE POLICY "Users can follow others" 
ON follows FOR INSERT 
WITH CHECK (auth.uid() = follower_id);

-- Allow users to unfollow (delete their own follow records)
CREATE POLICY "Users can unfollow" 
ON follows FOR DELETE 
USING (auth.uid() = follower_id);
