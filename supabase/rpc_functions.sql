-- =============================================================================
-- RPC Functions for "Your Parenting Compass"
-- Search functions for articles and embeddings with filtering capabilities
-- =============================================================================

-- search_articles(age_days, locale, tags)
-- Returns articles filtered by locale, age_days (falls within min/max), and tag overlap
create or replace function public.search_articles(age_days int, locale text, tags text[])
returns setof public.articles
language sql
stable
as $$
select *
from public.articles a
where (a.locale = coalesce(locale, a.locale))
and (
    (age_days is null)
    or (
        (a.age_min_days is null or a.age_min_days <= age_days)
        and (a.age_max_days is null or a.age_max_days >= age_days)
    )
)
and (
    tags is null
    or tags = '{}'
    or a.tags && tags
)
order by a.last_reviewed_at desc nulls last, a.title asc
$$;

comment on function public.search_articles is 'Returns articles filtered by locale, age_days (falls within min/max), and tag overlap.';

-- search_embeddings(query_embedding, match_count, filter)
-- filter jsonb accepts keys: locale (text), tags (text[]), age_days (int)
-- Returns k-NN search over embeddings with optional locale/tags/age filters
create or replace function public.search_embeddings(
    query_embedding vector(1536),
    match_count int,
    filter jsonb default '{}'::jsonb
)
returns table (
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
language plpgsql
stable
as $$
declare
    f_locale text := nullif(filter->>'locale', '');
    f_age int := (filter->>'age_days')::int;
    f_tags text[] := (select array_agg(value::text) from jsonb_array_elements_text(coalesce(filter->'tags','[]'::jsonb)));
begin
    return query
    select
        e.id,
        e.source_table,
        e.source_id,
        e.chunk_index,
        e.locale,
        e.tags,
        e.age_min_days,
        e.age_max_days,
        1 - (e.embedding <=> query_embedding) as similarity
    from public.embeddings e
    where (f_locale is null or e.locale = f_locale)
    and (
        f_age is null
        or (
            (e.age_min_days is null or e.age_min_days <= f_age)
            and (e.age_max_days is null or e.age_max_days >= f_age)
        )
    )
    and (
        f_tags is null
        or cardinality(f_tags) = 0
        or e.tags && f_tags
    )
    order by e.embedding <-> query_embedding
    limit greatest(match_count, 1);
end;
$$;

comment on function public.search_embeddings is 'k-NN search over embeddings with optional locale/tags/age filters. Returns similarity = 1 - cosine distance.';

-- get_baby_age_days(baby_id)
-- Helper function to calculate baby's age in days
create or replace function public.get_baby_age_days(baby_id uuid)
returns int
language sql
stable
as $$
select extract(days from (current_date - b.date_of_birth))::int
from public.babies b
where b.id = baby_id;
$$;

comment on function public.get_baby_age_days is 'Calculate baby age in days from date of birth.';

-- get_personalized_articles(baby_id, locale, limit_count)
-- Get articles personalized for a specific baby's age
create or replace function public.get_personalized_articles(
    baby_id uuid,
    locale text default 'en-US',
    limit_count int default 10
)
returns setof public.articles
language sql
stable
as $$
select a.*
from public.articles a,
     public.get_baby_age_days(baby_id) as age_days
where (a.locale = locale)
and (
    (a.age_min_days is null or a.age_min_days <= age_days)
    and (a.age_max_days is null or a.age_max_days >= age_days)
)
order by a.last_reviewed_at desc nulls last, a.title asc
limit limit_count;
$$;

comment on function public.get_personalized_articles is 'Get articles personalized for a specific baby based on their age.';

-- get_upcoming_reminders(user_id, days_ahead)
-- Get reminders due within specified days for a user
create or replace function public.get_upcoming_reminders(
    user_id uuid,
    days_ahead int default 7
)
returns setof public.reminders
language sql
stable
as $$
select r.*
from public.reminders r
where r.user_id = user_id
and r.status = 'scheduled'
and r.due_at between now() and (now() + interval '1 day' * days_ahead)
order by r.due_at asc;
$$;

comment on function public.get_upcoming_reminders is 'Get scheduled reminders due within specified days for a user.';

-- get_growth_percentiles(baby_id, measurement_type)
-- Calculate growth percentiles for a baby (placeholder for future implementation)
create or replace function public.get_growth_percentiles(
    baby_id uuid,
    measurement_type text default 'weight'
)
returns table (
    measurement_date date,
    value numeric,
    percentile numeric
)
language sql
stable
as $$
select
    gm.measured_at::date as measurement_date,
    case 
        when measurement_type = 'weight' then gm.weight_g::numeric / 1000 -- convert to kg
        when measurement_type = 'length' then gm.length_cm
        when measurement_type = 'head_circumference' then gm.head_circum_cm
        else null
    end as value,
    50.0 as percentile -- placeholder - would calculate actual percentiles with growth charts
from public.growth_measurements gm
where gm.baby_id = baby_id
and case 
    when measurement_type = 'weight' then gm.weight_g is not null
    when measurement_type = 'length' then gm.length_cm is not null
    when measurement_type = 'head_circumference' then gm.head_circum_cm is not null
    else false
end
order by gm.measured_at desc;
$$;

comment on function public.get_growth_percentiles is 'Calculate growth percentiles for a baby (placeholder implementation).';
