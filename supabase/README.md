# Supabase Directory Guide

Welcome to the backend setup for `stayfit-solana`! This folder contains everything you need to manage your Supabase database, edge functions, and schema.

## What is in this folder?

1. **`migrations/`**: This folder contains sequentially ordered SQL files that define the structure of your database (the Schema) and insert seed data. You run these to set up your project locally or reproduce the exact environment.
2. **`functions/`**: This holds all the deployed Deno Edge Functions (like the `workout-tracker`, `profile-manager`, etc.). These serverless functions execute custom backend logic. 
3. **`complete_schema_reference.sql`**: A large reference file containing the raw SQL for all the tables, triggers, and foreign keys in the project. This is kept as a quick reference to easily lookup column names without having to sift through all 60+ migration files.
4. **`.temp/`**: A system-generated directory created when you run `supabase link`. It holds purely internal cached state (like `project-ref` and versions) so that the CLI knows exactly which project to deploy to. **Do not modify or commit files in this folder**. It is automatically ignored in version control.

---

## The Database Schema Overview

The StayFit application uses a deeply interconnected PostgreSQL database. Below is a high-level summary of the major logical groupings of the 28 tables to help you navigate:

### 1. User & Identity
* **`profiles`**: The central user table. Links directly to Supabase Auth (`auth.users`) and stores everything from physical metrics (weight/height/gender) to app preferences (theme, units, goal).
* **`social_links`**: Stores external URLs linked to a user's profile.
* **`follows`**: Tracks the user follower/following relationships.

### 2. Exercise Database (The Dictionary)
* **`exercises`**: The main dictionary of exercises (e.g. "Pushup", "Squat"). Contains instructions, target body parts (`exercise_focus_areas`), required equipment, GIF URLs, and metadata on whether it requires weight or is done per-side.
* **`exercise_focus_areas`**: Maps an exercise to the specific muscle groups it works out.
* **`exercise_tips` & `exercise_mistakes`**: Supplemental advice and warnings for a given exercise.
* **`exercise_animations`**: Framed animation data mapping for specific exercises (useful for the UI).

### 3. Workout Routines (The Plan)
* **`workout_routines`**: A container for a workout plan (e.g. "Upper Body Blast", "Leg Day"). Has an image, a difficulty level, and a location category (home/gym).
* **`routine_exercises`**: The vital link between a Route and an Exercise. It stores the specific rules for that exercise inside the routine: how many `sets`, `reps`, `duration`, and its sequential `order_position`.

### 4. Live Session Tracking (The Action)
* **`workout_sessions`**: Whenever a user starts a workout, a session is created here to track `started_at`, `completed_at`, `paused_duration`, and broad summaries like aggregate calories burned.
* **`exercise_completions`**: Logs the exact performance of *every single exercise* inside a session (how many actual reps you did, what weight you used, whether it was skipped or completed).
* **`focus_area_tracking`**: Logs intense focus mapping metadata derived from completions.
* **`workouts`**: A higher-level log that acts as a generic "workout completed" record.

### 5. Gamification & Streaks (The Reward)
* **`workout_streaks`**: Tracks a user's `current_streak` and `longest_streak`.
* **`user_streak_history`**: Granular log of specific streak milestones (fire, ice, frozen modes).
* **`achievements` & `user_achievements`**: Global definitions of unlockable badges and the junction table tracking user progress towards unlocking them. 
* **`challenges`, `challenge_days`, `user_challenges` & `user_challenge_logs`**: System defining multi-day challenges, mapping them to specific routines natively for each day, and tracking human progression through them.
* **`activities`**: The central timeline/feed table that generates events like "workout completed" or "unlocked an achievement" for social sharing.

### 6. Health & Metrics Logging
* **`weight_history`**: Tracks user body mass changes over time.
* **`exercise_weight_history`**: Tracks the max weight used for specific exercises allowing for progression graphs.
* **`progress_photos`**: Image logging for bodily changes.
* **`nutrition_logs`**: Caloric and macro (proteins, carbs, fats) intake tracking.
* **`daily_workout_summary`**: A daily aggregate of total routines, duration, and calories.

---

## How to Deploy Changes (Hackathon Guide)

### Deploying Edge Functions
If you write a new function in `supabase/functions/my-new-function`, you can push it to the live backend using the Supabase CLI:
```bash
npx supabase functions deploy my-new-function --project-ref 
```
*(Make sure to use the `--no-verify-jwt` flag if your function needs to be entirely public and unauthenticated).*

### Generating Database Changes
If you design new tables or alter columns via the Supabase Dashboard, you must pull those changes into the local git repository so the team can see them:
```bash
npx supabase db pull 
```
If you are writing the SQL locally in a new migration file, you can test it on a local docker container or apply it directly to the remote database using:
```bash
npx supabase db push
```
