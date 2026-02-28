-- Migration to add "Leg Advanced" routine
-- Exercises include: Burpees, Squats, Bottom Leg Lift, Curtsy Lunges, Side Leg Circles, Jumping Squats, Glute Kick Back, etc.
-- Includes 43 steps.

DO $$ 
DECLARE
  -- Exercise IDs
  e_burpees UUID;
  e_squats UUID;
  e_bottom_leg_lift_left UUID;
  e_bottom_leg_lift_right UUID;
  e_curtsy_lunges UUID;
  e_side_leg_circles_left UUID;
  e_side_leg_circles_right UUID;
  e_jumping_squats UUID;
  e_glute_kick_back_left UUID;
  e_glute_kick_back_right UUID;
  e_wall_sit UUID;
  e_left_quad_stretch_wall UUID;
  e_right_quad_stretch_wall UUID;
  e_lying_butterfly_stretch UUID;
  e_leaning_stretcher_raises UUID;
  e_wall_resisting_calf_raise_left UUID;
  e_wall_resisting_calf_raise_right UUID;
  e_calf_stretch_left UUID;
  e_calf_stretch_right UUID;
  
  r_id UUID;
BEGIN
  -- 1. Ensure Exercises Exist and Get IDs
  
  -- Burpees
  SELECT id INTO e_burpees FROM exercises WHERE name = 'Burpees' LIMIT 1;
  IF e_burpees IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Burpees', 'Cardio') RETURNING id INTO e_burpees;
  END IF;

  -- Squats
  SELECT id INTO e_squats FROM exercises WHERE name = 'Squats' LIMIT 1;
  IF e_squats IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Squats', 'Strength') RETURNING id INTO e_squats;
  END IF;

  -- Bottom Leg Lift Left
  SELECT id INTO e_bottom_leg_lift_left FROM exercises WHERE name = 'Bottom Leg Lift Left' LIMIT 1;
  IF e_bottom_leg_lift_left IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Bottom Leg Lift Left', 'Strength', true) RETURNING id INTO e_bottom_leg_lift_left;
  END IF;

  -- Bottom Leg Lift Right
  SELECT id INTO e_bottom_leg_lift_right FROM exercises WHERE name = 'Bottom Leg Lift Right' LIMIT 1;
  IF e_bottom_leg_lift_right IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Bottom Leg Lift Right', 'Strength', true) RETURNING id INTO e_bottom_leg_lift_right;
  END IF;

  -- Curtsy Lunges
  SELECT id INTO e_curtsy_lunges FROM exercises WHERE name = 'Curtsy Lunges' LIMIT 1;
  IF e_curtsy_lunges IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Curtsy Lunges', 'Strength') RETURNING id INTO e_curtsy_lunges;
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

  -- Jumping Squats
  SELECT id INTO e_jumping_squats FROM exercises WHERE name = 'Jumping Squats' LIMIT 1;
  IF e_jumping_squats IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Jumping Squats', 'Plyometric') RETURNING id INTO e_jumping_squats;
  END IF;

  -- Glute Kick Back Left
  SELECT id INTO e_glute_kick_back_left FROM exercises WHERE name = 'Glute Kick Back Left' LIMIT 1;
  IF e_glute_kick_back_left IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Glute Kick Back Left', 'Strength', true) RETURNING id INTO e_glute_kick_back_left;
  END IF;

  -- Glute Kick Back Right
  SELECT id INTO e_glute_kick_back_right FROM exercises WHERE name = 'Glute Kick Back Right' LIMIT 1;
  IF e_glute_kick_back_right IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Glute Kick Back Right', 'Strength', true) RETURNING id INTO e_glute_kick_back_right;
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

  -- Lying Butterfly Stretch
  SELECT id INTO e_lying_butterfly_stretch FROM exercises WHERE name = 'Lying Butterfly Stretch' LIMIT 1;
  IF e_lying_butterfly_stretch IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Lying Butterfly Stretch', 'Flexibility') RETURNING id INTO e_lying_butterfly_stretch;
  END IF;

  -- Leaning Stretcher Raises
  SELECT id INTO e_leaning_stretcher_raises FROM exercises WHERE name = 'Leaning Stretcher Raises' LIMIT 1;
  IF e_leaning_stretcher_raises IS NULL THEN
    INSERT INTO exercises (name, exercise_type) VALUES ('Leaning Stretcher Raises', 'Unknown') RETURNING id INTO e_leaning_stretcher_raises;
  END IF;

  -- Wall Resisting Single Leg Calf Raise Left
  SELECT id INTO e_wall_resisting_calf_raise_left FROM exercises WHERE name = 'Wall Resisting Single Leg Calf Raise Left' LIMIT 1;
  IF e_wall_resisting_calf_raise_left IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Wall Resisting Single Leg Calf Raise Left', 'Strength', true) RETURNING id INTO e_wall_resisting_calf_raise_left;
  END IF;

  -- Wall Resisting Single Leg Calf Raise Right
  SELECT id INTO e_wall_resisting_calf_raise_right FROM exercises WHERE name = 'Wall Resisting Single Leg Calf Raise Right' LIMIT 1;
  IF e_wall_resisting_calf_raise_right IS NULL THEN
    INSERT INTO exercises (name, exercise_type, is_per_side) VALUES ('Wall Resisting Single Leg Calf Raise Right', 'Strength', true) RETURNING id INTO e_wall_resisting_calf_raise_right;
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
  SELECT id INTO r_id FROM workout_routines WHERE name = 'Leg Advanced' LIMIT 1;
  
  IF r_id IS NULL THEN
      INSERT INTO workout_routines (name, category, level, place) 
      VALUES ('Leg Advanced', 'Leg', 'Advanced', 'Home') 
      RETURNING id INTO r_id;
  ELSE
      -- Update headers if needed
      UPDATE workout_routines SET category = 'Leg', level = 'Advanced', place = 'Home' WHERE id = r_id;
      -- Clear existing links
      DELETE FROM routine_exercises WHERE routine_id = r_id;
  END IF;
  
  -- 3. Insert Routine Exercises
  
  -- 1. Burpees (x8)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_burpees, 8, 1);
  -- 2. Squats (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_squats, 14, 2);
  -- 3. Squats (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_squats, 14, 3);
  -- 4. Squats (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_squats, 14, 4);
  -- 5. Bottom Leg Lift Left (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_bottom_leg_lift_left, 12, 5);
  -- 6. Bottom Leg Lift Right (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_bottom_leg_lift_right, 12, 6);
  -- 7. Bottom Leg Lift Left (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_bottom_leg_lift_left, 12, 7);
  -- 8. Bottom Leg Lift Right (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_bottom_leg_lift_right, 12, 8);
  -- 9. Bottom Leg Lift Left (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_bottom_leg_lift_left, 12, 9);
  -- 10. Bottom Leg Lift Right (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_bottom_leg_lift_right, 12, 10);
  -- 11. Curtsy Lunges (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_curtsy_lunges, 14, 11);
  -- 12. Curtsy Lunges (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_curtsy_lunges, 14, 12);
  -- 13. Curtsy Lunges (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_curtsy_lunges, 14, 13);
  -- 14. Side Leg Circles Left (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_side_leg_circles_left, 12, 14);
  -- 15. Side Leg Circles Right (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_side_leg_circles_right, 12, 15);
  -- 16. Side Leg Circles Left (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_side_leg_circles_left, 12, 16);
  -- 17. Side Leg Circles Right (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_side_leg_circles_right, 12, 17);
  -- 18. Side Leg Circles Left (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_side_leg_circles_left, 12, 18);
  -- 19. Side Leg Circles Right (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_side_leg_circles_right, 12, 19);
  -- 20. Jumping Squats (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_jumping_squats, 14, 20);
  -- 21. Jumping Squats (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_jumping_squats, 14, 21);
  -- 22. Jumping Squats (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_jumping_squats, 14, 22);
  -- 23. Glute Kick Back Left (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_glute_kick_back_left, 12, 23);
  -- 24. Glute Kick Back Right (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_glute_kick_back_right, 12, 24);
  -- 25. Glute Kick Back Left (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_glute_kick_back_left, 12, 25);
  -- 26. Glute Kick Back Right (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_glute_kick_back_right, 12, 26);
  -- 27. Glute Kick Back Left (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_glute_kick_back_left, 12, 27);
  -- 28. Glute Kick Back Right (x12)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_glute_kick_back_right, 12, 28);
  -- 29. Wall Sit (40s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_wall_sit, 40, 29);
  -- 30. Left Quad Stretch With Wall (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_left_quad_stretch_wall, 30, 30);
  -- 31. Right Quad Stretch With Wall (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_right_quad_stretch_wall, 30, 31);
  -- 32. Lying Butterfly Stretch (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_lying_butterfly_stretch, 30, 32);
  -- 33. Leaning Stretcher Raises (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_leaning_stretcher_raises, 14, 33);
  -- 34. Leaning Stretcher Raises (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_leaning_stretcher_raises, 14, 34);
  -- 35. Leaning Stretcher Raises (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_leaning_stretcher_raises, 14, 35);
  -- 36. Wall Resisting Single Leg Calf Raise Left (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_wall_resisting_calf_raise_left, 14, 36);
  -- 37. Wall Resisting Single Leg Calf Raise Right (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_wall_resisting_calf_raise_right, 14, 37);
  -- 38. Wall Resisting Single Leg Calf Raise Left (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_wall_resisting_calf_raise_left, 14, 38);
  -- 39. Wall Resisting Single Leg Calf Raise Right (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_wall_resisting_calf_raise_right, 14, 39);
  -- 40. Wall Resisting Single Leg Calf Raise Left (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_wall_resisting_calf_raise_left, 14, 40);
  -- 41. Wall Resisting Single Leg Calf Raise Right (x14)
  INSERT INTO routine_exercises (routine_id, exercise_id, reps, order_position) VALUES (r_id, e_wall_resisting_calf_raise_right, 14, 41);
  -- 42. Calf Stretch Left (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_calf_stretch_left, 30, 42);
  -- 43. Calf Stretch Right (30s)
  INSERT INTO routine_exercises (routine_id, exercise_id, duration, order_position) VALUES (r_id, e_calf_stretch_right, 30, 43);

END $$;
