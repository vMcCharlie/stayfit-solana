create table if not exists public.user_streak_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  activity_date date not null,
  streak_type text not null check (streak_type in ('fire', 'ice', 'frozen')),
  created_at timestamp with time zone default timezone('utc', now()),
  unique(user_id, activity_date)
);

-- RLS Policies
alter table public.user_streak_history enable row level security;

create policy "Users can view their own streak history"
  on public.user_streak_history for select
  using (auth.uid() = user_id);

create policy "Users can manage their own streak history"
  on public.user_streak_history for all
  using (auth.uid() = user_id);
