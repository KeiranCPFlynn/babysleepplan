-- Add subscription_period_end column to profiles
-- Tracks when the current subscription period (trial or billing cycle) ends

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMPTZ;
