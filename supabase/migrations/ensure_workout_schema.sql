-- Ensure tables exist with proper structure
-- 1. Workout Sessions
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  routine_id UUID REFERENCES workout_routines(id),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  total_duration INTEGER DEFAULT 0,
  total_calories_burned NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'workout_sessions' AND column_name = 'focus_areas_summary') THEN
        ALTER TABLE workout_sessions ADD COLUMN focus_areas_summary JSONB DEFAULT '{}';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_routine_id ON workout_sessions(routine_id);

-- 2. Exercise Completions
CREATE TABLE IF NOT EXISTS exercise_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  reps_completed INTEGER,
  duration_completed INTEGER,
  weight_used NUMERIC,
  is_per_side BOOLEAN DEFAULT false,
  notes TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exercise_completions_session_id ON exercise_completions(session_id);

-- 3. Daily Workout Summary
CREATE TABLE IF NOT EXISTS daily_workout_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  date DATE NOT NULL,
  total_workouts INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0,
  total_calories_burned NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Ensure focus_areas_summary column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'daily_workout_summary' AND column_name = 'focus_areas_summary') THEN
        ALTER TABLE daily_workout_summary ADD COLUMN focus_areas_summary JSONB DEFAULT '{}';
    END IF;
END $$;

-- 4. Workout Streaks
CREATE TABLE IF NOT EXISTS workout_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_workout_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Focus Area Tracking
CREATE TABLE IF NOT EXISTS focus_area_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    exercise_completion_id UUID REFERENCES exercise_completions(id) ON DELETE CASCADE,
    focus_area_id UUID REFERENCES exercise_focus_areas(id),
    intensity_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_workout_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_area_tracking ENABLE ROW LEVEL SECURITY;

-- Idempotent Policy Creation
DO $$
BEGIN
    -- Workout Sessions
    DROP POLICY IF EXISTS "Users can view their own sessions" ON workout_sessions;
    CREATE POLICY "Users can view their own sessions" ON workout_sessions FOR SELECT USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users can insert their own sessions" ON workout_sessions;
    CREATE POLICY "Users can insert their own sessions" ON workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users can update their own sessions" ON workout_sessions;
    CREATE POLICY "Users can update their own sessions" ON workout_sessions FOR UPDATE USING (auth.uid() = user_id);

    -- Exercise Completions
    DROP POLICY IF EXISTS "Users can view their own completions" ON exercise_completions;
    CREATE POLICY "Users can view their own completions" ON exercise_completions FOR SELECT USING (exists (select 1 from workout_sessions where id = exercise_completions.session_id and user_id = auth.uid()));
    
    DROP POLICY IF EXISTS "Users can insert their own completions" ON exercise_completions;
    CREATE POLICY "Users can insert their own completions" ON exercise_completions FOR INSERT WITH CHECK (exists (select 1 from workout_sessions where id = session_id and user_id = auth.uid()));

    DROP POLICY IF EXISTS "Users can update their own completions" ON exercise_completions;
    CREATE POLICY "Users can update their own completions" ON exercise_completions FOR UPDATE USING (exists (select 1 from workout_sessions where id = session_id and user_id = auth.uid()));

    -- Daily Summary
    DROP POLICY IF EXISTS "Users can view their own daily summary" ON daily_workout_summary;
    CREATE POLICY "Users can view their own daily summary" ON daily_workout_summary FOR SELECT USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users can insert their own daily summary" ON daily_workout_summary;
    CREATE POLICY "Users can insert their own daily summary" ON daily_workout_summary FOR INSERT WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can update their own daily summary" ON daily_workout_summary;
    CREATE POLICY "Users can update their own daily summary" ON daily_workout_summary FOR UPDATE USING (auth.uid() = user_id);

    -- Workout Streaks
    DROP POLICY IF EXISTS "Users can view their own streaks" ON workout_streaks;
    CREATE POLICY "Users can view their own streaks" ON workout_streaks FOR SELECT USING (auth.uid() = user_id);
    
    DROP POLICY IF EXISTS "Users can insert their own streaks" ON workout_streaks;
    CREATE POLICY "Users can insert their own streaks" ON workout_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can update their own streaks" ON workout_streaks;
    CREATE POLICY "Users can update their own streaks" ON workout_streaks FOR UPDATE USING (auth.uid() = user_id);

    -- Focus Area Tracking
     DROP POLICY IF EXISTS "Users can view their own focus tracking" ON focus_area_tracking;
    CREATE POLICY "Users can view their own focus tracking" ON focus_area_tracking FOR SELECT USING (exists (select 1 from exercise_completions ec join workout_sessions ws on ec.session_id = ws.id where ec.id = exercise_completion_id and ws.user_id = auth.uid()));
    
    DROP POLICY IF EXISTS "Users can insert their own focus tracking" ON focus_area_tracking;
    CREATE POLICY "Users can insert their own focus tracking" ON focus_area_tracking FOR INSERT WITH CHECK (exists (select 1 from exercise_completions ec join workout_sessions ws on ec.session_id = ws.id where ec.id = exercise_completion_id and ws.user_id = auth.uid()));

END $$;

-- RPC Function for Profile Stats
CREATE OR REPLACE FUNCTION update_profile_totals(p_user_id UUID, p_calories_burned NUMERIC, p_time_taken INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET 
    calories_burned = COALESCE(calories_burned, 0) + p_calories_burned,
    total_time_taken = COALESCE(total_time_taken, 0) + p_time_taken,
    workouts_completed = COALESCE(workouts_completed, 0) + 1
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
