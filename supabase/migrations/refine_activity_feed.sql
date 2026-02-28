-- Drop the follow trigger and function
drop trigger if exists on_follow_created on public.follows;
drop function if exists public.handle_new_follow();

-- Add new activity types
-- Note: Altering enum inside a transaction block can be tricky in some Postgres versions if not careful, 
-- but 'ADD VALUE' is generally safe.
alter type public.activity_type add value if not exists 'streak_milestone';
alter type public.activity_type add value if not exists 'weekly_goal_met';

-- Clean up existing 'started_following' activities
delete from public.activities where type = 'started_following';

-- Create an index on activities to speed up feed queries
-- We filter by user_id and order by created_at
create index if not exists idx_activities_feed on public.activities(user_id, created_at desc);

-- Grant permissions if new types affect RLS (usually not needed for enum updates)
