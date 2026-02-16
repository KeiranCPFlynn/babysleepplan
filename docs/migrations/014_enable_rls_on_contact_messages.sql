-- Enable RLS on contact_messages to satisfy security lint checks.
-- This table is written by server-side API code using the service role key.
ALTER TABLE IF EXISTS public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Ensure client roles cannot read/write contact submissions directly.
REVOKE ALL ON TABLE public.contact_messages FROM anon, authenticated;

-- Keep server-side access for API route inserts/ops.
GRANT SELECT, INSERT ON TABLE public.contact_messages TO service_role;
