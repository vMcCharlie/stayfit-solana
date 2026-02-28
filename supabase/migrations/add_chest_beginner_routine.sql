-- Migration to add "Chest Beginner" routine
-- Exercises include: Jumping Jacks, Incline Push-Ups, Wide Arm Push-Ups, Triceps Dips, Knee Push-Ups, Cobra Stretch, Chest Stretch.
-- Includes 11 steps.

DO $$ 
DECLARE
  -- Exercise IDs
  e_jumping_jacks UUID;
  e_incline_pushups UUID;
  e_pushups UUID;
  e_wide_arm_pushups UUID;
  e_triceps_dips UUID;
  e_knee_pushups UUID;
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

  -- Incline Push-Ups
  SELECT id INTO e_incline_pushups FROM exercises WHERE name = 'Incline Push-Ups' LIMIT 1;
  IF e_incline_pushups IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Incline Push-Ups', 'Strength') RETURNING id INTO e_incline_pushups;
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

  -- Triceps Dips
  SELECT id INTO e_triceps_dips FROM exercises WHERE name = 'Triceps Dips' LIMIT 1;
  IF e_triceps_dips IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Triceps Dips', 'Strength') RETURNING id INTO e_triceps_dips;
  END IF;

  -- Knee Push-Ups
  SELECT id INTO e_knee_pushups FROM exercises WHERE name = 'Knee Push-Ups' LIMIT 1;
  IF e_knee_pushups IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Knee Push-Ups', 'Strength') RETURNING id INTO e_knee_pushups;
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
  SELECT id INTO r_id FROM workout_routines WHERE name = 'Chest Beginner' LIMIT 1;
  
  IF r_id IS NULL THEN
      INSERT INTO workout_routines (name, category, level, place) 
      VALUES ('Chest Beginner', 'Chest', 'Beginner', 'Home') 
      RETURNING id INTO r_id;
  ELSE
      -- Update headers if needed
      UPDATE workout_routines SET category = 'Chest', level = 'Beginner', place = 'Home' WHERE id = r_id;
      -- Clear existing links
      DELETE FROM routine_exercises WHERE routine_id = r_id;
  END IF;
  
  -- 3. Insert Routine Exercises
  
  -- 1. Jumping Jacks (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_jumping_jacks, 30, 1);
  -- 2. Incline Push-Ups (x10)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_incline_pushups, 10, 2);
  -- 3. Push-Ups (x8)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_pushups, 8, 3);
  -- 4. Wide Arm Push-Ups (x8)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_wide_arm_pushups, 8, 4);
  -- 5. Triceps Dips (x10)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_triceps_dips, 10, 5);
  -- 6. Wide Arm Push-Ups (x6)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_wide_arm_pushups, 6, 6);
  -- 7. Incline Push-Ups (x8)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_incline_pushups, 8, 7);
  -- 8. Triceps Dips (x8)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_triceps_dips, 8, 8);
  -- 9. Knee Push-Ups (x8)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_knee_pushups, 8, 9);
  -- 10. Cobra Stretch (20s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_cobra_stretch, 20, 10);
  -- 11. Chest Stretch (20s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_chest_stretch, 20, 11);

END $$;
