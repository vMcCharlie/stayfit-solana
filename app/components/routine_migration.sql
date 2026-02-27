-- Workout Routine Migration SQL for Supabase
-- This script will populate the workout_routines and routine_exercises tables

-- Function to safely handle parsing and inserting workout routine data
CREATE OR REPLACE FUNCTION import_routine_data() RETURNS void AS $$
DECLARE
    routine_row RECORD;
    exercise_row RECORD;
    routine_id UUID;
    admin_user_id UUID;
BEGIN
    -- Get admin user ID (using the first user in the database)
    SELECT id INTO admin_user_id FROM auth.users LIMIT 1;
    
    -- Clean up existing data (optional - remove in production if you want to keep existing data)
    DELETE FROM routine_exercises;
    DELETE FROM workout_routines;

    -- First routine: Full Body Beginner
    INSERT INTO workout_routines (id, name, created_by, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Full Body Beginner',
        admin_user_id,
        NOW(),
        NOW()
    )
    RETURNING id INTO routine_id;
    
    -- Add exercises to Full Body Beginner
    INSERT INTO routine_exercises (id, routine_id, exercise_id, sets, reps, duration, order_position)
    VALUES 
        (gen_random_uuid(), routine_id, '4aac8b8a-b9bd-4dad-a50b-67c258dbce57', 3, 12, NULL, 1),  -- Push-Up
        (gen_random_uuid(), routine_id, 'b3b5fbb8-dca8-4ec8-bd14-0eea88b27d96', 3, 15, NULL, 2),  -- Squat
        (gen_random_uuid(), routine_id, '9cd93164-0b58-4471-bcbf-76d909f57277', 3, 10, NULL, 3),  -- Lunges
        (gen_random_uuid(), routine_id, '26410d09-fb0e-4c56-be71-ac440f442835', 3, NULL, 30, 4),  -- Plank
        (gen_random_uuid(), routine_id, '763ce1b6-0d21-4f30-a417-eb17ed4fae80', 3, 12, NULL, 5),  -- Tricep Dip
        (gen_random_uuid(), routine_id, '8e449bfb-4a89-4253-88e6-3b4852269efa', 2, 30, NULL, 6);  -- Jumping Jacks

    -- Second routine: Abs Intermediate
    INSERT INTO workout_routines (id, name, created_by, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Abs Intermediate',
        admin_user_id,
        NOW(),
        NOW()
    )
    RETURNING id INTO routine_id;
    
    -- Add exercises to Abs Intermediate
    INSERT INTO routine_exercises (id, routine_id, exercise_id, sets, reps, duration, order_position)
    VALUES 
        (gen_random_uuid(), routine_id, '29c67d98-826b-4473-b231-2798e72f5ac0', 4, 20, NULL, 1),  -- Abdominal Crunches
        (gen_random_uuid(), routine_id, '26410d09-fb0e-4c56-be71-ac440f442835', 3, NULL, 45, 2),  -- Plank
        (gen_random_uuid(), routine_id, '5cb47942-0d41-4899-866d-5291239c0fe0', 3, 15, NULL, 3),  -- Russian Twist
        (gen_random_uuid(), routine_id, 'ee33915c-1b37-461b-9e1a-f67111e104be', 3, 30, NULL, 4),  -- Mountain Climbers
        (gen_random_uuid(), routine_id, '020a188b-3f1d-4f6f-a56f-bd1ded834b5b', 3, 15, NULL, 5);  -- Glute Bridge

    -- Third routine: Upper Body Advanced
    INSERT INTO workout_routines (id, name, created_by, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Upper Body Advanced',
        admin_user_id,
        NOW(),
        NOW()
    )
    RETURNING id INTO routine_id;
    
    -- Add exercises to Upper Body Advanced
    INSERT INTO routine_exercises (id, routine_id, exercise_id, sets, reps, duration, order_position)
    VALUES 
        (gen_random_uuid(), routine_id, '18f31ca2-bf54-443c-8bb6-d50243ac330d', 4, 12, NULL, 1),  -- Pull-Up
        (gen_random_uuid(), routine_id, '495f5e57-24d9-4710-9561-0b79aabc2e02', 4, 10, NULL, 2),  -- Bench Press
        (gen_random_uuid(), routine_id, '214aa68e-092b-4ee2-a856-56008e2d1267', 4, 12, NULL, 3),  -- Shoulder Press
        (gen_random_uuid(), routine_id, '23e62964-0355-446f-aad3-6ece3fdfd80b', 3, 15, NULL, 4),  -- Bicep Curl
        (gen_random_uuid(), routine_id, '763ce1b6-0d21-4f30-a417-eb17ed4fae80', 3, 15, NULL, 5),  -- Tricep Dip
        (gen_random_uuid(), routine_id, '34a0da12-394d-4997-9200-25a142231523', 3, 12, NULL, 6),  -- Chest Fly
        (gen_random_uuid(), routine_id, '5e444b81-4c93-48e5-bfef-7f51b2502db9', 3, 12, NULL, 7);  -- Seated Row

    -- Fourth routine: Lower Body Beginner
    INSERT INTO workout_routines (id, name, created_by, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Lower Body Beginner',
        admin_user_id,
        NOW(),
        NOW()
    )
    RETURNING id INTO routine_id;
    
    -- Add exercises to Lower Body Beginner
    INSERT INTO routine_exercises (id, routine_id, exercise_id, sets, reps, duration, order_position)
    VALUES 
        (gen_random_uuid(), routine_id, 'b3b5fbb8-dca8-4ec8-bd14-0eea88b27d96', 3, 15, NULL, 1),  -- Squat
        (gen_random_uuid(), routine_id, '9cd93164-0b58-4471-bcbf-76d909f57277', 3, 10, NULL, 2),  -- Lunges
        (gen_random_uuid(), routine_id, '020a188b-3f1d-4f6f-a56f-bd1ded834b5b', 3, 15, NULL, 3),  -- Glute Bridge
        (gen_random_uuid(), routine_id, '4ee881b4-3957-4c07-a6e6-3cfd46b58e56', 3, 20, NULL, 4),  -- Calf Raise
        (gen_random_uuid(), routine_id, '10e2cfe0-6eaf-49e4-bab8-bd5c9011db3e', 3, 12, NULL, 5);  -- Step-Up

    -- Fifth routine: Cardio Blast
    INSERT INTO workout_routines (id, name, created_by, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        'Cardio Blast',
        admin_user_id,
        NOW(),
        NOW()
    )
    RETURNING id INTO routine_id;
    
    -- Add exercises to Cardio Blast
    INSERT INTO routine_exercises (id, routine_id, exercise_id, sets, reps, duration, order_position)
    VALUES 
        (gen_random_uuid(), routine_id, '8e449bfb-4a89-4253-88e6-3b4852269efa', 3, 30, NULL, 1),  -- Jumping Jacks
        (gen_random_uuid(), routine_id, 'b546aefa-0e10-4169-898d-53c7d6e297ec', 3, 15, NULL, 2),  -- Burpee
        (gen_random_uuid(), routine_id, 'ee33915c-1b37-461b-9e1a-f67111e104be', 3, 30, NULL, 3),  -- Mountain Climbers
        (gen_random_uuid(), routine_id, '9cd93164-0b58-4471-bcbf-76d909f57277', 3, 20, NULL, 4),  -- Lunges
        (gen_random_uuid(), routine_id, 'b3b5fbb8-dca8-4ec8-bd14-0eea88b27d96', 3, 25, NULL, 5);  -- Squat

END;
$$ LANGUAGE plpgsql;

-- Execute the import function
SELECT import_routine_data();

-- Clean up (drop the function after import)
DROP FUNCTION IF EXISTS import_routine_data();

-- Verify results (optional, you can comment these out for production)
SELECT COUNT(*) AS total_routines FROM workout_routines;
SELECT COUNT(*) AS total_routine_exercises FROM routine_exercises;

-- Sample join query to check data integrity
SELECT 
    wr.name AS routine_name,
    e.name AS exercise_name,
    re.sets,
    re.reps,
    re.duration,
    re.order_position
FROM 
    workout_routines wr
JOIN 
    routine_exercises re ON wr.id = re.routine_id
JOIN 
    exercises e ON re.exercise_id = e.id
ORDER BY 
    wr.name, re.order_position
LIMIT 10; 