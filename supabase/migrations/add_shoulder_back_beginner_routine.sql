-- Migration to add "Shoulder & Back Beginner" routine
-- Exercises include: Jumping Jacks, Arm Raises, Rhomboid Pulls, Side Arm Raise, Knee Push-Ups, Side-Lying Floor Stretch, etc.
-- Includes 17 steps.

DO $$ 
DECLARE
  -- Exercise IDs
  e_jumping_jacks UUID;
  e_arm_raises UUID;
  e_rhomboid_pulls UUID;
  e_side_arm_raise UUID;
  e_knee_push_ups UUID;
  e_side_lying_floor_stretch_left UUID;
  e_side_lying_floor_stretch_right UUID;
  e_arm_scissors UUID;
  e_cat_cow_pose UUID;
  e_prone_triceps_push_ups UUID;
  e_reclined_rhomboid_squeezes UUID;
  e_childs_pose UUID;
  
  r_id UUID;
BEGIN
  -- 1. Ensure Exercises Exist and Get IDs
  
  -- Jumping Jacks
  SELECT id INTO e_jumping_jacks FROM exercises WHERE name = 'Jumping Jacks' LIMIT 1;
  IF e_jumping_jacks IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Jumping Jacks', 'Cardio') RETURNING id INTO e_jumping_jacks;
  END IF;

  -- Arm Raises
  SELECT id INTO e_arm_raises FROM exercises WHERE name = 'Arm Raises' LIMIT 1;
  IF e_arm_raises IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Arm Raises', 'Strength') RETURNING id INTO e_arm_raises;
  END IF;

  -- Rhomboid Pulls
  SELECT id INTO e_rhomboid_pulls FROM exercises WHERE name = 'Rhomboid Pulls' LIMIT 1;
  IF e_rhomboid_pulls IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Rhomboid Pulls', 'Strength') RETURNING id INTO e_rhomboid_pulls;
  END IF;

  -- Side Arm Raise
  SELECT id INTO e_side_arm_raise FROM exercises WHERE name = 'Side Arm Raise' LIMIT 1;
  IF e_side_arm_raise IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Side Arm Raise', 'Strength') RETURNING id INTO e_side_arm_raise;
  END IF;

  -- Knee Push-Ups
  SELECT id INTO e_knee_push_ups FROM exercises WHERE name = 'Knee Push-Ups' LIMIT 1;
  IF e_knee_push_ups IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Knee Push-Ups', 'Strength') RETURNING id INTO e_knee_push_ups;
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

  -- Arm Scissors
  SELECT id INTO e_arm_scissors FROM exercises WHERE name = 'Arm Scissors' LIMIT 1;
  IF e_arm_scissors IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Arm Scissors', 'Strength') RETURNING id INTO e_arm_scissors;
  END IF;

  -- Cat Cow Pose
  SELECT id INTO e_cat_cow_pose FROM exercises WHERE name = 'Cat Cow Pose' LIMIT 1;
  IF e_cat_cow_pose IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Cat Cow Pose', 'Flexibility') RETURNING id INTO e_cat_cow_pose;
  END IF;

  -- Prone Triceps Push Ups
  SELECT id INTO e_prone_triceps_push_ups FROM exercises WHERE name = 'Prone Triceps Push Ups' LIMIT 1;
  IF e_prone_triceps_push_ups IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Prone Triceps Push Ups', 'Strength') RETURNING id INTO e_prone_triceps_push_ups;
  END IF;

  -- Reclined Rhomboid Squeezes
  SELECT id INTO e_reclined_rhomboid_squeezes FROM exercises WHERE name = 'Reclined Rhomboid Squeezes' LIMIT 1;
  IF e_reclined_rhomboid_squeezes IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Reclined Rhomboid Squeezes', 'Strength') RETURNING id INTO e_reclined_rhomboid_squeezes;
  END IF;

  -- Child's Pose
  SELECT id INTO e_childs_pose FROM exercises WHERE name = 'Child''s Pose' LIMIT 1;
  IF e_childs_pose IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Child''s Pose', 'Flexibility') RETURNING id INTO e_childs_pose;
  END IF;


  -- 2. Upsert Routine
  SELECT id INTO r_id FROM workout_routines WHERE name = 'Shoulder & Back Beginner' LIMIT 1;
  
  IF r_id IS NULL THEN
      INSERT INTO workout_routines (name, category, level, place) 
      VALUES ('Shoulder & Back Beginner', 'Shoulder & Back', 'Beginner', 'Home') 
      RETURNING id INTO r_id;
  ELSE
      -- Update headers if needed
      UPDATE workout_routines SET category = 'Shoulder & Back', level = 'Beginner', place = 'Home' WHERE id = r_id;
      -- Clear existing links
      DELETE FROM routine_exercises WHERE routine_id = r_id;
  END IF;
  
  -- 3. Insert Routine Exercises
  
  -- 1. Jumping Jacks (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_jumping_jacks, 30, 1);
  -- 2. Arm Raises (16s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_arm_raises, 16, 2);
  -- 3. Rhomboid Pulls (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_rhomboid_pulls, 14, 3);
  -- 4. Side Arm Raise (16s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_side_arm_raise, 16, 4);
  -- 5. Knee Push-Ups (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_knee_push_ups, 14, 5);
  -- 6. Side-Lying Floor Stretch Left (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_side_lying_floor_stretch_left, 30, 6);
  -- 7. Side-Lying Floor Stretch Right (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_side_lying_floor_stretch_right, 30, 7);
  -- 8. Arm Scissors (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_arm_scissors, 30, 8);
  -- 9. Rhomboid Pulls (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_rhomboid_pulls, 12, 9);
  -- 10. Side Arm Raise (14s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_side_arm_raise, 14, 10);
  -- 11. Knee Push-Ups (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_knee_push_ups, 12, 11);
  -- 12. Cat Cow Pose (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_cat_cow_pose, 30, 12);
  -- 13. Prone Triceps Push Ups (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_prone_triceps_push_ups, 14, 13);
  -- 14. Reclined Rhomboid Squeezes (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_reclined_rhomboid_squeezes, 12, 14);
  -- 15. Prone Triceps Push Ups (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_prone_triceps_push_ups, 14, 15);
  -- 16. Reclined Rhomboid Squeezes (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_reclined_rhomboid_squeezes, 12, 16);
  -- 17. Child's Pose (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_childs_pose, 30, 17);

END $$;
