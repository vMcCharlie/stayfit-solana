-- Migration to add "Shoulder & Back Intermediate" routine
-- Exercises include: Triceps Kickbacks, Incline Push-Ups, Rhomboid Pulls, Floor Tricep Dips, Cat Cow Pose, Hip Hinge, Hover Push Up, Swimmer And Superman, etc.
-- Includes 17 steps.

DO $$ 
DECLARE
  -- Exercise IDs
  e_jumping_jacks UUID;
  e_triceps_kickbacks UUID;
  e_incline_push_ups UUID;
  e_rhomboid_pulls UUID;
  e_floor_tricep_dips UUID;
  e_cat_cow_pose UUID;
  e_hip_hinge UUID;
  e_side_lying_floor_stretch_left UUID;
  e_side_lying_floor_stretch_right UUID;
  e_hover_push_up UUID;
  e_swimmer_and_superman UUID;
  e_childs_pose UUID;
  
  r_id UUID;
BEGIN
  -- 1. Ensure Exercises Exist and Get IDs
  
  -- Jumping Jacks
  SELECT id INTO e_jumping_jacks FROM exercises WHERE name = 'Jumping Jacks' LIMIT 1;
  IF e_jumping_jacks IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Jumping Jacks', 'Cardio') RETURNING id INTO e_jumping_jacks;
  END IF;

  -- Triceps Kickbacks
  SELECT id INTO e_triceps_kickbacks FROM exercises WHERE name = 'Triceps Kickbacks' LIMIT 1;
  IF e_triceps_kickbacks IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Triceps Kickbacks', 'Strength') RETURNING id INTO e_triceps_kickbacks;
  END IF;

  -- Incline Push-Ups
  SELECT id INTO e_incline_push_ups FROM exercises WHERE name = 'Incline Push-Ups' LIMIT 1;
  IF e_incline_push_ups IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Incline Push-Ups', 'Strength') RETURNING id INTO e_incline_push_ups;
  END IF;

  -- Rhomboid Pulls
  SELECT id INTO e_rhomboid_pulls FROM exercises WHERE name = 'Rhomboid Pulls' LIMIT 1;
  IF e_rhomboid_pulls IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Rhomboid Pulls', 'Strength') RETURNING id INTO e_rhomboid_pulls;
  END IF;

  -- Floor Tricep Dips
  SELECT id INTO e_floor_tricep_dips FROM exercises WHERE name = 'Floor Tricep Dips' LIMIT 1;
  IF e_floor_tricep_dips IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Floor Tricep Dips', 'Strength') RETURNING id INTO e_floor_tricep_dips;
  END IF;

  -- Cat Cow Pose
  SELECT id INTO e_cat_cow_pose FROM exercises WHERE name = 'Cat Cow Pose' LIMIT 1;
  IF e_cat_cow_pose IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Cat Cow Pose', 'Flexibility') RETURNING id INTO e_cat_cow_pose;
  END IF;

  -- Hip Hinge
  SELECT id INTO e_hip_hinge FROM exercises WHERE name = 'Hip Hinge' LIMIT 1;
  IF e_hip_hinge IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Hip Hinge', 'Strength') RETURNING id INTO e_hip_hinge;
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

  -- Hover Push Up
  SELECT id INTO e_hover_push_up FROM exercises WHERE name = 'Hover Push Up' LIMIT 1;
  IF e_hover_push_up IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Hover Push Up', 'Strength') RETURNING id INTO e_hover_push_up;
  END IF;

  -- Swimmer And Superman
  SELECT id INTO e_swimmer_and_superman FROM exercises WHERE name = 'Swimmer And Superman' LIMIT 1;
  IF e_swimmer_and_superman IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Swimmer And Superman', 'Strength') RETURNING id INTO e_swimmer_and_superman;
  END IF;

  -- Child's Pose
  SELECT id INTO e_childs_pose FROM exercises WHERE name = 'Child''s Pose' LIMIT 1;
  IF e_childs_pose IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Child''s Pose', 'Flexibility') RETURNING id INTO e_childs_pose;
  END IF;


  -- 2. Upsert Routine
  SELECT id INTO r_id FROM workout_routines WHERE name = 'Shoulder & Back Intermediate' LIMIT 1;
  
  IF r_id IS NULL THEN
      INSERT INTO workout_routines (name, category, level, place) 
      VALUES ('Shoulder & Back Intermediate', 'Shoulder & Back', 'Intermediate', 'Home') 
      RETURNING id INTO r_id;
  ELSE
      -- Update headers if needed
      UPDATE workout_routines SET category = 'Shoulder & Back', level = 'Intermediate', place = 'Home' WHERE id = r_id;
      -- Clear existing links
      DELETE FROM routine_exercises WHERE routine_id = r_id;
  END IF;
  
  -- 3. Insert Routine Exercises
  
  -- 1. Jumping Jacks (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_jumping_jacks, 30, 1);
  -- 2. Triceps Kickbacks (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_triceps_kickbacks, 14, 2);
  -- 3. Incline Push-Ups (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_incline_push_ups, 14, 3);
  -- 4. Rhomboid Pulls (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_rhomboid_pulls, 12, 4);
  -- 5. Floor Tricep Dips (x15) - As analyzed from image, seems to be x15 or x16. Going with x15 as per visual best guess.
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_floor_tricep_dips, 15, 5);
  -- 6. Cat Cow Pose (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_cat_cow_pose, 30, 6);
  -- 7. Triceps Kickbacks (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_triceps_kickbacks, 12, 7);
  -- 8. Incline Push-Ups (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_incline_push_ups, 12, 8);
  -- 9. Hip Hinge (x10)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_hip_hinge, 10, 9);
  -- 10. Floor Tricep Dips (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_floor_tricep_dips, 14, 10);
  -- 11. Side-Lying Floor Stretch Left (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_side_lying_floor_stretch_left, 30, 11);
  -- 12. Side-Lying Floor Stretch Right (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_side_lying_floor_stretch_right, 30, 12);
  -- 13. Hover Push Up (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_hover_push_up, 14, 13);
  -- 14. Swimmer And Superman (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_swimmer_and_superman, 14, 14);
  -- 15. Hover Push Up (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_hover_push_up, 12, 15);
  -- 16. Swimmer And Superman (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_swimmer_and_superman, 12, 16);
  -- 17. Child's Pose (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_childs_pose, 30, 17);

END $$;
