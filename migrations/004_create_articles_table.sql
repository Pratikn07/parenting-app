-- Migration: Create articles table for age-appropriate parenting content
-- This table stores expert-written educational articles with precise age-based filtering

-- =====================================================
-- 1. Create articles table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  body_md TEXT NOT NULL,
  age_min_days INTEGER,
  age_max_days INTEGER,
  tags TEXT[],
  locale TEXT DEFAULT 'en-US' NOT NULL,
  last_reviewed_at TIMESTAMPTZ,
  reviewer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. Add table and column comments
-- =====================================================

COMMENT ON TABLE public.articles IS 'Expert-written parenting articles with age-based filtering for personalized recommendations';
COMMENT ON COLUMN public.articles.id IS 'Primary key';
COMMENT ON COLUMN public.articles.slug IS 'URL-friendly unique identifier for SEO';
COMMENT ON COLUMN public.articles.title IS 'Article headline displayed to users';
COMMENT ON COLUMN public.articles.body_md IS 'Full article content in markdown format';
COMMENT ON COLUMN public.articles.age_min_days IS 'Minimum child age in days (null = all ages/expecting)';
COMMENT ON COLUMN public.articles.age_max_days IS 'Maximum child age in days (null = all ages)';
COMMENT ON COLUMN public.articles.tags IS 'Array of tags for categorization (sleep, feeding, development, etc.)';
COMMENT ON COLUMN public.articles.locale IS 'Language/region code for internationalization';
COMMENT ON COLUMN public.articles.last_reviewed_at IS 'Timestamp of last content review for freshness tracking';
COMMENT ON COLUMN public.articles.reviewer IS 'Name/ID of person who last reviewed content';
COMMENT ON COLUMN public.articles.created_at IS 'Timestamp when article was created';
COMMENT ON COLUMN public.articles.updated_at IS 'Timestamp when article was last modified';

-- =====================================================
-- 3. Enable Row Level Security
-- =====================================================

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Articles are educational content - publicly readable by all authenticated users
CREATE POLICY "Anyone can view articles"
  ON public.articles FOR SELECT
  USING (true);

-- Only admins can insert/update articles (implement admin role later if needed)
-- For now, articles are managed via migrations and direct SQL

-- =====================================================
-- 4. Create performance indexes
-- =====================================================

-- Most common query: age-based filtering
-- Enables fast lookups like "show articles for 45-day-old baby"
CREATE INDEX IF NOT EXISTS idx_articles_age_range 
  ON public.articles(age_min_days, age_max_days);

-- Tag-based search using GIN index for array contains queries
-- Enables fast lookups like "find all 'sleep' articles"
CREATE INDEX IF NOT EXISTS idx_articles_tags 
  ON public.articles USING GIN(tags);

-- Locale filtering for internationalization
CREATE INDEX IF NOT EXISTS idx_articles_locale 
  ON public.articles(locale);

-- SEO-friendly slug lookups
CREATE INDEX IF NOT EXISTS idx_articles_slug 
  ON public.articles(slug);

-- =====================================================
-- 5. Create updated_at trigger
-- =====================================================

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to articles table
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Migration complete
-- =====================================================
-- Next step: Run 005_seed_articles.sql to insert 27 articles
