#!/usr/bin/env python3
"""
Automated Supabase Database Setup for "Your Parenting Compass"
Generates SQL files and provides step-by-step setup instructions.
"""

import os
import sys
import json
from typing import Dict, List, Optional
from dataclasses import dataclass
import datetime

@dataclass
class SupabaseConfig:
    """Supabase project configuration"""
    project_url: str = 'https://ccrgvammglkvdlaojgzv.supabase.co'
    service_role_key: str = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjcmd2YW1tZ2xrdmRsYW9qZ3p2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ0MjQxMywiZXhwIjoyMDcxMDE4NDEzfQ.mbH8CsRcu_AJVMDlMQvueOvbkFQ5czgPZ0qYkWk9L84'
    anon_key: str = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjcmd2YW1tZ2xrdmRsYW9qZ3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NDI0MTMsImV4cCI6MjA3MTAxODQxM30.qEHX8779s2mtGzc_q1dOxnKFH8Ry2_9iDLyqH25nPzk'

class DatabaseSetupGenerator:
    """Generates SQL files and setup instructions for Supabase"""
    
    def __init__(self, config: SupabaseConfig):
        self.config = config
        self.timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    
    def generate_complete_setup_sql(self) -> str:
        """Generate a single SQL file with complete database setup"""
        return f"""-- =============================================================================
-- Complete Supabase Database Setup for "Your Parenting Compass"
-- Generated on: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
-- Project URL: {self.config.project_url}
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
CREATE POLICY IF NOT EXISTS "service role all - users" ON public.users FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "own rows - babies" ON public.babies;
CREATE POLICY "own rows - babies" ON public.babies FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "service role all - babies" ON public.babies FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "own rows - onboarding" ON public.onboarding_responses;
CREATE POLICY "own rows - onboarding" ON public.onboarding_responses FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "service role all - onboarding" ON public.onboarding_responses FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "own rows - chat_sessions" ON public.chat_sessions;
CREATE POLICY "own rows - chat_sessions" ON public.chat_sessions FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "service role all - chat_sessions" ON public.chat_sessions FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "own rows - chat_messages" ON public.chat_messages;
CREATE POLICY "own rows - chat_messages" ON public.chat_messages FOR ALL USING (
    EXISTS (SELECT 1 FROM public.chat_sessions s WHERE s.id = chat_messages.session_id AND s.user_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.chat_sessions s WHERE s.id = chat_messages.session_id AND s.user_id = auth.uid())
);
CREATE POLICY IF NOT EXISTS "service role all - chat_messages" ON public.chat_messages FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "own rows - reminders" ON public.reminders;
CREATE POLICY "own rows - reminders" ON public.reminders FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "service role all - reminders" ON public.reminders FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "own rows - growth_measurements" ON public.growth_measurements;
CREATE POLICY "own rows - growth_measurements" ON public.growth_measurements FOR ALL USING (
    EXISTS (SELECT 1 FROM public.babies b WHERE b.id = growth_measurements.baby_id AND b.user_id = auth.uid())
) WITH CHECK (
    EXISTS (SELECT 1 FROM public.babies b WHERE b.id = growth_measurements.baby_id AND b.user_id = auth.uid())
);
CREATE POLICY IF NOT EXISTS "service role all - growth_measurements" ON public.growth_measurements FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "own rows - devices" ON public.devices;
CREATE POLICY "own rows - devices" ON public.devices FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "service role all - devices" ON public.devices FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Public content policies
DROP POLICY IF EXISTS "public read - articles" ON public.articles;
CREATE POLICY "public read - articles" ON public.articles FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY IF NOT EXISTS "service role write - articles" ON public.articles FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "public read - checklists" ON public.checklists;
CREATE POLICY "public read - checklists" ON public.checklists FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY IF NOT EXISTS "service role write - checklists" ON public.checklists FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "public read - checklist_items" ON public.checklist_items;
CREATE POLICY "public read - checklist_items" ON public.checklist_items FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY IF NOT EXISTS "service role write - checklist_items" ON public.checklist_items FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "public read - embeddings" ON public.embeddings;
CREATE POLICY "public read - embeddings" ON public.embeddings FOR SELECT USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
CREATE POLICY IF NOT EXISTS "service role write - embeddings" ON public.embeddings FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

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
SELECT EXTRACT(days FROM (CURRENT_DATE - b.date_of_birth))::int
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

## Understanding Newborn Sleep Patterns

Newborns sleep 14-17 hours per day, but in short bursts of 2-4 hours. This is completely normal and necessary for their development.

### Key Points:
- Sleep cycles are shorter than adults (50-60 minutes vs 90 minutes)
- REM sleep is more prominent, supporting brain development
- Day/night confusion is common in the first 6-8 weeks

## Creating a Sleep-Friendly Environment

- Keep the room at 68-70°F (20-21°C)
- Use blackout curtains for daytime naps
- White noise can help mask household sounds
- Swaddling may help some babies feel secure

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

### Sterilizing Equipment
- Sterilize bottles and nipples before first use
- For ongoing use, thorough washing with hot soapy water is sufficient
- Air dry on a clean towel or drying rack

### Formula Preparation
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

### 1. Swaddling
- Wrap baby snugly in a blanket
- Arms should be straight at sides
- Hips should have room to move

### 2. Side/Stomach Position (for soothing only)
- Hold baby on their side or stomach while awake
- **Never** place baby on side or stomach to sleep

### 3. Shushing
- Make a loud "shush" sound near baby''s ear
- Use white noise machines or apps

### 4. Swinging
- Gentle, rhythmic motion
- Rock in a chair, walk, or use a swing

### 5. Sucking
- Offer a pacifier or clean finger
- Wait until breastfeeding is established (3-4 weeks)

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
"""

    def generate_new_table_template(self, table_name: str, columns: List[Dict]) -> str:
        """Generate SQL for a new table with RLS policies"""
        
        # Generate column definitions
        column_defs = []
        for col in columns:
            col_def = f"    {col['name']} {col['type']}"
            if col.get('primary_key'):
                col_def += " PRIMARY KEY"
            if col.get('default'):
                col_def += f" DEFAULT {col['default']}"
            if col.get('not_null'):
                col_def += " NOT NULL"
            if col.get('references'):
                col_def += f" REFERENCES {col['references']}"
            if col.get('check'):
                col_def += f" CHECK ({col['check']})"
            column_defs.append(col_def)
        
        return f"""-- New table: {table_name}
-- Generated on: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

CREATE TABLE IF NOT EXISTS public.{table_name} (
{',\\n'.join(column_defs)}
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_{table_name}_user ON public.{table_name} (user_id);
CREATE INDEX IF NOT EXISTS idx_{table_name}_created ON public.{table_name} (created_at);

-- Enable RLS
ALTER TABLE public.{table_name} ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "own rows - {table_name}" ON public.{table_name};
CREATE POLICY "own rows - {table_name}" ON public.{table_name} 
FOR ALL USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "service role all - {table_name}" ON public.{table_name} 
FOR ALL USING (auth.role() = 'service_role') 
WITH CHECK (auth.role() = 'service_role');
"""

    def create_setup_instructions(self) -> str:
        """Generate step-by-step setup instructions"""
        return f"""
🚀 SUPABASE DATABASE SETUP INSTRUCTIONS
=====================================

Project: Your Parenting Compass
URL: {self.config.project_url}
Generated: {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

STEP 1: Open Supabase Dashboard
------------------------------
1. Go to: {self.config.project_url}
2. Navigate to "SQL Editor" in the left sidebar
3. Click "New Query"

STEP 2: Execute Setup SQL
------------------------
1. Copy the contents of 'complete_setup_{self.timestamp}.sql'
2. Paste into the SQL Editor
3. Click "Run" to execute

STEP 3: Configure Authentication
-------------------------------
1. Go to "Authentication" > "Settings"
2. Enable Email authentication (should be enabled by default)
3. Configure OAuth providers:
   - Apple: Add Service ID, Key ID, Team ID, and private key
   - Google: Add OAuth client ID and secret
4. Set Site URL: yourapp://callback
5. Add Redirect URLs: yourapp://callback

STEP 4: Enable Realtime
----------------------
1. Go to "Database" > "Replication"
2. Enable realtime for these tables:
   - chat_messages (for live chat updates)
   - reminders (for notification updates)

STEP 5: Test the Setup
---------------------
1. Check that all tables were created in "Database" > "Tables"
2. Verify RLS policies in "Database" > "Policies"
3. Test RPC functions in "SQL Editor":
   
   SELECT * FROM search_articles(20, 'en-US', ARRAY['sleep']);

STEP 6: Update Frontend Configuration
------------------------------------
Your frontend is already configured with:
- Project URL: {self.config.project_url}
- Anon Key: Already set in src/services/supabase.ts

✅ VERIFICATION CHECKLIST
========================
□ Extensions enabled (uuid-ossp, pgcrypto, vector, pg_trgm)
□ All 12 tables created successfully
□ RLS policies applied to all tables
□ RPC functions created and working
□ Sample data inserted
□ Authentication providers configured
□ Realtime enabled for chat_messages
□ Frontend services updated

🎉 Your Supabase backend is ready!
"""

def main():
    """Main function"""
    config = SupabaseConfig()
    generator = DatabaseSetupGenerator(config)
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "generate":
            # Generate complete setup SQL file
            sql_content = generator.generate_complete_setup_sql()
            filename = f"complete_setup_{generator.timestamp}.sql"
            
            with open(filename, 'w') as f:
                f.write(sql_content)
            
            # Generate instructions
            instructions = generator.create_setup_instructions()
            instructions_filename = f"SETUP_INSTRUCTIONS_{generator.timestamp}.md"
            
            with open(instructions_filename, 'w') as f:
                f.write(instructions)
            
            print(f"✅ Generated setup files:")
            print(f"   📄 {filename}")
            print(f"   📋 {instructions_filename}")
            print(f"\n🚀 Next steps:")
            print(f"   1. Open {instructions_filename} for detailed instructions")
            print(f"   2. Copy {filename} contents to Supabase SQL Editor")
            print(f"   3. Execute the SQL to set up your database")
            
        elif command == "new-table":
            # Generate a new table template
            if len(sys.argv) < 3:
                print("Usage: python automated_setup.py new-table <table_name>")
                print("Example: python automated_setup.py new-table appointments")
                sys.exit(1)
            
            table_name = sys.argv[2]
            
            # Example columns for demonstration
            example_columns = [
                {"name": "id", "type": "uuid", "primary_key": True, "default": "gen_random_uuid()"},
                {"name": "user_id", "type": "uuid", "not_null": True, "references": "public.users(id) ON DELETE CASCADE"},
                {"name": "name", "type": "text", "not_null": True},
                {"name": "created_at", "type": "timestamptz", "not_null": True, "default": "now()"}
            ]
            
            table_sql = generator.generate_new_table_template(table_name, example_columns)
            filename = f"new_table_{table_name}_{generator.timestamp}.sql"
            
            with open(filename, 'w') as f:
                f.write(table_sql)
            
            print(f"✅ Generated new table template: {filename}")
            print(f"📝 Edit the file to customize columns, then run:")
            print(f"   Copy contents to Supabase SQL Editor and execute")
            
        else:
            print("❌ Unknown command. Available commands:")
            print("  generate    - Generate complete setup SQL and instructions")
            print("  new-table   - Generate template for a new table")
    else:
        print("🔧 Automated Supabase Database Setup")
        print("Usage: python automated_setup.py <command>")
        print("\nAvailable commands:")
        print("  generate    - Generate complete setup SQL and instructions")
        print("  new-table   - Generate template for a new table")
        print("\nExamples:")
        print("  python automated_setup.py generate")
        print("  python automated_setup.py new-table appointments")

if __name__ == "__main__":
    main()
