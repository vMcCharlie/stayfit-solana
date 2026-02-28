-- Drop the old trigger that was on the wrong table (workouts instead of workout_sessions)
-- The workout_completed activity is now created by the workout-tracker edge function
drop trigger if exists on_workout_created on public.workouts;
drop function if exists public.handle_new_workout();

-- Create an index for faster activity lookups
create index if not exists idx_activities_user_created on public.activities(user_id, created_at desc);
