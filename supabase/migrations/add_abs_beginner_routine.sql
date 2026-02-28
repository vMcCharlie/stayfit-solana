-- Migration to add "Abs Beginner" routine extracted from image
-- Exercises include: Jumping Jacks, Crunches, Russian Twist, Mountain Climber, Heel Touch, Leg Raises, Plank, Cobra Stretch, Spine Twist
-- Includes 16 steps/sets.

DO $$ 
DECLARE
  e_jumping_jacks UUID;
  e_crunches UUID;
  e_russian_twist UUID;
  e_mountain_climber UUID;
  e_heel_touch UUID;
  e_leg_raises UUID;
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
  
  -- Abdominal Crunches
  SELECT id INTO e_crunches FROM exercises WHERE name = 'Abdominal Crunches' LIMIT 1;
  IF e_crunches IS NULL THEN
      INSERT INTO exercises (name, exercise_type) VALUES ('Abdominal Crunches', 'Strength') RETURNING id INTO e_crunches;
  END IF;

  -- Russian Twist
  SELECT id INTO e_russian_twist FROM exercises WHERE name = 'Russian Twist' LIMIT 1;
  IF e_russian_twist IS NULL THEN
      INSERT INTO exercises (name, exercise_type) VALUES ('Russian Twist', 'Strength') RETURNING id INTO e_russian_twist;
  END IF;

  -- Mountain Climber
  SELECT id INTO e_mountain_climber FROM exercises WHERE name = 'Mountain Climber' LIMIT 1;
  IF e_mountain_climber IS NULL THEN
      INSERT INTO exercises (name, exercise_type) VALUES ('Mountain Climber', 'Strength') RETURNING id INTO e_mountain_climber;
  END IF;

  -- Heel Touch
  SELECT id INTO e_heel_touch FROM exercises WHERE name = 'Heel Touch' LIMIT 1;
  IF e_heel_touch IS NULL THEN
      INSERT INTO exercises (name, exercise_type) VALUES ('Heel Touch', 'Strength') RETURNING id INTO e_heel_touch;
  END IF;

  -- Leg Raises
  SELECT id INTO e_leg_raises FROM exercises WHERE name = 'Leg Raises' LIMIT 1;
  IF e_leg_raises IS NULL THEN
      INSERT INTO exercises (name, exercise_type) VALUES ('Leg Raises', 'Strength') RETURNING id INTO e_leg_raises;
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
  SELECT id INTO r_id FROM workout_routines WHERE name = 'Abs Beginner' LIMIT 1;
  
  IF r_id IS NULL THEN
      INSERT INTO workout_routines (name, category, level, place) 
      VALUES ('Abs Beginner', 'Abs', 'Beginner', 'Home') 
      RETURNING id INTO r_id;
  ELSE
      -- Update headers if needed
      UPDATE workout_routines SET category = 'Abs', level = 'Beginner', place = 'Home' WHERE id = r_id;
      -- Clear existing links to overwrite with new structure
      DELETE FROM routine_exercises WHERE routine_id = r_id;
  END IF;
  
  -- 3. Insert Routine Exercises
  
  -- 1. Jumping Jacks (20s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_jumping_jacks, 20, 1);
  
  -- 2. Abdominal Crunches (x16)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_crunches, 16, 2);
  
  -- 3. Russian Twist (x20)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_russian_twist, 20, 3);
  
  -- 4. Mountain Climber (x16)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_mountain_climber, 16, 4);
  
  -- 5. Heel Touch (x20)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_heel_touch, 20, 5);
  
  -- 6. Leg Raises (x16)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_leg_raises, 16, 6);
  
  -- 7. Plank (20s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_plank, 20, 7);
  
  -- 8. Abdominal Crunches (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_crunches, 12, 8);
  
  -- 9. Russian Twist (x32)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_russian_twist, 32, 9);
  
  -- 10. Mountain Climber (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_mountain_climber, 12, 10);
  
  -- 11. Heel Touch (x20)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_heel_touch, 20, 11);
  
  -- 12. Leg Raises (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_leg_raises, 14, 12);
  
  -- 13. Plank (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_plank, 30, 13);
  
  -- 14. Cobra Stretch (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_cobra, 30, 14);
  
  -- 15. Spine Lumbar Twist Stretch Left (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_spine_left, 30, 15);
  
  -- 16. Spine Lumbar Twist Stretch Right (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_spine_right, 30, 16);

END $$;
