-- Migration: Fix intake_submissions status column
-- Date: 2026-01-27
-- Problem: Database has 'pending' as default and CHECK constraint,
--          but app expects 'draft', 'submitted', 'paid'
--
-- Run this in Supabase SQL Editor

-- Step 1: Drop the existing CHECK constraint
ALTER TABLE intake_submissions DROP CONSTRAINT IF EXISTS intake_submissions_status_check;

-- Step 2: Update any existing 'pending' rows to 'draft'
UPDATE intake_submissions SET status = 'draft' WHERE status = 'pending';

-- Step 3: Add new CHECK constraint with correct values
ALTER TABLE intake_submissions
ADD CONSTRAINT intake_submissions_status_check
CHECK (status IN ('draft', 'submitted', 'paid'));

-- Step 4: Set the default to 'draft'
ALTER TABLE intake_submissions
ALTER COLUMN status SET DEFAULT 'draft';

-- Verification query (run separately to check):
-- SELECT column_default FROM information_schema.columns
-- WHERE table_name = 'intake_submissions' AND column_name = 'status';
-- Expected result: 'draft'::text
