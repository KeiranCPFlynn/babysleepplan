# Security Guide

This document describes the security measures in place for LunaCradle.

## Authentication

- **Provider:** Supabase Auth (email/password)
- **Minimum password:** 8 characters (enforced in `signup-form.tsx`, `update-password-form.tsx`, and Supabase auth config)
- **Route protection:** `src/middleware.ts` redirects unauthenticated users away from `/dashboard/*` routes
- **Server-side auth:** `requireAuth()` in `src/lib/auth.ts` validates session on every protected page

## Authorization

### Row Level Security (RLS)
All database tables have RLS enabled. Policies enforce `user_id = auth.uid()` so users can only read/write their own data. See `docs/database-schema.sql` for full policy definitions.

### Defense-in-Depth API Filtering
Even though RLS provides DB-level protection, API routes and server components also filter by `user_id` explicitly. This prevents data leaks if RLS policies are accidentally misconfigured.

**Example:** The intake page query includes `.eq('user_id', user.id)` alongside `.eq('id', id)`:
```typescript
// src/app/dashboard/intake/[id]/page.tsx
supabase
  .from('intake_submissions')
  .select('*')
  .eq('id', id)
  .eq('user_id', user.id)  // defense-in-depth
  .single()
```

### Internal API Authentication
The `/api/generate-plan` route accepts two auth methods:
1. **INTERNAL_API_KEY:** Bearer token for service-to-service calls (e.g. webhook triggers plan generation)
2. **User session:** Authenticated user who owns the plan

The `INTERNAL_API_KEY` has no hardcoded fallback. If the env var is unset, the route returns a 500 error.

## HTTP Security Headers

Configured in `next.config.ts` and applied to all routes:

| Header | Value | Purpose |
|--------|-------|---------|
| Content-Security-Policy | `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com; ...` | Restricts resource loading sources |
| Strict-Transport-Security | `max-age=31536000; includeSubDomains` | Forces HTTPS for 1 year |
| X-Frame-Options | `DENY` | Prevents clickjacking |
| X-Content-Type-Options | `nosniff` | Prevents MIME-type sniffing |
| X-XSS-Protection | `0` | Modern best practice (CSP handles XSS protection) |
| Referrer-Policy | `strict-origin-when-cross-origin` | Limits referrer info sent cross-origin |
| Permissions-Policy | `camera=(), microphone=(), geolocation=()` | Disables unused browser APIs |

### CSP Breakdown
- `default-src 'self'` - Only allow same-origin by default
- `script-src` - Self + inline (needed for Next.js) + Stripe.js + Google Tag Manager
- `style-src` - Self + inline (needed for Tailwind)
- `img-src` - Self + data URIs + Unsplash (blog images) + Google Analytics beacon domain
- `frame-src` - Stripe.js only (for payment elements)
- `connect-src` - Self + Supabase (HTTPS + WSS) + Stripe API

### Verifying Headers
```bash
curl -I https://your-domain.com
```

## Input Sanitization

All sanitization utilities live in `src/lib/sanitize.ts`.

### HTML Escaping (Email Templates)
`escapeHtml(str)` escapes `&`, `<`, `>`, `"`, `'` to prevent XSS in HTML email bodies.

Applied in `src/lib/email/send.ts` to all user-interpolated values:
- User names in welcome emails
- Baby names in plan-ready and payment confirmation emails
- Payment amounts in confirmation emails

### Email Subject Sanitization
`sanitizeEmailSubject(subject)` strips `\r` and `\n` characters to prevent email header injection attacks.

### HTML Tag Stripping (Contact Form)
`stripHtml(str)` removes all HTML tags from contact form inputs before storage. Applied in `src/app/api/contact/route.ts` to `name`, `topic`, and `message` fields.

### Email Validation (Contact Form)
Uses proper regex validation (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) instead of simple `includes('@')`.

### AI Prompt Sanitization
`sanitizeForPrompt(input, maxLength)` protects against prompt injection:
1. **Truncation:** Limits input to `maxLength` characters (default 2000)
2. **Pattern stripping:** Removes common injection phrases (e.g. "ignore previous instructions", "system prompt", "you are now", etc.)
3. **Delimiter wrapping:** Wraps content in `<user_input>...</user_input>` tags for clear separation from system instructions

Applied in:
- `src/app/api/generate-plan/route.ts` - Baby name, temperament notes, medical conditions, sleep descriptions, problem details, parent constraints, goals, additional notes
- `src/app/api/diary/review/route.ts` - Baby name, success description, additional notes
- `src/app/api/diary/plan-update/route.ts` - Baby name

## API Error Handling

API routes return generic error messages to clients. Detailed error information is logged server-side only.

```typescript
// Pattern used across all API routes:
console.error('Operation failed:', err)  // server-side logging
return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })  // client response
```

This prevents leaking database internals, stack traces, or implementation details.

**Files updated:**
- `src/app/api/generate-plan/route.ts`
- `src/app/api/intake/create/route.ts`
- `src/app/api/diary/review/route.ts`
- `src/app/api/diary/plan-update/route.ts`

## Production Logging

Sensitive `console.log` calls are gated behind `isDev` checks (`process.env.NODE_ENV !== 'production'`). This prevents leaking user IDs, emails, Stripe customer IDs, and subscription details in production server logs.

`console.error` calls are retained for production error tracking.

**Files with gated logging:**
- `src/app/dashboard/subscription/page.tsx` - Subscription sync debug logs
- `src/app/api/generate-plan/route.ts` - Plan generation progress logs
- `src/app/api/stripe/webhook/route.ts` - Webhook processing logs
- `src/app/api/stripe/checkout/route.ts` - Payment bypass logs
- `src/app/api/diary/review/route.ts` - Review generation logs

## Production Guards

### Stripe Dev Bypass
When `NEXT_PUBLIC_STRIPE_ENABLED=false`, the checkout route bypasses Stripe and creates plans for free. This is blocked in production:

```typescript
if (!isStripeEnabled) {
  if (process.env.NODE_ENV === 'production') {
    console.error('STRIPE_ENABLED is false in production!')
    return NextResponse.json({ error: 'Payment system unavailable' }, { status: 503 })
  }
  // dev bypass continues...
}
```

### Admin Debug UI
Debug panels showing user IDs, Stripe customer IDs, and subscription internals are gated behind both `NODE_ENV !== 'production'` and `is_admin === true`:

- `src/app/dashboard/subscription/page.tsx` - Debug info panel + test controls
- `src/app/dashboard/page.tsx` - Subscription status debug + test controls

### Environment Variable Validation
`src/lib/env.ts` (imported in root layout) validates all required env vars at server startup:

**Always required:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `RESEND_API_KEY`

**Required in production only:**
- `INTERNAL_API_KEY`

**Required when Stripe is enabled:**
- `STRIPE_MODE` (optional but recommended: `test` or `live`)
- `STRIPE_SECRET_KEY_<MODE>` or legacy `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET_<MODE>` or legacy `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID_<MODE>` or legacy `STRIPE_PRICE_ID`
- `STRIPE_ADDITIONAL_BABY_PRICE_ID_<MODE>` or legacy `STRIPE_ADDITIONAL_BABY_PRICE_ID`

The validation is skipped during the Next.js build phase (where server-only env vars aren't available) and on the client.

## Deployment Checklist

1. Generate a strong `INTERNAL_API_KEY`: `openssl rand -base64 32`
2. Set all required env vars in hosting dashboard
3. Verify `NEXT_PUBLIC_STRIPE_ENABLED=true` in production
4. Verify `STRIPE_MODE` is set intentionally (`live` for real billing, `test` for sandbox)
5. Verify security headers: `curl -I https://your-domain.com`
6. Confirm admin debug panels are not visible (test with admin account)
7. Test signup with password < 8 chars (should be rejected)
8. Test contact form with HTML in name field (should be stripped)
9. Test with `INTERNAL_API_KEY` unset (should fail with clear error)
10. Verify error responses don't contain stack traces or DB details
11. Configure Supabase auth minimum password to 8 characters

## Files Reference

| File | Security Purpose |
|------|-----------------|
| `next.config.ts` | Security headers (CSP, HSTS, etc.) |
| `src/lib/env.ts` | Startup env var validation |
| `src/lib/sanitize.ts` | `escapeHtml`, `stripHtml`, `sanitizeEmailSubject`, `sanitizeForPrompt` |
| `src/lib/email/send.ts` | HTML-escaped email templates |
| `src/app/api/generate-plan/route.ts` | API key auth, prompt sanitization, gated logs, generic errors |
| `src/app/api/stripe/checkout/route.ts` | Production Stripe guard, API key auth, gated logs |
| `src/app/api/stripe/webhook/route.ts` | API key auth, gated logs |
| `src/app/api/contact/route.ts` | Email regex validation, HTML stripping, rate limiting |
| `src/app/api/intake/create/route.ts` | Generic error responses |
| `src/app/api/diary/review/route.ts` | Prompt sanitization, generic errors |
| `src/app/api/diary/plan-update/route.ts` | Prompt sanitization, generic errors |
| `src/app/dashboard/subscription/page.tsx` | Dev-only debug panel, gated logs |
| `src/app/dashboard/page.tsx` | Dev-only admin controls |
| `src/app/dashboard/intake/[id]/page.tsx` | Defense-in-depth `user_id` filter |
| `src/app/dashboard/intake/[id]/payment/success/page.tsx` | API key with no fallback |
| `src/components/forms/signup-form.tsx` | 8-char min password |
| `src/components/forms/update-password-form.tsx` | 8-char min password |
