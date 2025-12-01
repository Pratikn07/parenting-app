-- =====================================================
-- DATABASE VERIFICATION SCRIPT
-- =====================================================
-- This script checks which tables exist in your Supabase database
-- Run this in Supabase SQL Editor to verify your current database state

-- Check all tables in public schema
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- EXPECTED TABLES CHECKLIST
-- =====================================================
-- Core tables (from supabase-schema.sql):
-- ✓ profiles OR users (check which one exists)
-- ✓ children
-- ✓ milestones  
-- ✓ chat_messages
-- ✓ resources

-- Enhancement tables (from create-resources-enhancement-tables.sql):
-- ✓ user_saved_resources
-- ✓ user_activity_log
-- ✓ user_progress_stats
-- ✓ daily_tips
-- ✓ milestone_templates
-- ✓ user_milestone_progress

-- Migration tables:
-- ✓ chat_sessions
-- ✓ conversation_summaries

-- Potentially missing:
-- ? articles (needed by RecommendationsService)

-- =====================================================
-- CHECK SPECIFIC CRITICAL TABLES
-- =====================================================

-- Check if 'users' table exists
SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'users'
) as users_table_exists;

-- Check if 'profiles' table exists
SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'profiles'
) as profiles_table_exists;

-- Check if 'articles' table exists
SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'articles'
) as articles_table_exists;

-- Check if 'chat_sessions' table exists
SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'chat_sessions'
) as chat_sessions_table_exists;

-- Check if enhancement tables exist
SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'daily_tips'
) as daily_tips_table_exists;

SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'milestone_templates'
) as milestone_templates_table_exists;

SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_milestone_progress'
) as user_milestone_progress_table_exists;

SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_saved_resources'
) as user_saved_resources_table_exists;

SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_activity_log'
) as user_activity_log_table_exists;

SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_progress_stats'
) as user_progress_stats_table_exists;

SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'conversation_summaries'
) as conversation_summaries_table_exists;

-- =====================================================
-- DETAILED TABLE INFO
-- =====================================================

-- Get column information for users/profiles table (whichever exists)
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name IN ('users', 'profiles')
ORDER BY table_name, ordinal_position;

-- Get column information for children table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'children'
ORDER BY ordinal_position;

-- =====================================================
-- FOREIGN KEY REFERENCES CHECK
-- =====================================================
-- Check what foreign keys reference users vs profiles

SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND ccu.table_name IN ('users', 'profiles')
ORDER BY tc.table_name;

-- =====================================================
-- ROW COUNTS
-- =====================================================
-- Check if tables have data

SELECT 
    'users' as table_name, 
    COUNT(*) as row_count 
FROM public.users
WHERE EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users')

UNION ALL

SELECT 
    'profiles' as table_name, 
    COUNT(*) as row_count 
FROM public.profiles
WHERE EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles')

UNION ALL

SELECT 
    'children' as table_name, 
    COUNT(*) as row_count 
FROM public.children

UNION ALL

SELECT 
    'chat_messages' as table_name, 
    COUNT(*) as row_count 
FROM public.chat_messages

UNION ALL

SELECT 
    'resources' as table_name, 
    COUNT(*) as row_count 
FROM public.resources;
