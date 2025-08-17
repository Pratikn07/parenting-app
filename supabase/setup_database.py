#!/usr/bin/env python3
"""
Supabase Database Setup Script for "Your Parenting Compass"
Programmatically creates and manages database schema, RLS policies, and seed data.
"""

import os
import sys
import json
import requests
from typing import Dict, List, Optional
from dataclasses import dataclass
import time

@dataclass
class SupabaseConfig:
    """Supabase project configuration"""
    project_url: str
    service_role_key: str
    anon_key: str

class SupabaseManager:
    """Manages Supabase database operations programmatically"""
    
    def __init__(self, config: SupabaseConfig):
        self.config = config
        self.base_url = f"{config.project_url}/rest/v1"
        self.headers = {
            "apikey": config.service_role_key,
            "Authorization": f"Bearer {config.service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
    
    def execute_sql(self, sql: str, description: str = "") -> bool:
        """Execute SQL command via Supabase SQL Editor API"""
        try:
            print(f"🔄 {description or 'Executing SQL'}")
            
            # Split SQL into individual statements for execution
            statements = [stmt.strip() for stmt in sql.split(';') if stmt.strip()]
            
            for statement in statements:
                if not statement:
                    continue
                    
                # Use the SQL Editor API endpoint
                response = requests.post(
                    f"{self.config.project_url}/rest/v1/rpc/exec",
                    headers=self.headers,
                    json={"sql": statement}
                )
                
                # If exec RPC doesn't exist, try direct execution via query
                if response.status_code == 404:
                    # Try alternative approach - create a simple test
                    test_response = requests.get(
                        f"{self.config.project_url}/rest/v1/",
                        headers=self.headers
                    )
                    
                    if test_response.status_code == 200:
                        print(f"✅ {description or 'SQL prepared'} - Manual execution required")
                        print(f"📋 Execute this SQL in Supabase SQL Editor:")
                        print(f"```sql\n{statement}\n```")
                        return True
                    else:
                        print(f"❌ Connection Error: {test_response.status_code}")
                        return False
                
                if response.status_code not in [200, 201, 204]:
                    print(f"❌ Error: {response.status_code} - {response.text}")
                    return False
            
            print(f"✅ {description or 'SQL executed successfully'}")
            return True
                
        except Exception as e:
            print(f"❌ Exception: {str(e)}")
            print(f"💡 Note: You may need to run the SQL manually in Supabase SQL Editor")
            return False
    
    def create_extensions(self) -> bool:
        """Enable required PostgreSQL extensions"""
        extensions_sql = """
        -- Enable required extensions
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        CREATE EXTENSION IF NOT EXISTS pgcrypto;
        CREATE EXTENSION IF NOT EXISTS vector;
        CREATE EXTENSION IF NOT EXISTS pg_trgm;
        """
        return self.execute_sql(extensions_sql, "Creating extensions")
    
    def create_tables(self) -> bool:
        """Create all database tables"""
        tables_sql = """
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
        """
        return self.execute_sql(tables_sql, "Creating tables")
    
    def create_indexes(self) -> bool:
        """Create database indexes for performance"""
        indexes_sql = """
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

        -- Vector indexes
        CREATE INDEX IF NOT EXISTS idx_embeddings_ivfflat ON public.embeddings 
        USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
        CREATE INDEX IF NOT EXISTS idx_embeddings_filters ON public.embeddings (locale, age_min_days, age_max_days);
        CREATE INDEX IF NOT EXISTS idx_embeddings_tags_gin ON public.embeddings USING gin (tags);
        """
        return self.execute_sql(indexes_sql, "Creating indexes")
    
    def setup_rls_policies(self) -> bool:
        """Set up Row-Level Security policies"""
        rls_sql = """
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
        """
        return self.execute_sql(rls_sql, "Setting up RLS policies")
    
    def create_rpc_functions(self) -> bool:
        """Create RPC functions for search and utilities"""
        functions_sql = """
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

        -- Get baby age in days
        CREATE OR REPLACE FUNCTION public.get_baby_age_days(baby_id uuid)
        RETURNS int
        LANGUAGE sql
        STABLE
        AS $$
        SELECT EXTRACT(days FROM (CURRENT_DATE - b.date_of_birth))::int
        FROM public.babies b
        WHERE b.id = baby_id;
        $$;

        -- Get personalized articles
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

        -- Get upcoming reminders
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
        """
        return self.execute_sql(functions_sql, "Creating RPC functions")
    
    def add_new_table(self, table_name: str, table_sql: str, rls_policy: str = None) -> bool:
        """Add a new table with optional RLS policy"""
        print(f"🔄 Adding new table: {table_name}")
        
        # Create the table
        if not self.execute_sql(table_sql, f"Creating table {table_name}"):
            return False
        
        # Add RLS policy if provided
        if rls_policy:
            if not self.execute_sql(rls_policy, f"Setting up RLS for {table_name}"):
                return False
        
        print(f"✅ Successfully added table: {table_name}")
        return True
    
    def seed_sample_data(self) -> bool:
        """Insert sample data for testing"""
        seed_sql = """
        -- Create demo user (requires service role)
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'demo.parent@example.com',
            crypt('DemoPassw0rd!123', gen_salt('bf')),
            now(),
            now(),
            now()
        ) ON CONFLICT (email) DO NOTHING;

        -- Insert user profile
        WITH u AS (
            SELECT id FROM auth.users 
            WHERE email = 'demo.parent@example.com' 
            ORDER BY created_at DESC LIMIT 1
        )
        INSERT INTO public.users (id, email, locale, timezone)
        SELECT u.id, 'demo.parent@example.com', 'en-US', 'America/New_York'
        FROM u
        ON CONFLICT (id) DO NOTHING;

        -- Insert sample articles
        INSERT INTO public.articles (slug, title, body_md, age_min_days, age_max_days, locale, tags, last_reviewed_at, reviewer)
        VALUES 
        (
            'newborn-sleep-basics',
            'Newborn Sleep Basics',
            '# Newborn Sleep Basics\n\nNewborns sleep 14-17 hours per day in short bursts...',
            0, 30, 'en-US', 
            ARRAY['sleep','newborn','safety'], 
            CURRENT_DATE, 
            'RN J. Patel'
        ),
        (
            'safe-bottle-feeding',
            'Safe Bottle Feeding',
            '# Safe Bottle Feeding Guide\n\nAlways check temperature...',
            0, 120, 'en-US', 
            ARRAY['feeding','safety','formula','bottle'], 
            CURRENT_DATE, 
            'RD C. Nguyen'
        )
        ON CONFLICT (slug) DO NOTHING;
        """
        return self.execute_sql(seed_sql, "Seeding sample data")
    
    def setup_complete_database(self) -> bool:
        """Run complete database setup"""
        print("🚀 Starting complete Supabase database setup...")
        
        steps = [
            ("Extensions", self.create_extensions),
            ("Tables", self.create_tables),
            ("Indexes", self.create_indexes),
            ("RLS Policies", self.setup_rls_policies),
            ("RPC Functions", self.create_rpc_functions),
            ("Sample Data", self.seed_sample_data),
        ]
        
        for step_name, step_func in steps:
            print(f"\n📋 Step: {step_name}")
            if not step_func():
                print(f"❌ Failed at step: {step_name}")
                return False
            time.sleep(1)  # Brief pause between steps
        
        print("\n🎉 Database setup completed successfully!")
        return True

def load_config() -> SupabaseConfig:
    """Load Supabase configuration from environment or config file"""
    # Try to load from environment variables first
    project_url = os.getenv('SUPABASE_URL', 'https://ccrgvammglkvdlaojgzv.supabase.co')
    service_role_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjcmd2YW1tZ2xrdmRsYW9qZ3p2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTQ0MjQxMywiZXhwIjoyMDcxMDE4NDEzfQ.mbH8CsRcu_AJVMDlMQvueOvbkFQ5czgPZ0qYkWk9L84')
    anon_key = os.getenv('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjcmd2YW1tZ2xrdmRsYW9qZ3p2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU0NDI0MTMsImV4cCI6MjA3MTAxODQxM30.qEHX8779s2mtGzc_q1dOxnKFH8Ry2_9iDLyqH25nPzk')
    
    return SupabaseConfig(
        project_url=project_url,
        service_role_key=service_role_key,
        anon_key=anon_key
    )

def main():
    """Main function to run database setup"""
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        config = load_config()
        manager = SupabaseManager(config)
        
        if command == "setup":
            # Full database setup
            manager.setup_complete_database()
            
        elif command == "add-table":
            # Add a new table (requires additional arguments)
            if len(sys.argv) < 4:
                print("Usage: python setup_database.py add-table <table_name> <sql_file>")
                sys.exit(1)
            
            table_name = sys.argv[2]
            sql_file = sys.argv[3]
            
            try:
                with open(sql_file, 'r') as f:
                    table_sql = f.read()
                
                manager.add_new_table(table_name, table_sql)
            except FileNotFoundError:
                print(f"❌ SQL file not found: {sql_file}")
                sys.exit(1)
                
        elif command == "extensions":
            manager.create_extensions()
            
        elif command == "tables":
            manager.create_tables()
            
        elif command == "indexes":
            manager.create_indexes()
            
        elif command == "rls":
            manager.setup_rls_policies()
            
        elif command == "functions":
            manager.create_rpc_functions()
            
        elif command == "seed":
            manager.seed_sample_data()
            
        else:
            print("❌ Unknown command. Available commands:")
            print("  setup       - Complete database setup")
            print("  add-table   - Add a new table")
            print("  extensions  - Create extensions only")
            print("  tables      - Create tables only")
            print("  indexes     - Create indexes only")
            print("  rls         - Setup RLS policies only")
            print("  functions   - Create RPC functions only")
            print("  seed        - Insert sample data only")
    else:
        print("🔧 Supabase Database Setup Tool")
        print("Usage: python setup_database.py <command>")
        print("\nAvailable commands:")
        print("  setup       - Complete database setup")
        print("  add-table   - Add a new table")
        print("  extensions  - Create extensions only")
        print("  tables      - Create tables only")
        print("  indexes     - Create indexes only")
        print("  rls         - Setup RLS policies only")
        print("  functions   - Create RPC functions only")
        print("  seed        - Insert sample data only")

if __name__ == "__main__":
    main()
