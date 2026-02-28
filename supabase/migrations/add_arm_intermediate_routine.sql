-- Migration to add "Arm Intermediate" routine
-- Exercises include: Arm Circles, Floor Tricep Dips, Military Push Ups, Alternating Hooks, Push-Up & Rotation, Leg Barbell Curl, Skipping Without Rope, Burpees, Arm Scissors, etc.
-- Includes 25 steps.

DO $$ 
DECLARE
  -- Exercise IDs
  e_arm_circles_cw UUID;
  e_arm_circles_ccw UUID;
  e_floor_tricep_dips UUID;
  e_military_push_ups UUID;
  e_alternating_hooks UUID;
  e_push_up_rotation UUID;
  e_leg_barbell_curl_left UUID;
  e_leg_barbell_curl_right UUID;
  e_skipping_no_rope UUID;
  e_pushups UUID;
  e_burpees UUID;
  e_arm_scissors UUID;
  e_triceps_stretch_left UUID;
  e_triceps_stretch_right UUID;
  e_biceps_stretch_left UUID;
  e_biceps_stretch_right UUID;
  
  r_id UUID;
BEGIN
  -- 1. Ensure Exercises Exist and Get IDs
  
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

  -- Floor Tricep Dips
  SELECT id INTO e_floor_tricep_dips FROM exercises WHERE name = 'Floor Tricep Dips' LIMIT 1;
  IF e_floor_tricep_dips IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Floor Tricep Dips', 'Strength') RETURNING id INTO e_floor_tricep_dips;
  END IF;

  -- Military Push Ups
  SELECT id INTO e_military_push_ups FROM exercises WHERE name = 'Military Push Ups' LIMIT 1;
  IF e_military_push_ups IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Military Push Ups', 'Strength') RETURNING id INTO e_military_push_ups;
  END IF;

  -- Alternating Hooks
  SELECT id INTO e_alternating_hooks FROM exercises WHERE name = 'Alternating Hooks' LIMIT 1;
  IF e_alternating_hooks IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Alternating Hooks', 'Cardio') RETURNING id INTO e_alternating_hooks;
  END IF;

  -- Push-Up & Rotation
  SELECT id INTO e_push_up_rotation FROM exercises WHERE name = 'Push-Up & Rotation' LIMIT 1;
  IF e_push_up_rotation IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Push-Up & Rotation', 'Strength') RETURNING id INTO e_push_up_rotation;
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

  -- Skipping Without Rope
  SELECT id INTO e_skipping_no_rope FROM exercises WHERE name = 'Skipping Without Rope' LIMIT 1;
  IF e_skipping_no_rope IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Skipping Without Rope', 'Cardio') RETURNING id INTO e_skipping_no_rope;
  END IF;

  -- Push-Ups
  SELECT id INTO e_pushups FROM exercises WHERE name = 'Push-Ups' LIMIT 1;
  IF e_pushups IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Push-Ups', 'Strength') RETURNING id INTO e_pushups;
  END IF;

  -- Burpees
  SELECT id INTO e_burpees FROM exercises WHERE name = 'Burpees' LIMIT 1;
  IF e_burpees IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Burpees', 'Cardio') RETURNING id INTO e_burpees;
  END IF;

  -- Arm Scissors
  SELECT id INTO e_arm_scissors FROM exercises WHERE name = 'Arm Scissors' LIMIT 1;
  IF e_arm_scissors IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Arm Scissors', 'Cardio') RETURNING id INTO e_arm_scissors;
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
  SELECT id INTO r_id FROM workout_routines WHERE name = 'Arm Intermediate' LIMIT 1;
  
  IF r_id IS NULL THEN
      INSERT INTO workout_routines (name, category, level, place) 
      VALUES ('Arm Intermediate', 'Arm', 'Intermediate', 'Home') 
      RETURNING id INTO r_id;
  ELSE
      -- Update headers if needed
      UPDATE workout_routines SET category = 'Arm', level = 'Intermediate', place = 'Home' WHERE id = r_id;
      -- Clear existing links
      DELETE FROM routine_exercises WHERE routine_id = r_id;
  END IF;
  
  -- 3. Insert Routine Exercises
  
  -- 1. Arm Circles Clockwise (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_arm_circles_cw, 30, 1);
  -- 2. Arm Circles Counterclockwise (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_arm_circles_ccw, 30, 2);
  -- 3. Floor Tricep Dips (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_floor_tricep_dips, 14, 3);
  -- 4. Military Push Ups (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_military_push_ups, 12, 4);
  -- 5. Alternating Hooks (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_alternating_hooks, 30, 5);
  -- 6. Push-Up & Rotation (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_push_up_rotation, 12, 6);
  -- 7. Leg Barbell Curl Left (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_leg_barbell_curl_left, 12, 7);
  -- 8. Leg Barbell Curl Right (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_leg_barbell_curl_right, 12, 8);
  -- 9. Floor Tricep Dips (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_floor_tricep_dips, 12, 9);
  -- 10. Military Push Ups (x10)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_military_push_ups, 10, 10);
  -- 11. Alternating Hooks (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_alternating_hooks, 30, 11);
  -- 12. Push-Up & Rotation (x10)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_push_up_rotation, 10, 12);
  -- 13. Leg Barbell Curl Left (x10)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_leg_barbell_curl_left, 10, 13);
  -- 14. Leg Barbell Curl Right (x10)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_leg_barbell_curl_right, 10, 14);
  -- 15. Skipping Without Rope (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_skipping_no_rope, 30, 15);
  -- 16. Push-Ups (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_pushups, 14, 16);
  -- 17. Burpees (x10)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_burpees, 10, 17);
  -- 18. Arm Scissors (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_arm_scissors, 30, 18);
  -- 19. Skipping Without Rope (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_skipping_no_rope, 30, 19);
  -- 20. Push-Ups (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_pushups, 12, 20);
  -- 21. Burpees (x8)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_burpees, 8, 21);
  -- 22. Triceps Stretch Left (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_triceps_stretch_left, 30, 22);
  -- 23. Triceps Stretch Right (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_triceps_stretch_right, 30, 23);
  -- 24. Standing Biceps Stretch Left (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_biceps_stretch_left, 30, 24);
  -- 25. Standing Biceps Stretch Right (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_biceps_stretch_right, 30, 25);

END $$;
