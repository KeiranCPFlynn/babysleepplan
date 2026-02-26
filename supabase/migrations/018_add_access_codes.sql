-- Migration: Add access code system for invite-only trial access
-- Tables: access_codes, access_code_redemptions
-- Column: profiles.trial_ends_at

-- 1. Add trial_ends_at to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Access codes table
CREATE TABLE IF NOT EXISTS access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  trial_days INTEGER NOT NULL DEFAULT 14,
  max_redemptions INTEGER DEFAULT NULL, -- null = unlimited
  redeemed_count INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ DEFAULT NULL,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  category TEXT NOT NULL DEFAULT 'custom', -- founding, partner, student, custom
  note TEXT DEFAULT NULL, -- internal admin note
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Access code redemptions table
CREATE TABLE IF NOT EXISTS access_code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_code_id UUID NOT NULL REFERENCES access_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trial_ends_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(access_code_id, user_id) -- one redemption per user per code
);

-- 4. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_access_codes_code ON access_codes(code);
CREATE INDEX IF NOT EXISTS idx_access_code_redemptions_user ON access_code_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_access_code_redemptions_code ON access_code_redemptions(access_code_id);

-- 5. RLS policies
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_code_redemptions ENABLE ROW LEVEL SECURITY;

-- Access codes: no client access (admin uses service role)
-- No SELECT/INSERT/UPDATE/DELETE policies = no access via anon/authenticated

-- Redemptions: users can see their own redemptions only
CREATE POLICY "Users can view own redemptions"
  ON access_code_redemptions FOR SELECT
  USING (auth.uid() = user_id);

-- 6. Atomic redeem function (prevents race conditions on max_redemptions)
CREATE OR REPLACE FUNCTION redeem_access_code(
  p_code TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code_row access_codes%ROWTYPE;
  v_existing access_code_redemptions%ROWTYPE;
  v_new_trial_end TIMESTAMPTZ;
  v_current_trial_end TIMESTAMPTZ;
  v_final_trial_end TIMESTAMPTZ;
BEGIN
  -- Look up the code (lock the row to prevent concurrent redemptions)
  SELECT * INTO v_code_row
  FROM access_codes
  WHERE access_codes.code = UPPER(TRIM(p_code))
  FOR UPDATE;

  IF v_code_row IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid access code.');
  END IF;

  -- Check enabled
  IF NOT v_code_row.enabled THEN
    RETURN jsonb_build_object('success', false, 'error', 'This access code is no longer active.');
  END IF;

  -- Check date window
  IF v_code_row.starts_at IS NOT NULL AND NOW() < v_code_row.starts_at THEN
    RETURN jsonb_build_object('success', false, 'error', 'This access code is not yet active.');
  END IF;

  IF v_code_row.expires_at IS NOT NULL AND NOW() > v_code_row.expires_at THEN
    RETURN jsonb_build_object('success', false, 'error', 'This access code has expired.');
  END IF;

  -- Check max redemptions
  IF v_code_row.max_redemptions IS NOT NULL AND v_code_row.redeemed_count >= v_code_row.max_redemptions THEN
    RETURN jsonb_build_object('success', false, 'error', 'This access code has reached its redemption limit.');
  END IF;

  -- Check if user already redeemed this code
  SELECT * INTO v_existing
  FROM access_code_redemptions
  WHERE access_code_id = v_code_row.id AND user_id = p_user_id;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already redeemed this code.');
  END IF;

  -- Calculate new trial end
  v_new_trial_end := NOW() + (v_code_row.trial_days || ' days')::INTERVAL;

  -- Get current trial_ends_at from profile
  SELECT trial_ends_at INTO v_current_trial_end
  FROM profiles
  WHERE id = p_user_id;

  -- Only extend, never shorten
  IF v_current_trial_end IS NOT NULL AND v_current_trial_end > v_new_trial_end THEN
    v_final_trial_end := v_current_trial_end;
  ELSE
    v_final_trial_end := v_new_trial_end;
  END IF;

  -- Insert redemption record
  INSERT INTO access_code_redemptions (access_code_id, user_id, trial_ends_at)
  VALUES (v_code_row.id, p_user_id, v_final_trial_end);

  -- Increment redeemed_count
  UPDATE access_codes
  SET redeemed_count = redeemed_count + 1, updated_at = NOW()
  WHERE id = v_code_row.id;

  -- Update user profile trial_ends_at
  UPDATE profiles
  SET trial_ends_at = v_final_trial_end
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'trial_ends_at', v_final_trial_end,
    'trial_days', v_code_row.trial_days,
    'category', v_code_row.category
  );
END;
$$;
