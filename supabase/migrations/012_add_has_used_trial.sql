-- Add has_used_trial flag to prevent repeat free trials
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_used_trial BOOLEAN DEFAULT false;

-- Backfill: mark users who have already had a subscription as having used their trial
UPDATE profiles
SET has_used_trial = true
WHERE subscription_status IN ('active', 'trialing', 'cancelled')
   OR subscription_status IS NOT NULL AND subscription_status != 'inactive';
