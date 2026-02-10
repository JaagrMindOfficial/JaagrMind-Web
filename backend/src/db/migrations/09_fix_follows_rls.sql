-- Enable RLS on follows table
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read follows (needed for counts, "who to follow", etc.)
CREATE POLICY "Public follows are viewable by everyone" 
ON follows FOR SELECT 
USING (true);

-- Allow authenticated users to follow others
CREATE POLICY "Users can follow others" 
ON follows FOR INSERT 
WITH CHECK (auth.uid() = follower_id);

-- Allow users to unfollow (delete their own follow records)
CREATE POLICY "Users can unfollow" 
ON follows FOR DELETE 
USING (auth.uid() = follower_id);
