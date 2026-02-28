-- Sample Workout Data Migration
-- Run this in Supabase SQL Editor to add sample workout data

-- 1. Insert sample exercises
INSERT INTO exercises (id, name, exercise_type, avg_time_per_rep, place, equipments, instructions, is_per_side) VALUES
  -- Home Bodyweight Exercises
  ('11111111-1111-1111-1111-111111111101', 'Push-ups', 'strength', 3, 'Home', ARRAY['none'], 'Start in plank position, lower chest to ground, push back up.', false),
  ('11111111-1111-1111-1111-111111111102', 'Squats', 'strength', 4, 'Home', ARRAY['none'], 'Stand with feet shoulder-width apart, lower hips back and down.', false),
  ('11111111-1111-1111-1111-111111111103', 'Plank', 'core', 30, 'Home', ARRAY['none'], 'Hold body in straight line from head to heels.', false),
  ('11111111-1111-1111-1111-111111111104', 'Lunges', 'strength', 4, 'Home', ARRAY['none'], 'Step forward, lower back knee toward ground.', true),
  ('11111111-1111-1111-1111-111111111105', 'Mountain Climbers', 'cardio', 2, 'Home', ARRAY['none'], 'In plank position, alternate driving knees to chest.', false),
  ('11111111-1111-1111-1111-111111111106', 'Burpees', 'cardio', 6, 'Home', ARRAY['none'], 'Squat, jump feet back to plank, push-up, jump feet forward, jump up.', false),
  ('11111111-1111-1111-1111-111111111107', 'Jumping Jacks', 'cardio', 2, 'Home', ARRAY['none'], 'Jump while spreading legs and arms, return to start.', false),
  ('11111111-1111-1111-1111-111111111108', 'High Knees', 'cardio', 2, 'Home', ARRAY['none'], 'Run in place bringing knees high toward chest.', false),
  ('11111111-1111-1111-1111-111111111109', 'Tricep Dips', 'strength', 4, 'Home', ARRAY['chair'], 'Use chair to lower and raise body using triceps.', false),
  ('11111111-1111-1111-1111-111111111110', 'Bicycle Crunches', 'core', 3, 'Home', ARRAY['none'], 'Lie on back, alternate touching elbow to opposite knee.', false),
  -- Gym Exercises
  ('11111111-1111-1111-1111-111111111201', 'Bench Press', 'strength', 4, 'Gym', ARRAY['barbell', 'bench'], 'Lie on bench, lower bar to chest, press up.', false),
  ('11111111-1111-1111-1111-111111111202', 'Deadlift', 'strength', 5, 'Gym', ARRAY['barbell'], 'Lift barbell from ground while keeping back straight.', false),
  ('11111111-1111-1111-1111-111111111203', 'Lat Pulldown', 'strength', 4, 'Gym', ARRAY['cable machine'], 'Pull bar down to chest, squeeze shoulder blades.', false),
  ('11111111-1111-1111-1111-111111111204', 'Leg Press', 'strength', 4, 'Gym', ARRAY['leg press machine'], 'Push platform away with legs, control return.', false),
  ('11111111-1111-1111-1111-111111111205', 'Cable Rows', 'strength', 4, 'Gym', ARRAY['cable machine'], 'Pull cable toward waist, squeeze back muscles.', false),
  ('11111111-1111-1111-1111-111111111206', 'Shoulder Press', 'strength', 4, 'Gym', ARRAY['dumbbells'], 'Press dumbbells overhead from shoulder level.', false),
  ('11111111-1111-1111-1111-111111111207', 'Bicep Curls', 'strength', 3, 'Gym', ARRAY['dumbbells'], 'Curl weight toward shoulder, squeeze bicep.', false),
  ('11111111-1111-1111-1111-111111111208', 'Leg Curls', 'strength', 3, 'Gym', ARRAY['leg curl machine'], 'Curl weight by bending knees on machine.', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert sample workout routines (names contain level info for index.tsx parsing)
INSERT INTO workout_routines (id, name, created_by, image_url) VALUES
  -- Beginner Routines
  ('22222222-2222-2222-2222-222222222201', 'Beginner Full Body Home Workout', NULL, NULL),
  ('22222222-2222-2222-2222-222222222202', 'Beginner Abs Home Workout', NULL, NULL),
  ('22222222-2222-2222-2222-222222222203', 'Beginner Gym Full Body', NULL, NULL),
  -- Intermediate Routines
  ('22222222-2222-2222-2222-222222222204', 'Intermediate Upper Body Home', NULL, NULL),
  ('22222222-2222-2222-2222-222222222205', 'Intermediate Full Body Gym Workout', NULL, NULL),
  ('22222222-2222-2222-2222-222222222206', 'Intermediate Cardio HIIT', NULL, NULL),
  -- Advanced Routines
  ('22222222-2222-2222-2222-222222222207', 'Advanced Full Body Home Challenge', NULL, NULL),
  ('22222222-2222-2222-2222-222222222208', 'Advanced Upper Body Gym Power', NULL, NULL),
  ('22222222-2222-2222-2222-222222222209', 'Advanced Lower Body Gym Power', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- 3. Link exercises to routines via routine_exercises

-- Beginner Full Body Home Workout (Push-ups, Squats, Plank, Lunges)
INSERT INTO routine_exercises (routine_id, exercise_id, reps, duration, order_position) VALUES
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 10, NULL, 1),
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111102', 15, NULL, 2),
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111103', NULL, 30, 3),
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111104', 10, NULL, 4)
ON CONFLICT DO NOTHING;

-- Beginner Abs Home Workout (Plank, Bicycle Crunches, Mountain Climbers)
INSERT INTO routine_exercises (routine_id, exercise_id, reps, duration, order_position) VALUES
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111103', NULL, 30, 1),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111110', 20, NULL, 2),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111105', 20, NULL, 3)
ON CONFLICT DO NOTHING;

-- Beginner Gym Full Body (Bench Press, Lat Pulldown, Leg Press)
INSERT INTO routine_exercises (routine_id, exercise_id, reps, duration, order_position) VALUES
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111201', 10, NULL, 1),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111203', 10, NULL, 2),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111204', 12, NULL, 3)
ON CONFLICT DO NOTHING;

-- Intermediate Upper Body Home (Push-ups, Tricep Dips, Burpees)
INSERT INTO routine_exercises (routine_id, exercise_id, reps, duration, order_position) VALUES
  ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111101', 15, NULL, 1),
  ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111109', 12, NULL, 2),
  ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111106', 10, NULL, 3)
ON CONFLICT DO NOTHING;

-- Intermediate Full Body Gym (Bench, Deadlift, Rows, Shoulder Press)
INSERT INTO routine_exercises (routine_id, exercise_id, reps, duration, order_position) VALUES
  ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111201', 12, NULL, 1),
  ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111202', 8, NULL, 2),
  ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111205', 12, NULL, 3),
  ('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111206', 10, NULL, 4)
ON CONFLICT DO NOTHING;

-- Intermediate Cardio HIIT (Burpees, Mountain Climbers, Jumping Jacks, High Knees)
INSERT INTO routine_exercises (routine_id, exercise_id, reps, duration, order_position) VALUES
  ('22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111106', 10, NULL, 1),
  ('22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111105', 30, NULL, 2),
  ('22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111107', 30, NULL, 3),
  ('22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111108', NULL, 30, 4)
ON CONFLICT DO NOTHING;

-- Advanced Full Body Home Challenge (Push-ups, Burpees, Squats, Mountain Climbers, Plank)
INSERT INTO routine_exercises (routine_id, exercise_id, reps, duration, order_position) VALUES
  ('22222222-2222-2222-2222-222222222207', '11111111-1111-1111-1111-111111111101', 25, NULL, 1),
  ('22222222-2222-2222-2222-222222222207', '11111111-1111-1111-1111-111111111106', 15, NULL, 2),
  ('22222222-2222-2222-2222-222222222207', '11111111-1111-1111-1111-111111111102', 25, NULL, 3),
  ('22222222-2222-2222-2222-222222222207', '11111111-1111-1111-1111-111111111105', 40, NULL, 4),
  ('22222222-2222-2222-2222-222222222207', '11111111-1111-1111-1111-111111111103', NULL, 60, 5)
ON CONFLICT DO NOTHING;

-- Advanced Upper Body Gym Power (Bench, Shoulder Press, Rows, Bicep Curls)
INSERT INTO routine_exercises (routine_id, exercise_id, reps, duration, order_position) VALUES
  ('22222222-2222-2222-2222-222222222208', '11111111-1111-1111-1111-111111111201', 8, NULL, 1),
  ('22222222-2222-2222-2222-222222222208', '11111111-1111-1111-1111-111111111206', 10, NULL, 2),
  ('22222222-2222-2222-2222-222222222208', '11111111-1111-1111-1111-111111111205', 10, NULL, 3),
  ('22222222-2222-2222-2222-222222222208', '11111111-1111-1111-1111-111111111207', 12, NULL, 4)
ON CONFLICT DO NOTHING;

-- Advanced Lower Body Gym Power (Deadlift, Leg Press, Leg Curls, Squats)
INSERT INTO routine_exercises (routine_id, exercise_id, reps, duration, order_position) VALUES
  ('22222222-2222-2222-2222-222222222209', '11111111-1111-1111-1111-111111111202', 6, NULL, 1),
  ('22222222-2222-2222-2222-222222222209', '11111111-1111-1111-1111-111111111204', 12, NULL, 2),
  ('22222222-2222-2222-2222-222222222209', '11111111-1111-1111-1111-111111111208', 12, NULL, 3),
  ('22222222-2222-2222-2222-222222222209', '11111111-1111-1111-1111-111111111102', 20, NULL, 4)
ON CONFLICT DO NOTHING;
