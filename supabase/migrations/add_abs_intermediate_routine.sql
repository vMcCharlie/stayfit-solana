-- Migration to add "Abs Intermediate" routine extracted from image
-- Exercises include: Jumping Jacks, Heel Touch, Crossover Crunch, Mountain Climber, Side Bridges, Butt Bridge, Bicycle Crunches, V-Up, Plank, Leg Raises, Push-Up & Rotation, Side Plank, Cobra Stretch, Spine Twist
-- Includes 21 steps.

DO $$ 
DECLARE
  -- Exercise IDs
  e_jumping_jacks UUID;
  e_heel_touch UUID;
  e_crossover_crunch UUID;
  e_mountain_climber UUID;
  e_side_bridges_left UUID;
  e_side_bridges_right UUID;
  e_butt_bridge UUID;
  e_bicycle_crunches UUID;
  e_v_up UUID;
  e_crunches UUID;
  e_plank UUID;
  e_leg_raises UUID;
  e_push_up_rotation UUID;
  e_side_plank_right UUID;
  e_side_plank_left UUID;
  e_cobra UUID;
  e_spine_left UUID;
  e_spine_right UUID;
  
  r_id UUID;
BEGIN
  -- 1. Ensure Exercises Exist and Get IDs
  
  -- Jumping Jacks
  SELECT id INTO e_jumping_jacks FROM exercises WHERE name = 'Jumping Jacks' LIMIT 1;
  IF e_jumping_jacks IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Jumping Jacks', 'Cardio') RETURNING id INTO e_jumping_jacks;
  END IF;

  -- Heel Touch
  SELECT id INTO e_heel_touch FROM exercises WHERE name = 'Heel Touch' LIMIT 1;
  IF e_heel_touch IS NULL THEN
      INSERT INTO exercises (name, exercise_type) VALUES ('Heel Touch', 'Strength') RETURNING id INTO e_heel_touch;
  END IF;

  -- Crossover Crunch
  SELECT id INTO e_crossover_crunch FROM exercises WHERE name = 'Crossover Crunch' LIMIT 1;
  IF e_crossover_crunch IS NULL THEN
      INSERT INTO exercises (name, exercise_type) VALUES ('Crossover Crunch', 'Strength') RETURNING id INTO e_crossover_crunch;
  END IF;

  -- Mountain Climber
  SELECT id INTO e_mountain_climber FROM exercises WHERE name = 'Mountain Climber' LIMIT 1;
  IF e_mountain_climber IS NULL THEN
      INSERT INTO exercises (name, exercise_type) VALUES ('Mountain Climber', 'Strength') RETURNING id INTO e_mountain_climber;
  END IF;

  -- Side Bridges Left
  SELECT id INTO e_side_bridges_left FROM exercises WHERE name = 'Side Bridges Left' LIMIT 1;
  IF e_side_bridges_left IS NULL THEN
      INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Side Bridges Left', 'Strength', true) RETURNING id INTO e_side_bridges_left;
  END IF;

  -- Side Bridges Right
  SELECT id INTO e_side_bridges_right FROM exercises WHERE name = 'Side Bridges Right' LIMIT 1;
  IF e_side_bridges_right IS NULL THEN
      INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Side Bridges Right', 'Strength', true) RETURNING id INTO e_side_bridges_right;
  END IF;

  -- Butt Bridge
  SELECT id INTO e_butt_bridge FROM exercises WHERE name = 'Butt Bridge' LIMIT 1;
  IF e_butt_bridge IS NULL THEN
      INSERT INTO exercises (name, exercise_type) VALUES ('Butt Bridge', 'Strength') RETURNING id INTO e_butt_bridge;
  END IF;

  -- Bicycle Crunches
  SELECT id INTO e_bicycle_crunches FROM exercises WHERE name = 'Bicycle Crunches' LIMIT 1;
  IF e_bicycle_crunches IS NULL THEN
      INSERT INTO exercises (name, exercise_type) VALUES ('Bicycle Crunches', 'Strength') RETURNING id INTO e_bicycle_crunches;
  END IF;

  -- V-Up
  SELECT id INTO e_v_up FROM exercises WHERE name = 'V-Up' LIMIT 1;
  IF e_v_up IS NULL THEN
      INSERT INTO exercises (name, exercise_type) VALUES ('V-Up', 'Strength') RETURNING id INTO e_v_up;
  END IF;

  -- Abdominal Crunches
  SELECT id INTO e_crunches FROM exercises WHERE name = 'Abdominal Crunches' LIMIT 1;
  IF e_crunches IS NULL THEN
      INSERT INTO exercises (name, exercise_type) VALUES ('Abdominal Crunches', 'Strength') RETURNING id INTO e_crunches;
  END IF;

  -- Plank
  SELECT id INTO e_plank FROM exercises WHERE name = 'Plank' LIMIT 1;
  IF e_plank IS NULL THEN
      INSERT INTO exercises (name, exercise_type) VALUES ('Plank', 'Strength') RETURNING id INTO e_plank;
  END IF;

  -- Leg Raises
  SELECT id INTO e_leg_raises FROM exercises WHERE name = 'Leg Raises' LIMIT 1;
  IF e_leg_raises IS NULL THEN
      INSERT INTO exercises (name, exercise_type) VALUES ('Leg Raises', 'Strength') RETURNING id INTO e_leg_raises;
  END IF;

  -- Push-Up & Rotation
  SELECT id INTO e_push_up_rotation FROM exercises WHERE name = 'Push-Up & Rotation' LIMIT 1;
  IF e_push_up_rotation IS NULL THEN
      INSERT INTO exercises (name, exercise_type) VALUES ('Push-Up & Rotation', 'Strength') RETURNING id INTO e_push_up_rotation;
  END IF;

  -- Side Plank Right
  SELECT id INTO e_side_plank_right FROM exercises WHERE name = 'Side Plank Right' LIMIT 1;
  IF e_side_plank_right IS NULL THEN
      INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Side Plank Right', 'Strength', true) RETURNING id INTO e_side_plank_right;
  END IF;

  -- Side Plank Left
  SELECT id INTO e_side_plank_left FROM exercises WHERE name = 'Side Plank Left' LIMIT 1;
  IF e_side_plank_left IS NULL THEN
      INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Side Plank Left', 'Strength', true) RETURNING id INTO e_side_plank_left;
  END IF;
  
  -- Cobra Stretch
  SELECT id INTO e_cobra FROM exercises WHERE name = 'Cobra Stretch' LIMIT 1;
  IF e_cobra IS NULL THEN
      INSERT INTO exercises (name, exercise_type) VALUES ('Cobra Stretch', 'Flexibility') RETURNING id INTO e_cobra;
  END IF;

  -- Spine Lumbar Twist Stretch Left
  SELECT id INTO e_spine_left FROM exercises WHERE name = 'Spine Lumbar Twist Stretch Left' LIMIT 1;
  IF e_spine_left IS NULL THEN
      INSERT INTO exercises (name, exercise_type) VALUES ('Spine Lumbar Twist Stretch Left', 'Flexibility') RETURNING id INTO e_spine_left;
  END IF;

  -- Spine Lumbar Twist Stretch Right
  SELECT id INTO e_spine_right FROM exercises WHERE name = 'Spine Lumbar Twist Stretch Right' LIMIT 1;
  IF e_spine_right IS NULL THEN
      INSERT INTO exercises (name, exercise_type) VALUES ('Spine Lumbar Twist Stretch Right', 'Flexibility') RETURNING id INTO e_spine_right;
  END IF;


  -- 2. Upsert Routine
  SELECT id INTO r_id FROM workout_routines WHERE name = 'Abs Intermediate' LIMIT 1;
  
  IF r_id IS NULL THEN
      INSERT INTO workout_routines (name, category, level, place) 
      VALUES ('Abs Intermediate', 'Abs', 'Intermediate', 'Home') 
      RETURNING id INTO r_id;
  ELSE
      -- Update headers if needed
      UPDATE workout_routines SET category = 'Abs', level = 'Intermediate', place = 'Home' WHERE id = r_id;
      -- Clear existing links to overwrite with new structure
      DELETE FROM routine_exercises WHERE routine_id = r_id;
  END IF;
  
  -- 3. Insert Routine Exercises
  
  -- 1. Jumping Jacks (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_jumping_jacks, 30, 1);
  -- 2. Heel Touch (x26)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_heel_touch, 26, 2);
  -- 3. Crossover Crunch (x20)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_crossover_crunch, 20, 3);
  -- 4. Mountain Climber (x20)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_mountain_climber, 20, 4);
  -- 5. Side Bridges Left (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_side_bridges_left, 12, 5);
  -- 6. Side Bridges Right (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_side_bridges_right, 12, 6);
  -- 7. Butt Bridge (x20)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_butt_bridge, 20, 7);
  -- 8. Bicycle Crunches (x20)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_bicycle_crunches, 20, 8);
  -- 9. V-Up (x20)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_v_up, 20, 9);
  -- 10. Heel Touch (x26)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_heel_touch, 26, 10);
  -- 11. Abdominal Crunches (x20)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_crunches, 20, 11);
  -- 12. Plank (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_plank, 30, 12);
  -- 13. Crossover Crunch (x20)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_crossover_crunch, 20, 13);
  -- 14. Leg Raises (x16)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_leg_raises, 16, 14);
  -- 15. Bicycle Crunches (x20)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_bicycle_crunches, 20, 15);
  -- 16. Push-Up & Rotation (x20)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_push_up_rotation, 20, 16);
  -- 17. Side Plank Right (20s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_side_plank_right, 20, 17);
  -- 18. Side Plank Left (20s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_side_plank_left, 20, 18);
  -- 19. Cobra Stretch (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_cobra, 30, 19);
  -- 20. Spine Lumbar Twist Stretch Left (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_spine_left, 30, 20);
  -- 21. Spine Lumbar Twist Stretch Right (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_spine_right, 30, 21);

END $$;
