-- =====================================================
-- ADD DESCRIPTIONS TO EXISTING SUPABASE DATABASE
-- =====================================================
-- 
-- Run this script in your Supabase SQL Editor to add
-- comprehensive descriptions to all tables and columns
-- 
-- This assumes your tables already exist and you want
-- to add descriptions without recreating them.
-- 
-- Database Structure: users + children tables (no ENUM types)
-- =====================================================

-- Note: Skipping ENUM type descriptions since they don't exist in your database

-- =====================================================
-- USERS TABLE DESCRIPTIONS
-- =====================================================

COMMENT ON TABLE public.users IS 'User profiles for parents, extending Supabase auth.users with parenting-specific information';
COMMENT ON COLUMN public.users.id IS 'Primary key referencing auth.users.id';
COMMENT ON COLUMN public.users.name IS 'Full name of the parent';
COMMENT ON COLUMN public.users.email IS 'Email address, must be unique across all users';
COMMENT ON COLUMN public.users.avatar_url IS 'URL to the user''s profile picture';
COMMENT ON COLUMN public.users.locale IS 'User''s preferred language/locale setting';
COMMENT ON COLUMN public.users.has_completed_onboarding IS 'Whether the user has completed the initial onboarding flow';
COMMENT ON COLUMN public.users.created_at IS 'Timestamp when the user record was created';
COMMENT ON COLUMN public.users.updated_at IS 'Timestamp when the user record was last updated';

-- =====================================================
-- CHILDREN TABLE DESCRIPTIONS (0-13 years)
-- =====================================================

COMMENT ON TABLE public.children IS 'Information about children (0-13 years) belonging to each parent user';
COMMENT ON COLUMN public.children.id IS 'Primary key, auto-generated UUID';
COMMENT ON COLUMN public.children.user_id IS 'Foreign key referencing the parent''s user ID from auth.users';
COMMENT ON COLUMN public.children.name IS 'Child''s name (1-100 characters)';
COMMENT ON COLUMN public.children.date_of_birth IS 'Child''s date of birth, used for age calculations and stage-based content (0-13 years supported)';
COMMENT ON COLUMN public.children.gender IS 'Child''s gender: male, female, or other';
COMMENT ON COLUMN public.children.notes IS 'Additional notes or information about the child';
COMMENT ON COLUMN public.children.created_at IS 'Timestamp when the child record was created';
COMMENT ON COLUMN public.children.updated_at IS 'Timestamp when the child record was last updated';

-- =====================================================
-- MILESTONES TABLE DESCRIPTIONS
-- =====================================================

COMMENT ON TABLE public.milestones IS 'Developmental milestones achieved by children, categorized by type';
COMMENT ON COLUMN public.milestones.id IS 'Primary key, auto-generated UUID';
COMMENT ON COLUMN public.milestones.child_id IS 'Foreign key referencing the child who achieved this milestone';
COMMENT ON COLUMN public.milestones.title IS 'Brief title of the milestone (1-100 characters)';
COMMENT ON COLUMN public.milestones.description IS 'Detailed description of the milestone achievement';
COMMENT ON COLUMN public.milestones.achieved_at IS 'Timestamp when the milestone was achieved';
COMMENT ON COLUMN public.milestones.milestone_type IS 'Category of milestone: physical, cognitive, social, or emotional';
COMMENT ON COLUMN public.milestones.created_at IS 'Timestamp when the milestone record was created';
COMMENT ON COLUMN public.milestones.updated_at IS 'Timestamp when the milestone record was last updated';

-- =====================================================
-- CHAT MESSAGES TABLE DESCRIPTIONS
-- =====================================================

COMMENT ON TABLE public.chat_messages IS 'Chat conversation history between users and the AI parenting assistant';
COMMENT ON COLUMN public.chat_messages.id IS 'Primary key, auto-generated UUID';
COMMENT ON COLUMN public.chat_messages.user_id IS 'Foreign key referencing the user who sent/received the message';
COMMENT ON COLUMN public.chat_messages.message IS 'The message content (user question or AI response)';
COMMENT ON COLUMN public.chat_messages.response IS 'AI response to user message (deprecated, use is_from_user instead)';
COMMENT ON COLUMN public.chat_messages.is_from_user IS 'True if message is from user, false if from AI assistant';
COMMENT ON COLUMN public.chat_messages.created_at IS 'Timestamp when the message was sent/received';

-- =====================================================
-- RESOURCES TABLE DESCRIPTIONS
-- =====================================================

COMMENT ON TABLE public.resources IS 'Educational content and resources for parents, organized by category and parenting stage';
COMMENT ON COLUMN public.resources.id IS 'Primary key, auto-generated UUID';
COMMENT ON COLUMN public.resources.title IS 'Title of the resource article or content';
COMMENT ON COLUMN public.resources.description IS 'Brief description or summary of the resource';
COMMENT ON COLUMN public.resources.content IS 'Full content of the resource (markdown or HTML)';
COMMENT ON COLUMN public.resources.category IS 'Category of the resource (e.g., Sleep, Feeding, Development)';
COMMENT ON COLUMN public.resources.parenting_stages IS 'Array of parenting stages this resource applies to';
COMMENT ON COLUMN public.resources.tags IS 'Array of tags for categorization and search';
COMMENT ON COLUMN public.resources.image_url IS 'URL to the resource''s featured image';
COMMENT ON COLUMN public.resources.is_featured IS 'Whether this resource should be featured prominently';
COMMENT ON COLUMN public.resources.created_at IS 'Timestamp when the resource was created';
COMMENT ON COLUMN public.resources.updated_at IS 'Timestamp when the resource was last updated';

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- 
-- Run these queries after executing the above to verify
-- that descriptions were added successfully:
-- 
-- -- Check table descriptions
-- SELECT 
--   schemaname,
--   tablename,
--   obj_description(oid) as table_description
-- FROM pg_tables pt
-- JOIN pg_class pc ON pc.relname = pt.tablename
-- WHERE schemaname = 'public'
-- AND obj_description(oid) IS NOT NULL;
-- 
-- -- Check column descriptions  
-- SELECT 
--   t.table_name,
--   c.column_name,
--   col_description(pgc.oid, c.ordinal_position) as column_description
-- FROM information_schema.tables t
-- JOIN information_schema.columns c ON c.table_name = t.table_name
-- JOIN pg_class pgc ON pgc.relname = t.table_name
-- WHERE t.table_schema = 'public'
-- AND col_description(pgc.oid, c.ordinal_position) IS NOT NULL
-- ORDER BY t.table_name, c.ordinal_position;
