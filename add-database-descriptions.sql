-- =====================================================
-- ADD DESCRIPTIONS TO EXISTING SUPABASE DATABASE
-- =====================================================
-- 
-- Run this script in your Supabase SQL Editor to add
-- comprehensive descriptions to all tables and columns
-- 
-- This assumes your tables already exist and you want
-- to add descriptions without recreating them.
-- =====================================================

-- Add descriptions for ENUM types
COMMENT ON TYPE parenting_stage IS 'Stages of parenting journey: expecting (pregnancy), newborn (0-3 months), infant (3-12 months), toddler (1-3 years)';
COMMENT ON TYPE feeding_preference IS 'Feeding methods: breastfeeding (exclusively breast milk), formula (exclusively formula), mixed (combination)';
COMMENT ON TYPE milestone_type IS 'Categories of child development milestones: physical (motor skills), cognitive (thinking/learning), social (interaction), emotional (feelings/behavior)';
COMMENT ON TYPE gender IS 'Gender options: male, female, or other for inclusive representation';

-- =====================================================
-- PROFILES TABLE DESCRIPTIONS
-- =====================================================

COMMENT ON TABLE public.profiles IS 'User profiles for parents, extending Supabase auth.users with parenting-specific information';
COMMENT ON COLUMN public.profiles.id IS 'Primary key referencing auth.users.id';
COMMENT ON COLUMN public.profiles.name IS 'Full name of the parent (2-50 characters)';
COMMENT ON COLUMN public.profiles.email IS 'Email address, must be unique across all users';
COMMENT ON COLUMN public.profiles.parenting_stage IS 'Current parenting stage: expecting, newborn, infant, or toddler';
COMMENT ON COLUMN public.profiles.feeding_preference IS 'Preferred feeding method: breastfeeding, formula, or mixed';
COMMENT ON COLUMN public.profiles.has_completed_onboarding IS 'Whether the user has completed the initial onboarding flow';
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL to the user''s profile picture';
COMMENT ON COLUMN public.profiles.created_at IS 'Timestamp when the profile was created';
COMMENT ON COLUMN public.profiles.updated_at IS 'Timestamp when the profile was last updated';

-- =====================================================
-- USERS TABLE DESCRIPTIONS (if using users instead of profiles)
-- =====================================================

-- Uncomment these if you're using a 'users' table instead of 'profiles'
-- COMMENT ON TABLE public.users IS 'User profiles for parents, extending Supabase auth.users with parenting-specific information';
-- COMMENT ON COLUMN public.users.id IS 'Primary key referencing auth.users.id';
-- COMMENT ON COLUMN public.users.name IS 'Full name of the parent';
-- COMMENT ON COLUMN public.users.email IS 'Email address, must be unique across all users';
-- COMMENT ON COLUMN public.users.avatar_url IS 'URL to the user''s profile picture';
-- COMMENT ON COLUMN public.users.locale IS 'User''s preferred language/locale setting';
-- COMMENT ON COLUMN public.users.has_completed_onboarding IS 'Whether the user has completed the initial onboarding flow';
-- COMMENT ON COLUMN public.users.created_at IS 'Timestamp when the user record was created';
-- COMMENT ON COLUMN public.users.updated_at IS 'Timestamp when the user record was last updated';

-- =====================================================
-- CHILDREN/BABIES TABLE DESCRIPTIONS
-- =====================================================

-- For 'children' table
COMMENT ON TABLE public.children IS 'Information about children/babies belonging to each parent user';
COMMENT ON COLUMN public.children.id IS 'Primary key, auto-generated UUID';
COMMENT ON COLUMN public.children.parent_id IS 'Foreign key referencing the parent''s profile ID';
COMMENT ON COLUMN public.children.name IS 'Child''s name (1-50 characters)';
COMMENT ON COLUMN public.children.birth_date IS 'Child''s date of birth, used for age calculations and milestone tracking';
COMMENT ON COLUMN public.children.gender IS 'Child''s gender: male, female, or other';
COMMENT ON COLUMN public.children.created_at IS 'Timestamp when the child record was created';
COMMENT ON COLUMN public.children.updated_at IS 'Timestamp when the child record was last updated';

-- For 'babies' table (if using babies instead of children)
-- COMMENT ON TABLE public.babies IS 'Information about babies/children belonging to each parent user';
-- COMMENT ON COLUMN public.babies.id IS 'Primary key, auto-generated UUID';
-- COMMENT ON COLUMN public.babies.user_id IS 'Foreign key referencing the parent''s user ID';
-- COMMENT ON COLUMN public.babies.name IS 'Baby''s name';
-- COMMENT ON COLUMN public.babies.date_of_birth IS 'Baby''s date of birth, used for age calculations and milestone tracking';
-- COMMENT ON COLUMN public.babies.created_at IS 'Timestamp when the baby record was created';
-- COMMENT ON COLUMN public.babies.updated_at IS 'Timestamp when the baby record was last updated';

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
