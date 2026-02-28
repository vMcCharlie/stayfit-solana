-- Add theme-related columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'light',
ADD COLUMN IF NOT EXISTS theme_color text DEFAULT '#4CAF50';

-- Add onboarding-related columns if they don't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS onboarding_step text DEFAULT 'gender-selection',
ADD COLUMN IF NOT EXISTS weight_unit text DEFAULT 'kg',
ADD COLUMN IF NOT EXISTS height_unit text DEFAULT 'cm';

-- Create enum types for various fields
DO $$ BEGIN
    CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
    CREATE TYPE fitness_goal_type AS ENUM ('build_muscle', 'lose_weight', 'improve_endurance', 'stay_active');
    CREATE TYPE fitness_level_type AS ENUM ('beginner', 'intermediate', 'advanced');
    CREATE TYPE equipment_access_type AS ENUM ('home_bodyweight', 'home_equipment', 'full_gym');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update columns to use enum types and set default values
ALTER TABLE profiles
ALTER COLUMN gender TYPE gender_type USING gender::gender_type,
ALTER COLUMN fitness_goal TYPE fitness_goal_type USING fitness_goal::fitness_goal_type,
ALTER COLUMN fitness_level TYPE fitness_level_type USING fitness_level::fitness_level_type,
ALTER COLUMN equipment_access TYPE equipment_access_type USING equipment_access::equipment_access_type,
ALTER COLUMN height SET DEFAULT 170,
ALTER COLUMN weight SET DEFAULT 70,
ALTER COLUMN workout_frequency SET DEFAULT 3; 