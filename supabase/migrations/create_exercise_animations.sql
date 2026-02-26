create table if not exists public.exercise_animations (
    id uuid not null default gen_random_uuid(),
    exercise_id uuid not null references public.exercises(id) on delete cascade,
    gender text not null check (gender in ('male', 'female')),
    frame_urls text[] not null default '{}',
    frame_count integer not null default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (id),
    unique (exercise_id, gender)
);

alter table public.exercise_animations enable row level security;

create policy "Enable read access for all users"
    on public.exercise_animations for select
    using (true);

create policy "Enable insert for service role only"
    on public.exercise_animations for insert
    with check (auth.role() = 'service_role');

create policy "Enable update for service role only"
    on public.exercise_animations for update
    using (auth.role() = 'service_role');

create policy "Enable delete for service role only"
    on public.exercise_animations for delete
    using (auth.role() = 'service_role');
