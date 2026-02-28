-- Migration to add more gym exercises

DO $$
DECLARE
    v_exercise_id UUID;
BEGIN

    -- Box Jump
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Box Jump', 'Gym', 'plyometric', ARRAY['Box'], FALSE, 'Stand in front of box. Jump onto it, landing softly.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Quads', 90);
        INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Cardio', 50);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Land with knees bent.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_mistakes (exercise_id, title, subtitle) VALUES (v_exercise_id, 'Landing stiff-legged.', '');
    END IF;

    -- Skull Crushers
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Skull Crushers', 'Gym', 'strength', ARRAY['Barbell' or 'Ez-Bar'], FALSE, 'Lie on bench. Lower bar to forehead bending only at elbows.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Triceps', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Keep elbows tucked.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_mistakes (exercise_id, title, subtitle) VALUES (v_exercise_id, 'Flaring elbows.', '');
    END IF;

    -- Incline Push-ups
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Incline Push-ups', 'Any', 'strength', ARRAY['Bench' or 'Box'], FALSE, 'Hands on elevated surface. Perform push-up.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Chest', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Keep body simplified.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_mistakes (exercise_id, title, subtitle) VALUES (v_exercise_id, 'Sagging hips.', '');
    END IF;

    -- Alternating Dumbbell Curl
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Alternating Dumbbell Curl', 'Gym', 'strength', ARRAY['Dumbbell'], TRUE, 'Curl one dumbbell at a time.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Biceps', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Control the weight.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_mistakes (exercise_id, title, subtitle) VALUES (v_exercise_id, 'Swinging body.', '');
    END IF;

    -- Walking Lunges
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Walking Lunges', 'Any', 'strength', ARRAY['Bodyweight' or 'Dumbbell'], TRUE, 'Step forward into lunge, then bring back foot forward to next step.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Quads', 50);
        INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Glutes', 50);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Keep torso upright.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_mistakes (exercise_id, title, subtitle) VALUES (v_exercise_id, 'Knee hitting floor hard.', '');
    END IF;

    -- Assisted Pull-ups
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Assisted Pull-ups', 'Gym', 'strength', ARRAY['Machine' or 'Band'], FALSE, 'Use assisted machine or band. Pull chin over bar.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Back', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Full range of motion.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_mistakes (exercise_id, title, subtitle) VALUES (v_exercise_id, 'Using momentum.', '');
    END IF;

    -- Overhead Dumbbell Tricep Extension
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Overhead Dumbbell Tricep Extension', 'Gym', 'strength', ARRAY['Dumbbell'], FALSE, 'Sit or stand. Lower dumbbell behind head.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Triceps', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Keep elbows pointing up.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_mistakes (exercise_id, title, subtitle) VALUES (v_exercise_id, 'Arching back.', '');
    END IF;
END $$;
