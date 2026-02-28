-- Migration to add "Leg Intermediate" routine
-- Exercises include: Jumping Jacks, Squats, Fire Hydrant, Lunges, Side Leg Circles, Sumo Squat, Reverse Flutter Kicks, Wall Sit, Calf Raise With Splayed Foot, Single Leg Calf Hop, etc.
-- Includes 36 steps.

DO $$ 
DECLARE
  -- Exercise IDs
  e_jumping_jacks UUID;
  e_squats UUID;
  e_fire_hydrant_left UUID;
  e_fire_hydrant_right UUID;
  e_lunges UUID;
  e_side_leg_circles_left UUID;
  e_side_leg_circles_right UUID;
  e_sumo_squat UUID;
  e_reverse_flutter_kicks UUID;
  e_wall_sit UUID;
  e_left_quad_stretch_wall UUID;
  e_right_quad_stretch_wall UUID;
  e_knee_to_chest_stretch_left UUID;
  e_knee_to_chest_stretch_right UUID;
  e_calf_raise_splayed_foot UUID;
  e_single_leg_calf_hop_left UUID;
  e_single_leg_calf_hop_right UUID;
  e_calf_stretch_left UUID;
  e_calf_stretch_right UUID;
  
  r_id UUID;
BEGIN
  -- 1. Ensure Exercises Exist and Get IDs
  
  -- Jumping Jacks
  SELECT id INTO e_jumping_jacks FROM exercises WHERE name = 'Jumping Jacks' LIMIT 1;
  IF e_jumping_jacks IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Jumping Jacks', 'Cardio') RETURNING id INTO e_jumping_jacks;
  END IF;

  -- Squats
  SELECT id INTO e_squats FROM exercises WHERE name = 'Squats' LIMIT 1;
  IF e_squats IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Squats', 'Strength') RETURNING id INTO e_squats;
  END IF;

  -- Fire Hydrant Left
  SELECT id INTO e_fire_hydrant_left FROM exercises WHERE name = 'Fire Hydrant Left' LIMIT 1;
  IF e_fire_hydrant_left IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Fire Hydrant Left', 'Strength', true) RETURNING id INTO e_fire_hydrant_left;
  END IF;

  -- Fire Hydrant Right
  SELECT id INTO e_fire_hydrant_right FROM exercises WHERE name = 'Fire Hydrant Right' LIMIT 1;
  IF e_fire_hydrant_right IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Fire Hydrant Right', 'Strength', true) RETURNING id INTO e_fire_hydrant_right;
  END IF;

  -- Lunges
  SELECT id INTO e_lunges FROM exercises WHERE name = 'Lunges' LIMIT 1;
  IF e_lunges IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Lunges', 'Strength') RETURNING id INTO e_lunges;
  END IF;

  -- Side Leg Circles Left
  SELECT id INTO e_side_leg_circles_left FROM exercises WHERE name = 'Side Leg Circles Left' LIMIT 1;
  IF e_side_leg_circles_left IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Side Leg Circles Left', 'Strength', true) RETURNING id INTO e_side_leg_circles_left;
  END IF;

  -- Side Leg Circles Right
  SELECT id INTO e_side_leg_circles_right FROM exercises WHERE name = 'Side Leg Circles Right' LIMIT 1;
  IF e_side_leg_circles_right IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Side Leg Circles Right', 'Strength', true) RETURNING id INTO e_side_leg_circles_right;
  END IF;

  -- Sumo Squat
  SELECT id INTO e_sumo_squat FROM exercises WHERE name = 'Sumo Squat' LIMIT 1;
  IF e_sumo_squat IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Sumo Squat', 'Strength') RETURNING id INTO e_sumo_squat;
  END IF;

  -- Reverse Flutter Kicks
  SELECT id INTO e_reverse_flutter_kicks FROM exercises WHERE name = 'Reverse Flutter Kicks' LIMIT 1;
  IF e_reverse_flutter_kicks IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Reverse Flutter Kicks', 'Strength') RETURNING id INTO e_reverse_flutter_kicks;
  END IF;

  -- Wall Sit
  SELECT id INTO e_wall_sit FROM exercises WHERE name = 'Wall Sit' LIMIT 1;
  IF e_wall_sit IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Wall Sit', 'Strength') RETURNING id INTO e_wall_sit;
  END IF;

  -- Left Quad Stretch With Wall
  SELECT id INTO e_left_quad_stretch_wall FROM exercises WHERE name = 'Left Quad Stretch With Wall' LIMIT 1;
  IF e_left_quad_stretch_wall IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Left Quad Stretch With Wall', 'Flexibility', true) RETURNING id INTO e_left_quad_stretch_wall;
  END IF;

  -- Right Quad Stretch With Wall
  SELECT id INTO e_right_quad_stretch_wall FROM exercises WHERE name = 'Right Quad Stretch With Wall' LIMIT 1;
  IF e_right_quad_stretch_wall IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Right Quad Stretch With Wall', 'Flexibility', true) RETURNING id INTO e_right_quad_stretch_wall;
  END IF;

  -- Knee To Chest Stretch Left
  SELECT id INTO e_knee_to_chest_stretch_left FROM exercises WHERE name = 'Knee To Chest Stretch Left' LIMIT 1;
  IF e_knee_to_chest_stretch_left IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Knee To Chest Stretch Left', 'Flexibility', true) RETURNING id INTO e_knee_to_chest_stretch_left;
  END IF;

  -- Knee To Chest Stretch Right
  SELECT id INTO e_knee_to_chest_stretch_right FROM exercises WHERE name = 'Knee To Chest Stretch Right' LIMIT 1;
  IF e_knee_to_chest_stretch_right IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Knee To Chest Stretch Right', 'Flexibility', true) RETURNING id INTO e_knee_to_chest_stretch_right;
  END IF;

  -- Calf Raise With Splayed Foot
  SELECT id INTO e_calf_raise_splayed_foot FROM exercises WHERE name = 'Calf Raise With Splayed Foot' LIMIT 1;
  IF e_calf_raise_splayed_foot IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Calf Raise With Splayed Foot', 'Strength') RETURNING id INTO e_calf_raise_splayed_foot;
  END IF;

  -- Single Leg Calf Hop Left
  SELECT id INTO e_single_leg_calf_hop_left FROM exercises WHERE name = 'Single Leg Calf Hop Left' LIMIT 1;
  IF e_single_leg_calf_hop_left IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Single Leg Calf Hop Left', 'Plyometric', true) RETURNING id INTO e_single_leg_calf_hop_left;
  END IF;

  -- Single Leg Calf Hop Right
  SELECT id INTO e_single_leg_calf_hop_right FROM exercises WHERE name = 'Single Leg Calf Hop Right' LIMIT 1;
  IF e_single_leg_calf_hop_right IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Single Leg Calf Hop Right', 'Plyometric', true) RETURNING id INTO e_single_leg_calf_hop_right;
  END IF;

  -- Calf Stretch Left
  SELECT id INTO e_calf_stretch_left FROM exercises WHERE name = 'Calf Stretch Left' LIMIT 1;
  IF e_calf_stretch_left IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Calf Stretch Left', 'Flexibility', true) RETURNING id INTO e_calf_stretch_left;
  END IF;

  -- Calf Stretch Right
  SELECT id INTO e_calf_stretch_right FROM exercises WHERE name = 'Calf Stretch Right' LIMIT 1;
  IF e_calf_stretch_right IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Calf Stretch Right', 'Flexibility', true) RETURNING id INTO e_calf_stretch_right;
  END IF;


  -- 2. Upsert Routine
  SELECT id INTO r_id FROM workout_routines WHERE name = 'Leg Intermediate' LIMIT 1;
  
  IF r_id IS NULL THEN
      INSERT INTO workout_routines (name, category, level, place) 
      VALUES ('Leg Intermediate', 'Leg', 'Intermediate', 'Home') 
      RETURNING id INTO r_id;
  ELSE
      -- Update headers if needed
      UPDATE workout_routines SET category = 'Leg', level = 'Intermediate', place = 'Home' WHERE id = r_id;
      -- Clear existing links
      DELETE FROM routine_exercises WHERE routine_id = r_id;
  END IF;
  
  -- 3. Insert Routine Exercises
  
  -- 1. Jumping Jacks (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_jumping_jacks, 30, 1);
  -- 2. Squats (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_squats, 12, 2);
  -- 3. Squats (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_squats, 12, 3);
  -- 4. Squats (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_squats, 12, 4);
  -- 5. Fire Hydrant Left (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_fire_hydrant_left, 12, 5);
  -- 6. Fire Hydrant Right (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_fire_hydrant_right, 12, 6);
  -- 7. Fire Hydrant Left (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_fire_hydrant_left, 12, 7);
  -- 8. Fire Hydrant Right (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_fire_hydrant_right, 12, 8);
  -- 9. Fire Hydrant Left (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_fire_hydrant_left, 12, 9);
  -- 10. Fire Hydrant Right (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_fire_hydrant_right, 12, 10);
  -- 11. Lunges (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_lunges, 14, 11);
  -- 12. Lunges (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_lunges, 14, 12);
  -- 13. Side Leg Circles Left (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_side_leg_circles_left, 12, 13);
  -- 14. Side Leg Circles Right (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_side_leg_circles_right, 12, 14);
  -- 15. Side Leg Circles Left (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_side_leg_circles_left, 12, 15);
  -- 16. Side Leg Circles Right (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_side_leg_circles_right, 12, 16);
  -- 17. Sumo Squat (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_sumo_squat, 12, 17);
  -- 18. Sumo Squat (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_sumo_squat, 12, 18);
  -- 19. Sumo Squat (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_sumo_squat, 12, 19);
  -- 20. Reverse Flutter Kicks (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_reverse_flutter_kicks, 12, 20);
  -- 21. Reverse Flutter Kicks (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_reverse_flutter_kicks, 12, 21);
  -- 22. Reverse Flutter Kicks (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_reverse_flutter_kicks, 12, 22);
  -- 23. Wall Sit (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_wall_sit, 30, 23);
  -- 24. Left Quad Stretch With Wall (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_left_quad_stretch_wall, 30, 24);
  -- 25. Right Quad Stretch With Wall (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_right_quad_stretch_wall, 30, 25);
  -- 26. Knee To Chest Stretch Left (30s) -- Image says "Left" but name might be "Knee To Chest Stretch Left"
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_knee_to_chest_stretch_left, 30, 26);
  -- 27. Knee To Chest Stretch Right (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_knee_to_chest_stretch_right, 30, 27);
  -- 28. Calf Raise With Splayed Foot (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_calf_raise_splayed_foot, 12, 28);
  -- 29. Calf Raise With Splayed Foot (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_calf_raise_splayed_foot, 12, 29);
  -- 30. Calf Raise With Splayed Foot (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_calf_raise_splayed_foot, 12, 30);
  -- 31. Single Leg Calf Hop Left (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_single_leg_calf_hop_left, 12, 31);
  -- 32. Single Leg Calf Hop Right (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_single_leg_calf_hop_right, 12, 32);
  -- 33. Single Leg Calf Hop Left (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_single_leg_calf_hop_left, 12, 33);
  -- 34. Single Leg Calf Hop Right (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_single_leg_calf_hop_right, 12, 34);
  -- 35. Calf Stretch Left (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_calf_stretch_left, 30, 35);
  -- 36. Calf Stretch Right (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_calf_stretch_right, 30, 36);

END $$;
