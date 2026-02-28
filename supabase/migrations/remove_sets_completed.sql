-- Remove sets_completed column from exercise_completions
ALTER TABLE exercise_completions DROP COLUMN IF EXISTS sets_completed; 