-- =====================================================
-- CHECK WHAT TABLES CURRENTLY EXIST
-- =====================================================
-- Run this first to see what's in your database

-- 1. List all tables in public schema
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. If babies table exists, show its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'babies'
ORDER BY ordinal_position;

-- 3. If babies table exists, show sample data (first 5 rows)
-- SELECT * FROM public.babies LIMIT 5;

-- 4. Count records in babies table (if it exists)
-- SELECT COUNT(*) as babies_count FROM public.babies;

-- 5. Check if any other tables exist
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
