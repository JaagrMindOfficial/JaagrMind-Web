-- Add hierarchy support to topics
ALTER TABLE topics
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES topics(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS level INT DEFAULT 0;

-- Create index for parent_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_topics_parent_id ON topics(parent_id);

-- Seed Root Categories (if they don't exist)
INSERT INTO topics (name, slug, description, level, parent_id)
VALUES 
  ('Life', 'life', 'Explore the complexities of life, family, and personal growth.', 0, NULL),
  ('Self Improvement', 'self-improvement', 'Unlock your potential with tips on productivity, mental health, and mindfulness.', 0, NULL),
  ('Work', 'work', 'Insights on career, leadership, and entrepreneurship.', 0, NULL),
  ('Technology', 'technology', 'The latest in code, gadgets, and the future of tech.', 0, NULL),
  ('Programming', 'programming', 'Coding tutorials, languages, and software engineering.', 0, NULL), -- Will move this to Technology later if needed
  ('Relationships', 'relationships', 'Love, friendship, and social dynamics.', 0, NULL) -- Will move to Life
ON CONFLICT (slug) DO NOTHING;

-- Now let's organize some existing topics (or newly inserted ones) into hierarchy
-- We use a DO block to dynamically find IDs and update them

DO $$
DECLARE
  life_id UUID;
  self_id UUID;
  work_id UUID;
  tech_id UUID;
BEGIN
  -- Get Root IDs
  SELECT id INTO life_id FROM topics WHERE slug = 'life';
  SELECT id INTO self_id FROM topics WHERE slug = 'self-improvement';
  SELECT id INTO work_id FROM topics WHERE slug = 'work';
  SELECT id INTO tech_id FROM topics WHERE slug = 'technology';

  -- Create/Update Sub-topics for LIFE
  INSERT INTO topics (name, slug, level, parent_id) VALUES 
    ('Family', 'family', 1, life_id),
    ('Health', 'health', 1, life_id),
    ('Adoption', 'adoption', 2, (SELECT id FROM topics WHERE slug = 'family')), -- assuming family text insert works or we fetch it? nesting inserts is tricky in one go.
    ('Children', 'children', 2, (SELECT id FROM topics WHERE slug = 'family'))
  ON CONFLICT (slug) DO UPDATE SET level = EXCLUDED.level, parent_id = EXCLUDED.parent_id;

  -- Update Relationships to be under Life
  UPDATE topics SET parent_id = life_id, level = 1 WHERE slug = 'relationships';

  -- Create/Update Sub-topics for WORK
  INSERT INTO topics (name, slug, level, parent_id) VALUES
    ('Business', 'business', 1, work_id),
    ('Freelancing', 'freelancing', 1, work_id),
    ('Startups', 'startups', 1, work_id),
    ('Marketing', 'marketing', 1, work_id)
  ON CONFLICT (slug) DO UPDATE SET level = EXCLUDED.level, parent_id = EXCLUDED.parent_id;

  -- Create/Update Sub-topics for SELF IMPROVEMENT
  INSERT INTO topics (name, slug, level, parent_id) VALUES
    ('Mental Health', 'mental-health', 1, self_id),
    ('Productivity', 'productivity', 1, self_id),
    ('Mindfulness', 'mindfulness', 1, self_id)
  ON CONFLICT (slug) DO UPDATE SET level = EXCLUDED.level, parent_id = EXCLUDED.parent_id;

  -- Create/Update Sub-topics for TECHNOLOGY
  UPDATE topics SET parent_id = tech_id, level = 1 WHERE slug = 'programming';
  
  INSERT INTO topics (name, slug, level, parent_id) VALUES
    ('Artificial Intelligence', 'ai', 1, tech_id),
    ('Machine Learning', 'machine-learning', 1, tech_id),
    ('Data Science', 'data-science', 1, tech_id)
  ON CONFLICT (slug) DO UPDATE SET level = EXCLUDED.level, parent_id = EXCLUDED.parent_id;

END $$;
