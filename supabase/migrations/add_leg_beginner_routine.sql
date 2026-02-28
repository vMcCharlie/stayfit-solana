-- Migration to add "Leg Beginner" routine
-- Exercises include: Side Hop, Squats, Side-Lying Leg Lift L/R, Backward Lunge, Donkey Kicks L/R, etc.
-- Includes 23 steps.

DO $$ 
DECLARE
  -- Exercise IDs
  e_side_hop UUID;
  e_squats UUID;
  e_side_lying_leg_lift_left UUID;
  e_side_lying_leg_lift_right UUID;
  e_backward_lunge UUID;
  e_donkey_kicks_left UUID;
  e_donkey_kicks_right UUID;
  e_left_quad_stretch_wall UUID;
  e_right_quad_stretch_wall UUID;
  e_knee_to_chest_stretch_left UUID;
  e_knee_to_chest_stretch_right UUID;
  e_wall_calf_raises UUID;
  e_sumo_squat_calf_raises_wall UUID;
  e_calf_stretch_left UUID;
  e_calf_stretch_right UUID;
  
  r_id UUID;
BEGIN
  -- 1. Ensure Exercises Exist and Get IDs
  
  -- Side Hop
  SELECT id INTO e_side_hop FROM exercises WHERE name = 'Side Hop' LIMIT 1;
  IF e_side_hop IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Side Hop', 'Cardio') RETURNING id INTO e_side_hop;
  END IF;

  -- Squats
  SELECT id INTO e_squats FROM exercises WHERE name = 'Squats' LIMIT 1;
  IF e_squats IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Squats', 'Strength') RETURNING id INTO e_squats;
  END IF;

  -- Side-Lying Leg Lift Left
  SELECT id INTO e_side_lying_leg_lift_left FROM exercises WHERE name = 'Side-Lying Leg Lift Left' LIMIT 1;
  IF e_side_lying_leg_lift_left IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Side-Lying Leg Lift Left', 'Strength', true) RETURNING id INTO e_side_lying_leg_lift_left;
  END IF;

  -- Side-Lying Leg Lift Right
  SELECT id INTO e_side_lying_leg_lift_right FROM exercises WHERE name = 'Side-Lying Leg Lift Right' LIMIT 1;
  IF e_side_lying_leg_lift_right IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Side-Lying Leg Lift Right', 'Strength', true) RETURNING id INTO e_side_lying_leg_lift_right;
  END IF;

  -- Backward Lunge
  SELECT id INTO e_backward_lunge FROM exercises WHERE name = 'Backward Lunge' LIMIT 1;
  IF e_backward_lunge IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Backward Lunge', 'Strength') RETURNING id INTO e_backward_lunge;
  END IF;

  -- Donkey Kicks Left
  SELECT id INTO e_donkey_kicks_left FROM exercises WHERE name = 'Donkey Kicks Left' LIMIT 1;
  IF e_donkey_kicks_left IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Donkey Kicks Left', 'Strength', true) RETURNING id INTO e_donkey_kicks_left;
  END IF;

  -- Donkey Kicks Right
  SELECT id INTO e_donkey_kicks_right FROM exercises WHERE name = 'Donkey Kicks Right' LIMIT 1;
  IF e_donkey_kicks_right IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Donkey Kicks Right', 'Strength', true) RETURNING id INTO e_donkey_kicks_right;
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

  -- Wall Calf Raises
  SELECT id INTO e_wall_calf_raises FROM exercises WHERE name = 'Wall Calf Raises' LIMIT 1;
  IF e_wall_calf_raises IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Wall Calf Raises', 'Strength') RETURNING id INTO e_wall_calf_raises;
  END IF;

  -- Sumo Squat Calf Raises With Wall
  SELECT id INTO e_sumo_squat_calf_raises_wall FROM exercises WHERE name = 'Sumo Squat Calf Raises With Wall' LIMIT 1;
  IF e_sumo_squat_calf_raises_wall IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Sumo Squat Calf Raises With Wall', 'Strength') RETURNING id INTO e_sumo_squat_calf_raises_wall;
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
  SELECT id INTO r_id FROM workout_routines WHERE name = 'Leg Beginner' LIMIT 1;
  
  IF r_id IS NULL THEN
      INSERT INTO workout_routines (name, category, level, place) 
      VALUES ('Leg Beginner', 'Leg', 'Beginner', 'Home') 
      RETURNING id INTO r_id;
  ELSE
      -- Update headers if needed
      UPDATE workout_routines SET category = 'Leg', level = 'Beginner', place = 'Home' WHERE id = r_id;
      -- Clear existing links
      DELETE FROM routine_exercises WHERE routine_id = r_id;
  END IF;
  
  -- 3. Insert Routine Exercises
  
  -- 1. Side Hop (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_side_hop, 30, 1);
  -- 2. Squats (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_squats, 12, 2);
  -- 3. Squats (x12) -- Appears twice in the image list? Yes, items 2 and 3.
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_squats, 12, 3);
  -- 4. Side-Lying Leg Lift Left (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_side_lying_leg_lift_left, 12, 4);
  -- 5. Side-Lying Leg Lift Right (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_side_lying_leg_lift_right, 12, 5);
  -- 6. Side-Lying Leg Lift Left (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_side_lying_leg_lift_left, 12, 6);
  -- 7. Side-Lying Leg Lift Right (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_side_lying_leg_lift_right, 12, 7);
  -- 8. Backward Lunge (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_backward_lunge, 14, 8);
  -- 9. Backward Lunge (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_backward_lunge, 14, 9);
  -- 10. Donkey Kicks Left (x16)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_donkey_kicks_left, 16, 10);
  -- 11. Donkey Kicks Right (x16)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_donkey_kicks_right, 16, 11);
  -- 12. Donkey Kicks Left (x16)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_donkey_kicks_left, 16, 12);
  -- 13. Donkey Kicks Right (x16)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_donkey_kicks_right, 16, 13);
  -- 14. Left Quad Stretch With Wall (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_left_quad_stretch_wall, 30, 14);
  -- 15. Right Quad Stretch With Wall (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_right_quad_stretch_wall, 30, 15);
  -- 16. Knee To Chest Stretch Left (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_knee_to_chest_stretch_left, 30, 16);
  -- 17. Knee To Chest Stretch Right (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_knee_to_chest_stretch_right, 30, 17);
  -- 18. Wall Calf Raises (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_wall_calf_raises, 12, 18);
  -- 19. Wall Calf Raises (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_wall_calf_raises, 12, 19);
  -- 20. Sumo Squat Calf Raises With Wall (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_sumo_squat_calf_raises_wall, 12, 20);
  -- 21. Sumo Squat Calf Raises With Wall (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_sumo_squat_calf_raises_wall, 12, 21);
  -- 22. Calf Stretch Left (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_calf_stretch_left, 30, 22);
  -- 23. Calf Stretch Right (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_calf_stretch_right, 30, 23);

END $$;
