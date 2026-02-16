-- Prevent concurrent plan generation runs for the same plan (reduces duplicate Gemini calls).
ALTER TABLE IF EXISTS public.plans
  ADD COLUMN IF NOT EXISTS generation_lock_token TEXT,
  ADD COLUMN IF NOT EXISTS generation_lock_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_plans_generation_lock
  ON public.plans (status, generation_lock_expires_at);

CREATE OR REPLACE FUNCTION public.acquire_plan_generation_lock(
  p_plan_id UUID,
  p_lock_token TEXT,
  p_lease_seconds INTEGER DEFAULT 480
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE public.plans
  SET
    generation_lock_token = p_lock_token,
    generation_lock_expires_at = NOW() + make_interval(secs => p_lease_seconds)
  WHERE
    id = p_plan_id
    AND status IN ('generating', 'failed')
    AND (generation_lock_expires_at IS NULL OR generation_lock_expires_at < NOW());

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated = 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_plan_generation_lock(
  p_plan_id UUID,
  p_lock_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE public.plans
  SET
    generation_lock_token = NULL,
    generation_lock_expires_at = NULL
  WHERE
    id = p_plan_id
    AND generation_lock_token = p_lock_token;

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.acquire_plan_generation_lock(UUID, TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_plan_generation_lock(UUID, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.acquire_plan_generation_lock(UUID, TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_plan_generation_lock(UUID, TEXT) TO service_role;
