DO $$
DECLARE
    v_routine_id UUID;
    v_exercise_id UUID;
    v_order_pos INTEGER;
BEGIN
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
    v_order_pos := 1;
    
        -- Find Barbell Squat
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Barbell Squat' OR name ILIKE '%Barbell Squat%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..4 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, 8, NULL, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Barbell Squat';
        END IF;
        
        -- Find Romanian Deadlift
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Romanian Deadlift' OR name ILIKE '%Romanian Deadlift%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..4 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, 8, NULL, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Romanian Deadlift';
        END IF;
        
        -- Find Walking Lunges
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Walking Lunges' OR name ILIKE '%Walking Lunges%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..3 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, 24, NULL, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Walking Lunges';
        END IF;
        
        -- Find Leg Extension
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Leg Extension' OR name ILIKE '%Leg Extension%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..3 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, 12, NULL, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Leg Extension';
        END IF;
        
        -- Find Standing Calf Raises
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Standing Calf Raises' OR name ILIKE '%Standing Calf Raises%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..4 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, 20, NULL, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Standing Calf Raises';
        END IF;
        
        -- Find Quad Stretch
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Quad Stretch' OR name ILIKE '%Quad Stretch%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..2 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, NULL, 30, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Quad Stretch';
        END IF;
        
        -- Find Hamstring Stretch
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Hamstring Stretch' OR name ILIKE '%Hamstring Stretch%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..2 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, NULL, 30, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Hamstring Stretch';
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
