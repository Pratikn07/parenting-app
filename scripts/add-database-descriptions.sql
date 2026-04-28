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
-- BABIES TABLE DESCRIPTIONS (will rename to children later)
-- =====================================================

COMMENT ON TABLE public.babies IS 'Information about children/babies (0-13 years) belonging to each parent user';
COMMENT ON COLUMN public.babies.id IS 'Primary key, auto-generated UUID';
COMMENT ON COLUMN public.babies.user_id IS 'Foreign key referencing the parent''s user ID from auth.users';
COMMENT ON COLUMN public.babies.name IS 'Child''s name';
COMMENT ON COLUMN public.babies.date_of_birth IS 'Child''s date of birth, used for age calculations and stage-based content (0-13 years supported)';
COMMENT ON COLUMN public.babies.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN public.babies.updated_at IS 'Timestamp when the record was last updated';

-- =====================================================
-- ALL TABLE DESCRIPTIONS
-- =====================================================

-- Articles table
COMMENT ON TABLE public.articles IS 'Educational articles and content for parents';

-- Chat messages table  
COMMENT ON TABLE public.chat_messages IS 'Chat conversation history between users and the AI parenting assistant';

-- Chat sessions table
COMMENT ON TABLE public.chat_sessions IS 'Chat session management for organizing conversations';

-- Checklist items table
COMMENT ON TABLE public.checklist_items IS 'Individual items within parenting checklists';

-- Checklists table
COMMENT ON TABLE public.checklists IS 'Parenting checklists and task lists for users';

-- Devices table
COMMENT ON TABLE public.devices IS 'User device information for push notifications and app management';

-- Embeddings table
COMMENT ON TABLE public.embeddings IS 'Vector embeddings for AI-powered content recommendations and search';

-- Growth measurements table
COMMENT ON TABLE public.growth_measurements IS 'Physical growth tracking data for children (height, weight, etc.)';

-- Milestones table
COMMENT ON TABLE public.milestones IS 'Developmental milestones achieved by children, categorized by type';

-- Onboarding responses table
COMMENT ON TABLE public.onboarding_responses IS 'User responses collected during the onboarding process';

-- Reminders table
COMMENT ON TABLE public.reminders IS 'Scheduled reminders and notifications for parents';

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
