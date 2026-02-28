-- Clean up duplicate exercise completion records
-- Keep only the most recent record for each exercise in a session
WITH ranked_exercises AS (
  SELECT 
    id,
    session_id,
    exercise_id,
    status,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY session_id, exercise_id 
      ORDER BY created_at DESC
    ) as rn
  FROM exercise_completions
)
DELETE FROM exercise_completions
WHERE id IN (
  SELECT id 
  FROM ranked_exercises 
  WHERE rn > 1
); 