-- ============================================================
-- JaagrMind Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS & PROFILES
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  role TEXT DEFAULT 'reader' CHECK (role IN ('admin', 'editor', 'author', 'reader')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,  -- Soft delete
  can_delete_own_comments BOOLEAN DEFAULT TRUE,
  can_delete_others_comments BOOLEAN DEFAULT FALSE
);

CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CONTENT
-- ============================================================
CREATE TABLE topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  cover_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) UNIQUE NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  owner_id UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  publication_id UUID REFERENCES publications(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  subtitle TEXT,
  slug VARCHAR(500) NOT NULL,
  content JSONB NOT NULL DEFAULT '[]',
  cover_url TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,  -- Soft delete

  -- Slug unique per author (allows same slug by different authors)
  UNIQUE(author_id, slug)
);

CREATE TABLE post_topics (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, topic_id)
);

-- ============================================================
-- ENGAGEMENT
-- ============================================================
CREATE TABLE claps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id VARCHAR(100),
  count INT DEFAULT 1 CHECK (count BETWEEN 1 AND 50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE NULLS NOT DISTINCT (post_id, user_id),
  UNIQUE NULLS NOT DISTINCT (post_id, session_id)
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ  -- Soft delete
);

CREATE TABLE bookmarks (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, post_id)
);

CREATE TABLE follows (
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)  -- Prevent self-follow
);

CREATE TABLE topic_follows (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, topic_id)
);

-- ============================================================
-- ANALYTICS
-- ============================================================
CREATE TABLE post_views (
  id BIGSERIAL PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_posts_feed ON posts(status, published_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_posts_author ON posts(author_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_claps_post ON claps(post_id);
CREATE INDEX idx_comments_post ON comments(post_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_post_views_post ON post_views(post_id, viewed_at DESC);
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);

-- ============================================================
-- VIEWS (Computed Fields)
-- ============================================================
CREATE OR REPLACE VIEW posts_with_stats AS
SELECT
  p.*,
  COALESCE(c.total_claps, 0) as clap_count,
  COALESCE(v.view_count, 0) as view_count,
  -- Reading time: ~200 words per minute
  GREATEST(1, ROUND(jsonb_array_length(p.content) * 0.5)) as reading_time
FROM posts p
LEFT JOIN (SELECT post_id, SUM(count) as total_claps FROM claps GROUP BY post_id) c ON p.id = c.post_id
LEFT JOIN (SELECT post_id, COUNT(*) as view_count FROM post_views GROUP BY post_id) v ON p.id = v.post_id;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Anyone can read published posts
CREATE POLICY "Public read published posts" ON posts
  FOR SELECT USING (status = 'published' AND deleted_at IS NULL);

-- Authors can manage their own posts
CREATE POLICY "Authors manage own posts" ON posts
  FOR ALL USING (auth.uid()::uuid = author_id);

-- Anyone can read comments on published posts
CREATE POLICY "Public read comments" ON comments
  FOR SELECT USING (
    deleted_at IS NULL AND 
    EXISTS (SELECT 1 FROM posts WHERE id = post_id AND status = 'published')
  );

-- Authenticated users can add comments
CREATE POLICY "Auth users add comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can manage their own bookmarks
CREATE POLICY "Users manage own bookmarks" ON bookmarks
  FOR ALL USING (auth.uid()::uuid = user_id);

-- Users can manage their own follows
CREATE POLICY "Users manage own follows" ON follows
  FOR ALL USING (auth.uid()::uuid = follower_id);
