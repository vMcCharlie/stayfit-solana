-- Migration to add "Arm Advanced" routine
-- Exercises include: Arm Circles, Skipping, Burpees, Arm Curls Crunch, Military Push Ups, Shoulder Gators, Doorway Curls, Modified Push-Up Low Hold, etc.
-- Includes 28 steps.

DO $$ 
DECLARE
  -- Exercise IDs
  e_arm_circles_cw UUID;
  e_arm_circles_ccw UUID;
  e_skipping_no_rope UUID;
  e_leg_barbell_curl_left UUID;
  e_leg_barbell_curl_right UUID;
  e_burpees UUID;
  e_arm_curls_crunch_left UUID;
  e_arm_curls_crunch_right UUID;
  e_floor_tricep_dips UUID;
  e_alternating_hooks UUID;
  e_military_push_ups UUID;
  e_shoulder_gators UUID;
  e_doorway_curls_left UUID;
  e_doorway_curls_right UUID;
  e_modified_pushup_low_hold UUID;
  e_chest_press_pulse UUID;
  e_push_up_rotation UUID;
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

  -- Skipping Without Rope
  SELECT id INTO e_skipping_no_rope FROM exercises WHERE name = 'Skipping Without Rope' LIMIT 1;
  IF e_skipping_no_rope IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Skipping Without Rope', 'Cardio') RETURNING id INTO e_skipping_no_rope;
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

  -- Burpees
  SELECT id INTO e_burpees FROM exercises WHERE name = 'Burpees' LIMIT 1;
  IF e_burpees IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Burpees', 'Cardio') RETURNING id INTO e_burpees;
  END IF;

  -- Arm Curls Crunch Left
  SELECT id INTO e_arm_curls_crunch_left FROM exercises WHERE name = 'Arm Curls Crunch Left' LIMIT 1;
  IF e_arm_curls_crunch_left IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Arm Curls Crunch Left', 'Strength', true) RETURNING id INTO e_arm_curls_crunch_left;
  END IF;

  -- Arm Curls Crunch Right
  SELECT id INTO e_arm_curls_crunch_right FROM exercises WHERE name = 'Arm Curls Crunch Right' LIMIT 1;
  IF e_arm_curls_crunch_right IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Arm Curls Crunch Right', 'Strength', true) RETURNING id INTO e_arm_curls_crunch_right;
  END IF;

  -- Floor Tricep Dips
  SELECT id INTO e_floor_tricep_dips FROM exercises WHERE name = 'Floor Tricep Dips' LIMIT 1;
  IF e_floor_tricep_dips IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Floor Tricep Dips', 'Strength') RETURNING id INTO e_floor_tricep_dips;
  END IF;

  -- Alternating Hooks
  SELECT id INTO e_alternating_hooks FROM exercises WHERE name = 'Alternating Hooks' LIMIT 1;
  IF e_alternating_hooks IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Alternating Hooks', 'Cardio') RETURNING id INTO e_alternating_hooks;
  END IF;

  -- Military Push Ups
  SELECT id INTO e_military_push_ups FROM exercises WHERE name = 'Military Push Ups' LIMIT 1;
  IF e_military_push_ups IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Military Push Ups', 'Strength') RETURNING id INTO e_military_push_ups;
  END IF;

  -- Shoulder Gators
  SELECT id INTO e_shoulder_gators FROM exercises WHERE name = 'Shoulder Gators' LIMIT 1;
  IF e_shoulder_gators IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Shoulder Gators', 'Strength') RETURNING id INTO e_shoulder_gators;
  END IF;

  -- Doorway Curls Left
  SELECT id INTO e_doorway_curls_left FROM exercises WHERE name = 'Doorway Curls Left' LIMIT 1;
  IF e_doorway_curls_left IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Doorway Curls Left', 'Strength', true) RETURNING id INTO e_doorway_curls_left;
  END IF;

  -- Doorway Curls Right
  SELECT id INTO e_doorway_curls_right FROM exercises WHERE name = 'Doorway Curls Right' LIMIT 1;
  IF e_doorway_curls_right IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Doorway Curls Right', 'Strength', true) RETURNING id INTO e_doorway_curls_right;
  END IF;

  -- Modified Push-Up Low Hold
  SELECT id INTO e_modified_pushup_low_hold FROM exercises WHERE name = 'Modified Push-Up Low Hold' LIMIT 1;
  IF e_modified_pushup_low_hold IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Modified Push-Up Low Hold', 'Strength') RETURNING id INTO e_modified_pushup_low_hold;
  END IF;

  -- Chest Press Pulse
  SELECT id INTO e_chest_press_pulse FROM exercises WHERE name = 'Chest Press Pulse' LIMIT 1;
  IF e_chest_press_pulse IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Chest Press Pulse', 'Strength') RETURNING id INTO e_chest_press_pulse;
  END IF;

  -- Push-Up & Rotation
  SELECT id INTO e_push_up_rotation FROM exercises WHERE name = 'Push-Up & Rotation' LIMIT 1;
  IF e_push_up_rotation IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Push-Up & Rotation', 'Strength') RETURNING id INTO e_push_up_rotation;
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
  SELECT id INTO r_id FROM workout_routines WHERE name = 'Arm Advanced' LIMIT 1;
  
  IF r_id IS NULL THEN
      INSERT INTO workout_routines (name, category, level, place) 
      VALUES ('Arm Advanced', 'Arm', 'Advanced', 'Home') 
      RETURNING id INTO r_id;
  ELSE
      -- Update headers if needed
      UPDATE workout_routines SET category = 'Arm', level = 'Advanced', place = 'Home' WHERE id = r_id;
      -- Clear existing links
      DELETE FROM routine_exercises WHERE routine_id = r_id;
  END IF;
  
  -- 3. Insert Routine Exercises
  
  -- 1. Arm Circles Clockwise (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_arm_circles_cw, 30, 1);
  -- 2. Arm Circles Counterclockwise (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_arm_circles_ccw, 30, 2);
  -- 3. Skipping Without Rope (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_skipping_no_rope, 30, 3);
  -- 4. Leg Barbell Curl Left (x16)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_leg_barbell_curl_left, 16, 4);
  -- 5. Leg Barbell Curl Right (x16)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_leg_barbell_curl_right, 16, 5);
  -- 6. Burpees (x16)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_burpees, 16, 6);
  -- 7. Arm Curls Crunch Left (x16)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_arm_curls_crunch_left, 16, 7);
  -- 8. Arm Curls Crunch Right (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_arm_curls_crunch_right, 14, 8);
  -- 9. Floor Tricep Dips (x18)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_floor_tricep_dips, 18, 9);
  -- 10. Alternating Hooks (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_alternating_hooks, 30, 10);
  -- 11. Military Push Ups (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_military_push_ups, 14, 11);
  -- 12. Shoulder Gators (x16)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_shoulder_gators, 16, 12);
  -- 13. Floor Tricep Dips (x16)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_floor_tricep_dips, 16, 13);
  -- 14. Alternating Hooks (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_alternating_hooks, 30, 14);
  -- 15. Burpees (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_burpees, 14, 15);
  -- 16. Arm Curls Crunch Left (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_arm_curls_crunch_left, 12, 16);
  -- 17. Arm Curls Crunch Right (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_arm_curls_crunch_right, 12, 17);
  -- 18. Military Push Ups (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_military_push_ups, 12, 18);
  -- 19. Shoulder Gators (x16)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_shoulder_gators, 16, 19);
  -- 20. Doorway Curls Left (x8)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_doorway_curls_left, 8, 20);
  -- 21. Doorway Curls Right (x8)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_doorway_curls_right, 8, 21);
  -- 22. Modified Push-Up Low Hold (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_modified_pushup_low_hold, 30, 22);
  -- 23. Chest Press Pulse (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_chest_press_pulse, 30, 23);
  -- 24. Push-Up & Rotation (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_push_up_rotation, 12, 24);
  -- 25. Triceps Stretch Left (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_triceps_stretch_left, 30, 25);
  -- 26. Triceps Stretch Right (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_triceps_stretch_right, 30, 26);
  -- 27. Standing Biceps Stretch Left (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_biceps_stretch_left, 30, 27);
  -- 28. Standing Biceps Stretch Right (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_biceps_stretch_right, 30, 28);

END $$;
