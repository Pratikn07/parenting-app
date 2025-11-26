-- =====================================================
-- MILESTONE TEMPLATES MIGRATION
-- Creates milestone_templates table and updates milestones table
-- =====================================================

-- =====================================================
-- NEW TABLE: milestone_templates
-- Master list of developmental milestones by age range
-- =====================================================

CREATE TABLE IF NOT EXISTS public.milestone_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 100),
    description TEXT,
    category milestone_type NOT NULL,
    age_min_months INTEGER NOT NULL CHECK (age_min_months >= 0),
    age_max_months INTEGER NOT NULL CHECK (age_max_months >= age_min_months),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add table and column descriptions
COMMENT ON TABLE public.milestone_templates IS 'Master list of developmental milestones organized by age range and category';
COMMENT ON COLUMN public.milestone_templates.id IS 'Primary key, auto-generated UUID';
COMMENT ON COLUMN public.milestone_templates.title IS 'Brief title of the milestone (1-100 characters)';
COMMENT ON COLUMN public.milestone_templates.description IS 'Detailed description of what the milestone entails';
COMMENT ON COLUMN public.milestone_templates.category IS 'Category of milestone: physical, cognitive, social, or emotional';
COMMENT ON COLUMN public.milestone_templates.age_min_months IS 'Minimum age in months when this milestone typically occurs';
COMMENT ON COLUMN public.milestone_templates.age_max_months IS 'Maximum age in months when this milestone typically occurs';
COMMENT ON COLUMN public.milestone_templates.is_active IS 'Whether this template is currently active and shown to users';
COMMENT ON COLUMN public.milestone_templates.sort_order IS 'Order for displaying milestones within same age range';
COMMENT ON COLUMN public.milestone_templates.created_at IS 'Timestamp when the template was created';

-- =====================================================
-- UPDATE: milestones table
-- Add template reference and custom milestone support
-- =====================================================

-- Add template_id column (nullable for custom milestones)
ALTER TABLE public.milestones 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.milestone_templates(id) ON DELETE SET NULL;

-- Add is_custom flag
ALTER TABLE public.milestones 
ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT FALSE;

-- Add notes column for user notes about achievement
ALTER TABLE public.milestones 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comments for new columns
COMMENT ON COLUMN public.milestones.template_id IS 'Reference to milestone template (null for custom milestones)';
COMMENT ON COLUMN public.milestones.is_custom IS 'True if this is a user-created custom milestone';
COMMENT ON COLUMN public.milestones.notes IS 'User notes about when/how the milestone was achieved';

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- milestone_templates indexes
CREATE INDEX IF NOT EXISTS idx_milestone_templates_category ON public.milestone_templates(category);
CREATE INDEX IF NOT EXISTS idx_milestone_templates_age_range ON public.milestone_templates(age_min_months, age_max_months);
CREATE INDEX IF NOT EXISTS idx_milestone_templates_active ON public.milestone_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_milestone_templates_sort ON public.milestone_templates(sort_order);

-- milestones table - add index for template lookups
CREATE INDEX IF NOT EXISTS idx_milestones_template_id ON public.milestones(template_id);
CREATE INDEX IF NOT EXISTS idx_milestones_is_custom ON public.milestones(is_custom);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on milestone_templates
ALTER TABLE public.milestone_templates ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view active milestone templates (read-only)
CREATE POLICY "Authenticated users can view active milestone templates"
    ON public.milestone_templates FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

-- =====================================================
-- UNIQUE CONSTRAINT
-- Prevent duplicate milestones for same child/template combo
-- =====================================================

-- Add unique constraint to prevent duplicate achievements
CREATE UNIQUE INDEX IF NOT EXISTS idx_milestones_child_template_unique 
    ON public.milestones(child_id, template_id) 
    WHERE template_id IS NOT NULL;

