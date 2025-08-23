-- =====================================================
-- RENAME BABIES TABLE TO CHILDREN
-- =====================================================
-- This script safely renames the babies table to children
-- and updates any references

-- Step 1: Rename the table
ALTER TABLE public.babies RENAME TO children;

-- Step 2: Add any missing columns for 0-13 year age range
-- (Uncomment if you want to add these fields)
-- ALTER TABLE public.children ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other'));
-- ALTER TABLE public.children ADD COLUMN IF NOT EXISTS notes TEXT;

-- Step 3: Update any foreign key references in other tables
-- (This will depend on what other tables reference babies)
-- Example: If milestones table has baby_id, rename it to child_id
-- ALTER TABLE public.milestones RENAME COLUMN baby_id TO child_id;

-- Step 4: Update RLS policies (drop old ones, create new ones)
DROP POLICY IF EXISTS "Users can view their own babies" ON public.children;
DROP POLICY IF EXISTS "Users can insert their own babies" ON public.children;
DROP POLICY IF EXISTS "Users can update their own babies" ON public.children;
DROP POLICY IF EXISTS "Users can delete their own babies" ON public.children;

-- Create new policies with children naming
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

-- Step 5: Update table description
COMMENT ON TABLE public.children IS 'Information about children (0-13 years) belonging to each parent user';

-- Success message
SELECT 'Successfully renamed babies table to children!' as message;
