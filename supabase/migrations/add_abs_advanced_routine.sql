-- Migration to add "Abs Advanced" routine extracted from image
-- Exercises include: Jumping Jacks, Sit-Ups, Side Bridges, Crunches, Bicycle Crunches, Side Plank, V-Up, Push-Up & Rotation, Russian Twist, Butt Bridge, Heel Touch, Mountain Climber, Crossover Crunch, Plank, Cobra Stretch, Spine Twist
-- Includes 21 steps.

DO $$ 
DECLARE
  -- Exercise IDs
  e_jumping_jacks UUID;
  e_sit_ups UUID;
  e_side_bridges_left UUID;
  e_side_bridges_right UUID;
  e_crunches UUID;
  e_bicycle_crunches UUID;
  e_side_plank_right UUID;
  e_side_plank_left UUID;
  e_v_up UUID;
  e_push_up_rotation UUID;
  e_russian_twist UUID;
  e_butt_bridge UUID;
  e_heel_touch UUID;
  e_mountain_climber UUID;
  e_crossover_crunch UUID;
  e_plank UUID;
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

  -- Sit-Ups
  SELECT id INTO e_sit_ups FROM exercises WHERE name = 'Sit-Ups' LIMIT 1;
  IF e_sit_ups IS NULL THEN
      INSERT INTO exercises (name, exercise_type) VALUES ('Sit-Ups', 'Strength') RETURNING id INTO e_sit_ups;
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

  -- Abdominal Crunches
  SELECT id INTO e_crunches FROM exercises WHERE name = 'Abdominal Crunches' LIMIT 1;
  IF e_crunches IS NULL THEN
      INSERT INTO exercises (name, exercise_type) VALUES ('Abdominal Crunches', 'Strength') RETURNING id INTO e_crunches;
  END IF;

  -- Bicycle Crunches
  SELECT id INTO e_bicycle_crunches FROM exercises WHERE name = 'Bicycle Crunches' LIMIT 1;
  IF e_bicycle_crunches IS NULL THEN
      INSERT INTO exercises (name, exercise_type) VALUES ('Bicycle Crunches', 'Strength') RETURNING id INTO e_bicycle_crunches;
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

  -- V-Up
  SELECT id INTO e_v_up FROM exercises WHERE name = 'V-Up' LIMIT 1;
  IF e_v_up IS NULL THEN
      INSERT INTO exercises (name, exercise_type) VALUES ('V-Up', 'Strength') RETURNING id INTO e_v_up;
  END IF;

  -- Push-Up & Rotation
  SELECT id INTO e_push_up_rotation FROM exercises WHERE name = 'Push-Up & Rotation' LIMIT 1;
  IF e_push_up_rotation IS NULL THEN
      INSERT INTO exercises (name, exercise_type) VALUES ('Push-Up & Rotation', 'Strength') RETURNING id INTO e_push_up_rotation;
  END IF;

  -- Russian Twist
  SELECT id INTO e_russian_twist FROM exercises WHERE name = 'Russian Twist' LIMIT 1;
  IF e_russian_twist IS NULL THEN
      INSERT INTO exercises (name, exercise_type) VALUES ('Russian Twist', 'Strength') RETURNING id INTO e_russian_twist;
  END IF;

  -- Butt Bridge
  SELECT id INTO e_butt_bridge FROM exercises WHERE name = 'Butt Bridge' LIMIT 1;
  IF e_butt_bridge IS NULL THEN
      INSERT INTO exercises (name, exercise_type) VALUES ('Butt Bridge', 'Strength') RETURNING id INTO e_butt_bridge;
  END IF;

  -- Heel Touch
  SELECT id INTO e_heel_touch FROM exercises WHERE name = 'Heel Touch' LIMIT 1;
  IF e_heel_touch IS NULL THEN
      INSERT INTO exercises (name, exercise_type) VALUES ('Heel Touch', 'Strength') RETURNING id INTO e_heel_touch;
  END IF;

  -- Mountain Climber
  SELECT id INTO e_mountain_climber FROM exercises WHERE name = 'Mountain Climber' LIMIT 1;
  IF e_mountain_climber IS NULL THEN
      INSERT INTO exercises (name, exercise_type) VALUES ('Mountain Climber', 'Strength') RETURNING id INTO e_mountain_climber;
  END IF;

  -- Crossover Crunch
  SELECT id INTO e_crossover_crunch FROM exercises WHERE name = 'Crossover Crunch' LIMIT 1;
  IF e_crossover_crunch IS NULL THEN
      INSERT INTO exercises (name, exercise_type) VALUES ('Crossover Crunch', 'Strength') RETURNING id INTO e_crossover_crunch;
  END IF;

  -- Plank
  SELECT id INTO e_plank FROM exercises WHERE name = 'Plank' LIMIT 1;
  IF e_plank IS NULL THEN
      INSERT INTO exercises (name, exercise_type) VALUES ('Plank', 'Strength') RETURNING id INTO e_plank;
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
  SELECT id INTO r_id FROM workout_routines WHERE name = 'Abs Advanced' LIMIT 1;
  
  IF r_id IS NULL THEN
      INSERT INTO workout_routines (name, category, level, place) 
      VALUES ('Abs Advanced', 'Abs', 'Advanced', 'Home') 
      RETURNING id INTO r_id;
  ELSE
      -- Update headers if needed
      UPDATE workout_routines SET category = 'Abs', level = 'Advanced', place = 'Home' WHERE id = r_id;
      -- Clear existing links to overwrite with new structure
      DELETE FROM routine_exercises WHERE routine_id = r_id;
  END IF;
  
  -- 3. Insert Routine Exercises
  
  -- 1. Jumping Jacks (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_jumping_jacks, 30, 1);
  -- 2. Sit-Ups (x20)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_sit_ups, 20, 2);
  -- 3. Side Bridges Left (x20)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_side_bridges_left, 20, 3);
  -- 4. Side Bridges Right (x20)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_side_bridges_right, 20, 4);
  -- 5. Abdominal Crunches (x30)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_crunches, 30, 5);
  -- 6. Bicycle Crunches (x24)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_bicycle_crunches, 24, 6);
  -- 7. Side Plank Right (20s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_side_plank_right, 20, 7);
  -- 8. Side Plank Left (20s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_side_plank_left, 20, 8);
  -- 9. V-Up (x18)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_v_up, 18, 9);
  -- 10. Push-Up & Rotation (x24)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_push_up_rotation, 24, 10);
  -- 11. Russian Twist (x48)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_russian_twist, 48, 11);
  -- 12. Abdominal Crunches (x28)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_crunches, 28, 12);
  -- 13. Butt Bridge (x30)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_butt_bridge, 30, 13);
  -- 14. Heel Touch (x34)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_heel_touch, 34, 14);
  -- 15. Mountain Climber (x30)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_mountain_climber, 30, 15);
  -- 16. Crossover Crunch (x24)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_crossover_crunch, 24, 16);
  -- 17. V-Up (x16)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_v_up, 16, 17);
  -- 18. Plank (60s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_plank, 60, 18);
  -- 19. Cobra Stretch (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_cobra, 30, 19);
  -- 20. Spine Lumbar Twist Stretch Left (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_spine_left, 30, 20);
  -- 21. Spine Lumbar Twist Stretch Right (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_spine_right, 30, 21);

END $$;
