DO $$
DECLARE
    v_routine_id UUID;
    v_exercise_id UUID;
    v_order_pos INTEGER;
BEGIN
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
    v_order_pos := 1;
    
        -- Find Barbell Deadlift
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Barbell Deadlift' OR name ILIKE '%Barbell Deadlift%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..5 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, 5, NULL, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Barbell Deadlift';
        END IF;
        
        -- Find Chin Up
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Chin Up' OR name ILIKE '%Chin Up%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..4 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, 10, NULL, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Chin Up';
        END IF;
        
        -- Find Barbell Overhead Press
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Barbell Overhead Press' OR name ILIKE '%Barbell Overhead Press%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..4 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, 8, NULL, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Barbell Overhead Press';
        END IF;
        
        -- Find Upright Rows
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Upright Rows' OR name ILIKE '%Upright Rows%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..3 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, 10, NULL, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Upright Rows';
        END IF;
        
        -- Find Face Pull
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Face Pull' OR name ILIKE '%Face Pull%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..3 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, 15, NULL, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Face Pull';
        END IF;
        
        -- Find Upper Back Stretch
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Upper Back Stretch' OR name ILIKE '%Upper Back Stretch%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..2 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, NULL, 30, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Upper Back Stretch';
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
