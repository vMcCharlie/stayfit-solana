-- Create follows table if it doesn't exist
create table if not exists public.follows (
    id uuid default gen_random_uuid() primary key,
    follower_id uuid references public.profiles(id) not null,
    following_id uuid references public.profiles(id) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(follower_id, following_id)
);

-- Enable RLS
alter table public.follows enable row level security;

-- Policies for follows
create policy "Users can see who follows whom"
    on public.follows for select
    using (true);

create policy "Users can follow others"
    on public.follows for insert
    with check (auth.uid() = follower_id);

create policy "Users can unfollow"
    on public.follows for delete
    using (auth.uid() = follower_id);

-- Create activity_type enum
do $$ begin
    create type public.activity_type as enum ('workout_completed', 'achievement_unlocked', 'started_following', 'post_liked', 'comment_added');
exception
    when duplicate_object then null;
end $$;

-- Create activities table
create table if not exists public.activities (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) not null,
    type public.activity_type not null,
    data jsonb not null default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.activities enable row level security;

-- Policies for activities
create policy "Users can see activities of people they follow"
    on public.activities for select
    using (
        exists (
            select 1 from public.follows
            where follower_id = auth.uid()
            and following_id = activities.user_id
        )
        or user_id = auth.uid() -- See own activities
    );

-- Functions and Triggers for auto-generation

-- Trigger for Workout Completion
create or replace function public.handle_new_workout()
returns trigger as $$
begin
    insert into public.activities (user_id, type, data)
    values (
        new.user_id,
        'workout_completed',
        jsonb_build_object(
            'workout_id', new.id,
            'workout_name', new.name,
            'duration', new.duration,
            'calories', new.calories_burned
        )
    );
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_workout_created on public.workouts;
create trigger on_workout_created
    after insert on public.workouts
    for each row execute procedure public.handle_new_workout();

-- Trigger for Follows
create or replace function public.handle_new_follow()
returns trigger as $$
begin
    insert into public.activities (user_id, type, data)
    values (
        new.follower_id,
        'started_following',
        jsonb_build_object(
            'following_id', new.following_id
        )
    );
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_follow_created on public.follows;
create trigger on_follow_created
    after insert on public.follows
    for each row execute procedure public.handle_new_follow();

-- Trigger for Achievements (assuming user_achievements table)
create or replace function public.handle_new_achievement()
returns trigger as $$
begin
    insert into public.activities (user_id, type, data)
    values (
        new.user_id,
        'achievement_unlocked',
        jsonb_build_object(
            'achievement_code', new.achievement_code,
            'unlocked_at', new.unlocked_at
        )
    );
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_achievement_unlocked on public.user_achievements;
create trigger on_achievement_unlocked
    after insert on public.user_achievements
    for each row execute procedure public.handle_new_achievement();
