-- =====================================================
-- RESOURCES & TIPS ENHANCEMENT SCHEMA
-- =====================================================
-- 
-- This script adds new tables to support user-specific
-- resources and tips functionality, transforming the
-- static implementation into a dynamic, personalized system.

-- =====================================================
-- CREATE ACTIVITY TYPE ENUM
-- =====================================================

DO $$ BEGIN
    CREATE TYPE activity_type AS ENUM (
        'resource_viewed', 
        'resource_saved', 
        'resource_shared',
        'milestone_completed',
        'milestone_uncompleted',
        'question_asked',
        'tip_viewed',
        'search_performed',
        'category_filtered'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- USER SAVED RESOURCES TABLE
-- Tracks resources bookmarked/saved by users
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_saved_resources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    UNIQUE(user_id, resource_id)
);

COMMENT ON TABLE public.user_saved_resources IS 'Resources bookmarked/saved by users for later reference';
COMMENT ON COLUMN public.user_saved_resources.id IS 'Primary key, auto-generated UUID';
COMMENT ON COLUMN public.user_saved_resources.user_id IS 'Foreign key referencing the user who saved the resource';
COMMENT ON COLUMN public.user_saved_resources.resource_id IS 'Foreign key referencing the saved resource';
COMMENT ON COLUMN public.user_saved_resources.saved_at IS 'Timestamp when the resource was saved';
COMMENT ON COLUMN public.user_saved_resources.notes IS 'Optional user notes about the saved resource';

-- =====================================================
-- USER ACTIVITY LOG TABLE
-- Tracks user interactions and engagement
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_activity_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_type activity_type NOT NULL,
    resource_id UUID REFERENCES public.resources(id) ON DELETE SET NULL,
    milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.user_activity_log IS 'Log of user interactions and engagement activities';
COMMENT ON COLUMN public.user_activity_log.id IS 'Primary key, auto-generated UUID';
COMMENT ON COLUMN public.user_activity_log.user_id IS 'Foreign key referencing the user who performed the activity';
COMMENT ON COLUMN public.user_activity_log.activity_type IS 'Type of activity performed (resource_viewed, milestone_completed, etc.)';
COMMENT ON COLUMN public.user_activity_log.resource_id IS 'Optional reference to related resource';
COMMENT ON COLUMN public.user_activity_log.milestone_id IS 'Optional reference to related milestone';
COMMENT ON COLUMN public.user_activity_log.metadata IS 'Additional activity data in JSON format (search terms, category filters, etc.)';
COMMENT ON COLUMN public.user_activity_log.created_at IS 'Timestamp when the activity occurred';

-- =====================================================
-- USER PROGRESS STATS TABLE
-- Aggregated user engagement metrics
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_progress_stats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    questions_asked INTEGER DEFAULT 0,
    tips_received INTEGER DEFAULT 0,
    content_saved INTEGER DEFAULT 0,
    milestones_completed INTEGER DEFAULT 0,
    resources_viewed INTEGER DEFAULT 0,
    search_queries INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, week_start_date)
);

COMMENT ON TABLE public.user_progress_stats IS 'Weekly aggregated user engagement and progress statistics';
COMMENT ON COLUMN public.user_progress_stats.id IS 'Primary key, auto-generated UUID';
COMMENT ON COLUMN public.user_progress_stats.user_id IS 'Foreign key referencing the user';
COMMENT ON COLUMN public.user_progress_stats.week_start_date IS 'Start date of the week (Monday) for which stats are calculated';
COMMENT ON COLUMN public.user_progress_stats.questions_asked IS 'Number of questions asked this week';
COMMENT ON COLUMN public.user_progress_stats.tips_received IS 'Number of tips viewed this week';
COMMENT ON COLUMN public.user_progress_stats.content_saved IS 'Number of resources saved this week';
COMMENT ON COLUMN public.user_progress_stats.milestones_completed IS 'Number of milestones completed this week';
COMMENT ON COLUMN public.user_progress_stats.resources_viewed IS 'Number of resources viewed this week';
COMMENT ON COLUMN public.user_progress_stats.search_queries IS 'Number of searches performed this week';

-- =====================================================
-- DAILY TIPS TABLE
-- Personalized daily tips for users
-- =====================================================

CREATE TABLE IF NOT EXISTS public.daily_tips (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    tip_date DATE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    parenting_stage parenting_stage NOT NULL,
    child_age_months INTEGER,
    quick_tips TEXT[],
    is_viewed BOOLEAN DEFAULT FALSE,
    viewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, tip_date)
);

COMMENT ON TABLE public.daily_tips IS 'Personalized daily tips generated for users based on their profile and children';
COMMENT ON COLUMN public.daily_tips.id IS 'Primary key, auto-generated UUID';
COMMENT ON COLUMN public.daily_tips.user_id IS 'Foreign key referencing the user';
COMMENT ON COLUMN public.daily_tips.tip_date IS 'Date this tip is for (one tip per user per day)';
COMMENT ON COLUMN public.daily_tips.title IS 'Title of the daily tip';
COMMENT ON COLUMN public.daily_tips.description IS 'Main content/description of the tip';
COMMENT ON COLUMN public.daily_tips.category IS 'Category of the tip (sleep, feeding, health, activities, etc.)';
COMMENT ON COLUMN public.daily_tips.parenting_stage IS 'Parenting stage this tip is relevant for';
COMMENT ON COLUMN public.daily_tips.child_age_months IS 'Child age in months this tip is targeted for (if applicable)';
COMMENT ON COLUMN public.daily_tips.quick_tips IS 'Array of quick actionable tips/bullet points';
COMMENT ON COLUMN public.daily_tips.is_viewed IS 'Whether the user has viewed this tip';
COMMENT ON COLUMN public.daily_tips.viewed_at IS 'Timestamp when the user viewed this tip';

-- =====================================================
-- MILESTONE TEMPLATES TABLE
-- Standard milestone templates by age and category
-- =====================================================

CREATE TABLE IF NOT EXISTS public.milestone_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    milestone_type milestone_type NOT NULL,
    min_age_months INTEGER NOT NULL,
    max_age_months INTEGER NOT NULL,
    parenting_stage parenting_stage NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.milestone_templates IS 'Standard milestone templates organized by age range and developmental category';
COMMENT ON COLUMN public.milestone_templates.id IS 'Primary key, auto-generated UUID';
COMMENT ON COLUMN public.milestone_templates.title IS 'Title of the milestone template';
COMMENT ON COLUMN public.milestone_templates.description IS 'Detailed description of what this milestone entails';
COMMENT ON COLUMN public.milestone_templates.milestone_type IS 'Category of milestone: physical, cognitive, social, or emotional';
COMMENT ON COLUMN public.milestone_templates.min_age_months IS 'Minimum age in months when this milestone typically occurs';
COMMENT ON COLUMN public.milestone_templates.max_age_months IS 'Maximum age in months when this milestone typically occurs';
COMMENT ON COLUMN public.milestone_templates.parenting_stage IS 'Parenting stage this milestone belongs to';
COMMENT ON COLUMN public.milestone_templates.is_active IS 'Whether this milestone template is currently active/visible';

-- =====================================================
-- USER MILESTONE PROGRESS TABLE
-- Tracks user-specific milestone achievements
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_milestone_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
    milestone_template_id UUID REFERENCES public.milestone_templates(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, child_id, milestone_template_id)
);

COMMENT ON TABLE public.user_milestone_progress IS 'User-specific milestone progress tracking for each child';
COMMENT ON COLUMN public.user_milestone_progress.id IS 'Primary key, auto-generated UUID';
COMMENT ON COLUMN public.user_milestone_progress.user_id IS 'Foreign key referencing the parent user';
COMMENT ON COLUMN public.user_milestone_progress.child_id IS 'Foreign key referencing the specific child';
COMMENT ON COLUMN public.user_milestone_progress.milestone_template_id IS 'Foreign key referencing the milestone template';
COMMENT ON COLUMN public.user_milestone_progress.is_completed IS 'Whether this milestone has been achieved by the child';
COMMENT ON COLUMN public.user_milestone_progress.completed_at IS 'Timestamp when the milestone was marked as completed';
COMMENT ON COLUMN public.user_milestone_progress.notes IS 'Optional user notes about the milestone achievement';

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- User saved resources indexes
CREATE INDEX IF NOT EXISTS idx_user_saved_resources_user_id ON public.user_saved_resources(user_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_resources_resource_id ON public.user_saved_resources(resource_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_resources_saved_at ON public.user_saved_resources(saved_at);

-- User activity log indexes
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON public.user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_activity_type ON public.user_activity_log(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON public.user_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_resource_id ON public.user_activity_log(resource_id);

-- User progress stats indexes
CREATE INDEX IF NOT EXISTS idx_user_progress_stats_user_id ON public.user_progress_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_stats_week_start ON public.user_progress_stats(week_start_date);

-- Daily tips indexes
CREATE INDEX IF NOT EXISTS idx_daily_tips_user_id ON public.daily_tips(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_tips_tip_date ON public.daily_tips(tip_date);
CREATE INDEX IF NOT EXISTS idx_daily_tips_parenting_stage ON public.daily_tips(parenting_stage);
CREATE INDEX IF NOT EXISTS idx_daily_tips_category ON public.daily_tips(category);

-- Milestone templates indexes
CREATE INDEX IF NOT EXISTS idx_milestone_templates_type ON public.milestone_templates(milestone_type);
CREATE INDEX IF NOT EXISTS idx_milestone_templates_age_range ON public.milestone_templates(min_age_months, max_age_months);
CREATE INDEX IF NOT EXISTS idx_milestone_templates_parenting_stage ON public.milestone_templates(parenting_stage);
CREATE INDEX IF NOT EXISTS idx_milestone_templates_active ON public.milestone_templates(is_active);

-- User milestone progress indexes
CREATE INDEX IF NOT EXISTS idx_user_milestone_progress_user_id ON public.user_milestone_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_milestone_progress_child_id ON public.user_milestone_progress(child_id);
CREATE INDEX IF NOT EXISTS idx_user_milestone_progress_completed ON public.user_milestone_progress(is_completed);

-- =====================================================
-- TRIGGERS FOR updated_at COLUMNS
-- =====================================================

-- Apply triggers to tables with updated_at columns
-- Note: PostgreSQL doesn't support IF NOT EXISTS for triggers
-- These will fail silently if triggers already exist

DO $$ 
BEGIN
    -- Create trigger for user_progress_stats
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_user_progress_stats_updated_at'
    ) THEN
        CREATE TRIGGER update_user_progress_stats_updated_at
            BEFORE UPDATE ON public.user_progress_stats
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();
    END IF;

    -- Create trigger for milestone_templates
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_milestone_templates_updated_at'
    ) THEN
        CREATE TRIGGER update_milestone_templates_updated_at
            BEFORE UPDATE ON public.milestone_templates
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();
    END IF;

    -- Create trigger for user_milestone_progress
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_user_milestone_progress_updated_at'
    ) THEN
        CREATE TRIGGER update_user_milestone_progress_updated_at
            BEFORE UPDATE ON public.user_milestone_progress
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at();
    END IF;
END $$;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE public.user_saved_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestone_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_milestone_progress ENABLE ROW LEVEL SECURITY;

-- User saved resources policies
CREATE POLICY "Users can view their own saved resources" 
    ON public.user_saved_resources FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved resources"
    ON public.user_saved_resources FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved resources"
    ON public.user_saved_resources FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved resources"
    ON public.user_saved_resources FOR DELETE 
    USING (auth.uid() = user_id);

-- User activity log policies
CREATE POLICY "Users can view their own activity log"
    ON public.user_activity_log FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity log"
    ON public.user_activity_log FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- User progress stats policies
CREATE POLICY "Users can view their own progress stats"
    ON public.user_progress_stats FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress stats"
    ON public.user_progress_stats FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress stats"
    ON public.user_progress_stats FOR UPDATE
    USING (auth.uid() = user_id);

-- Daily tips policies
CREATE POLICY "Users can view their own daily tips"
    ON public.daily_tips FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily tips"
    ON public.daily_tips FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily tips"
    ON public.daily_tips FOR UPDATE
    USING (auth.uid() = user_id);

-- Milestone templates policies (all authenticated users can view)
CREATE POLICY "Authenticated users can view milestone templates"
    ON public.milestone_templates FOR SELECT
    TO authenticated
    USING (is_active = true);

-- User milestone progress policies
CREATE POLICY "Users can view milestone progress for their children"
    ON public.user_milestone_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert milestone progress for their children"
    ON public.user_milestone_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id AND EXISTS (
        SELECT 1 FROM public.children 
        WHERE children.id = user_milestone_progress.child_id 
        AND children.parent_id = auth.uid()
    ));

CREATE POLICY "Users can update milestone progress for their children"
    ON public.user_milestone_progress FOR UPDATE
    USING (auth.uid() = user_id AND EXISTS (
        SELECT 1 FROM public.children 
        WHERE children.id = user_milestone_progress.child_id 
        AND children.parent_id = auth.uid()
    ));

CREATE POLICY "Users can delete milestone progress for their children"
    ON public.user_milestone_progress FOR DELETE
    USING (auth.uid() = user_id AND EXISTS (
        SELECT 1 FROM public.children 
        WHERE children.id = user_milestone_progress.child_id 
        AND children.parent_id = auth.uid()
    ));
