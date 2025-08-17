-- =============================================================================
-- Complete Supabase Database Setup for "Your Parenting Compass"
-- Generated on: 2025-08-17 12:26:44
-- Project URL: https://ccrgvammglkvdlaojgzv.supabase.co
-- =============================================================================

-- STEP 1: Enable Extensions
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector; -- Requires Supabase Pro plan
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- STEP 2: Create Tables
-- =============================================================================

-- Users table (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE,
    locale text NOT NULL DEFAULT 'en-US',
    timezone text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Babies table (user-scoped)
CREATE TABLE IF NOT EXISTS public.babies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name text,
    date_of_birth date NOT NULL,
    sex text CHECK (sex IN ('female','male','unspecified')),
    gestational_age_weeks int,
    allergies text[],
    diet_notes text,
    pediatrician_contact jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Onboarding responses (user-scoped)
CREATE TABLE IF NOT EXISTS public.onboarding_responses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    question_key text NOT NULL,
    answer jsonb NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Chat sessions (user-scoped; baby_id optional)
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    baby_id uuid NULL REFERENCES public.babies(id) ON DELETE SET NULL,
    topic text,
    started_at timestamptz NOT NULL DEFAULT now()
);

-- Chat messages (scoped via session → user)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id bigserial PRIMARY KEY,
    session_id uuid NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('user','assistant','system')),
    content text NOT NULL,
    tokens int,
    safety_flags jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Articles (publicly readable content)
CREATE TABLE IF NOT EXISTS public.articles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text UNIQUE,
    title text NOT NULL,
    body_md text NOT NULL,
    age_min_days int,
    age_max_days int,
    locale text NOT NULL DEFAULT 'en-US',
    tags text[],
    last_reviewed_at date,
    reviewer text
);

-- Checklists (publicly readable content)
CREATE TABLE IF NOT EXISTS public.checklists (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    locale text NOT NULL DEFAULT 'en-US',
    age_min_days int,
    age_max_days int
);

-- Checklist items
CREATE TABLE IF NOT EXISTS public.checklist_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id uuid NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
    text text NOT NULL,
    item_order int NOT NULL,
    required boolean NOT NULL DEFAULT false
);

-- Reminders (user-scoped)
CREATE TABLE IF NOT EXISTS public.reminders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type text NOT NULL,
    due_at timestamptz,
    rrule text,
    payload jsonb,
    status text NOT NULL DEFAULT 'scheduled'
);

-- Growth measurements (scoped via baby → user)
CREATE TABLE IF NOT EXISTS public.growth_measurements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    baby_id uuid NOT NULL REFERENCES public.babies(id) ON DELETE CASCADE,
    measured_at timestamptz NOT NULL,
    weight_g int,
    length_cm numeric,
    head_circum_cm numeric,
    source text
);

-- Devices (user-scoped)
CREATE TABLE IF NOT EXISTS public.devices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    push_token text NOT NULL,
    platform text CHECK (platform IN ('ios','android','web')),
    last_seen_at timestamptz NOT NULL DEFAULT now()
);

-- Embeddings for pgvector
CREATE TABLE IF NOT EXISTS public.embeddings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_table text,
    source_id uuid,
    chunk_index int,
    locale text,
    tags text[],
    age_min_days int,
    age_max_days int,
    embedding vector(1536) NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- STEP 3: Create Indexes
-- =============================================================================

-- Age targeting and tags indexes
CREATE INDEX IF NOT EXISTS idx_articles_age_locale ON public.articles (age_min_days, age_max_days, locale);
CREATE INDEX IF NOT EXISTS idx_articles_tags_gin ON public.articles USING gin (tags);
CREATE INDEX IF NOT EXISTS idx_checklists_age_locale ON public.checklists (age_min_days, age_max_days, locale);

-- Chat performance indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created ON public.chat_messages (session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON public.chat_sessions (user_id, started_at);

-- Reminders scheduling indexes
CREATE INDEX IF NOT EXISTS idx_reminders_due_status ON public.reminders (due_at, status);
CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_partial ON public.reminders (due_at) WHERE status = 'scheduled';

-- Devices unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS uq_devices_user_token ON public.devices (user_id, push_token);

-- Growth measurements by baby/time
CREATE INDEX IF NOT EXISTS idx_growth_baby_time ON public.growth_measurements (baby_id, measured_at);

-- Vector indexes (requires pgvector extension)
CREATE INDEX IF NOT EXISTS idx_embeddings_ivfflat ON public.embeddings 
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX IF NOT EXISTS idx_embeddings_filters ON public.embeddings (locale, age_min_days, age_max_days);
CREATE INDEX IF NOT EXISTS idx_embeddings_tags_gin ON public.embeddings USING gin (tags);

-- STEP 4: Enable Row-Level Security
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.babies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;

-- User-scoped policies
DROP POLICY IF EXISTS "own row - users" ON public.users;
CREATE POLICY "own row - users" ON public.users FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());
DROP POLICY IF EXISTS "service role all - users" ON public.users;
CREATE POLICY "service role all - users" ON public.users FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "own rows - babies" ON public.babies;
CREATE POLICY "own rows - babies" ON public.babies FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "service role all - babies" ON public.babies;
CREATE POLICY "service role all - babies" ON public.babies FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "own rows - onboarding" ON public.onboarding_responses;
CREATE POLICY "own rows - onboarding" ON public.onboarding_responses FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "service role all - onboarding" ON public.onboarding_responses;
CREATE POLICY "service role all - onboarding" ON public.onboarding_responses FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "own rows - chat_sessions" ON public.chat_sessions;
CREATE POLICY "own rows - chat_sessions" ON public.chat_sessions FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "service role all - chat_sessions" ON public.chat_sessions;
CREATE POLICY "service role all - chat_sessions" ON public.chat_sessions FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "own rows - chat_messages" ON public.chat_messages;
CREATE POLICY "own rows - chat_messages" ON public.chat_messages FOR ALL USING (
    EXISTS (SELECT 1 FROM public.chat_sessions s WHERE s.id = chat_messages.session_id AND s.user_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.chat_sessions s WHERE s.id = chat_messages.session_id AND s.user_id = auth.uid())
);
DROP POLICY IF EXISTS "service role all - chat_messages" ON public.chat_messages;
CREATE POLICY "service role all - chat_messages" ON public.chat_messages FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "own rows - reminders" ON public.reminders;
CREATE POLICY "own rows - reminders" ON public.reminders FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "service role all - reminders" ON public.reminders;
CREATE POLICY "service role all - reminders" ON public.reminders FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "own rows - growth_measurements" ON public.growth_measurements;
CREATE POLICY "own rows - growth_measurements" ON public.growth_measurements FOR ALL USING (
    EXISTS (SELECT 1 FROM public.babies b WHERE b.id = growth_measurements.baby_id AND b.user_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.babies b WHERE b.id = growth_measurements.baby_id AND b.user_id = auth.uid())
);
DROP POLICY IF EXISTS "service role all - growth_measurements" ON public.growth_measurements;
CREATE POLICY "service role all - growth_measurements" ON public.growth_measurements FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "own rows - devices" ON public.devices;
CREATE POLICY "own rows - devices" ON public.devices FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "service role all - devices" ON public.devices;
CREATE POLICY "service role all - devices" ON public.devices FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Public content policies
DROP POLICY IF EXISTS "public read - articles" ON public.articles;
CREATE POLICY "public read - articles" ON public.articles FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
DROP POLICY IF EXISTS "service role write - articles" ON public.articles;
CREATE POLICY "service role write - articles" ON public.articles FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "public read - checklists" ON public.checklists;
CREATE POLICY "public read - checklists" ON public.checklists FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
DROP POLICY IF EXISTS "service role write - checklists" ON public.checklists;
CREATE POLICY "service role write - checklists" ON public.checklists FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "public read - checklist_items" ON public.checklist_items;
CREATE POLICY "public read - checklist_items" ON public.checklist_items FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
DROP POLICY IF EXISTS "service role write - checklist_items" ON public.checklist_items;
CREATE POLICY "service role write - checklist_items" ON public.checklist_items FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "public read - embeddings" ON public.embeddings;
CREATE POLICY "public read - embeddings" ON public.embeddings FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
DROP POLICY IF EXISTS "service role write - embeddings" ON public.embeddings;
CREATE POLICY "service role write - embeddings" ON public.embeddings FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- STEP 5: Create RPC Functions
-- =============================================================================

-- Search articles function
CREATE OR REPLACE FUNCTION public.search_articles(age_days int, locale text, tags text[])
RETURNS SETOF public.articles
LANGUAGE sql
STABLE
AS $$
SELECT *
FROM public.articles a
WHERE (a.locale = COALESCE(locale, a.locale))
AND (
    (age_days IS NULL)
    OR (
        (a.age_min_days IS NULL OR a.age_min_days <= age_days)
        AND (a.age_max_days IS NULL OR a.age_max_days >= age_days)
    )
)
AND (
    tags IS NULL
    OR tags = '{}'
    OR a.tags && tags
)
ORDER BY a.last_reviewed_at DESC NULLS LAST, a.title ASC
$$;

-- Search embeddings function
CREATE OR REPLACE FUNCTION public.search_embeddings(
    query_embedding vector(1536),
    match_count int,
    filter jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
    id uuid,
    source_table text,
    source_id uuid,
    chunk_index int,
    locale text,
    tags text[],
    age_min_days int,
    age_max_days int,
    similarity float4
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    f_locale text := NULLIF(filter->>'locale', '');
    f_age int := (filter->>'age_days')::int;
    f_tags text[] := (SELECT array_agg(value::text) FROM jsonb_array_elements_text(COALESCE(filter->'tags','[]'::jsonb)));
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.source_table,
        e.source_id,
        e.chunk_index,
        e.locale,
        e.tags,
        e.age_min_days,
        e.age_max_days,
        1 - (e.embedding <=> query_embedding) AS similarity
    FROM public.embeddings e
    WHERE (f_locale IS NULL OR e.locale = f_locale)
    AND (
        f_age IS NULL
        OR (
            (e.age_min_days IS NULL OR e.age_min_days <= f_age)
            AND (e.age_max_days IS NULL OR e.age_max_days >= f_age)
        )
    )
    AND (
        f_tags IS NULL
        OR cardinality(f_tags) = 0
        OR e.tags && f_tags
    )
    ORDER BY e.embedding <-> query_embedding
    LIMIT GREATEST(match_count, 1);
END;
$$;

-- Helper functions
CREATE OR REPLACE FUNCTION public.get_baby_age_days(baby_id uuid)
RETURNS int
LANGUAGE sql
STABLE
AS $$
SELECT (CURRENT_DATE - b.date_of_birth)::int
FROM public.babies b
WHERE b.id = baby_id;
$$;

CREATE OR REPLACE FUNCTION public.get_personalized_articles(
    baby_id uuid,
    locale text DEFAULT 'en-US',
    limit_count int DEFAULT 10
)
RETURNS SETOF public.articles
LANGUAGE sql
STABLE
AS $$
SELECT a.*
FROM public.articles a,
     public.get_baby_age_days(baby_id) AS age_days
WHERE (a.locale = locale)
AND (
    (a.age_min_days IS NULL OR a.age_min_days <= age_days)
    AND (a.age_max_days IS NULL OR a.age_max_days >= age_days)
)
ORDER BY a.last_reviewed_at DESC NULLS LAST, a.title ASC
LIMIT limit_count;
$$;

CREATE OR REPLACE FUNCTION public.get_upcoming_reminders(
    user_id uuid,
    days_ahead int DEFAULT 7
)
RETURNS SETOF public.reminders
LANGUAGE sql
STABLE
AS $$
SELECT r.*
FROM public.reminders r
WHERE r.user_id = user_id
AND r.status = 'scheduled'
AND r.due_at BETWEEN now() AND (now() + INTERVAL '1 day' * days_ahead)
ORDER BY r.due_at ASC;
$$;

-- STEP 6: Insert Sample Data
-- =============================================================================

-- Insert sample articles
INSERT INTO public.articles (slug, title, body_md, age_min_days, age_max_days, locale, tags, last_reviewed_at, reviewer)
VALUES 
(
    'newborn-sleep-basics',
    'Newborn Sleep Basics',
    '# Newborn Sleep Basics

Newborns sleep 14-17 hours per day, but in short bursts of 2-4 hours. This is completely normal and necessary for their development.

## Key Points:
- Sleep cycles are shorter than adults (50-60 minutes vs 90 minutes)
- REM sleep is more prominent, supporting brain development
- Day/night confusion is common in the first 6-8 weeks

## Safe Sleep Guidelines
Always follow the ABCs of safe sleep:
- **A**lone: Baby sleeps alone in their crib
- **B**ack: Always place baby on their back to sleep
- **C**rib: Use a firm mattress with a fitted sheet

Remember: Every baby is different. Trust your instincts and don''t hesitate to ask for help.',
    0, 30, 'en-US', 
    ARRAY['sleep','newborn','safety'], 
    CURRENT_DATE, 
    'RN J. Patel'
),
(
    'safe-bottle-feeding',
    'Safe Bottle Feeding',
    '# Safe Bottle Feeding Guide

## Preparation and Safety
- Always wash hands before preparing formula
- Use water that has been boiled and cooled to room temperature
- Follow formula instructions exactly - never add extra powder
- Check temperature by dropping a small amount on your wrist

## Signs of Proper Feeding
- Baby seems satisfied after feeds
- Regular wet diapers (6+ per day after day 5)
- Steady weight gain
- Alert periods between feeds

Contact your pediatrician with any concerns about feeding or growth.',
    0, 120, 'en-US', 
    ARRAY['feeding','safety','formula','bottle'], 
    CURRENT_DATE, 
    'RD C. Nguyen'
),
(
    'soothing-techniques',
    'Soothing Techniques for Fussy Babies',
    '# Soothing Techniques for Fussy Babies

## The Five S''s Method
Dr. Harvey Karp''s "Five S''s" can help calm crying babies:

1. **Swaddling** - Wrap baby snugly in a blanket
2. **Side/Stomach Position** - Hold baby on their side (for soothing only, never for sleep)
3. **Shushing** - Make a loud "shush" sound near baby''s ear
4. **Swinging** - Gentle, rhythmic motion
5. **Sucking** - Offer a pacifier or clean finger

Remember: All babies cry - it''s their primary form of communication. It''s okay to put baby down safely and take a break if you feel overwhelmed.',
    0, 90, 'en-US', 
    ARRAY['soothing','newborn','crying','comfort'], 
    CURRENT_DATE, 
    'MD A. Romero'
)
ON CONFLICT (slug) DO NOTHING;

-- Insert sample checklists
WITH c AS (
    INSERT INTO public.checklists (title, locale, age_min_days, age_max_days)
    VALUES ('Newborn Home Safety', 'en-US', 0, 60)
    RETURNING id
)
INSERT INTO public.checklist_items (checklist_id, text, item_order, required)
VALUES 
    ((SELECT id FROM c), 'Check crib mattress firmness', 1, true),
    ((SELECT id FROM c), 'Remove loose bedding and pillows', 2, true),
    ((SELECT id FROM c), 'Install smoke and carbon monoxide detectors', 3, true),
    ((SELECT id FROM c), 'Use room thermometer (68–72°F)', 4, false),
    ((SELECT id FROM c), 'Secure furniture to walls', 5, false),
    ((SELECT id FROM c), 'Install outlet covers', 6, false);

-- Insert feeding checklist
WITH c AS (
    INSERT INTO public.checklists (title, locale, age_min_days, age_max_days)
    VALUES ('Feeding Essentials', 'en-US', 0, 30)
    RETURNING id
)
INSERT INTO public.checklist_items (checklist_id, text, item_order, required)
VALUES 
    ((SELECT id FROM c), 'Establish feeding routine', 1, true),
    ((SELECT id FROM c), 'Track wet and dirty diapers', 2, true),
    ((SELECT id FROM c), 'Monitor weight gain', 3, true),
    ((SELECT id FROM c), 'Prepare feeding supplies', 4, false),
    ((SELECT id FROM c), 'Learn hunger and fullness cues', 5, false);

-- Analyze tables for performance
ANALYZE public.articles;
ANALYZE public.embeddings;
ANALYZE public.babies;
ANALYZE public.chat_sessions;
ANALYZE public.chat_messages;

-- =============================================================================
-- SETUP COMPLETE!
-- =============================================================================
