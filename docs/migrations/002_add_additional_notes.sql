-- Migration: Add additional_notes column to intake_submissions
-- Run this in Supabase SQL Editor

ALTER TABLE intake_submissions ADD COLUMN IF NOT EXISTS additional_notes TEXT;
