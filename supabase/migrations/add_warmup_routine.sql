-- Migration to add Warm Up routine and exercises

DO $$
DECLARE
    v_routine_id uuid;
    -- Exercise IDs
    v_ex_high_kicks uuid;
    v_ex_toe_touches uuid;
    v_ex_knee_tucks uuid;
    v_ex_hip_turn_outs uuid;
    v_ex_lunge_twist uuid;
    v_ex_torso_twist uuid;
    v_ex_back_slaps uuid;
    v_ex_fwd_arm_circles uuid;
    v_ex_bwd_arm_circles uuid;
    v_ex_butt_kicks uuid;
    v_ex_high_knees uuid;
    v_ex_jumping_jacks uuid;
    v_ex_burpees uuid;
BEGIN
    -- 1. Insert newly required exercises if they don't exist
    
    -- Helper to insert and return ID
    INSERT INTO exercises (name, exercise_type, instructions) 
    VALUES ('Alternating High Kicks', 'warmup', 'Dynamic warm-up exercise.')
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name 
    RETURNING id INTO v_ex_high_kicks;
    
    IF v_ex_high_kicks IS NULL THEN SELECT id INTO v_ex_high_kicks FROM exercises WHERE name = 'Alternating High Kicks'; END IF;

    INSERT INTO exercises (name, exercise_type, instructions) 
    VALUES ('Alternating Toe Touches', 'warmup', 'Dynamic warm-up exercise.')
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_ex_toe_touches;
    IF v_ex_toe_touches IS NULL THEN SELECT id INTO v_ex_toe_touches FROM exercises WHERE name = 'Alternating Toe Touches'; END IF;

    INSERT INTO exercises (name, exercise_type, instructions) 
    VALUES ('Alternating Knee Tucks', 'warmup', 'Dynamic warm-up exercise.')
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_ex_knee_tucks;
    IF v_ex_knee_tucks IS NULL THEN SELECT id INTO v_ex_knee_tucks FROM exercises WHERE name = 'Alternating Knee Tucks'; END IF;

    INSERT INTO exercises (name, exercise_type, instructions) 
    VALUES ('Alternating Hip Turn Outs', 'warmup', 'Dynamic warm-up exercise.')
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_ex_hip_turn_outs;
    IF v_ex_hip_turn_outs IS NULL THEN SELECT id INTO v_ex_hip_turn_outs FROM exercises WHERE name = 'Alternating Hip Turn Outs'; END IF;

    INSERT INTO exercises (name, exercise_type, instructions) 
    VALUES ('Alternating Lunge with Twist', 'warmup', 'Dynamic warm-up exercise.')
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_ex_lunge_twist;
    IF v_ex_lunge_twist IS NULL THEN SELECT id INTO v_ex_lunge_twist FROM exercises WHERE name = 'Alternating Lunge with Twist'; END IF;

    INSERT INTO exercises (name, exercise_type, instructions) 
    VALUES ('Rising Torso Twist', 'warmup', 'Dynamic warm-up exercise.')
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_ex_torso_twist;
    IF v_ex_torso_twist IS NULL THEN SELECT id INTO v_ex_torso_twist FROM exercises WHERE name = 'Rising Torso Twist'; END IF;

    INSERT INTO exercises (name, exercise_type, instructions) 
    VALUES ('Back Slaps', 'warmup', 'Dynamic warm-up exercise.')
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_ex_back_slaps;
    IF v_ex_back_slaps IS NULL THEN SELECT id INTO v_ex_back_slaps FROM exercises WHERE name = 'Back Slaps'; END IF;

    INSERT INTO exercises (name, exercise_type, instructions) 
    VALUES ('Forward Arm Circles', 'warmup', 'Dynamic warm-up exercise.')
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_ex_fwd_arm_circles;
    IF v_ex_fwd_arm_circles IS NULL THEN SELECT id INTO v_ex_fwd_arm_circles FROM exercises WHERE name = 'Forward Arm Circles'; END IF;

    INSERT INTO exercises (name, exercise_type, instructions) 
    VALUES ('Backward Arm Circles', 'warmup', 'Dynamic warm-up exercise.')
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_ex_bwd_arm_circles;
    IF v_ex_bwd_arm_circles IS NULL THEN SELECT id INTO v_ex_bwd_arm_circles FROM exercises WHERE name = 'Backward Arm Circles'; END IF;

    INSERT INTO exercises (name, exercise_type, instructions) 
    VALUES ('Butt Kicks', 'warmup', 'Dynamic warm-up exercise.')
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO v_ex_butt_kicks;
    IF v_ex_butt_kicks IS NULL THEN SELECT id INTO v_ex_butt_kicks FROM exercises WHERE name = 'Butt Kicks'; END IF;

    -- Existing exercises (fetch ID, ensuring they exist)
    SELECT id INTO v_ex_high_knees FROM exercises WHERE name = 'High Knees' LIMIT 1;
    IF v_ex_high_knees IS NULL THEN 
        INSERT INTO exercises (name, exercise_type, instructions) VALUES ('High Knees', 'warmup', 'Dynamic warm-up.') RETURNING id INTO v_ex_high_knees; 
    END IF;

    SELECT id INTO v_ex_jumping_jacks FROM exercises WHERE name = 'Jumping Jacks' LIMIT 1;
    IF v_ex_jumping_jacks IS NULL THEN 
        INSERT INTO exercises (name, exercise_type, instructions) VALUES ('Jumping Jacks', 'warmup', 'Jumping jacks.') RETURNING id INTO v_ex_jumping_jacks; 
    END IF;

    SELECT id INTO v_ex_burpees FROM exercises WHERE name = 'Burpees' LIMIT 1;
    IF v_ex_burpees IS NULL THEN 
        INSERT INTO exercises (name, exercise_type, instructions) VALUES ('Burpees', 'warmup', 'Burpees.') RETURNING id INTO v_ex_burpees; 
    END IF;


    -- 2. Insert Routine
    -- Check if it already exists to avoid duplicates if run multiple times
    SELECT id INTO v_routine_id FROM workout_routines WHERE name = '5-Minute Dynamic Warm-Up';
    
    IF v_routine_id IS NULL THEN
        INSERT INTO workout_routines (name, category, place, level, image_url)
        VALUES ('5-Minute Dynamic Warm-Up', 'Warm Up', 'Anywhere', 'Beginner', 'https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=2670&auto=format&fit=crop')
        RETURNING id INTO v_routine_id;
    END IF;

    -- 3. Link Exercises (Clear existing links for this routine first to assume idempotent)
    DELETE FROM routine_exercises WHERE routine_id = v_routine_id;
    
    -- Alternating High Kicks — 0:30
    INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (v_routine_id, v_ex_high_kicks, 30, 1);
    
    -- Alternating Toe Touches — 0:30
    INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (v_routine_id, v_ex_toe_touches, 30, 2);
    
    -- Alternating Knee Tucks — 0:30
    INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (v_routine_id, v_ex_knee_tucks, 30, 3);
    
    -- Alternating Hip Turn Outs — 0:30
    INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (v_routine_id, v_ex_hip_turn_outs, 30, 4);
    
    -- Alternating Lunge with Twist — 0:30
    INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (v_routine_id, v_ex_lunge_twist, 30, 5);
    
    -- Rising Torso Twist — 0:30
    INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (v_routine_id, v_ex_torso_twist, 30, 6);
    
    -- Back Slaps — 0:30
    INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (v_routine_id, v_ex_back_slaps, 30, 7);
    
    -- Forward Arm Circles — 0:20
    INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (v_routine_id, v_ex_fwd_arm_circles, 20, 8);
    
    -- Backward Arm Circles — 0:20
    INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (v_routine_id, v_ex_bwd_arm_circles, 20, 9);
    
    -- Butt Kicks — 0:20
    INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (v_routine_id, v_ex_butt_kicks, 20, 10);
    
    -- High Knees — 0:20
    INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (v_routine_id, v_ex_high_knees, 20, 11);
    
    -- Jumping Jacks — 0:20
    INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (v_routine_id, v_ex_jumping_jacks, 20, 12);
    
    -- Burpees — 0:20
    INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (v_routine_id, v_ex_burpees, 20, 13);
    
END $$;
