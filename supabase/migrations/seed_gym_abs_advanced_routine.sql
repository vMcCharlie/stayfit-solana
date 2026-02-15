DO $$
DECLARE
    v_routine_id UUID;
    v_exercise_id UUID;
    v_order_pos INTEGER;
BEGIN
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
    v_order_pos := 1;
    
        -- Find Hanging Leg Raises
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Hanging Leg Raises' OR name ILIKE '%Hanging Leg Raises%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..5 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, 15, NULL, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Hanging Leg Raises';
        END IF;
        
        -- Find Decline Weighted Crunch
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Decline Weighted Crunch' OR name ILIKE '%Decline Weighted Crunch%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..4 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, 12, NULL, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Decline Weighted Crunch';
        END IF;
        
        -- Find Ab Rollouts
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Ab Rollouts' OR name ILIKE '%Ab Rollouts%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..4 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, 10, NULL, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Ab Rollouts';
        END IF;
        
        -- Find Plank
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Plank' OR name ILIKE '%Plank%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..4 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, NULL, 60, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Plank';
        END IF;
        
        -- Find Bicycle Crunch
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Bicycle Crunch' OR name ILIKE '%Bicycle Crunch%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..3 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, 30, NULL, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Bicycle Crunch';
        END IF;
        
        -- Find Cobra Stretch
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Cobra Stretch' OR name ILIKE '%Cobra Stretch%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..2 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, NULL, 30, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Cobra Stretch';
        END IF;
        
        -- Find Child's Pose
        v_exercise_id := NULL;
        SELECT id INTO v_exercise_id FROM exercises WHERE name = 'Child''s Pose' OR name ILIKE '%Child''s Pose%' ORDER BY length(name) ASC LIMIT 1;
        
        IF v_exercise_id IS NOT NULL THEN
            FOR i IN 1..1 LOOP
                INSERT INTO routine_exercises (routine_id, exercise_id, sets, reps, duration, order_position)
                VALUES (v_routine_id, v_exercise_id, 1, NULL, 60, v_order_pos);
                v_order_pos := v_order_pos + 1;
            END LOOP;
        ELSE
            RAISE NOTICE 'Exercise not found: Child''s Pose';
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
