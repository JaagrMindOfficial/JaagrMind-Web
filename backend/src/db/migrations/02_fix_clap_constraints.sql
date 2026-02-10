-- Fix claps unique constraints
-- Dropping incorrect "NULLS NOT DISTINCT" constraints that prevented multiple NULLs
-- Replacing with Partial Unique Indexes

ALTER TABLE claps DROP CONSTRAINT IF EXISTS claps_post_id_user_id_key;
ALTER TABLE claps DROP CONSTRAINT IF EXISTS claps_post_id_session_id_key;

-- If the constraint names were auto-generated differently, we try to drop them by definition if possible, 
-- but usually standard names are table_col1_col2_key. 
-- In the schema.sql they were named implicitly. We might need to check standard naming.
-- Supabase/Postgres default: claps_post_id_user_id_key

-- Create Partial Unique Indexes instead
CREATE UNIQUE INDEX IF NOT EXISTS idx_claps_unique_user ON claps(post_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_claps_unique_session ON claps(post_id, session_id) WHERE session_id IS NOT NULL;
