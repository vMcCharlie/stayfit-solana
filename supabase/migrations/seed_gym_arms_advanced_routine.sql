DO $$
DECLARE
    v_routine_id UUID;
    v_exercise_id UUID;
    v_order_pos INTEGER;
BEGIN
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
    v_order_pos := 1;
    
        -- Find Barbell Bicep Curl
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Barbell Bicep Curl' OR name ILIKE '%Barbell Bicep Curl%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..5 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, 8, NULL, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Barbell Bicep Curl';
        END IF;
        
        -- Find Concentration Curl
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Concentration Curl' OR name ILIKE '%Concentration Curl%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..4 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, 10, NULL, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Concentration Curl';
        END IF;
        
        -- Find Close-Grip Bench Press
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Close-Grip Bench Press' OR name ILIKE '%Close-Grip Bench Press%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..5 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, 6, NULL, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Close-Grip Bench Press';
        END IF;
        
        -- Find Cable Tricep Extension
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Cable Tricep Extension' OR name ILIKE '%Cable Tricep Extension%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..4 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, 12, NULL, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Cable Tricep Extension';
        END IF;
        
        -- Find Hammer Curl
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Hammer Curl' OR name ILIKE '%Hammer Curl%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..3 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, 12, NULL, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Hammer Curl';
        END IF;
        
        -- Find Cable Tricep Extension
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Cable Tricep Extension' OR name ILIKE '%Cable Tricep Extension%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..3 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, 12, NULL, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Cable Tricep Extension';
        END IF;
        
        -- Find Bicep Stretch
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Bicep Stretch' OR name ILIKE '%Bicep Stretch%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..2 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, NULL, 30, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Bicep Stretch';
        END IF;
        
        -- Find Tricep Stretch
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Tricep Stretch' OR name ILIKE '%Tricep Stretch%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..2 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, NULL, 30, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Tricep Stretch';
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
