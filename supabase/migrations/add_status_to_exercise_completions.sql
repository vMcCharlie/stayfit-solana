-- Add status column to exercise_completions table
ALTER TABLE exercise_completions 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed';

-- Update existing records to have 'completed' status
UPDATE exercise_completions 
SET status = 'completed' 
WHERE status IS NULL; 