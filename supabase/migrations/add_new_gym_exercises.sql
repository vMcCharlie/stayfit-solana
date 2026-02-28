-- Migration to add new gym exercises

DO $$
DECLARE
    v_exercise_id UUID;
BEGIN

    -- Arm Circles
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Arm Circles', 'Any', 'warmup', ARRAY['None'], FALSE, 'Stand tall and make large circles with your arms, first forward then backward.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Shoulders', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Start small and gradually increase the size of the circles.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_mistakes (exercise_id, title, subtitle) VALUES (v_exercise_id, 'Swinging too fast.', '');
    END IF;

    -- Shoulder Rolls
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Shoulder Rolls', 'Any', 'warmup', ARRAY['None'], FALSE, ' shrug shoulders up to ears, then roll them back and down.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Shoulders', 90);
        INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Traps', 50);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Focus on releasing tension.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
    END IF;

    -- March in Place
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('March in Place', 'Any', 'warmup', ARRAY['None'], FALSE, 'March in place, lifting knees high and swinging arms.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Cardio', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Keep a steady rhythm.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
    END IF;

    -- Torso Twists
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Torso Twists', 'Any', 'warmup', ARRAY['None'], FALSE, 'Stand with feet hip-width. Twist torso gently side to side.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Core', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Don''t force the twist.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
    END IF;

    -- Standing Toe Touches
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Standing Toe Touches', 'Any', 'warmup', ARRAY['None'], FALSE, 'Stand tall, bend at hips to touch toes, then return to standing.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Hamstrings', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Keep knees slightly bent.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_mistakes (exercise_id, title, subtitle) VALUES (v_exercise_id, 'Rounding back too much.', '');
    END IF;

    -- Arm Swings
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Arm Swings', 'Any', 'warmup', ARRAY['None'], FALSE, 'Swing arms horizontally across chest and back out.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Chest', 90);
        INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Shoulders', 50);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Dynamic movement to open chest.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
    END IF;

    -- Crunches
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Crunches', 'Any', 'core', ARRAY['None'], FALSE, 'Lie on back, knees bent. Curl upper back off floor.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Abs', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Don''t pull on neck.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_mistakes (exercise_id, title, subtitle) VALUES (v_exercise_id, 'Pulling neck.', '');
    END IF;

    -- Heel Taps
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Heel Taps', 'Any', 'core', ARRAY['None'], FALSE, 'Lie on back, knees bent. Reach hand to touch same-side heel, alternating.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Abs', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Keep shoulders off ground.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
    END IF;

    -- Hanging Knee Raises
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Hanging Knee Raises', 'Gym', 'core', ARRAY['Pull-up Bar'], FALSE, 'Hang from bar. Lift knees to chest.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Abs', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Avoid swinging.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_mistakes (exercise_id, title, subtitle) VALUES (v_exercise_id, 'Swinging.', '');
    END IF;

    -- Weighted Crunch
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Weighted Crunch', 'Any', 'core', ARRAY['Dumbbell'], FALSE, 'Perform crunch holding a weight at chest.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Abs', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Control the weight.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
    END IF;

    -- Hanging Leg Raises
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Hanging Leg Raises', 'Gym', 'core', ARRAY['Pull-up Bar'], FALSE, 'Hang from bar. Lift straight legs to hip height.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Abs', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Avoid swinging.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_mistakes (exercise_id, title, subtitle) VALUES (v_exercise_id, 'Swinging.', '');
    END IF;

    -- Decline Weighted Crunch
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Decline Weighted Crunch', 'Gym', 'core', ARRAY['Decline Bench', 'Plate'], FALSE, 'Perform crunch on decline bench with weight.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Abs', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Control the descent.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
    END IF;

    -- Ab Rollouts
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Ab Rollouts', 'Any', 'core', ARRAY['Ab Wheel'], FALSE, 'Kneel and roll wheel forward until body is extended, then roll back.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Abs', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Keep core tight, don''t sag hips.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_mistakes (exercise_id, title, subtitle) VALUES (v_exercise_id, 'Sagging hips.', '');
    END IF;

    -- Bench Dips
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Bench Dips', 'Any', 'strength', ARRAY['Bench'], FALSE, 'Hands on bench behind you. Lower hips preventing elbows flaring.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Triceps', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Keep back close to bench.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_mistakes (exercise_id, title, subtitle) VALUES (v_exercise_id, 'Shoulders rolling forward.', '');
    END IF;

    -- Hamstring Curl
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Hamstring Curl', 'Gym', 'strength', ARRAY['Machine'], FALSE, 'Use leg curl machine. Curl weight towards glutes.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Hamstrings', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Control the return.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_mistakes (exercise_id, title, subtitle) VALUES (v_exercise_id, 'Lifting hips.', '');
    END IF;

    -- Standing Calf Raises
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Standing Calf Raises', 'Any', 'strength', ARRAY['Bodyweight', 'Machine'], FALSE, 'Stand on edge of step. Lower heels then raise high.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Calves', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Full range of motion.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_mistakes (exercise_id, title, subtitle) VALUES (v_exercise_id, 'Bouncing.', '');
    END IF;

    -- Seated Calf Raises
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Seated Calf Raises', 'Gym', 'strength', ARRAY['Machine'], FALSE, 'Sit at calf machine. Raise heels against potential.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Calves', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Full stretch at bottom.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
    END IF;

    -- Dips
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Dips', 'Gym', 'strength', ARRAY['Dip Station'], FALSE, 'Support body on parallel bars. Lower until shoulders below elbows.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Triceps', 50);
        INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Chest', 50);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Lean forward for chest.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_mistakes (exercise_id, title, subtitle) VALUES (v_exercise_id, 'Shoulders shrugging.', '');
    END IF;

    -- Leg Extension
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Leg Extension', 'Gym', 'strength', ARRAY['Machine'], FALSE, 'Use leg extension machine. Extend legs until straight.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Quads', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Don''t lock out explosively.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_mistakes (exercise_id, title, subtitle) VALUES (v_exercise_id, 'Using momentum.', '');
    END IF;

    -- Close-Grip Bench Press
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Close-Grip Bench Press', 'Gym', 'strength', ARRAY['Barbell', 'Bench'], FALSE, 'Bench press with hands shoulder-width or closer.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Triceps', 90);
        INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Chest', 40);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Tuck elbows.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_mistakes (exercise_id, title, subtitle) VALUES (v_exercise_id, 'Flaring elbows.', '');
    END IF;

    -- Weighted Dips
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Weighted Dips', 'Gym', 'strength', ARRAY['Dip Station', 'Belt'], FALSE, 'Dips with added weight.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Triceps', 50);
        INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Chest', 50);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Maintain form with weight.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
    END IF;

    -- Upright Rows
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Upright Rows', 'Gym', 'strength', ARRAY['Barbell'], FALSE, 'Pull barbell vertically to chin height.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Shoulders', 90);
        INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Traps', 50);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Lead with elbows.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_mistakes (exercise_id, title, subtitle) VALUES (v_exercise_id, 'Wrists bending.', '');
    END IF;

    -- Bicep Stretch
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Bicep Stretch', 'Any', 'stretch', ARRAY['None'], FALSE, 'Extend arm forward, palm up. Pull fingers back.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Biceps', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Gentle pull.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
    END IF;

    -- Tricep Stretch
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Tricep Stretch', 'Any', 'stretch', ARRAY['None'], FALSE, 'Reach arm overhead, bend elbow. Gently push elbow down.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Triceps', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Keep head upright.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
    END IF;

    -- Cobra Stretch
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Cobra Stretch', 'Any', 'stretch', ARRAY['None'], FALSE, 'Lie prone. Push chest up with hands.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Abs', 90);
        INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Back', 50);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Relax shoulders.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
    END IF;

    -- Standing Side Stretch
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Standing Side Stretch', 'Any', 'stretch', ARRAY['None'], FALSE, 'Stand tall. Reach one arm overhead and lean to opposite side.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Obliques', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Keep chest open.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
    END IF;

    -- Chest Opener Stretch
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Chest Opener Stretch', 'Any', 'stretch', ARRAY['None'], FALSE, 'Clasp hands behind back and open chest.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Chest', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Lift hands slightly.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
    END IF;

    -- Shoulder Stretch
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Shoulder Stretch', 'Any', 'stretch', ARRAY['None'], FALSE, 'Pull arm across chest.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Shoulders', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Keep shoulder down.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
    END IF;

    -- Upper Back Stretch
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Upper Back Stretch', 'Any', 'stretch', ARRAY['None'], FALSE, 'Interlace fingers in front, push palms away and round back.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Back', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Feel space between shoulder blades.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
    END IF;

    -- Quad Stretch
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Quad Stretch', 'Any', 'stretch', ARRAY['None'], FALSE, 'Stand on one leg. Pull other foot to glute.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Quads', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Keep knees together.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
    END IF;

    -- Hamstring Stretch
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Hamstring Stretch', 'Any', 'stretch', ARRAY['None'], FALSE, 'Sit or stand. Reach for toes.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Hamstrings', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Keep back straight if possible.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
    END IF;

    -- Calf Stretch
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Calf Stretch', 'Any', 'stretch', ARRAY['None'], FALSE, 'Press heel into ground with leg straight behind you.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Calves', 90);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Hold steady.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
    END IF;

    -- Deep Breathing
    INSERT INTO exercises (name, place, exercise_type, equipments, is_per_side, instructions, created_at, updated_at)
    VALUES ('Deep Breathing', 'Any', 'stretch', ARRAY['None'], FALSE, 'Sit or lie down. Breathe deeply.', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
    RETURNING id INTO v_exercise_id;
    
    IF v_exercise_id IS NOT NULL THEN
        -- 2. Insert Focus Areas
        DELETE FROM exercise_focus_areas WHERE exercise_id = v_exercise_id;
            INSERT INTO exercise_focus_areas (exercise_id, area, weightage) VALUES (v_exercise_id, 'Recovery', 100);
        DELETE FROM exercise_tips WHERE exercise_id = v_exercise_id;
        INSERT INTO exercise_tips (exercise_id, tip) VALUES (v_exercise_id, 'Focus on breath.');
        DELETE FROM exercise_mistakes WHERE exercise_id = v_exercise_id;
    END IF;
END $$;
