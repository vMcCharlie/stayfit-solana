-- Migration to recalculate streaks based on actual consecutive workout days
-- This fixes any incorrect streak values by recalculating from daily_workout_summary

-- Function to calculate streak for a user
CREATE OR REPLACE FUNCTION calculate_user_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    streak_count INTEGER := 0;
    check_date DATE := CURRENT_DATE;
    has_workout BOOLEAN;
BEGIN
    -- Loop backwards from today checking for consecutive workout days
    LOOP
        -- Check if there's a workout on this date
        SELECT EXISTS(
            SELECT 1 FROM daily_workout_summary 
            WHERE user_id = p_user_id AND date = check_date
        ) INTO has_workout;
        
        IF has_workout THEN
            streak_count := streak_count + 1;
            check_date := check_date - INTERVAL '1 day';
        ELSE
            -- If not today and no workout, streak is broken
            IF check_date < CURRENT_DATE THEN
                EXIT;
            END IF;
            -- If today and no workout yet, check yesterday
            check_date := check_date - INTERVAL '1 day';
            
            -- Check yesterday
            SELECT EXISTS(
                SELECT 1 FROM daily_workout_summary 
                WHERE user_id = p_user_id AND date = check_date
            ) INTO has_workout;
            
            IF has_workout THEN
                streak_count := streak_count + 1;
                check_date := check_date - INTERVAL '1 day';
            ELSE
                EXIT;
            END IF;
        END IF;
    END LOOP;
    
    RETURN streak_count;
END;
$$ LANGUAGE plpgsql;

-- Update all existing streaks with correct calculated values
DO $$
DECLARE
    user_record RECORD;
    calculated_streak INTEGER;
BEGIN
    -- Loop through all users with workout data
    FOR user_record IN 
        SELECT DISTINCT user_id FROM daily_workout_summary
    LOOP
        -- Calculate the streak
        calculated_streak := calculate_user_streak(user_record.user_id);
        
        -- Update or insert the streak record
        INSERT INTO workout_streaks (user_id, current_streak, longest_streak, last_workout_date)
        SELECT 
            user_record.user_id,
            calculated_streak,
            GREATEST(calculated_streak, COALESCE((SELECT longest_streak FROM workout_streaks WHERE user_id = user_record.user_id), 0)),
            COALESCE((SELECT MAX(date) FROM daily_workout_summary WHERE user_id = user_record.user_id), CURRENT_DATE)
        ON CONFLICT (user_id) DO UPDATE SET
            current_streak = calculated_streak,
            longest_streak = GREATEST(calculated_streak, workout_streaks.longest_streak),
            last_workout_date = COALESCE((SELECT MAX(date) FROM daily_workout_summary WHERE user_id = user_record.user_id), CURRENT_DATE);
    END LOOP;
END $$;

-- Add a comment for documentation
COMMENT ON FUNCTION calculate_user_streak IS 'Calculates consecutive workout streak for a user based on daily_workout_summary';
