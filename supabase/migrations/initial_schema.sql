-- Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  username text unique,
  full_name text,
  avatar_url text,
  gender text,
  height numeric,
  weight numeric,
  date_of_birth date,
  fitness_goal text,
  workout_frequency integer,
  workout_style text[],
  fitness_level text,
  equipment_access text,
  theme_preference jsonb
);

-- Create workouts table
create table workouts (
  id uuid default uuid_generate_v4() primary key not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  type text not null,
  duration integer not null,
  calories_burned integer,
  notes text
);

-- Create nutrition_logs table
create table nutrition_logs (
  id uuid default uuid_generate_v4() primary key not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references profiles(id) on delete cascade not null,
  meal_type text not null,
  food_name text not null,
  calories integer not null,
  protein numeric not null,
  carbs numeric not null,
  fats numeric not null,
  notes text
);

-- Create progress_photos table
create table progress_photos (
  id uuid default uuid_generate_v4() primary key not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references profiles(id) on delete cascade not null,
  photo_url text not null,
  category text not null,
  notes text
);

-- Enable Row Level Security (RLS)
alter table profiles enable row level security;
alter table workouts enable row level security;
alter table nutrition_logs enable row level security;
alter table progress_photos enable row level security;

-- Create policies
create policy "Users can view own profile"
  on profiles for select
  using ( auth.uid() = id );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

create policy "Users can view own workouts"
  on workouts for select
  using ( auth.uid() = user_id );

create policy "Users can insert own workouts"
  on workouts for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own workouts"
  on workouts for update
  using ( auth.uid() = user_id );

create policy "Users can delete own workouts"
  on workouts for delete
  using ( auth.uid() = user_id );

create policy "Users can view own nutrition logs"
  on nutrition_logs for select
  using ( auth.uid() = user_id );

create policy "Users can insert own nutrition logs"
  on nutrition_logs for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own nutrition logs"
  on nutrition_logs for update
  using ( auth.uid() = user_id );

create policy "Users can delete own nutrition logs"
  on nutrition_logs for delete
  using ( auth.uid() = user_id );

create policy "Users can view own progress photos"
  on progress_photos for select
  using ( auth.uid() = user_id );

create policy "Users can insert own progress photos"
  on progress_photos for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own progress photos"
  on progress_photos for update
  using ( auth.uid() = user_id );

create policy "Users can delete own progress photos"
  on progress_photos for delete
  using ( auth.uid() = user_id );

-- Create function to handle user creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$;

-- Create trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user(); 