-- Fix update_workout_streak function to handle multiple workouts on the same day
CREATE OR REPLACE FUNCTION update_workout_streak()
RETURNS TRIGGER AS $$
DECLARE
    last_workout_date DATE;
    current_streak INTEGER;
    longest_streak INTEGER;
BEGIN
    -- Get the last workout date from the streak record
    SELECT last_workout_date INTO last_workout_date
    FROM workout_streaks
    WHERE user_id = NEW.user_id;
    
    -- If no streak record exists, create one
    IF last_workout_date IS NULL THEN
        INSERT INTO workout_streaks (user_id, current_streak, longest_streak, last_workout_date)
        VALUES (NEW.user_id, 1, 1, DATE(NEW.completed_at));
        RETURN NEW;
    END IF;
    
    -- Only update if this is a new day's workout
    IF last_workout_date < DATE(NEW.completed_at) THEN
        -- Calculate the new streak
        IF last_workout_date = DATE(NEW.completed_at) - INTERVAL '1 day' THEN
            -- Consecutive day
            UPDATE workout_streaks
            SET current_streak = current_streak + 1,
                longest_streak = GREATEST(current_streak + 1, longest_streak),
                last_workout_date = DATE(NEW.completed_at)
            WHERE user_id = NEW.user_id;
        ELSE
            -- Streak broken
            UPDATE workout_streaks
            SET current_streak = 1,
                last_workout_date = DATE(NEW.completed_at)
            WHERE user_id = NEW.user_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 