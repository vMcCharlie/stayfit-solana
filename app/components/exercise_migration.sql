-- Exercise Migration SQL for Supabase
-- This script will populate the exercises, exercise_focus_areas, exercise_mistakes, and exercise_tips tables

-- Function to safely handle parsing and inserting exercise data
CREATE OR REPLACE FUNCTION import_exercise_data() RETURNS void AS $$
DECLARE
    exercise_row RECORD;
    exercise_id UUID;
    focus_areas TEXT[];
    focus_area TEXT;
    area_name TEXT;
    area_weightage INTEGER;
    mistakes TEXT[];
    mistake TEXT;
    mistake_title TEXT;
    mistake_subtitle TEXT;
    tips TEXT[];
    tip TEXT;
    places TEXT[];
    place TEXT;
    equipment_array TEXT[];
    avg_time_secs INTEGER;
BEGIN
    -- Clean up exercises
    -- For production, you may want to keep existing exercises. For this example, we're starting fresh.
    DELETE FROM exercise_focus_areas;
    DELETE FROM exercise_mistakes;
    DELETE FROM exercise_tips;
    DELETE FROM exercises;

    -- Sample exercise data - replace with your actual data
    FOR exercise_row IN (
        SELECT 
            'Push-Up' AS name,
            'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000&auto=format&fit=crop' AS image,
            'reps' AS type,
            2.0 AS avg_time_per_rep,
            'Start in a plank position with hands under shoulders. Lower your body until your chest nearly touches the floor, then push back up.' AS instructions,
            'chest:60; shoulders:20; triceps:20' AS focus_area,
            'Sagging hips: Keep your body in a straight line.' AS common_mistakes,
            'Engage your core throughout the movement.' AS tips,
            'home; gym' AS place,
            'none' AS equipments
        UNION ALL SELECT 
            'Plank',
            'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000&auto=format&fit=crop',
            'duration',
            60.0,
            'Lie face down, then lift your body onto your toes and forearms, keeping your body straight. Hold this position.',
            'core:100',
            'Dropping hips: Maintain a straight line from head to heels.',
            'Focus on breathing steadily.',
            'home; gym',
            'none'
        UNION ALL SELECT 
            'Squat',
            'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?q=80&w=1000&auto=format&fit=crop',
            'reps',
            3.0,
            'Stand with feet shoulder-width apart. Lower your body by bending knees and hips, keeping your back straight, then return to standing.',
            'quadriceps:50; glutes:30; hamstrings:20',
            'Knees caving in: Keep knees aligned with toes.',
            'Keep your weight on your heels.',
            'home; gym',
            'none'
        UNION ALL SELECT 
            'Lunges',
            'https://images.unsplash.com/photo-1574680178050-55c6a6a96e0a?q=80&w=1000&auto=format&fit=crop',
            'reps',
            4.0,
            'Step forward with one leg and lower your hips until both knees are bent at about 90 degrees. Push back to the starting position.',
            'quadriceps:40; glutes:40; hamstrings:20',
            'Front knee extending past toes: Keep knee above ankle.',
            'Engage your core for balance.',
            'home; gym',
            'none'
        UNION ALL SELECT 
            'Deadlift',
            'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000&auto=format&fit=crop',
            'reps',
            4.0,
            'Stand with feet hip-width apart. Bend at hips and knees to grip the barbell. Lift by straightening hips and knees, keeping the bar close to your body.',
            'hamstrings:40; glutes:40; lower back:20',
            'Rounding back: Keep spine neutral.',
            'Engage your core before lifting.',
            'gym',
            'barbell'
        UNION ALL SELECT 
            'Bench Press',
            'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1000&auto=format&fit=crop',
            'reps',
            3.0,
            'Lie on a bench with feet flat on the floor. Grip the barbell slightly wider than shoulder-width. Lower the bar to your chest, then press it back up.',
            'chest:60; triceps:30; shoulders:10',
            'Bouncing bar off chest: Lower with control.',
            'Keep wrists straight.',
            'gym',
            'barbell; bench'
        UNION ALL SELECT 
            'Pull-Up',
            'https://images.unsplash.com/photo-1598971639058-a9a3a1c3a2a1?q=80&w=1000&auto=format&fit=crop',
            'reps',
            3.0,
            'Hang from a bar with palms facing away. Pull your body up until your chin is above the bar, then lower back down.',
            'back:60; biceps:30; shoulders:10',
            'Using momentum: Perform controlled movements.',
            'Engage your scapulae at the start.',
            'gym',
            'pull-up bar'
        UNION ALL SELECT 
            'Bicep Curl',
            'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop',
            'reps',
            2.5,
            'Stand with a dumbbell in each hand, palms facing forward. Curl the weights while keeping upper arms stationary, then lower.',
            'biceps:100',
            'Swinging weights: Keep elbows stationary.',
            'Control the movement both up and down.',
            'home; gym',
            'dumbbells'
        UNION ALL SELECT 
            'Tricep Dip',
            'https://images.unsplash.com/photo-1598971639058-d79c9972a3a1?q=80&w=1000&auto=format&fit=crop',
            'reps',
            3.0,
            'Sit on the edge of a bench. Place hands next to hips, slide hips off, and lower body by bending elbows. Push back up.',
            'triceps:100',
            'Shoulders hunching: Keep shoulders down.',
            'Keep elbows pointing back.',
            'home; gym',
            'bench'
        UNION ALL SELECT 
            'Shoulder Press',
            'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=1000&auto=format&fit=crop',
            'reps',
            3.0,
            'Hold dumbbells at shoulder height with palms facing forward. Press the weights overhead until arms are straight, then lower.',
            'shoulders:100',
            'Arching back: Engage core to stabilize.',
            'Don''t lock elbows at the top.',
            'home; gym',
            'dumbbells'
        UNION ALL SELECT 
            'Leg Press',
            'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?q=80&w=1000&auto=format&fit=crop',
            'reps',
            3.0,
            'Sit on the leg press machine with feet shoulder-width apart on the platform. Push the platform away by extending your knees.',
            'quadriceps:50; glutes:30; hamstrings:20',
            'Locking knees: Keep a slight bend.',
            'Don''t let knees cave in.',
            'gym',
            'leg press machine'
        UNION ALL SELECT 
            'Calf Raise',
            'https://images.unsplash.com/photo-1596357395217-80de13130e92?q=80&w=1000&auto=format&fit=crop',
            'reps',
            2.0,
            'Stand upright. Push through the balls of your feet to raise your body upward, then lower back down.',
            'calves:100',
            'Rolling ankles: Keep movement controlled.',
            'Hold the top position briefly.',
            'home; gym',
            'none'
        UNION ALL SELECT 
            'Russian Twist',
            'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=1000&auto=format&fit=crop',
            'reps',
            2.5,
            'Sit on the floor with knees bent. Lean back slightly and twist your torso to the right, then to the left.',
            'obliques:100',
            'Using momentum: Move deliberately.',
            'Keep spine neutral.',
            'home; gym',
            'none'
        UNION ALL SELECT 
            'Mountain Climbers',
            'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?q=80&w=1000&auto=format&fit=crop',
            'reps',
            1.0,
            'Start in a plank position. Quickly draw one knee to your chest, then switch legs, continuing in a running motion.',
            'core:50; shoulders:25; legs:25',
            'Hips rising: Keep body in a straight line.',
            'Maintain a steady rhythm.',
            'home; gym',
            'none'
        UNION ALL SELECT 
            'Burpee',
            'https://images.unsplash.com/photo-1593476123561-9516f2097158?q=80&w=1000&auto=format&fit=crop',
            'reps',
            3.0,
            'From standing, drop into a squat with hands on the ground. Kick feet back into a plank, return to squat, then jump up.',
            'full body:100',
            'Skipping steps: Perform each movement fully.',
            'Land softly to protect joints.',
            'home; gym',
            'none'
        UNION ALL SELECT 
            'Leg Curl',
            'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000&auto=format&fit=crop',
            'reps',
            3.0,
            'Lie face down on the leg curl machine. Curl your legs toward your buttocks by bending your knees, then lower.',
            'hamstrings:100',
            'Lifting hips: Keep hips down.',
            'Adjust machine to fit your body.',
            'gym',
            'leg curl machine'
        UNION ALL SELECT 
            'Lat Pulldown',
            'https://images.unsplash.com/photo-1598266663439-2056e6900339?q=80&w=1000&auto=format&fit=crop',
            'reps',
            3.0,
            'Sit at a lat pulldown machine. Grip the bar wider than shoulder-width and pull it down to your upper chest, then release.',
            'back:70; biceps:30',
            'Leaning back: Keep torso upright.',
            'Control the bar''s ascent.',
            'gym',
            'lat pulldown machine'
        UNION ALL SELECT 
            'Chest Fly',
            'https://images.unsplash.com/photo-1529516548873-9ce57c8f155e?q=80&w=1000&auto=format&fit=crop',
            'reps',
            3.0,
            'Lie on a bench with dumbbells in each hand, arms extended above chest. Lower arms out to sides, then bring back together.',
            'chest:100',
            'Overstretching: Stop at shoulder level.',
            'Keep a slight bend in elbows.',
            'gym',
            'dumbbells; bench'
        UNION ALL SELECT 
            'Seated Row',
            'https://images.unsplash.com/photo-1544216717-3bbf52512659?q=80&w=1000&auto=format&fit=crop',
            'reps',
            3.0,
            'Sit at a rowing machine with feet secured. Pull the handle toward your waist while keeping your back straight, then extend arms.',
            'back:70; biceps:30',
            'Rounding shoulders: Keep chest open.',
            'Avoid leaning too far back.',
            'gym',
            'row machine'
        UNION ALL SELECT 
            'Step-Up',
            'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?q=80&w=1000&auto=format&fit=crop',
            'reps',
            3.0,
            'Stand in front of a bench. Step onto the bench with one foot, press through the heel to lift your body up, then step down.',
            'quadriceps:50; glutes:30; hamstrings:20',
            'Pushing off lower leg: Use leading leg.',
            'Keep torso upright.',
            'home; gym',
            'bench'
        UNION ALL SELECT 
            'Romanian Deadlift',
            'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?q=80&w=1000&auto=format&fit=crop',
            'reps',
            3.0,
            'Hold a barbell with an overhand grip. Hinge at hips to lower the bar down the front of your legs, then return upright.',
            'hamstrings:60; glutes:40',
            'Rounding back: Maintain neutral spine.',
            'Keep bar close to body.',
            'gym',
            'barbell'
        UNION ALL SELECT 
            'Glute Bridge',
            'https://images.unsplash.com/photo-1544216717-3bbf52512659?q=80&w=1000&auto=format&fit=crop',
            'reps',
            3.0,
            'Lie on your back with knees bent. Lift hips toward the ceiling by squeezing glutes, then lower.',
            'glutes:100',
            'Overarching back: Engage core.',
            'Press through heels.',
            'home; gym',
            'none'
        UNION ALL SELECT 
            'Jumping Jacks',
            'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?q=80&w=1000&auto=format&fit=crop',
            'reps',
            1.0,
            'Start with feet together and arms by sides. Jump to spread feet and raise arms overhead, then return to start position.',
            'full body:80; cardio:20',
            'Not fully extending: Make complete movements.',
            'Keep a steady rhythm.',
            'home; gym',
            'none'
        UNION ALL SELECT 
            'Abdominal Crunches',
            'https://images.unsplash.com/photo-1544216717-3bbf52512659?q=80&w=1000&auto=format&fit=crop',
            'reps',
            2.0,
            'Lie on your back with knees bent. Place hands behind head, then lift shoulders off the floor using abdominal muscles.',
            'abs:100',
            'Pulling neck: Let abs do the work.',
            'Exhale as you crunch up.',
            'home; gym',
            'none'
    ) LOOP
        -- Convert the avg_time_per_rep from seconds to an integer representing milliseconds
        avg_time_secs := (exercise_row.avg_time_per_rep * 1000)::INTEGER;
        
        -- Get the first location (home or gym) since place only accepts 4 chars
        places := string_to_array(exercise_row.place, '; ');
        place := places[1]; -- Take just the first place
        
        -- Insert the exercise
        INSERT INTO exercises (
            id, 
            name, 
            gif_url, 
            exercise_type, 
            avg_time_per_rep, 
            instructions, 
            place, 
            equipments,
            created_at,
            updated_at
        ) 
        VALUES (
            gen_random_uuid(), 
            exercise_row.name, 
            exercise_row.image, 
            exercise_row.type, 
            avg_time_secs, 
            exercise_row.instructions, 
            place,
            string_to_array(exercise_row.equipments, '; '),
            NOW(),
            NOW()
        )
        RETURNING id INTO exercise_id;
        
        -- Process focus areas
        focus_areas := string_to_array(exercise_row.focus_area, '; ');
        FOREACH focus_area IN ARRAY focus_areas
        LOOP
            area_name := split_part(focus_area, ':', 1);
            area_weightage := split_part(focus_area, ':', 2)::INTEGER;
            
            INSERT INTO exercise_focus_areas (id, exercise_id, area, weightage)
            VALUES (gen_random_uuid(), exercise_id, area_name, area_weightage);
        END LOOP;
        
        -- Process common mistakes
        mistakes := string_to_array(exercise_row.common_mistakes, '; ');
        FOREACH mistake IN ARRAY mistakes
        LOOP
            mistake_title := split_part(mistake, ': ', 1);
            mistake_subtitle := split_part(mistake, ': ', 2);
            
            INSERT INTO exercise_mistakes (id, exercise_id, title, subtitle)
            VALUES (gen_random_uuid(), exercise_id, mistake_title, mistake_subtitle);
        END LOOP;
        
        -- Process tips
        tips := string_to_array(exercise_row.tips, '; ');
        FOREACH tip IN ARRAY tips
        LOOP
            INSERT INTO exercise_tips (id, exercise_id, tip)
            VALUES (gen_random_uuid(), exercise_id, tip);
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the import function
SELECT import_exercise_data();

-- Clean up (drop the function after import)
DROP FUNCTION IF EXISTS import_exercise_data();

-- Verify results (optional, you can comment these out for production)
SELECT COUNT(*) AS total_exercises FROM exercises;
SELECT COUNT(*) AS total_focus_areas FROM exercise_focus_areas;
SELECT COUNT(*) AS total_mistakes FROM exercise_mistakes;
SELECT COUNT(*) AS total_tips FROM exercise_tips; 