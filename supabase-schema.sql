-- Parenting App Database Schema
-- This script creates all necessary tables, indexes, and RLS policies

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE parenting_stage AS ENUM ('expecting', 'newborn', 'infant', 'toddler');
CREATE TYPE feeding_preference AS ENUM ('breastfeeding', 'formula', 'mixed');
CREATE TYPE milestone_type AS ENUM ('physical', 'cognitive', 'social', 'emotional');
CREATE TYPE gender AS ENUM ('male', 'female', 'other');

-- =====================================================
-- PROFILES TABLE (extends auth.users)
-- =====================================================

CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    name TEXT NOT NULL CHECK (length(name) >= 2 AND length(name) <= 50),
    email TEXT NOT NULL UNIQUE,
    parenting_stage parenting_stage DEFAULT 'expecting',
    feeding_preference feeding_preference DEFAULT 'breastfeeding',
    has_completed_onboarding BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CHILDREN TABLE
-- =====================================================

CREATE TABLE public.children (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    parent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (length(name) >= 1 AND length(name) <= 50),
    birth_date DATE,
    gender gender,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MILESTONES TABLE
-- =====================================================

CREATE TABLE public.milestones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (length(title) >= 1 AND length(title) <= 100),
    description TEXT,
    achieved_at TIMESTAMP WITH TIME ZONE,
    milestone_type milestone_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CHAT MESSAGES TABLE (for AI chat history)
-- =====================================================

CREATE TABLE public.chat_messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    response TEXT,
    is_from_user BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- RESOURCES TABLE (for parenting content)
-- =====================================================

CREATE TABLE public.resources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    category TEXT,
    parenting_stages parenting_stage[],
    tags TEXT[],
    image_url TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_parenting_stage ON public.profiles(parenting_stage);

-- Children indexes  
CREATE INDEX idx_children_parent_id ON public.children(parent_id);
CREATE INDEX idx_children_birth_date ON public.children(birth_date);

-- Milestones indexes
CREATE INDEX idx_milestones_child_id ON public.milestones(child_id);
CREATE INDEX idx_milestones_achieved_at ON public.milestones(achieved_at);
CREATE INDEX idx_milestones_type ON public.milestones(milestone_type);

-- Chat messages indexes
CREATE INDEX idx_chat_messages_user_id ON public.chat_messages(user_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

-- Resources indexes
CREATE INDEX idx_resources_category ON public.resources(category);
CREATE INDEX idx_resources_parenting_stages ON public.resources USING GIN(parenting_stages);
CREATE INDEX idx_resources_tags ON public.resources USING GIN(tags);
CREATE INDEX idx_resources_featured ON public.resources(is_featured);

-- =====================================================
-- TRIGGERS FOR updated_at COLUMNS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_children_updated_at
    BEFORE UPDATE ON public.children
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_milestones_updated_at
    BEFORE UPDATE ON public.milestones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_resources_updated_at
    BEFORE UPDATE ON public.resources  
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Profiles policies (users can only access their own profile)
CREATE POLICY "Users can view their own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

-- Children policies (users can only access their own children)
CREATE POLICY "Users can view their own children"
    ON public.children FOR SELECT
    USING (auth.uid() = parent_id);

CREATE POLICY "Users can insert their own children"
    ON public.children FOR INSERT
    WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Users can update their own children"
    ON public.children FOR UPDATE
    USING (auth.uid() = parent_id);

CREATE POLICY "Users can delete their own children"
    ON public.children FOR DELETE
    USING (auth.uid() = parent_id);

-- Milestones policies (users can only access milestones for their children)
CREATE POLICY "Users can view milestones for their children"
    ON public.milestones FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.children 
        WHERE children.id = milestones.child_id 
        AND children.parent_id = auth.uid()
    ));

CREATE POLICY "Users can insert milestones for their children"
    ON public.milestones FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.children 
        WHERE children.id = milestones.child_id 
        AND children.parent_id = auth.uid()
    ));

CREATE POLICY "Users can update milestones for their children"
    ON public.milestones FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.children 
        WHERE children.id = milestones.child_id 
        AND children.parent_id = auth.uid()
    ));

CREATE POLICY "Users can delete milestones for their children"
    ON public.milestones FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.children 
        WHERE children.id = milestones.child_id 
        AND children.parent_id = auth.uid()
    ));

-- Chat messages policies (users can only access their own chat history)
CREATE POLICY "Users can view their own chat messages"
    ON public.chat_messages FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages"
    ON public.chat_messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Resources policies (all authenticated users can view resources)
CREATE POLICY "Authenticated users can view resources"
    ON public.resources FOR SELECT
    TO authenticated
    USING (true);

-- =====================================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- =====================================================

-- Function to create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, created_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.email,
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- SAMPLE DATA (optional - for development)
-- =====================================================

-- Insert some sample resources (uncomment for development)
/*
INSERT INTO public.resources (title, description, category, parenting_stages, tags, is_featured) VALUES
('Newborn Sleep Guide', 'Complete guide to newborn sleep patterns', 'Sleep', ARRAY['newborn']::parenting_stage[], ARRAY['sleep', 'newborn', 'guide'], true),
('Breastfeeding Basics', 'Essential breastfeeding tips for new mothers', 'Feeding', ARRAY['newborn', 'infant']::parenting_stage[], ARRAY['breastfeeding', 'feeding'], true),
('Toddler Development Milestones', 'Key developmental milestones for toddlers', 'Development', ARRAY['toddler']::parenting_stage[], ARRAY['development', 'milestones'], false);
*/