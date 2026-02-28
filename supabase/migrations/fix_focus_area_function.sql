-- Fix get_focus_area_intensity function type mismatch
-- The exercise_focus_areas.area column is VARCHAR but function returns TEXT
-- Add explicit cast to fix this

DROP FUNCTION IF EXISTS get_focus_area_intensity(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);

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
    efa.area::TEXT,  -- Explicit cast to TEXT
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
    efa.area;
END;
$$;
