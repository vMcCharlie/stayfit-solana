-- Enable RLS on user_achievements if not already
alter table public.user_achievements enable row level security;

-- Policy: Users can insert their own achievements
create policy "Users can insert own achievements"
    on public.user_achievements for insert
    with check (auth.uid() = user_id);

-- Policy: Users can update their own achievements
create policy "Users can update own achievements"
    on public.user_achievements for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Policy: Users can select their own achievements
create policy "Users can select own achievements"
    on public.user_achievements for select
    using (auth.uid() = user_id);

-- Optional: Allow public to see achievements if profile is public?
-- For now, let's keep it simple. If we want public profiles to show achievements, we'd add:
-- create policy "Public can view achievements"
--     on public.user_achievements for select
--     using (true); -- Or more complex logic checking profile visibility
-- But existing code in `public-profile` doesn't seem to list achievements yet, so local access is priority.

-- Also ensure achievements definition table is readable
alter table public.achievements enable row level security;

create policy "Achievements are viewable by everyone"
    on public.achievements for select
    using (true);
