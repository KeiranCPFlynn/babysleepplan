-- Add subscription tracking columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Add CHECK constraint including 'trialing'
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_status_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_status_check
  CHECK (subscription_status IN ('inactive', 'trialing', 'active', 'cancelled'));

NOTIFY pgrst, 'reload schema';
