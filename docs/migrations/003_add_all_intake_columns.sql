-- Migration: Add all intake form columns to intake_submissions
-- Run this in Supabase SQL Editor

-- Step 2: Current Sleep Situation
ALTER TABLE intake_submissions ADD COLUMN IF NOT EXISTS current_bedtime TIME;
ALTER TABLE intake_submissions ADD COLUMN IF NOT EXISTS current_waketime TIME;
ALTER TABLE intake_submissions ADD COLUMN IF NOT EXISTS falling_asleep_method TEXT;

-- Step 3: Night Sleep
ALTER TABLE intake_submissions ADD COLUMN IF NOT EXISTS night_wakings_count INTEGER;
ALTER TABLE intake_submissions ADD COLUMN IF NOT EXISTS night_wakings_description TEXT;
ALTER TABLE intake_submissions ADD COLUMN IF NOT EXISTS night_waking_duration TEXT;
ALTER TABLE intake_submissions ADD COLUMN IF NOT EXISTS night_waking_pattern TEXT;

-- Step 4: Naps
ALTER TABLE intake_submissions ADD COLUMN IF NOT EXISTS nap_count INTEGER;
ALTER TABLE intake_submissions ADD COLUMN IF NOT EXISTS nap_duration TEXT;
ALTER TABLE intake_submissions ADD COLUMN IF NOT EXISTS nap_method TEXT;
ALTER TABLE intake_submissions ADD COLUMN IF NOT EXISTS nap_location TEXT;

-- Step 5: The Problem
ALTER TABLE intake_submissions ADD COLUMN IF NOT EXISTS problems JSONB;
ALTER TABLE intake_submissions ADD COLUMN IF NOT EXISTS problem_description TEXT;

-- Step 6: Parent Preferences
ALTER TABLE intake_submissions ADD COLUMN IF NOT EXISTS crying_comfort_level INTEGER CHECK (crying_comfort_level BETWEEN 1 AND 5);
ALTER TABLE intake_submissions ADD COLUMN IF NOT EXISTS parent_constraints TEXT;

-- Step 7: Goals
ALTER TABLE intake_submissions ADD COLUMN IF NOT EXISTS success_description TEXT;
ALTER TABLE intake_submissions ADD COLUMN IF NOT EXISTS additional_notes TEXT;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
