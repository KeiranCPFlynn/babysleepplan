# LunaCradle

AI-powered personalized sleep plans for babies, with ongoing support through daily sleep diaries and weekly reviews. Think of it as having a sleep consultant in your pocket.

## Overview

Parents complete an intake questionnaire about their baby's sleep situation, and the app generates a personalized sleep plan using AI (Gemini). The plan is tailored based on:
- Baby's age and temperament
- Current sleep patterns and challenges
- Parent's comfort level with different methods
- Specific goals and constraints

**Status:** MVP in development. Core plan generation, sleep diary logging, and living plan updates working.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (PostgreSQL + Auth)
- **AI:** Google Gemini API
- **Payments:** Stripe (optional, can run in dev mode without)
- **Email:** Resend
- **Styling:** Tailwind CSS 4
- **UI Components:** Radix UI + shadcn/ui patterns
- **PDF Generation:** @react-pdf/renderer
- **Testing:** Vitest

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, signup pages
│   ├── api/             # API routes
│   │   ├── generate-plan/   # AI plan generation
│   │   ├── diary/           # Sleep diary + reviews + plan updates
│   │   ├── intake/          # Questionnaire CRUD
│   │   ├── plans/           # Plan management
│   │   ├── contact/         # Contact form handler
│   │   └── stripe/          # Payment webhooks
│   ├── auth/            # Auth callbacks
│   ├── blog/            # Blog pages (SSG)
│   └── dashboard/       # Protected app pages
│       ├── diary/           # Sleep diary hub
│       ├── intake/          # Questionnaire flow
│       ├── subscription/    # Subscription management
│       └── plans/           # View generated plans
│
├── components/
│   ├── blog/            # Blog rendering components
│   ├── forms/           # Form components (intake wizard, auth)
│   ├── layout/          # Dashboard shell and navigation
│   ├── pdf/             # PDF generation components
│   ├── subscription/    # Subscription UI components
│   └── ui/              # Base UI components
│
├── content/             # Blog post MDX content
│
├── data/
│   └── knowledge/       # Sleep training knowledge base (txt files)
│
├── lib/
│   ├── supabase/        # Supabase client setup
│   ├── email/           # Email templates (HTML-escaped)
│   ├── auth.ts          # Auth helpers
│   ├── blog.ts          # Blog content loader
│   ├── env.ts           # Startup env var validation
│   ├── gemini.ts        # Gemini AI client
│   ├── sanitize.ts      # HTML escaping + prompt sanitization
│   ├── stripe.ts        # Stripe client setup
│   └── subscription.ts  # Subscription helpers
│
└── types/               # TypeScript types
```

## Knowledge Base

The app uses a curated knowledge base in `src/data/knowledge/`:

- **Age-specific:** `age-0-3-months.txt`, `age-4-6-months.txt`, etc.
- **Problem-specific:** `problems-night-wakings.txt`, `problems-short-naps.txt`, etc.
- **Methods:** `methods-gentle.txt`, `methods-gradual.txt`, `methods-direct.txt`
- **Core:** `core-principles.txt`, `red-flags.txt`, `sleep-environment.txt`

The plan generator loads relevant files based on baby's age, selected problems, and parent's crying comfort level. See `docs/ARCHITECTURE.md` for details on the smart loader.

## Database Schema

See `docs/database-schema.sql` for the full schema. Key tables:

- **profiles** - User accounts (extends Supabase auth)
- **babies** - Baby info (name, DOB, temperament)
- **intake_submissions** - Questionnaire responses
- **plans** - Generated sleep plans
- **plan_revisions** - Living plan history
- **sleep_diary_entries** - Daily logs per plan
- **weekly_reviews** - AI weekly diary reviews
- **contact_messages** - Contact form submissions

All tables use Row Level Security (RLS) so users can only access their own data. API routes also apply explicit `user_id` filtering as defense-in-depth.

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=        # Required
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Required
SUPABASE_SERVICE_ROLE_KEY=       # Required

# Google AI
GEMINI_API_KEY=                  # Required

# Internal API key for service-to-service calls (plan generation trigger)
# MUST be a strong random secret (32+ chars). No fallback — required in production.
INTERNAL_API_KEY=                # Required in production

# Stripe (optional — set NEXT_PUBLIC_STRIPE_ENABLED=false to skip)
NEXT_PUBLIC_STRIPE_ENABLED=true
# Stripe mode toggle: set to `test` or `live`
STRIPE_MODE=test
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE=
STRIPE_SECRET_KEY_TEST=
STRIPE_SECRET_KEY_LIVE=
STRIPE_WEBHOOK_SECRET_TEST=
STRIPE_WEBHOOK_SECRET_LIVE=
STRIPE_PRICE_ID_TEST=
STRIPE_PRICE_ID_LIVE=
STRIPE_ADDITIONAL_BABY_PRICE_ID_TEST=
STRIPE_ADDITIONAL_BABY_PRICE_ID_LIVE=
# Legacy single-mode fallback (optional)
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
# STRIPE_SECRET_KEY=
# STRIPE_WEBHOOK_SECRET=
# STRIPE_PRICE_ID=
# STRIPE_ADDITIONAL_BABY_PRICE_ID=

# Email
RESEND_API_KEY=                  # Required

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
INTERNAL_API_KEY=                # Required in production
CRON_SECRET=                     # Recommended in production (Vercel Cron auth)
# Emergency force override (requires redeploy). Prefer runtime flag toggle in admin controls.
MAINTENANCE_MODE=false
# Optional bypass token for internal testing while maintenance mode is on
MAINTENANCE_BYPASS_TOKEN=
```

Environment variables are validated at runtime by `src/lib/env.ts` (imported in the root layout). The app will throw a clear error on startup if any required variable is missing. The validation is skipped during the Next.js build phase since server-only env vars aren't available at build time.

When Stripe is enabled, the app reads mode-specific keys using `STRIPE_MODE` (`test` or `live`) and falls back to legacy single-mode keys if needed.

### Generating INTERNAL_API_KEY

```bash
# Generate a strong random key
openssl rand -base64 32
```

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Dev Mode

Set `NEXT_PUBLIC_STRIPE_ENABLED=false` to skip payment flow. This enables:
- Direct plan generation without payment
- Regenerate button for testing prompt changes
- Seed diary entries for testing (3/7 days)
- Regenerate weekly review and force 7-day updates
- Cancel/retry buttons during generation
- Admin debug panels and test controls (visible to admin users only)

The Stripe dev bypass is blocked in production (`NODE_ENV=production`) with a 503 error to prevent accidental free plan generation.

### Maintenance Mode

Maintenance mode can be toggled live (no redeploy) using the admin Test Controls panel.

Requirements:
- Run migration `supabase/migrations/013_add_runtime_flags.sql` once.
- Use an admin account (`profiles.is_admin = true`).

How to toggle:
- Go to `/dashboard/subscription`.
- In **Test Controls** > **Site Maintenance Mode**, click **Enable Maintenance** or **Disable Maintenance**.

Behavior:
- Public traffic is redirected to `/maintenance` when the runtime flag is enabled.
- API routes remain available (including Stripe webhooks).
- Changes apply in about 10 seconds (edge cache TTL).
- Local/dev (`NODE_ENV !== 'production'`) always ignores maintenance mode.

Bypass for internal testing:
- Set `MAINTENANCE_BYPASS_TOKEN`.
- Open `/maintenance`, expand **Staff access**, and enter the token to unlock that browser.
- Optional fallback: open any URL once with `?bypass=YOUR_TOKEN` to set the bypass cookie.

Emergency override:
- Set `MAINTENANCE_MODE=true` to force maintenance mode via env (requires redeploy).

### Plan Generation Reliability

Plan generation has multiple fallbacks to reduce dropped-trigger risk:
- Server trigger from checkout/webhook/success flows.
- Client-side retry trigger on the payment success page.
- Vercel cron safety net (`vercel.json`) calling `/api/internal/retry-plan-generation` every 2 minutes.
- DB lock lease to prevent concurrent generation for the same plan (avoids redundant Gemini calls).

Production setup:
- Set `INTERNAL_API_KEY`.
- Set `CRON_SECRET` in Vercel so cron requests are authorized.
- Run migration `supabase/migrations/016_add_plan_generation_lock.sql`.

### Password Requirements

Minimum password length is 8 characters (enforced both client-side and by Supabase auth config).

## Security

See `docs/SECURITY.md` for comprehensive details. Key measures:

- **Authentication:** Supabase Auth (email/password, minimum 8 chars)
- **Authorization:** Row Level Security on all tables + explicit `user_id` filters in API routes
- **HTTP Security Headers:** CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (configured in `next.config.ts`)
- **Input Sanitization:** HTML escaping in email templates (`escapeHtml`), HTML stripping in contact form (`stripHtml`), prompt injection protection for AI inputs (`sanitizeForPrompt`)
- **API Security:** No hardcoded secrets — `INTERNAL_API_KEY` must be set via env var. Error responses use generic messages (no `details: error.message` leaks)
- **Production Guards:** Dev-only features (Stripe bypass, admin debug panels, test controls) are gated behind `NODE_ENV !== 'production'`
- **Logging:** Sensitive `console.log` calls (user IDs, emails, Stripe IDs) are gated behind `isDev` checks. `console.error` calls are kept for production error tracking.

## Current Features

1. **User Authentication** - Email/password via Supabase Auth
2. **Intake Questionnaire** - Multi-step wizard with progress saving
3. **AI Plan Generation** - Personalized plans via Gemini API
4. **Sleep Diary Logging** - Daily entries with summary view and edits
5. **Weekly Diary Reviews** - AI review of the last 7 days
6. **Living Plan Updates** - Append-only plan updates + plan history
7. **Plan Viewing** - Beautiful web display with markdown rendering
8. **PDF Download** - Professional PDF export matching web design
9. **Email Notifications** - Plan ready emails via Resend
10. **Subscription Management** - Stripe subscriptions with free trial
11. **Blog** - Static blog with SSG
12. **Contact Form** - Rate-limited with input sanitization

## Roadmap Notes

See `PLAN-sleep-diary.md` for the sleep diary iteration plan and future enhancements.

## API Routes

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| `/api/intake/create` | POST | User | Create new intake submission |
| `/api/intake/[id]` | GET, PATCH, POST | User | Read/update intake |
| `/api/generate-plan` | POST | Internal key or User | Trigger AI plan generation |
| `/api/internal/retry-plan-generation` | GET | Cron secret or Internal key | Retry stale `generating` plans |
| `/api/plans/[id]/reset` | POST | User | Reset plan for regeneration (dev only) |
| `/api/plans/[id]/cancel` | POST | User | Cancel plan generation |
| `/api/diary` | GET, POST | User | Fetch/save diary entries |
| `/api/diary/review` | GET, POST | User | Fetch/generate weekly diary review |
| `/api/diary/plan-update` | POST | User | Generate 7-day plan update |
| `/api/diary/seed` | POST | User | Seed diary entries (dev only) |
| `/api/stripe/checkout` | POST | User | Create Stripe checkout session |
| `/api/stripe/webhook` | POST | Stripe signature | Handle Stripe webhooks |
| `/api/stripe/portal` | POST | User | Create Stripe customer portal session |
| `/api/stripe/cancel` | POST | User | Cancel Stripe subscription |
| `/api/contact` | POST | None (rate-limited) | Submit contact form |
| `/api/admin/settings` | GET, POST | Admin | Admin settings management |
| `/api/admin/runtime-flags` | GET, POST | Admin | Toggle runtime maintenance mode |
| `/api/verify-subscription` | GET | User | Check subscription status |

## Testing

```bash
# Run all tests
npm test

# Run tests once
npm run test:run
```

Tests are in `src/__tests__/`.

## Deployment

Designed for Vercel deployment.

### Checklist

1. Set all required environment variables in Vercel dashboard (see Environment Variables above)
2. Generate a strong `INTERNAL_API_KEY` (`openssl rand -base64 32`)
3. Set `STRIPE_MODE=live` for real billing (`test` for sandbox)
4. Configure Stripe webhook endpoint to point to `/api/stripe/webhook` in the same Stripe mode
5. Verify security headers with `curl -I https://your-domain.com`
6. Confirm admin debug panels are not visible in production
7. Test the full auth flow (signup, login, password reset)
8. Test plan generation end-to-end (intake, payment, plan delivery)

## License

Private project.
