-- Add image_url column to workout_routines
ALTER TABLE workout_routines
ADD COLUMN image_url TEXT;

-- Update existing routines with their respective images
UPDATE workout_routines
SET image_url = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1000&auto=format&fit=crop'
WHERE id = '42071413-f70f-4fad-8772-806af436ce78'; -- Full Body Beginner

UPDATE workout_routines
SET image_url = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000&auto=format&fit=crop'
WHERE id = 'a323cb57-0aa4-478f-98d3-96768dae0f81'; -- Abs Intermediate

UPDATE workout_routines
SET image_url = 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop'
WHERE id = '2018abfa-18d2-4017-a9a3-e369856f6c12'; -- Upper Body Advanced

UPDATE workout_routines
SET image_url = 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?q=80&w=1000&auto=format&fit=crop'
WHERE id = '7e334c99-fda6-4a8b-a34c-06bb57c2fb10'; -- Lower Body Beginner

UPDATE workout_routines
SET image_url = 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?q=80&w=1000&auto=format&fit=crop'
WHERE id = '76572262-7c7e-461e-82e5-7f2c3b5805b9'; -- Cardio Blast

-- Set a default image for any new routines
ALTER TABLE workout_routines
ALTER COLUMN image_url 
SET DEFAULT 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=1000&auto=format&fit=crop'; 