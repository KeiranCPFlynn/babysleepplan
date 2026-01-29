-- Migration: Fix plans table to allow empty plan_content initially
-- Run this in Supabase SQL Editor

-- Make plan_content nullable (or set default) so we can create plans before generation
ALTER TABLE plans ALTER COLUMN plan_content DROP NOT NULL;

-- Or alternatively, set a default empty string:
-- ALTER TABLE plans ALTER COLUMN plan_content SET DEFAULT '';

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
