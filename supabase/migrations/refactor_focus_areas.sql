-- Add category column
ALTER TABLE exercise_focus_areas ADD COLUMN IF NOT EXISTS category TEXT;

-- Backfill data
UPDATE exercise_focus_areas SET category = 'Core' WHERE area IN ('core', 'abs', 'obliques');
UPDATE exercise_focus_areas SET category = 'Back' WHERE area IN ('back', 'lower back', 'lats', 'traps');
UPDATE exercise_focus_areas SET category = 'Chest' WHERE area IN ('chest', 'pectoralis');
UPDATE exercise_focus_areas SET category = 'Arms' WHERE area IN ('biceps', 'triceps', 'forearms');
UPDATE exercise_focus_areas SET category = 'Shoulders' WHERE area IN ('shoulders', 'deltoids');
UPDATE exercise_focus_areas SET category = 'Legs' WHERE area IN ('quadriceps', 'hamstrings', 'calves', 'glutes', 'legs');
UPDATE exercise_focus_areas SET category = 'Full Body' WHERE area IN ('full body', 'cardio');
-- Default fallback
UPDATE exercise_focus_areas SET category = 'Other' WHERE category IS NULL;

-- Update the function to group by category
CREATE OR REPLACE FUNCTION get_focus_area_intensity(
  p_user_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  area TEXT,
  intensity NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If start_date is not provided, default to 30 days ago
  IF p_start_date IS NULL THEN
    p_start_date := NOW() - INTERVAL '30 days';
  END IF;

  -- If end_date is not provided, default to now
  IF p_end_date IS NULL THEN
    p_end_date := NOW();
  END IF;

  RETURN QUERY
  SELECT 
    COALESCE(efa.category, 'Other')::TEXT as area,
    AVG(fat.intensity_score) as intensity
  FROM 
    focus_area_tracking fat
    JOIN exercise_completions ec ON fat.exercise_completion_id = ec.id
    JOIN workout_sessions ws ON ec.session_id = ws.id
    JOIN exercise_focus_areas efa ON fat.focus_area_id = efa.id
  WHERE 
    ws.user_id = p_user_id
    AND ws.completed_at >= p_start_date
    AND ws.completed_at <= p_end_date
  GROUP BY 
    COALESCE(efa.category, 'Other');
END;
$$;
