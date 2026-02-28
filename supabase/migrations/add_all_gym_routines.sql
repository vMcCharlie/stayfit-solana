-- Migration to add 15 Gym Routines with Stretching

DO $$
DECLARE
    v_routine_id UUID;
    v_exercise_id UUID;
BEGIN

    -- Routine: Abs Beginner
    INSERT INTO workout_routines (name, level, place, category, created_at, updated_at)
    VALUES ('Abs Beginner', 'Beginner', 'Gym', 'Abs', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET
        level = EXCLUDED.level,
        place = EXCLUDED.place,
        category = EXCLUDED.category,
        updated_at = NOW()
    RETURNING id INTO v_routine_id;
    
    -- Cleanup exercises
    DELETE FROM routine_exercises WHERE routine_id = v_routine_id;
    
    -- Insert Exercises
    
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Bodyweight Russian Twist' OR name LIKE '%Bodyweight Russian Twist%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 15, NULL, 1);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Bodyweight Leg Raise' OR name LIKE '%Bodyweight Leg Raise%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 12, NULL, 2);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Plank' OR name LIKE '%Plank%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, NULL, 45, 3);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Bodyweight Side Plank' OR name LIKE '%Bodyweight Side Plank%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 2, NULL, 30, 4);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Cat Cow Pose' OR name LIKE '%Cat Cow Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 45, 5);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Child''s Pose' OR name LIKE '%Child''s Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 60, 6);
        END IF;
        
    -- Routine: Abs Intermediate
    INSERT INTO workout_routines (name, level, place, category, created_at, updated_at)
    VALUES ('Abs Intermediate', 'Intermediate', 'Gym', 'Abs', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET
        level = EXCLUDED.level,
        place = EXCLUDED.place,
        category = EXCLUDED.category,
        updated_at = NOW()
    RETURNING id INTO v_routine_id;
    
    -- Cleanup exercises
    DELETE FROM routine_exercises WHERE routine_id = v_routine_id;
    
    -- Insert Exercises
    
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Bicycle Crunch' OR name LIKE '%Bicycle Crunch%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 20, NULL, 1);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Bodyweight Flutter Kicks' OR name LIKE '%Bodyweight Flutter Kicks%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 30, NULL, 2);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Bodyweight Reverse Crunch' OR name LIKE '%Bodyweight Reverse Crunch%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 15, NULL, 3);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Mountain Climber' OR name LIKE '%Mountain Climber%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 40, NULL, 4);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Plank' OR name LIKE '%Plank%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, NULL, 60, 5);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Cat Cow Pose' OR name LIKE '%Cat Cow Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 45, 6);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Child''s Pose' OR name LIKE '%Child''s Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 60, 7);
        END IF;
        
    -- Routine: Abs Advanced
    INSERT INTO workout_routines (name, level, place, category, created_at, updated_at)
    VALUES ('Abs Advanced', 'Advanced', 'Gym', 'Abs', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET
        level = EXCLUDED.level,
        place = EXCLUDED.place,
        category = EXCLUDED.category,
        updated_at = NOW()
    RETURNING id INTO v_routine_id;
    
    -- Cleanup exercises
    DELETE FROM routine_exercises WHERE routine_id = v_routine_id;
    
    -- Insert Exercises
    
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Bodyweight Hollow Body Hold' OR name LIKE '%Bodyweight Hollow Body Hold%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, NULL, 45, 1);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Bodyweight Leg Raise' OR name LIKE '%Bodyweight Leg Raise%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 20, NULL, 2);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Bodyweight Russian Twist' OR name LIKE '%Bodyweight Russian Twist%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 25, NULL, 3);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Bicycle Crunch' OR name LIKE '%Bicycle Crunch%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 30, NULL, 4);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Mountain Climber' OR name LIKE '%Mountain Climber%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 60, NULL, 5);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Cat Cow Pose' OR name LIKE '%Cat Cow Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 45, 6);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Child''s Pose' OR name LIKE '%Child''s Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 60, 7);
        END IF;
        
    -- Routine: Arms Beginner
    INSERT INTO workout_routines (name, level, place, category, created_at, updated_at)
    VALUES ('Arms Beginner', 'Beginner', 'Gym', 'Arms', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET
        level = EXCLUDED.level,
        place = EXCLUDED.place,
        category = EXCLUDED.category,
        updated_at = NOW()
    RETURNING id INTO v_routine_id;
    
    -- Cleanup exercises
    DELETE FROM routine_exercises WHERE routine_id = v_routine_id;
    
    -- Insert Exercises
    
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Dumbbell Bicep Curl' OR name LIKE '%Dumbbell Bicep Curl%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 12, NULL, 1);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Dumbbell Tricep Extension' OR name LIKE '%Dumbbell Tricep Extension%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 12, NULL, 2);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Cable Bicep Curl' OR name LIKE '%Cable Bicep Curl%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 12, NULL, 3);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Cable Tricep Extension' OR name LIKE '%Cable Tricep Extension%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 12, NULL, 4);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Cat Cow Pose' OR name LIKE '%Cat Cow Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 45, 5);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Child''s Pose' OR name LIKE '%Child''s Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 60, 6);
        END IF;
        
    -- Routine: Arms Intermediate
    INSERT INTO workout_routines (name, level, place, category, created_at, updated_at)
    VALUES ('Arms Intermediate', 'Intermediate', 'Gym', 'Arms', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET
        level = EXCLUDED.level,
        place = EXCLUDED.place,
        category = EXCLUDED.category,
        updated_at = NOW()
    RETURNING id INTO v_routine_id;
    
    -- Cleanup exercises
    DELETE FROM routine_exercises WHERE routine_id = v_routine_id;
    
    -- Insert Exercises
    
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Barbell Bicep Curl' OR name LIKE '%Barbell Bicep Curl%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 10, NULL, 1);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Barbell Tricep Extension' OR name LIKE '%Barbell Tricep Extension%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 12, NULL, 2);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Hammer Curl' OR name LIKE '%Hammer Curl%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 12, NULL, 3);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Tricep Kickback' OR name LIKE '%Tricep Kickback%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 15, NULL, 4);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Concentration Curl' OR name LIKE '%Concentration Curl%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 12, NULL, 5);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Cat Cow Pose' OR name LIKE '%Cat Cow Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 45, 6);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Child''s Pose' OR name LIKE '%Child''s Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 60, 7);
        END IF;
        
    -- Routine: Arms Advanced
    INSERT INTO workout_routines (name, level, place, category, created_at, updated_at)
    VALUES ('Arms Advanced', 'Advanced', 'Gym', 'Arms', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET
        level = EXCLUDED.level,
        place = EXCLUDED.place,
        category = EXCLUDED.category,
        updated_at = NOW()
    RETURNING id INTO v_routine_id;
    
    -- Cleanup exercises
    DELETE FROM routine_exercises WHERE routine_id = v_routine_id;
    
    -- Insert Exercises
    
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Barbell Bicep Curl' OR name LIKE '%Barbell Bicep Curl%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 5, 8, NULL, 1);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Skullcrusher' OR name LIKE '%Skullcrusher%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 5, 10, NULL, 2);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Preacher Curl' OR name LIKE '%Preacher Curl%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 12, NULL, 3);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Cable Tricep Extension' OR name LIKE '%Cable Tricep Extension%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 15, NULL, 4);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Dumbbell Bicep Curl' OR name LIKE '%Dumbbell Bicep Curl%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 10, NULL, 5);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Dumbbell Tricep Extension' OR name LIKE '%Dumbbell Tricep Extension%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 12, NULL, 6);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Cat Cow Pose' OR name LIKE '%Cat Cow Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 45, 7);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Child''s Pose' OR name LIKE '%Child''s Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 60, 8);
        END IF;
        
    -- Routine: Chest Beginner
    INSERT INTO workout_routines (name, level, place, category, created_at, updated_at)
    VALUES ('Chest Beginner', 'Beginner', 'Gym', 'Chest', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET
        level = EXCLUDED.level,
        place = EXCLUDED.place,
        category = EXCLUDED.category,
        updated_at = NOW()
    RETURNING id INTO v_routine_id;
    
    -- Cleanup exercises
    DELETE FROM routine_exercises WHERE routine_id = v_routine_id;
    
    -- Insert Exercises
    
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Bench Press' OR name LIKE '%Bench Press%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 10, NULL, 1);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Incline Dumbbell Press' OR name LIKE '%Incline Dumbbell Press%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 10, NULL, 2);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Chest Fly' OR name LIKE '%Chest Fly%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 12, NULL, 3);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Barbell Wide Push Up' OR name LIKE '%Barbell Wide Push Up%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 2, 10, NULL, 4);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Cat Cow Pose' OR name LIKE '%Cat Cow Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 45, 5);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Child''s Pose' OR name LIKE '%Child''s Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 60, 6);
        END IF;
        
    -- Routine: Chest Intermediate
    INSERT INTO workout_routines (name, level, place, category, created_at, updated_at)
    VALUES ('Chest Intermediate', 'Intermediate', 'Gym', 'Chest', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET
        level = EXCLUDED.level,
        place = EXCLUDED.place,
        category = EXCLUDED.category,
        updated_at = NOW()
    RETURNING id INTO v_routine_id;
    
    -- Cleanup exercises
    DELETE FROM routine_exercises WHERE routine_id = v_routine_id;
    
    -- Insert Exercises
    
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Bench Press' OR name LIKE '%Bench Press%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 8, NULL, 1);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Incline Bench Press' OR name LIKE '%Incline Bench Press%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 10, NULL, 2);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Decline Bench Press' OR name LIKE '%Decline Bench Press%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 12, NULL, 3);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Chest Fly' OR name LIKE '%Chest Fly%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 12, NULL, 4);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Barbell Push Up' OR name LIKE '%Barbell Push Up%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 15, NULL, 5);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Cat Cow Pose' OR name LIKE '%Cat Cow Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 45, 6);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Child''s Pose' OR name LIKE '%Child''s Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 60, 7);
        END IF;
        
    -- Routine: Chest Advanced
    INSERT INTO workout_routines (name, level, place, category, created_at, updated_at)
    VALUES ('Chest Advanced', 'Advanced', 'Gym', 'Chest', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET
        level = EXCLUDED.level,
        place = EXCLUDED.place,
        category = EXCLUDED.category,
        updated_at = NOW()
    RETURNING id INTO v_routine_id;
    
    -- Cleanup exercises
    DELETE FROM routine_exercises WHERE routine_id = v_routine_id;
    
    -- Insert Exercises
    
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Bench Press' OR name LIKE '%Bench Press%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 5, 5, NULL, 1);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Incline Bench Press' OR name LIKE '%Incline Bench Press%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 8, NULL, 2);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Decline Bench Press' OR name LIKE '%Decline Bench Press%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 10, NULL, 3);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Chest Fly' OR name LIKE '%Chest Fly%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 15, NULL, 4);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Barbell Diamond Push Up' OR name LIKE '%Barbell Diamond Push Up%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 15, NULL, 5);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Cat Cow Pose' OR name LIKE '%Cat Cow Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 45, 6);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Child''s Pose' OR name LIKE '%Child''s Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 60, 7);
        END IF;
        
    -- Routine: Legs Beginner
    INSERT INTO workout_routines (name, level, place, category, created_at, updated_at)
    VALUES ('Legs Beginner', 'Beginner', 'Gym', 'Legs', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET
        level = EXCLUDED.level,
        place = EXCLUDED.place,
        category = EXCLUDED.category,
        updated_at = NOW()
    RETURNING id INTO v_routine_id;
    
    -- Cleanup exercises
    DELETE FROM routine_exercises WHERE routine_id = v_routine_id;
    
    -- Insert Exercises
    
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Barbell Squat' OR name LIKE '%Barbell Squat%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 10, NULL, 1);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Leg Press' OR name LIKE '%Leg Press%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 12, NULL, 2);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Dumbbell Lunge' OR name LIKE '%Dumbbell Lunge%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 12, NULL, 3);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Barbell Glute Bridge' OR name LIKE '%Barbell Glute Bridge%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 12, NULL, 4);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Cat Cow Pose' OR name LIKE '%Cat Cow Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 45, 5);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Child''s Pose' OR name LIKE '%Child''s Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 60, 6);
        END IF;
        
    -- Routine: Legs Intermediate
    INSERT INTO workout_routines (name, level, place, category, created_at, updated_at)
    VALUES ('Legs Intermediate', 'Intermediate', 'Gym', 'Legs', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET
        level = EXCLUDED.level,
        place = EXCLUDED.place,
        category = EXCLUDED.category,
        updated_at = NOW()
    RETURNING id INTO v_routine_id;
    
    -- Cleanup exercises
    DELETE FROM routine_exercises WHERE routine_id = v_routine_id;
    
    -- Insert Exercises
    
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Barbell Squat' OR name LIKE '%Barbell Squat%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 8, NULL, 1);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Romanian Deadlift' OR name LIKE '%Romanian Deadlift%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 10, NULL, 2);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Bulgarian Split Squat' OR name LIKE '%Bulgarian Split Squat%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 10, NULL, 3);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Leg Press' OR name LIKE '%Leg Press%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 15, NULL, 4);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Barbell Glute Kickback' OR name LIKE '%Barbell Glute Kickback%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 15, NULL, 5);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Cat Cow Pose' OR name LIKE '%Cat Cow Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 45, 6);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Child''s Pose' OR name LIKE '%Child''s Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 60, 7);
        END IF;
        
    -- Routine: Legs Advanced
    INSERT INTO workout_routines (name, level, place, category, created_at, updated_at)
    VALUES ('Legs Advanced', 'Advanced', 'Gym', 'Legs', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET
        level = EXCLUDED.level,
        place = EXCLUDED.place,
        category = EXCLUDED.category,
        updated_at = NOW()
    RETURNING id INTO v_routine_id;
    
    -- Cleanup exercises
    DELETE FROM routine_exercises WHERE routine_id = v_routine_id;
    
    -- Insert Exercises
    
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Barbell Squat' OR name LIKE '%Barbell Squat%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 5, 5, NULL, 1);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Sumo Deadlift' OR name LIKE '%Sumo Deadlift%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 6, NULL, 2);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Barbell Lunge' OR name LIKE '%Barbell Lunge%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 10, NULL, 3);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Hip Thrust' OR name LIKE '%Hip Thrust%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 12, NULL, 4);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Sumo Squat' OR name LIKE '%Sumo Squat%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 15, NULL, 5);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Box Jump' OR name LIKE '%Box Jump%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 12, NULL, 6);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Cat Cow Pose' OR name LIKE '%Cat Cow Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 45, 7);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Child''s Pose' OR name LIKE '%Child''s Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 60, 8);
        END IF;
        
    -- Routine: Shoulder & Back Beginner
    INSERT INTO workout_routines (name, level, place, category, created_at, updated_at)
    VALUES ('Shoulder & Back Beginner', 'Beginner', 'Gym', 'Shoulder & Back', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET
        level = EXCLUDED.level,
        place = EXCLUDED.place,
        category = EXCLUDED.category,
        updated_at = NOW()
    RETURNING id INTO v_routine_id;
    
    -- Cleanup exercises
    DELETE FROM routine_exercises WHERE routine_id = v_routine_id;
    
    -- Insert Exercises
    
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Lat Pulldown' OR name LIKE '%Lat Pulldown%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 12, NULL, 1);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Dumbbell Overhead Press' OR name LIKE '%Dumbbell Overhead Press%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 10, NULL, 2);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Seated Row' OR name LIKE '%Seated Row%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 12, NULL, 3);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Dumbbell Lateral Raise' OR name LIKE '%Dumbbell Lateral Raise%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 12, NULL, 4);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Dumbbell Bird Dog' OR name LIKE '%Dumbbell Bird Dog%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 2, 10, NULL, 5);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Cat Cow Pose' OR name LIKE '%Cat Cow Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 45, 6);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Child''s Pose' OR name LIKE '%Child''s Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 60, 7);
        END IF;
        
    -- Routine: Shoulder & Back Intermediate
    INSERT INTO workout_routines (name, level, place, category, created_at, updated_at)
    VALUES ('Shoulder & Back Intermediate', 'Intermediate', 'Gym', 'Shoulder & Back', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET
        level = EXCLUDED.level,
        place = EXCLUDED.place,
        category = EXCLUDED.category,
        updated_at = NOW()
    RETURNING id INTO v_routine_id;
    
    -- Cleanup exercises
    DELETE FROM routine_exercises WHERE routine_id = v_routine_id;
    
    -- Insert Exercises
    
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Barbell Deadlift' OR name LIKE '%Barbell Deadlift%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 8, NULL, 1);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Barbell Overhead Press' OR name LIKE '%Barbell Overhead Press%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 8, NULL, 2);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Barbell Bent Over Row' OR name LIKE '%Barbell Bent Over Row%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 10, NULL, 3);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Face Pull' OR name LIKE '%Face Pull%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 15, NULL, 4);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Front Raise' OR name LIKE '%Front Raise%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 12, NULL, 5);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Chin Up' OR name LIKE '%Chin Up%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, 8, NULL, 6);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Cat Cow Pose' OR name LIKE '%Cat Cow Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 45, 7);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Child''s Pose' OR name LIKE '%Child''s Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 60, 8);
        END IF;
        
    -- Routine: Shoulder & Back Advanced
    INSERT INTO workout_routines (name, level, place, category, created_at, updated_at)
    VALUES ('Shoulder & Back Advanced', 'Advanced', 'Gym', 'Shoulder & Back', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET
        level = EXCLUDED.level,
        place = EXCLUDED.place,
        category = EXCLUDED.category,
        updated_at = NOW()
    RETURNING id INTO v_routine_id;
    
    -- Cleanup exercises
    DELETE FROM routine_exercises WHERE routine_id = v_routine_id;
    
    -- Insert Exercises
    
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Barbell Deadlift' OR name LIKE '%Barbell Deadlift%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 5, 5, NULL, 1);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Barbell Overhead Press' OR name LIKE '%Barbell Overhead Press%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 5, 5, NULL, 2);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Lat Pulldown' OR name LIKE '%Lat Pulldown%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 10, NULL, 3);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Arnold Press' OR name LIKE '%Arnold Press%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 10, NULL, 4);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Shrug' OR name LIKE '%Shrug%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 15, NULL, 5);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Reverse Fly' OR name LIKE '%Reverse Fly%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 4, 15, NULL, 6);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Farmers Walk' OR name LIKE '%Farmers Walk%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 3, NULL, 45, 7);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Cat Cow Pose' OR name LIKE '%Cat Cow Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 45, 8);
        END IF;
        
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Child''s Pose' OR name LIKE '%Child''s Pose%' LIMIT 1;
        IF v_exercise_id IS NOT NULL THEN
            INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
            VALUES (v_routine_id, v_exercise_id, 1, NULL, 60, 9);
        END IF;
        END $$;
