-- Update profiles table with new fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invite_code CHAR(8);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_number BIGINT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription VARCHAR(4) DEFAULT 'FREE' CHECK (subscription IN ('FREE', 'PLUS', 'PRO'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio VARCHAR(112);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_workouts_completed INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_calories_burned INTEGER DEFAULT 0;

-- Create social_links table
CREATE TABLE IF NOT EXISTS social_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create function to check social links limit
CREATE OR REPLACE FUNCTION check_social_links_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (
        SELECT COUNT(*)
        FROM social_links
        WHERE profile_id = NEW.profile_id
    ) >= 5 THEN
        RAISE EXCEPTION 'Maximum of 5 social links allowed per profile';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce social links limit
CREATE TRIGGER enforce_social_links_limit
    BEFORE INSERT ON social_links
    FOR EACH ROW
    EXECUTE FUNCTION check_social_links_limit();

-- Create exercises table
CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    gif_url TEXT,
    exercise_type VARCHAR(10) CHECK (exercise_type IN ('reps', 'duration')),
    avg_time_per_rep INTEGER, -- in seconds
    instructions TEXT,
    place VARCHAR(4) CHECK (place IN ('home', 'gym')),
    equipments TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create focus_areas table for exercises
CREATE TABLE IF NOT EXISTS exercise_focus_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    area VARCHAR(50) NOT NULL,
    weightage INTEGER CHECK (weightage BETWEEN 0 AND 100),
    UNIQUE(exercise_id, area)
);

-- Create common_mistakes table for exercises
CREATE TABLE IF NOT EXISTS exercise_mistakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    subtitle TEXT
);

-- Create tips table for exercises
CREATE TABLE IF NOT EXISTS exercise_tips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    tip TEXT NOT NULL
);

-- Create workout_routines table
CREATE TABLE IF NOT EXISTS workout_routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create routine_exercises table (junction table between routines and exercises)
CREATE TABLE IF NOT EXISTS routine_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_id UUID REFERENCES workout_routines(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    sets INTEGER NOT NULL,
    reps INTEGER, -- NULL if duration-based
    duration INTEGER, -- in seconds, NULL if reps-based
    order_position INTEGER NOT NULL,
    UNIQUE(routine_id, order_position)
);

-- Create functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_exercises_updated_at
    BEFORE UPDATE ON exercises
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_routines_updated_at
    BEFORE UPDATE ON workout_routines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_focus_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_mistakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_exercises ENABLE ROW LEVEL SECURITY;

-- Social links policies
CREATE POLICY "Users can view their own social links"
    ON social_links FOR SELECT
    USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own social links"
    ON social_links FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own social links"
    ON social_links FOR UPDATE
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own social links"
    ON social_links FOR DELETE
    USING (auth.uid() = profile_id);

-- Exercise policies (public read, admin write)
CREATE POLICY "Exercises are viewable by all users"
    ON exercises FOR SELECT
    USING (true);

CREATE POLICY "Only admins can insert exercises"
    ON exercises FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update exercises"
    ON exercises FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Similar policies for exercise_focus_areas, exercise_mistakes, and exercise_tips
CREATE POLICY "Focus areas are viewable by all users"
    ON exercise_focus_areas FOR SELECT
    USING (true);

CREATE POLICY "Mistakes are viewable by all users"
    ON exercise_mistakes FOR SELECT
    USING (true);

CREATE POLICY "Tips are viewable by all users"
    ON exercise_tips FOR SELECT
    USING (true);

-- Workout routines policies
CREATE POLICY "Users can view all public workout routines"
    ON workout_routines FOR SELECT
    USING (true);

CREATE POLICY "Users can create their own workout routines"
    ON workout_routines FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own workout routines"
    ON workout_routines FOR UPDATE
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own workout routines"
    ON workout_routines FOR DELETE
    USING (auth.uid() = created_by);

-- Routine exercises policies
CREATE POLICY "Users can view all routine exercises"
    ON routine_exercises FOR SELECT
    USING (true);

CREATE POLICY "Users can manage exercises in their routines"
    ON routine_exercises FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM workout_routines
            WHERE id = routine_exercises.routine_id
            AND created_by = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_invite_code ON profiles(invite_code);
CREATE INDEX IF NOT EXISTS idx_profiles_user_number ON profiles(user_number);
CREATE INDEX IF NOT EXISTS idx_social_links_profile_id ON social_links(profile_id);
CREATE INDEX IF NOT EXISTS idx_exercise_focus_areas_exercise_id ON exercise_focus_areas(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_mistakes_exercise_id ON exercise_mistakes(exercise_id);
CREATE INDEX IF NOT EXISTS idx_exercise_tips_exercise_id ON exercise_tips(exercise_id);
CREATE INDEX IF NOT EXISTS idx_routine_exercises_routine_id ON routine_exercises(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_exercises_exercise_id ON routine_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_workout_routines_created_by ON workout_routines(created_by);

-- Create function to generate unique invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS CHAR(8) AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    code CHAR(8);
    exists_already BOOLEAN;
BEGIN
    LOOP
        code := '';
        FOR i IN 1..8 LOOP
            code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
        END LOOP;
        
        SELECT EXISTS (
            SELECT 1 FROM profiles WHERE invite_code = code
        ) INTO exists_already;
        
        IF NOT exists_already THEN
            RETURN code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Create trigger to automatically generate invite code and user number
CREATE OR REPLACE FUNCTION before_insert_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate invite code if not provided
    IF NEW.invite_code IS NULL THEN
        NEW.invite_code := generate_invite_code();
    END IF;
    
    -- Set user number if not provided
    IF NEW.user_number IS NULL THEN
        SELECT COALESCE(MAX(user_number), 0) + 1
        INTO NEW.user_number
        FROM profiles;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_profile_trigger
    BEFORE INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION before_insert_profile();

-- Create exercise_completions table
CREATE TABLE IF NOT EXISTS exercise_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
    sets_completed INTEGER,
    reps_completed INTEGER,
    duration_completed INTEGER,
    is_per_side BOOLEAN DEFAULT FALSE,
    weight_used DECIMAL(5,2),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'completed', -- Add status column with default 'completed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
); 