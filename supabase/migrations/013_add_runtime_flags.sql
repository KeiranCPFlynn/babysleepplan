-- Runtime feature flags that can be toggled without redeploying the app.
CREATE TABLE IF NOT EXISTS public.runtime_flags (
  key TEXT PRIMARY KEY,
  value_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.runtime_flags ENABLE ROW LEVEL SECURITY;

-- Allow read access from edge/runtime with anon key.
GRANT SELECT ON TABLE public.runtime_flags TO anon, authenticated, service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'runtime_flags'
      AND policyname = 'Public can read runtime flags'
  ) THEN
    CREATE POLICY "Public can read runtime flags" ON public.runtime_flags
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'update_updated_at_column'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_runtime_flags_updated_at'
  ) THEN
    CREATE TRIGGER update_runtime_flags_updated_at
      BEFORE UPDATE ON public.runtime_flags
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

INSERT INTO public.runtime_flags (key, value_json)
VALUES ('maintenance_mode', '{"enabled": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

