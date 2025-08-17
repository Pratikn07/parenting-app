-- =============================================================================
-- Supabase Database Schema for "Your Parenting Compass"
-- Based on PRD requirements for parenting app with chat, milestones, and content
-- =============================================================================

-- Enable required extensions (idempotent)
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;
create extension if not exists vector; -- pgvector for embeddings
create extension if not exists pg_trgm; -- useful for future partial search (optional)

-- =============================================================================
-- TABLES
-- =============================================================================

-- users table (1:1 with auth.users)
-- Mirrors core profile fields and preferences, references auth.users.id
create table if not exists public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    email text unique,
    locale text not null default 'en-US',
    timezone text,
    created_at timestamptz not null default now()
);

-- babies table (user-scoped)
create table if not exists public.babies (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    name text,
    date_of_birth date not null,
    sex text check (sex in ('female','male','unspecified')),
    gestational_age_weeks int,
    allergies text[],
    diet_notes text,
    pediatrician_contact jsonb,
    created_at timestamptz not null default now()
);

-- onboarding_responses (user-scoped)
create table if not exists public.onboarding_responses (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    question_key text not null,
    answer jsonb not null,
    created_at timestamptz not null default now()
);

-- chat_sessions (user-scoped; baby_id optional)
create table if not exists public.chat_sessions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    baby_id uuid null references public.babies(id) on delete set null,
    topic text,
    started_at timestamptz not null default now()
);

-- chat_messages (scoped via session → user)
create table if not exists public.chat_messages (
    id bigserial primary key,
    session_id uuid not null references public.chat_sessions(id) on delete cascade,
    role text not null check (role in ('user','assistant','system')),
    content text not null,
    tokens int,
    safety_flags jsonb,
    created_at timestamptz not null default now()
);

-- articles (publicly readable content)
create table if not exists public.articles (
    id uuid primary key default gen_random_uuid(),
    slug text unique,
    title text not null,
    body_md text not null,
    age_min_days int,
    age_max_days int,
    locale text not null default 'en-US',
    tags text[],
    last_reviewed_at date,
    reviewer text
);

-- checklists (publicly readable content)
create table if not exists public.checklists (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    locale text not null default 'en-US',
    age_min_days int,
    age_max_days int
);

-- checklist_items
create table if not exists public.checklist_items (
    id uuid primary key default gen_random_uuid(),
    checklist_id uuid not null references public.checklists(id) on delete cascade,
    text text not null,
    item_order int not null,
    required boolean not null default false
);

-- reminders (user-scoped)
create table if not exists public.reminders (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    type text not null,
    due_at timestamptz,
    rrule text,
    payload jsonb,
    status text not null default 'scheduled'
);

-- growth_measurements (scoped via baby → user)
create table if not exists public.growth_measurements (
    id uuid primary key default gen_random_uuid(),
    baby_id uuid not null references public.babies(id) on delete cascade,
    measured_at timestamptz not null,
    weight_g int,
    length_cm numeric,
    head_circum_cm numeric,
    source text
);

-- devices (user-scoped)
create table if not exists public.devices (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    push_token text not null,
    platform text check (platform in ('ios','android','web')),
    last_seen_at timestamptz not null default now()
);

-- embeddings for pgvector (public content derived, plus future private)
create table if not exists public.embeddings (
    id uuid primary key default gen_random_uuid(),
    source_table text, -- e.g., 'articles' or 'checklists'
    source_id uuid,
    chunk_index int,
    locale text,
    tags text[],
    age_min_days int,
    age_max_days int,
    embedding vector(1536) not null,
    created_at timestamptz not null default now()
);

-- =============================================================================
-- INDEXES & PERFORMANCE
-- =============================================================================

-- Age targeting (composite) and tags GIN
create index if not exists idx_articles_age_locale on public.articles (age_min_days, age_max_days, locale);
create index if not exists idx_articles_tags_gin on public.articles using gin (tags);

create index if not exists idx_checklists_age_locale on public.checklists (age_min_days, age_max_days, locale);

-- Chat performance
create index if not exists idx_chat_messages_session_created on public.chat_messages (session_id, created_at);
create index if not exists idx_chat_sessions_user on public.chat_sessions (user_id, started_at);

-- Reminders scheduling
create index if not exists idx_reminders_due_status on public.reminders (due_at, status);
create index if not exists idx_reminders_scheduled_partial on public.reminders (due_at) where status = 'scheduled';

-- Devices
create unique index if not exists uq_devices_user_token on public.devices (user_id, push_token);

-- Growth by baby/time
create index if not exists idx_growth_baby_time on public.growth_measurements (baby_id, measured_at);

-- Vector index (IVFFLAT). Adjust lists based on corpus size (e.g., 100 for ~10k rows).
-- Note: IVFFLAT requires analyze after creation and performs best when match_count << table size.
create index if not exists idx_embeddings_ivfflat on public.embeddings 
using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index if not exists idx_embeddings_filters on public.embeddings (locale, age_min_days, age_max_days);
create index if not exists idx_embeddings_tags_gin on public.embeddings using gin (tags);
