-- Migration to add "Chest Intermediate" routine
-- Exercises include: Jumping Jacks, Knee Push-Ups, Push-Ups, Wide Arm Push-Ups, Hindu Push-Ups, Staggered Push-Ups, Decline Push-Ups, etc.
-- Includes 14 steps.

DO $$ 
DECLARE
  -- Exercise IDs
  e_jumping_jacks UUID;
  e_knee_pushups UUID;
  e_pushups UUID;
  e_wide_arm_pushups UUID;
  e_hindu_pushups UUID;
  e_staggered_pushups UUID;
  e_push_up_rotation UUID;
  e_decline_pushups UUID;
  e_shoulder_stretch UUID;
  e_cobra_stretch UUID;
  e_chest_stretch UUID;
  
  r_id UUID;
BEGIN
  -- 1. Ensure Exercises Exist and Get IDs
  
  -- Jumping Jacks
  SELECT id INTO e_jumping_jacks FROM exercises WHERE name = 'Jumping Jacks' LIMIT 1;
  IF e_jumping_jacks IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Jumping Jacks', 'Cardio') RETURNING id INTO e_jumping_jacks;
  END IF;

  -- Knee Push-Ups
  SELECT id INTO e_knee_pushups FROM exercises WHERE name = 'Knee Push-Ups' LIMIT 1;
  IF e_knee_pushups IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Knee Push-Ups', 'Strength') RETURNING id INTO e_knee_pushups;
  END IF;

  -- Push-Ups
  SELECT id INTO e_pushups FROM exercises WHERE name = 'Push-Ups' LIMIT 1;
  IF e_pushups IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Push-Ups', 'Strength') RETURNING id INTO e_pushups;
  END IF;

  -- Wide Arm Push-Ups
  SELECT id INTO e_wide_arm_pushups FROM exercises WHERE name = 'Wide Arm Push-Ups' LIMIT 1;
  IF e_wide_arm_pushups IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Wide Arm Push-Ups', 'Strength') RETURNING id INTO e_wide_arm_pushups;
  END IF;

  -- Hindu Push-Ups
  SELECT id INTO e_hindu_pushups FROM exercises WHERE name = 'Hindu Push-Ups' LIMIT 1;
  IF e_hindu_pushups IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Hindu Push-Ups', 'Strength') RETURNING id INTO e_hindu_pushups;
  END IF;

  -- Staggered Push-Ups
  SELECT id INTO e_staggered_pushups FROM exercises WHERE name = 'Staggered Push-Ups' LIMIT 1;
  IF e_staggered_pushups IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Staggered Push-Ups', 'Strength') RETURNING id INTO e_staggered_pushups;
  END IF;

  -- Push-Up & Rotation
  SELECT id INTO e_push_up_rotation FROM exercises WHERE name = 'Push-Up & Rotation' LIMIT 1;
  IF e_push_up_rotation IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Push-Up & Rotation', 'Strength') RETURNING id INTO e_push_up_rotation;
  END IF;

  -- Decline Push-Ups
  SELECT id INTO e_decline_pushups FROM exercises WHERE name = 'Decline Push-Ups' LIMIT 1;
  IF e_decline_pushups IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Decline Push-Ups', 'Strength') RETURNING id INTO e_decline_pushups;
  END IF;

  -- Shoulder Stretch
  SELECT id INTO e_shoulder_stretch FROM exercises WHERE name = 'Shoulder Stretch' LIMIT 1;
  IF e_shoulder_stretch IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Shoulder Stretch', 'Flexibility') RETURNING id INTO e_shoulder_stretch;
  END IF;

  -- Cobra Stretch
  SELECT id INTO e_cobra_stretch FROM exercises WHERE name = 'Cobra Stretch' LIMIT 1;
  IF e_cobra_stretch IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Cobra Stretch', 'Flexibility') RETURNING id INTO e_cobra_stretch;
  END IF;

  -- Chest Stretch
  SELECT id INTO e_chest_stretch FROM exercises WHERE name = 'Chest Stretch' LIMIT 1;
  IF e_chest_stretch IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Chest Stretch', 'Flexibility') RETURNING id INTO e_chest_stretch;
  END IF;


  -- 2. Upsert Routine
  SELECT id INTO r_id FROM workout_routines WHERE name = 'Chest Intermediate' LIMIT 1;
  
  IF r_id IS NULL THEN
      INSERT INTO workout_routines (name, category, level, place) 
      VALUES ('Chest Intermediate', 'Chest', 'Intermediate', 'Home') 
      RETURNING id INTO r_id;
  ELSE
      -- Update headers if needed
      UPDATE workout_routines SET category = 'Chest', level = 'Intermediate', place = 'Home' WHERE id = r_id;
      -- Clear existing links
      DELETE FROM routine_exercises WHERE routine_id = r_id;
  END IF;
  
  -- 3. Insert Routine Exercises
  
  -- 1. Jumping Jacks (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_jumping_jacks, 30, 1);
  -- 2. Knee Push-Ups (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_knee_pushups, 12, 2);
  -- 3. Push-Ups (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_pushups, 12, 3);
  -- 4. Wide Arm Push-Ups (x16)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_wide_arm_pushups, 16, 4);
  -- 5. Hindu Push-Ups (x10)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_hindu_pushups, 10, 5);
  -- 6. Staggered Push-Ups (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_staggered_pushups, 12, 6);
  -- 7. Push-Up & Rotation (x10)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_push_up_rotation, 10, 7);
  -- 8. Knee Push-Ups (x10)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_knee_pushups, 10, 8);
  -- 9. Hindu Push-Ups (x10)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_hindu_pushups, 10, 9);
  -- 10. Decline Push-Ups (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_decline_pushups, 12, 10);
  -- 11. Staggered Push-Ups (x10)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_staggered_pushups, 10, 11);
  -- 12. Shoulder Stretch (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_shoulder_stretch, 30, 12);
  -- 13. Cobra Stretch (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_cobra_stretch, 30, 13);
  -- 14. Chest Stretch (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_chest_stretch, 30, 14);

END $$;
