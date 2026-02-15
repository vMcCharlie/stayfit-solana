DO $$
DECLARE
    v_routine_id UUID;
    v_exercise_id UUID;
    v_order_pos INTEGER;
BEGIN
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
    v_order_pos := 1;
    
        -- Find Bench Press
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Bench Press' OR name ILIKE '%Bench Press%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..5 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, 5, NULL, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Bench Press';
        END IF;
        
        -- Find Incline Bench Press
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Incline Bench Press' OR name ILIKE '%Incline Bench Press%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..4 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, 8, NULL, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Incline Bench Press';
        END IF;
        
        -- Find Dumbbell Fly
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Dumbbell Fly' OR name ILIKE '%Dumbbell Fly%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..4 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, 12, NULL, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Dumbbell Fly';
        END IF;
        
        -- Find Weighted Dips
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Weighted Dips' OR name ILIKE '%Weighted Dips%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..3 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, 15, NULL, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Weighted Dips';
        END IF;
        
        -- Find Chest Opener Stretch
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Chest Opener Stretch' OR name ILIKE '%Chest Opener Stretch%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..2 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, NULL, 30, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Chest Opener Stretch';
        END IF;
        
        -- Find Deep Breathing
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Deep Breathing' OR name ILIKE '%Deep Breathing%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..1 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, NULL, 60, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Deep Breathing';
        END IF;
END $$;
