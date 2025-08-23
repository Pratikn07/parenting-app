-- =====================================================
-- MIGRATE BABIES TABLE TO CHILDREN TABLE
-- =====================================================
-- This script renames babies to children and adds fields for 0-13 year age range

-- Step 1: Rename babies table to children (if babies table exists)
-- Note: Run this only if you have a babies table
-- ALTER TABLE public.babies RENAME TO children;

-- Step 2: Create children table if it doesn't exist
-- (Uncomment this if you need to create the table from scratch)
/*
CREATE TABLE IF NOT EXISTS public.children (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
    date_of_birth DATE NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    notes TEXT, -- For any special notes about the child
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
*/

-- Step 3: Add any missing columns to existing children table
-- (Uncomment the ones you need)

-- Add gender if it doesn't exist
-- ALTER TABLE public.children ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other'));

-- Add notes field for additional information
-- ALTER TABLE public.children ADD COLUMN IF NOT EXISTS notes TEXT;

-- Ensure proper constraints for 0-13 year age range
-- ALTER TABLE public.children ADD CONSTRAINT check_age_range 
--   CHECK (date_of_birth >= CURRENT_DATE - INTERVAL '13 years');

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_children_user_id ON public.children(user_id);
CREATE INDEX IF NOT EXISTS idx_children_date_of_birth ON public.children(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_children_created_at ON public.children(created_at);

-- Step 5: Enable Row Level Security
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for children table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own children" ON public.children;
DROP POLICY IF EXISTS "Users can insert their own children" ON public.children;
DROP POLICY IF EXISTS "Users can update their own children" ON public.children;
DROP POLICY IF EXISTS "Users can delete their own children" ON public.children;

-- Create new policies
CREATE POLICY "Users can view their own children"
    ON public.children FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own children"
    ON public.children FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own children"
    ON public.children FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own children"
    ON public.children FOR DELETE
    USING (auth.uid() = user_id);

-- Step 7: Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_children_updated_at ON public.children;
CREATE TRIGGER update_children_updated_at
    BEFORE UPDATE ON public.children
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Drop babies table if it exists and you've migrated data
-- WARNING: Only run this after you've confirmed the migration worked!
-- DROP TABLE IF EXISTS public.babies;
