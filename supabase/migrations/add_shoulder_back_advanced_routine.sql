-- Migration to add "Shoulder & Back Advanced" routine
-- Exercises include: Hyperextension, Pike Push Ups, Reverse Push-Ups, Inchworms, Supine Push Up, Floor Y Raises, etc.
-- Includes 17 steps.

DO $$ 
DECLARE
  -- Exercise IDs
  e_jumping_jacks UUID;
  e_hyperextension UUID;
  e_pike_push_ups UUID;
  e_reverse_push_ups UUID;
  e_inchworms UUID;
  e_side_lying_floor_stretch_left UUID;
  e_side_lying_floor_stretch_right UUID;
  e_cat_cow_pose UUID;
  e_supine_push_up UUID;
  e_floor_y_raises UUID;
  e_reverse_snow_angels UUID;
  e_childs_pose UUID;
  
  r_id UUID;
BEGIN
  -- 1. Ensure Exercises Exist and Get IDs
  
  -- Jumping Jacks
  SELECT id INTO e_jumping_jacks FROM exercises WHERE name = 'Jumping Jacks' LIMIT 1;
  IF e_jumping_jacks IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Jumping Jacks', 'Cardio') RETURNING id INTO e_jumping_jacks;
  END IF;

  -- Hyperextension
  SELECT id INTO e_hyperextension FROM exercises WHERE name = 'Hyperextension' LIMIT 1;
  IF e_hyperextension IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Hyperextension', 'Strength') RETURNING id INTO e_hyperextension;
  END IF;

  -- Pike Push Ups
  SELECT id INTO e_pike_push_ups FROM exercises WHERE name = 'Pike Push Ups' LIMIT 1;
  IF e_pike_push_ups IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Pike Push Ups', 'Strength') RETURNING id INTO e_pike_push_ups;
  END IF;

  -- Reverse Push-Ups
  SELECT id INTO e_reverse_push_ups FROM exercises WHERE name = 'Reverse Push-Ups' LIMIT 1;
  IF e_reverse_push_ups IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Reverse Push-Ups', 'Strength') RETURNING id INTO e_reverse_push_ups;
  END IF;

  -- Inchworms
  SELECT id INTO e_inchworms FROM exercises WHERE name = 'Inchworms' LIMIT 1;
  IF e_inchworms IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Inchworms', 'Flexibility') RETURNING id INTO e_inchworms;
  END IF;

  -- Side-Lying Floor Stretch Left
  SELECT id INTO e_side_lying_floor_stretch_left FROM exercises WHERE name = 'Side-Lying Floor Stretch Left' LIMIT 1;
  IF e_side_lying_floor_stretch_left IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Side-Lying Floor Stretch Left', 'Flexibility', true) RETURNING id INTO e_side_lying_floor_stretch_left;
  END IF;

  -- Side-Lying Floor Stretch Right
  SELECT id INTO e_side_lying_floor_stretch_right FROM exercises WHERE name = 'Side-Lying Floor Stretch Right' LIMIT 1;
  IF e_side_lying_floor_stretch_right IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Side-Lying Floor Stretch Right', 'Flexibility', true) RETURNING id INTO e_side_lying_floor_stretch_right;
  END IF;

  -- Cat Cow Pose
  SELECT id INTO e_cat_cow_pose FROM exercises WHERE name = 'Cat Cow Pose' LIMIT 1;
  IF e_cat_cow_pose IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Cat Cow Pose', 'Flexibility') RETURNING id INTO e_cat_cow_pose;
  END IF;

  -- Supine Push Up
  SELECT id INTO e_supine_push_up FROM exercises WHERE name = 'Supine Push Up' LIMIT 1;
  IF e_supine_push_up IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Supine Push Up', 'Strength') RETURNING id INTO e_supine_push_up;
  END IF;

  -- Floor Y Raises
  SELECT id INTO e_floor_y_raises FROM exercises WHERE name = 'Floor Y Raises' LIMIT 1;
  IF e_floor_y_raises IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Floor Y Raises', 'Strength') RETURNING id INTO e_floor_y_raises;
  END IF;

  -- Reverse Snow Angels
  SELECT id INTO e_reverse_snow_angels FROM exercises WHERE name = 'Reverse Snow Angels' LIMIT 1;
  IF e_reverse_snow_angels IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Reverse Snow Angels', 'Strength') RETURNING id INTO e_reverse_snow_angels;
  END IF;

  -- Child's Pose
  SELECT id INTO e_childs_pose FROM exercises WHERE name = 'Child''s Pose' LIMIT 1;
  IF e_childs_pose IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Child''s Pose', 'Flexibility') RETURNING id INTO e_childs_pose;
  END IF;


  -- 2. Upsert Routine
  SELECT id INTO r_id FROM workout_routines WHERE name = 'Shoulder & Back Advanced' LIMIT 1;
  
  IF r_id IS NULL THEN
      INSERT INTO workout_routines (name, category, level, place) 
      VALUES ('Shoulder & Back Advanced', 'Shoulder & Back', 'Advanced', 'Home') 
      RETURNING id INTO r_id;
  ELSE
      -- Update headers if needed
      UPDATE workout_routines SET category = 'Shoulder & Back', level = 'Advanced', place = 'Home' WHERE id = r_id;
      -- Clear existing links
      DELETE FROM routine_exercises WHERE routine_id = r_id;
  END IF;
  
  -- 3. Insert Routine Exercises
  
  -- 1. Jumping Jacks (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_jumping_jacks, 30, 1);
  -- 2. Hyperextension (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_hyperextension, 14, 2);
  -- 3. Pike Push Ups (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_pike_push_ups, 14, 3);
  -- 4. Reverse Push-Ups (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_reverse_push_ups, 12, 4);
  -- 5. Inchworms (x16)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_inchworms, 16, 5);
  -- 6. Side-Lying Floor Stretch Left (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_side_lying_floor_stretch_left, 30, 6);
  -- 7. Side-Lying Floor Stretch Right (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_side_lying_floor_stretch_right, 30, 7);
  -- 8. Hyperextension (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_hyperextension, 12, 8);
  -- 9. Pike Push Ups (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_pike_push_ups, 12, 9);
  -- 10. Reverse Push-Ups (x10)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_reverse_push_ups, 10, 10);
  -- 11. Inchworms (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_inchworms, 14, 11);
  -- 12. Cat Cow Pose (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_cat_cow_pose, 30, 12);
  -- 13. Supine Push Up (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_supine_push_up, 14, 13);
  -- 14. Floor Y Raises (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_floor_y_raises, 14, 14);
  -- 15. Supine Push Up (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_supine_push_up, 12, 15);
  -- 16. Reverse Snow Angels (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_reverse_snow_angels, 12, 16);
  -- 17. Child's Pose (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_childs_pose, 30, 17);

END $$;
