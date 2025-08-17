-- =============================================================================
-- Seed Data for "Your Parenting Compass"
-- Sample data for testing and development
-- =============================================================================

-- Create a demo user via Supabase Auth helper
-- Note: This requires service role privileges
select
auth.create_user(
    email := 'demo.parent@example.com',
    password := 'DemoPassw0rd!123',
    email_confirm := true,
    raw_user_meta_data := jsonb_build_object('full_name','Priya Gupta')
) as created_user;

-- Insert user profile (mirrors auth.users)
with u as (
    select id from auth.users 
    where email = 'demo.parent@example.com' 
    order by created_at desc limit 1
)
insert into public.users (id, email, locale, timezone)
select u.id, 'demo.parent@example.com', 'en-US', 'America/New_York'
from u
on conflict (id) do nothing;

-- Insert baby
with u as (
    select id from auth.users 
    where email = 'demo.parent@example.com' limit 1
)
insert into public.babies (user_id, name, date_of_birth, sex, gestational_age_weeks, allergies, diet_notes, pediatrician_contact)
select 
    u.id, 
    'Aarav', 
    (current_date - interval '20 days')::date, 
    'male', 
    39, 
    array['peanuts'], 
    'Breastfeeding on demand', 
    jsonb_build_object('name','Dr. Lee','phone','+1-555-0101')
from u;

-- Insert onboarding responses
with u as (
    select id from auth.users 
    where email = 'demo.parent@example.com' limit 1
)
insert into public.onboarding_responses (user_id, question_key, answer)
select u.id, 'parenting_experience', jsonb_build_object('level', 'first_time', 'concerns', ['sleep', 'feeding'])
from u
union all
select u.id, 'support_system', jsonb_build_object('has_partner', true, 'family_nearby', false)
from u
union all
select u.id, 'preferred_topics', jsonb_build_object('interests', ['development', 'health', 'sleep'])
from u;

-- Insert chat session and messages
with u as (
    select id from auth.users 
    where email = 'demo.parent@example.com' limit 1
),
b as (
    select id from public.babies 
    where user_id = (select id from u) limit 1
),
s as (
    insert into public.chat_sessions (user_id, baby_id, topic)
    select (select id from u), (select id from b), 'Newborn sleep'
    returning id
)
insert into public.chat_messages (session_id, role, content, tokens, safety_flags)
select (select id from s), 'user', 'My newborn is waking every hour. Is this normal?', 12, null
union all
select (select id from s), 'assistant', 'Frequent waking is common in the first weeks. Newborns have short sleep cycles and need to feed often. Let''s check a few things: Is baby getting enough to eat? Room temperature comfortable? Any signs of discomfort?', 45, jsonb_build_object('safe', true)
union all
select (select id from s), 'user', 'How many naps should we expect at 3 weeks?', 9, null
union all
select (select id from s), 'assistant', 'At 3 weeks, babies typically sleep 14-17 hours per day in short bursts. Expect 4-6 naps lasting 30 minutes to 3 hours each. Every baby is different, so focus on their cues rather than strict schedules.', 42, jsonb_build_object('safe', true);

-- Insert articles
insert into public.articles (slug, title, body_md, age_min_days, age_max_days, locale, tags, last_reviewed_at, reviewer)
values 
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

## When to Seek Help

Contact your pediatrician if:
- Baby seems excessively sleepy or difficult to wake
- Significant changes in sleep patterns
- Signs of sleep apnea (pauses in breathing)

Remember: Every baby is different. Trust your instincts and don''t hesitate to ask for help.',
    0, 30, 'en-US', 
    array['sleep','newborn','safety'], 
    current_date, 
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

## Feeding Techniques

### Positioning
- Hold baby in a semi-upright position
- Support baby''s head and neck
- Tilt bottle so nipple is full of milk to reduce air intake

### Pacing
- Let baby control the feeding pace
- Take breaks to burp every 1-2 ounces
- Watch for hunger and fullness cues

## Storage Guidelines

### Prepared Formula
- Use within 1 hour at room temperature
- Refrigerate unused formula for up to 24 hours
- Never refreeze thawed formula

### Breast Milk Storage
- Room temperature: 4 hours
- Refrigerator: 4 days
- Freezer: 6-12 months

## Signs of Proper Feeding

- Baby seems satisfied after feeds
- Regular wet diapers (6+ per day after day 5)
- Steady weight gain
- Alert periods between feeds

Contact your pediatrician with any concerns about feeding or growth.',
    0, 120, 'en-US', 
    array['feeding','safety','formula','bottle'], 
    current_date, 
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
- Stop swaddling when baby shows signs of rolling

### 2. Side/Stomach Position (for soothing only)
- Hold baby on their side or stomach while awake
- **Never** place baby on side or stomach to sleep
- Return to back position for sleep

### 3. Shushing
- Make a loud "shush" sound near baby''s ear
- Use white noise machines or apps
- Volume should match baby''s crying level

### 4. Swinging
- Gentle, rhythmic motion
- Rock in a chair, walk, or use a swing
- Keep head supported and movements small

### 5. Sucking
- Offer a pacifier or clean finger
- Breastfeeding babies may need to suck for comfort
- Wait until breastfeeding is established (3-4 weeks)

## Other Soothing Strategies

### Environmental Changes
- Dim the lights
- Reduce stimulation
- Change baby''s position
- Check for uncomfortable clothing or diaper

### Physical Comfort
- Skin-to-skin contact
- Gentle massage
- Warm bath (if umbilical cord has healed)
- Check for hair wrapped around fingers or toes

## When Crying May Indicate a Problem

Contact your pediatrician if baby:
- Cries for more than 3 hours daily for several days
- Has a high-pitched, shrill cry
- Shows signs of illness (fever, poor feeding, lethargy)
- Crying seems to indicate pain

## Remember

- All babies cry - it''s their primary form of communication
- Peak crying often occurs around 6 weeks
- It''s okay to put baby down safely and take a break if you feel overwhelmed
- Ask for help from family, friends, or healthcare providers',
    0, 90, 'en-US', 
    array['soothing','newborn','crying','comfort'], 
    current_date, 
    'MD A. Romero'
);

-- Insert checklists
with c as (
    insert into public.checklists (title, locale, age_min_days, age_max_days)
    values ('Newborn Home Safety', 'en-US', 0, 60)
    returning id
)
insert into public.checklist_items (checklist_id, text, item_order, required)
values 
    ((select id from c), 'Check crib mattress firmness', 1, true),
    ((select id from c), 'Remove loose bedding and pillows', 2, true),
    ((select id from c), 'Install smoke and carbon monoxide detectors', 3, true),
    ((select id from c), 'Use room thermometer (68–72°F)', 4, false),
    ((select id from c), 'Secure furniture to walls', 5, false),
    ((select id from c), 'Install outlet covers', 6, false);

-- Insert another checklist for feeding
with c as (
    insert into public.checklists (title, locale, age_min_days, age_max_days)
    values ('Feeding Essentials', 'en-US', 0, 30)
    returning id
)
insert into public.checklist_items (checklist_id, text, item_order, required)
values 
    ((select id from c), 'Establish feeding routine', 1, true),
    ((select id from c), 'Track wet and dirty diapers', 2, true),
    ((select id from c), 'Monitor weight gain', 3, true),
    ((select id from c), 'Prepare feeding supplies', 4, false),
    ((select id from c), 'Learn hunger and fullness cues', 5, false);

-- Insert reminders
with u as (
    select id from auth.users 
    where email = 'demo.parent@example.com' limit 1
)
insert into public.reminders (user_id, type, due_at, rrule, payload, status)
select 
    u.id, 
    'pediatrician_appointment', 
    now() + interval '3 days', 
    null, 
    jsonb_build_object('note','2-week checkup', 'doctor','Dr. Lee'), 
    'scheduled'
from u
union all
select 
    u.id, 
    'vaccination', 
    now() + interval '6 weeks', 
    null, 
    jsonb_build_object('vaccines',['DTaP', 'IPV', 'Hib'], 'location','Pediatric Clinic'), 
    'scheduled'
from u;

-- Insert growth measurements
with b as (
    select id from public.babies 
    where name = 'Aarav' limit 1
)
insert into public.growth_measurements (baby_id, measured_at, weight_g, length_cm, head_circum_cm, source)
select 
    b.id, 
    now() - interval '1 day', 
    3700, 
    52.0, 
    35.0, 
    'hospital'
from b
union all
select 
    b.id, 
    now() - interval '1 week', 
    3500, 
    51.5, 
    34.8, 
    'home'
from b;

-- Insert device registration
with u as (
    select id from auth.users 
    where email = 'demo.parent@example.com' limit 1
)
insert into public.devices (user_id, push_token, platform, last_seen_at)
select 
    u.id, 
    'demo_push_token_ios_12345', 
    'ios', 
    now()
from u;

-- Insert sample embeddings (dummy vectors for demonstration)
-- In production, these would be generated by an AI service
insert into public.embeddings (source_table, source_id, chunk_index, locale, tags, age_min_days, age_max_days, embedding)
select 
    'articles', 
    a.id, 
    0, 
    a.locale, 
    a.tags, 
    a.age_min_days, 
    a.age_max_days,
    -- Create a dummy 1536-dimensional vector with small random values
    array_to_vector(
        ARRAY[0.001::float4, 0.002, 0.0, 0.004] || 
        array_fill(random()::float4 * 0.01, array[1532])
    )
from public.articles a
limit 3;

-- Analyze tables for better query performance (especially important for vector indexes)
analyze public.articles;
analyze public.embeddings;
analyze public.babies;
analyze public.chat_sessions;
analyze public.chat_messages;
