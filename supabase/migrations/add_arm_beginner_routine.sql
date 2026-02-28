-- Migration to add "Arm Beginner" routine
-- Exercises include: Arm Raises, Side Arm Raise, Triceps Dips, Push-Ups, Diamond Push-Ups, Punches, Inchworms, Wall Push-Ups, etc.
-- Includes 19 steps.

DO $$ 
DECLARE
  -- Exercise IDs
  e_arm_raises UUID;
  e_side_arm_raise UUID;
  e_triceps_dips UUID;
  e_arm_circles_cw UUID;
  e_arm_circles_ccw UUID;
  e_diamond_pushups UUID;
  e_jumping_jacks UUID;
  e_chest_press_pulse UUID;
  e_leg_barbell_curl_left UUID;
  e_leg_barbell_curl_right UUID;
  e_diagonal_plank UUID;
  e_punches UUID;
  e_pushups UUID;
  e_inchworms UUID;
  e_wall_pushups UUID;
  e_triceps_stretch_left UUID;
  e_triceps_stretch_right UUID;
  e_biceps_stretch_left UUID;
  e_biceps_stretch_right UUID;
  
  r_id UUID;
BEGIN
  -- 1. Ensure Exercises Exist and Get IDs
  
  -- Arm Raises
  SELECT id INTO e_arm_raises FROM exercises WHERE name = 'Arm Raises' LIMIT 1;
  IF e_arm_raises IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Arm Raises', 'Strength') RETURNING id INTO e_arm_raises;
  END IF;

  -- Side Arm Raise
  SELECT id INTO e_side_arm_raise FROM exercises WHERE name = 'Side Arm Raise' LIMIT 1;
  IF e_side_arm_raise IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Side Arm Raise', 'Strength') RETURNING id INTO e_side_arm_raise;
  END IF;

  -- Triceps Dips
  SELECT id INTO e_triceps_dips FROM exercises WHERE name = 'Triceps Dips' LIMIT 1;
  IF e_triceps_dips IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Triceps Dips', 'Strength') RETURNING id INTO e_triceps_dips;
  END IF;

  -- Arm Circles Clockwise
  SELECT id INTO e_arm_circles_cw FROM exercises WHERE name = 'Arm Circles Clockwise' LIMIT 1;
  IF e_arm_circles_cw IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Arm Circles Clockwise', 'Strength') RETURNING id INTO e_arm_circles_cw;
  END IF;

  -- Arm Circles Counterclockwise
  SELECT id INTO e_arm_circles_ccw FROM exercises WHERE name = 'Arm Circles Counterclockwise' LIMIT 1;
  IF e_arm_circles_ccw IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Arm Circles Counterclockwise', 'Strength') RETURNING id INTO e_arm_circles_ccw;
  END IF;

  -- Diamond Push-Ups
  SELECT id INTO e_diamond_pushups FROM exercises WHERE name = 'Diamond Push-Ups' LIMIT 1;
  IF e_diamond_pushups IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Diamond Push-Ups', 'Strength') RETURNING id INTO e_diamond_pushups;
  END IF;

  -- Jumping Jacks (Check existing)
  SELECT id INTO e_jumping_jacks FROM exercises WHERE name = 'Jumping Jacks' LIMIT 1;
  IF e_jumping_jacks IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Jumping Jacks', 'Cardio') RETURNING id INTO e_jumping_jacks;
  END IF;

  -- Chest Press Pulse
  SELECT id INTO e_chest_press_pulse FROM exercises WHERE name = 'Chest Press Pulse' LIMIT 1;
  IF e_chest_press_pulse IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Chest Press Pulse', 'Strength') RETURNING id INTO e_chest_press_pulse;
  END IF;

  -- Leg Barbell Curl Left
  SELECT id INTO e_leg_barbell_curl_left FROM exercises WHERE name = 'Leg Barbell Curl Left' LIMIT 1;
  IF e_leg_barbell_curl_left IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Leg Barbell Curl Left', 'Strength', true) RETURNING id INTO e_leg_barbell_curl_left;
  END IF;

  -- Leg Barbell Curl Right
  SELECT id INTO e_leg_barbell_curl_right FROM exercises WHERE name = 'Leg Barbell Curl Right' LIMIT 1;
  IF e_leg_barbell_curl_right IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Leg Barbell Curl Right', 'Strength', true) RETURNING id INTO e_leg_barbell_curl_right;
  END IF;

  -- Diagonal Plank
  SELECT id INTO e_diagonal_plank FROM exercises WHERE name = 'Diagonal Plank' LIMIT 1;
  IF e_diagonal_plank IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Diagonal Plank', 'Strength') RETURNING id INTO e_diagonal_plank;
  END IF;

  -- Punches
  SELECT id INTO e_punches FROM exercises WHERE name = 'Punches' LIMIT 1;
  IF e_punches IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Punches', 'Cardio') RETURNING id INTO e_punches;
  END IF;

  -- Push-Ups
  SELECT id INTO e_pushups FROM exercises WHERE name = 'Push-Ups' LIMIT 1;
  IF e_pushups IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Push-Ups', 'Strength') RETURNING id INTO e_pushups;
  END IF;

  -- Inchworms
  SELECT id INTO e_inchworms FROM exercises WHERE name = 'Inchworms' LIMIT 1;
  IF e_inchworms IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Inchworms', 'Strength') RETURNING id INTO e_inchworms;
  END IF;

  -- Wall Push-Ups
  SELECT id INTO e_wall_pushups FROM exercises WHERE name = 'Wall Push-Ups' LIMIT 1;
  IF e_wall_pushups IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Wall Push-Ups', 'Strength') RETURNING id INTO e_wall_pushups;
  END IF;

  -- Triceps Stretch Left
  SELECT id INTO e_triceps_stretch_left FROM exercises WHERE name = 'Triceps Stretch Left' LIMIT 1;
  IF e_triceps_stretch_left IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Triceps Stretch Left', 'Flexibility', true) RETURNING id INTO e_triceps_stretch_left;
  END IF;

  -- Triceps Stretch Right
  SELECT id INTO e_triceps_stretch_right FROM exercises WHERE name = 'Triceps Stretch Right' LIMIT 1;
  IF e_triceps_stretch_right IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Triceps Stretch Right', 'Flexibility', true) RETURNING id INTO e_triceps_stretch_right;
  END IF;

  -- Standing Biceps Stretch Left
  SELECT id INTO e_biceps_stretch_left FROM exercises WHERE name = 'Standing Biceps Stretch Left' LIMIT 1;
  IF e_biceps_stretch_left IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Standing Biceps Stretch Left', 'Flexibility', true) RETURNING id INTO e_biceps_stretch_left;
  END IF;

  -- Standing Biceps Stretch Right
  SELECT id INTO e_biceps_stretch_right FROM exercises WHERE name = 'Standing Biceps Stretch Right' LIMIT 1;
  IF e_biceps_stretch_right IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Standing Biceps Stretch Right', 'Flexibility', true) RETURNING id INTO e_biceps_stretch_right;
  END IF;


  -- 2. Upsert Routine
  SELECT id INTO r_id FROM workout_routines WHERE name = 'Arm Beginner' LIMIT 1;
  
  IF r_id IS NULL THEN
      INSERT INTO workout_routines (name, category, level, place) 
      VALUES ('Arm Beginner', 'Arm', 'Beginner', 'Home') 
      RETURNING id INTO r_id;
  ELSE
      -- Update headers if needed
      UPDATE workout_routines SET category = 'Arm', level = 'Beginner', place = 'Home' WHERE id = r_id;
      -- Clear existing links
      DELETE FROM routine_exercises WHERE routine_id = r_id;
  END IF;
  
  -- 3. Insert Routine Exercises
  
  -- 1. Arm Raises (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_arm_raises, 30, 1);
  -- 2. Side Arm Raise (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_side_arm_raise, 30, 2);
  -- 3. Triceps Dips (x10)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_triceps_dips, 10, 3);
  -- 4. Arm Circles Clockwise (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_arm_circles_cw, 30, 4);
  -- 5. Arm Circles Counterclockwise (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_arm_circles_ccw, 30, 5);
  -- 6. Diamond Push-Ups (x6)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_diamond_pushups, 6, 6);
  -- 7. Jumping Jacks (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_jumping_jacks, 30, 7);
  -- 8. Chest Press Pulse (16s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_chest_press_pulse, 16, 8);
  -- 9. Leg Barbell Curl Left (x8)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_leg_barbell_curl_left, 8, 9);
  -- 10. Leg Barbell Curl Right (x8)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_leg_barbell_curl_right, 8, 10);
  -- 11. Diagonal Plank (x10)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_diagonal_plank, 10, 11);
  -- 12. Punches (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_punches, 30, 12);
  -- 13. Push-Ups (x10)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_pushups, 10, 13);
  -- 14. Inchworms (x8)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_inchworms, 8, 14);
  -- 15. Wall Push-Ups (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_wall_pushups, 12, 15);
  -- 16. Triceps Stretch Left (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_triceps_stretch_left, 30, 16);
  -- 17. Triceps Stretch Right (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_triceps_stretch_right, 30, 17);
  -- 18. Standing Biceps Stretch Left (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_biceps_stretch_left, 30, 18);
  -- 19. Standing Biceps Stretch Right (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_biceps_stretch_right, 30, 19);

END $$;
