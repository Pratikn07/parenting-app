-- Migration: Create saved_articles table for tracking bookmarked articles
-- This table maintains persistent save state for articles (separate from activity log)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create saved_articles table
CREATE TABLE IF NOT EXISTS saved_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure a user can only save an article once
  UNIQUE(user_id, article_id)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_saved_articles_user_id ON saved_articles(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_articles_article_id ON saved_articles(article_id);
CREATE INDEX IF NOT EXISTS idx_saved_articles_created_at ON saved_articles(created_at);

-- Enable Row Level Security
ALTER TABLE saved_articles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own saved articles
CREATE POLICY "Users can view their own saved articles"
  ON saved_articles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save articles"
  ON saved_articles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave their own articles"
  ON saved_articles FOR DELETE
  USING (auth.uid() = user_id);

-- Add index on user_activity_log.created_at for date range queries
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at 
  ON user_activity_log(created_at);

CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_activity 
  ON user_activity_log(user_id, activity_type);

-- Comments for documentation
COMMENT ON TABLE saved_articles IS 'Stores user bookmarked/saved articles for quick access';
COMMENT ON COLUMN saved_articles.user_id IS 'Reference to the user who saved the article';
COMMENT ON COLUMN saved_articles.article_id IS 'Reference to the saved article';
COMMENT ON COLUMN saved_articles.created_at IS 'Timestamp when the article was saved';

