-- Migration 009: Backfill profiles table
-- Ensures the handle_new_user() trigger exists and backfills any missing profile rows.

-- Add email column (was in docs/database-schema.sql but never migrated)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Populate email for existing rows from auth.users
UPDATE profiles SET email = u.email
FROM auth.users u WHERE profiles.id = u.id AND profiles.email IS NULL;

-- Now make it NOT NULL to match the intended schema
ALTER TABLE profiles ALTER COLUMN email SET NOT NULL;

-- Re-create the trigger function (idempotent)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger (drop first to be idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: insert profiles for any auth.users that don't have one yet
INSERT INTO profiles (id, email, full_name, subscription_status)
SELECT
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name',
  'inactive'
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM profiles);
