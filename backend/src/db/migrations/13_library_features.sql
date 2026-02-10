-- Saved Posts (Reading List)
CREATE TABLE IF NOT EXISTS saved_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, post_id)
);

-- Reading History
CREATE TABLE IF NOT EXISTS reading_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, post_id)
);

-- RLS for Saved Posts
ALTER TABLE saved_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved posts"
  ON saved_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved posts"
  ON saved_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved posts"
  ON saved_posts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS for Reading History
ALTER TABLE reading_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own history"
  ON reading_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert/update their own history"
  ON reading_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own history"
  ON reading_history FOR UPDATE
  USING (auth.uid() = user_id);
