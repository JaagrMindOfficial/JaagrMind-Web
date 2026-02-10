-- ============================================================
-- Media Library Schema
-- Run this in Supabase SQL Editor to enable Media Library
-- ============================================================

CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  mimetype VARCHAR(100),
  size BIGINT,
  alt_text TEXT,
  tags TEXT[], -- Array of strings for filtering
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for searching tags (generalized for array search)
CREATE INDEX IF NOT EXISTS idx_media_tags ON media USING GIN(tags);

-- RLS Policies
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Authors and above can insert/update/delete their own media
-- Editors/Admins can manage all
-- For simplicity in this iteration: Authors can manage own, Editors+ all.
-- But usually media is shared. Let's allow all authors to read all media, but only manage own?
-- view definition check
-- Editors+ can Update/Delete any. Authors can Update/Delete own.

-- Read: Public (since images are public on website) or Auth? 
-- The table entries are for admin. The URLs are public.
-- Allow Auth users (Authors+) to read the media library list.

CREATE POLICY "Authors can view media library" ON media
  FOR SELECT
  USING (auth.uid() IN (SELECT id FROM users WHERE role IN ('author', 'editor', 'admin')));

CREATE POLICY "Authors can upload media" ON media
  FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role IN ('author', 'editor', 'admin')));

CREATE POLICY "Authors can update own media" ON media
  FOR UPDATE
  USING (
    uploaded_by = auth.uid() OR 
    auth.uid() IN (SELECT id FROM users WHERE role IN ('editor', 'admin'))
  );

CREATE POLICY "Authors can delete own media" ON media
  FOR DELETE
  USING (
    uploaded_by = auth.uid() OR 
    auth.uid() IN (SELECT id FROM users WHERE role IN ('editor', 'admin'))
  );
