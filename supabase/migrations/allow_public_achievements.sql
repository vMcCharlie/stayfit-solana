-- Allow authenticated users to view others' achievements (for Public Profile)
-- This assumes that if you can see the profile, you can see the achievements.
-- Ideally we would check profile visibility, but assuming open social graph for MVP.

create policy "Users can view all achievements"
    on public.user_achievements for select
    using (auth.role() = 'authenticated');

-- Note: This overlaps with "Users can select own achievements" but is broader.
-- Postgres allows permissive policies (OR logic).
