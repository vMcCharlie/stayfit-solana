-- Migration to add "Chest Advanced" routine
-- Exercises include: Jumping Jacks, Arm Circles, Burpees, Staggered Push-Ups, Hindu Push-Ups, Diamond Push-Ups, Box Push-Ups, Spiderman Push-Ups, etc.
-- Includes 16 steps.

DO $$ 
DECLARE
  -- Exercise IDs
  e_jumping_jacks UUID;
  e_arm_circles UUID;
  e_shoulder_stretch UUID;
  e_burpees UUID;
  e_staggered_pushups UUID;
  e_hindu_pushups UUID;
  e_push_up_rotation UUID;
  e_diamond_pushups UUID;
  e_box_pushups UUID;
  e_spiderman_pushups UUID;
  e_decline_pushups UUID;
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

  -- Arm Circles (Generic x20)
  SELECT id INTO e_arm_circles FROM exercises WHERE name = 'Arm Circles' LIMIT 1;
  IF e_arm_circles IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Arm Circles', 'Strength') RETURNING id INTO e_arm_circles;
  END IF;

  -- Shoulder Stretch
  SELECT id INTO e_shoulder_stretch FROM exercises WHERE name = 'Shoulder Stretch' LIMIT 1;
  IF e_shoulder_stretch IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Shoulder Stretch', 'Flexibility') RETURNING id INTO e_shoulder_stretch;
  END IF;

  -- Burpees
  SELECT id INTO e_burpees FROM exercises WHERE name = 'Burpees' LIMIT 1;
  IF e_burpees IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Burpees', 'Cardio') RETURNING id INTO e_burpees;
  END IF;

  -- Staggered Push-Ups
  SELECT id INTO e_staggered_pushups FROM exercises WHERE name = 'Staggered Push-Ups' LIMIT 1;
  IF e_staggered_pushups IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Staggered Push-Ups', 'Strength') RETURNING id INTO e_staggered_pushups;
  END IF;

  -- Hindu Push-Ups
  SELECT id INTO e_hindu_pushups FROM exercises WHERE name = 'Hindu Push-Ups' LIMIT 1;
  IF e_hindu_pushups IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Hindu Push-Ups', 'Strength') RETURNING id INTO e_hindu_pushups;
  END IF;

  -- Push-Up & Rotation
  SELECT id INTO e_push_up_rotation FROM exercises WHERE name = 'Push-Up & Rotation' LIMIT 1;
  IF e_push_up_rotation IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Push-Up & Rotation', 'Strength') RETURNING id INTO e_push_up_rotation;
  END IF;

  -- Diamond Push-Ups
  SELECT id INTO e_diamond_pushups FROM exercises WHERE name = 'Diamond Push-Ups' LIMIT 1;
  IF e_diamond_pushups IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Diamond Push-Ups', 'Strength') RETURNING id INTO e_diamond_pushups;
  END IF;

  -- Box Push-Ups
  SELECT id INTO e_box_pushups FROM exercises WHERE name = 'Box Push-Ups' LIMIT 1;
  IF e_box_pushups IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Box Push-Ups', 'Strength') RETURNING id INTO e_box_pushups;
  END IF;

  -- Spiderman Push-Ups
  SELECT id INTO e_spiderman_pushups FROM exercises WHERE name = 'Spiderman Push-Ups' LIMIT 1;
  IF e_spiderman_pushups IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Spiderman Push-Ups', 'Strength') RETURNING id INTO e_spiderman_pushups;
  END IF;

  -- Decline Push-Ups
  SELECT id INTO e_decline_pushups FROM exercises WHERE name = 'Decline Push-Ups' LIMIT 1;
  IF e_decline_pushups IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Decline Push-Ups', 'Strength') RETURNING id INTO e_decline_pushups;
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
  SELECT id INTO r_id FROM workout_routines WHERE name = 'Chest Advanced' LIMIT 1;
  
  IF r_id IS NULL THEN
      INSERT INTO workout_routines (name, category, level, place) 
      VALUES ('Chest Advanced', 'Chest', 'Advanced', 'Home') 
      RETURNING id INTO r_id;
  ELSE
      -- Update headers if needed
      UPDATE workout_routines SET category = 'Chest', level = 'Advanced', place = 'Home' WHERE id = r_id;
      -- Clear existing links
      DELETE FROM routine_exercises WHERE routine_id = r_id;
  END IF;
  
  -- 3. Insert Routine Exercises
  
  -- 1. Jumping Jacks (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_jumping_jacks, 30, 1);
  -- 2. Arm Circles (x20)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_arm_circles, 20, 2);
  -- 3. Shoulder Stretch (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_shoulder_stretch, 30, 3);
  -- 4. Burpees (x10)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_burpees, 10, 4);
  -- 5. Staggered Push-Ups (x16)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_staggered_pushups, 16, 5);
  -- 6. Hindu Push-Ups (x16)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_hindu_pushups, 16, 6);
  -- 7. Push-Up & Rotation (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_push_up_rotation, 12, 7);
  -- 8. Diamond Push-Ups (x16)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_diamond_pushups, 16, 8);
  -- 9. Box Push-Ups (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_box_pushups, 12, 9);
  -- 10. Hindu Push-Ups (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_hindu_pushups, 12, 10);
  -- 11. Spiderman Push-Ups (x20)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_spiderman_pushups, 20, 11);
  -- 12. Decline Push-Ups (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_decline_pushups, 12, 12);
  -- 13. Burpees (x10)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_burpees, 10, 13);
  -- 14. Shoulder Stretch (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_shoulder_stretch, 30, 14);
  -- 15. Cobra Stretch (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_cobra_stretch, 30, 15);
  -- 16. Chest Stretch (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_chest_stretch, 30, 16);

END $$;
