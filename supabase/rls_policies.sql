-- =============================================================================
-- Row-Level Security (RLS) Policies for "Your Parenting Compass"
-- Ensures users can only access their own data while allowing service role full access
-- =============================================================================

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.babies enable row level security;
alter table public.onboarding_responses enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.reminders enable row level security;
alter table public.growth_measurements enable row level security;
alter table public.devices enable row level security;
alter table public.articles enable row level security;
alter table public.checklists enable row level security;
alter table public.checklist_items enable row level security;
alter table public.embeddings enable row level security;

-- =============================================================================
-- USER-SCOPED TABLES (users can only see/modify their own data)
-- =============================================================================

-- users: a user can see and manage only their own profile
drop policy if exists "own row - users" on public.users;
create policy "own row - users" on public.users 
for all using (id = auth.uid()) 
with check (id = auth.uid());

create policy if not exists "service role all - users" on public.users 
for all using (auth.role() = 'service_role') 
with check (auth.role() = 'service_role');

-- babies: users can only see/manage their own babies
drop policy if exists "own rows - babies" on public.babies;
create policy "own rows - babies" on public.babies 
for all using (user_id = auth.uid()) 
with check (user_id = auth.uid());

create policy if not exists "service role all - babies" on public.babies 
for all using (auth.role() = 'service_role') 
with check (auth.role() = 'service_role');

-- onboarding_responses: users can only see/manage their own responses
drop policy if exists "own rows - onboarding" on public.onboarding_responses;
create policy "own rows - onboarding" on public.onboarding_responses 
for all using (user_id = auth.uid()) 
with check (user_id = auth.uid());

create policy if not exists "service role all - onboarding" on public.onboarding_responses 
for all using (auth.role() = 'service_role') 
with check (auth.role() = 'service_role');

-- chat_sessions: users can only see/manage their own chat sessions
drop policy if exists "own rows - chat_sessions" on public.chat_sessions;
create policy "own rows - chat_sessions" on public.chat_sessions 
for all using (user_id = auth.uid()) 
with check (user_id = auth.uid());

create policy if not exists "service role all - chat_sessions" on public.chat_sessions 
for all using (auth.role() = 'service_role') 
with check (auth.role() = 'service_role');

-- chat_messages: scope via session → user (users can only see messages in their sessions)
drop policy if exists "own rows - chat_messages" on public.chat_messages;
create policy "own rows - chat_messages" on public.chat_messages 
for all using (
    exists (
        select 1 from public.chat_sessions s 
        where s.id = chat_messages.session_id 
        and s.user_id = auth.uid()
    )
) 
with check (
    exists (
        select 1 from public.chat_sessions s 
        where s.id = chat_messages.session_id 
        and s.user_id = auth.uid()
    )
);

create policy if not exists "service role all - chat_messages" on public.chat_messages 
for all using (auth.role() = 'service_role') 
with check (auth.role() = 'service_role');

-- reminders: users can only see/manage their own reminders
drop policy if exists "own rows - reminders" on public.reminders;
create policy "own rows - reminders" on public.reminders 
for all using (user_id = auth.uid()) 
with check (user_id = auth.uid());

create policy if not exists "service role all - reminders" on public.reminders 
for all using (auth.role() = 'service_role') 
with check (auth.role() = 'service_role');

-- growth_measurements: scope via baby → user (users can only see measurements for their babies)
drop policy if exists "own rows - growth_measurements" on public.growth_measurements;
create policy "own rows - growth_measurements" on public.growth_measurements 
for all using (
    exists (
        select 1 from public.babies b 
        where b.id = growth_measurements.baby_id 
        and b.user_id = auth.uid()
    )
) 
with check (
    exists (
        select 1 from public.babies b 
        where b.id = growth_measurements.baby_id 
        and b.user_id = auth.uid()
    )
);

create policy if not exists "service role all - growth_measurements" on public.growth_measurements 
for all using (auth.role() = 'service_role') 
with check (auth.role() = 'service_role');

-- devices: users can only see/manage their own devices
drop policy if exists "own rows - devices" on public.devices;
create policy "own rows - devices" on public.devices 
for all using (user_id = auth.uid()) 
with check (user_id = auth.uid());

create policy if not exists "service role all - devices" on public.devices 
for all using (auth.role() = 'service_role') 
with check (auth.role() = 'service_role');

-- =============================================================================
-- PUBLIC CONTENT TABLES (readable to all authenticated users, writable by service role only)
-- =============================================================================

-- articles: readable to all authenticated users, writes restricted to service_role
drop policy if exists "public read - articles" on public.articles;
create policy "public read - articles" on public.articles 
for select using (auth.role() = 'authenticated' or auth.role() = 'anon');

create policy if not exists "service role write - articles" on public.articles 
for all using (auth.role() = 'service_role') 
with check (auth.role() = 'service_role');

-- checklists: readable to all authenticated users, writes restricted to service_role
drop policy if exists "public read - checklists" on public.checklists;
create policy "public read - checklists" on public.checklists 
for select using (auth.role() = 'authenticated' or auth.role() = 'anon');

create policy if not exists "service role write - checklists" on public.checklists 
for all using (auth.role() = 'service_role') 
with check (auth.role() = 'service_role');

-- checklist_items: readable to all authenticated users, writes restricted to service_role
drop policy if exists "public read - checklist_items" on public.checklist_items;
create policy "public read - checklist_items" on public.checklist_items 
for select using (auth.role() = 'authenticated' or auth.role() = 'anon');

create policy if not exists "service role write - checklist_items" on public.checklist_items 
for all using (auth.role() = 'service_role') 
with check (auth.role() = 'service_role');

-- embeddings: readable to all authenticated users for content discovery, writes restricted to service_role
drop policy if exists "public read - embeddings" on public.embeddings;
create policy "public read - embeddings" on public.embeddings 
for select using (auth.role() = 'authenticated' or auth.role() = 'anon');

create policy if not exists "service role write - embeddings" on public.embeddings 
for all using (auth.role() = 'service_role') 
with check (auth.role() = 'service_role');
