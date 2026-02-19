-- Free Schedule Builder: session tracking table
-- No PII stored: emails and IPs are SHA-256 hashed before insert.
-- Pasted post text is never persisted; only structured extracted_fields JSON is stored.

CREATE TABLE IF NOT EXISTS public.free_schedule_sessions (
  id                   UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id           TEXT NOT NULL UNIQUE,
  extracted_fields     JSONB NOT NULL DEFAULT '{}',
  report_content       TEXT,
  report_generated_at  TIMESTAMPTZ,
  email_hash           TEXT,        -- SHA-256 of lowercase email (no PII)
  ip_hash              TEXT,        -- SHA-256 of client IP (no PII)
  pdf_sent_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast session lookup by session_id
CREATE INDEX IF NOT EXISTS idx_fss_session_id
  ON public.free_schedule_sessions (session_id);

-- Index for per-email monthly rate limiting queries
CREATE INDEX IF NOT EXISTS idx_fss_email_hash_pdf
  ON public.free_schedule_sessions (email_hash, pdf_sent_at)
  WHERE email_hash IS NOT NULL AND pdf_sent_at IS NOT NULL;

-- Index for IP-based analytics (optional, lightweight)
CREATE INDEX IF NOT EXISTS idx_fss_ip_hash_created
  ON public.free_schedule_sessions (ip_hash, created_at)
  WHERE ip_hash IS NOT NULL;

-- Enable RLS — no anon or authenticated policies.
-- All access goes through the service_role key in API routes (bypasses RLS).
ALTER TABLE public.free_schedule_sessions ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.free_schedule_sessions IS
  'Tracks free schedule builder sessions for rate limiting and PDF delivery. No PII stored.';
