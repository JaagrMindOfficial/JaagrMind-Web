-- Add permission flags to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_delete_own_comments BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_delete_others_comments BOOLEAN DEFAULT FALSE;
