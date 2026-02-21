create table if not exists weight_history (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    weight numeric not null,
    recorded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table weight_history enable row level security;

create policy "Users can view their own weight history"
    on weight_history for select
    using (auth.uid() = user_id);

create policy "Users can insert their own weight history"
    on weight_history for insert
    with check (auth.uid() = user_id);
