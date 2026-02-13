# Architecture Overview

## Data Flow

### 1. User Registration
```
User signs up (8-char min password)
  → Supabase Auth creates user
  → Trigger creates profile row
  → Welcome email sent (HTML-escaped user name)
```

### 2. Intake Flow
```
User starts questionnaire
  → POST /api/intake/create (creates intake_submission + baby)
  → User fills multi-step form
  → Auto-saves on step change (PATCH /api/intake/[id])
  → Saves on page close (POST /api/intake/[id] via sendBeacon)
  → User submits → intake status = 'submitted'
```

### 3. Payment Flow (if Stripe enabled)
```
User clicks "Get Plan"
  → POST /api/stripe/checkout (creates Stripe session)
  → User completes payment on Stripe
  → Stripe webhook → POST /api/stripe/webhook
  → Creates plan row (status: 'generating')
  → Triggers POST /api/generate-plan (authenticated via INTERNAL_API_KEY)
```

### 4. Plan Generation
```
/api/generate-plan receives planId
  → Verifies auth (INTERNAL_API_KEY bearer token OR user ownership)
  → Fetches plan, baby, intake data from Supabase
  → Loads relevant knowledge base files
  → Sanitizes user-provided fields (sanitizeForPrompt)
  → Builds prompt with all context
  → Calls Gemini API (120s timeout, 5min overall timeout)
  → Saves plan_content to database
  → Sends "plan ready" email (HTML-escaped baby name)
```

### 5. Plan Viewing
```
User visits /dashboard/plans/[id]
  → Server component fetches plan + baby
  → Renders markdown with custom components
  → PDF download generates client-side via @react-pdf/renderer
```

### 6. Sleep Diary + Weekly Review
```
User logs daily sleep entry
  → POST /api/diary (upsert by plan_id + date)
  → Entry shows in diary grid and daily summary list
After 3+ days logged
  → POST /api/diary/review to generate weekly review
  → User-provided fields sanitized before AI prompt
  → Review stored in weekly_reviews and rendered in diary page
```

### 7. Living Plan Updates
```
User triggers 7-day plan update
  → POST /api/diary/plan-update
  → Uses diary entries (+ weekly review if available)
  → User-provided fields sanitized before AI prompt
  → Appends "Plan Update — Week of ..." section to plan_content
  → Inserts new plan_revisions row
  → Plan view shows current revision + update summary
```

## Key Components

### Intake Form (`src/components/forms/intake/`)
- `intake-form.tsx` - Main wizard with step navigation
- `steps/` - Individual step components
- Uses react-hook-form + zod for validation
- Auto-saves progress on step change and page close

### Plan Generation (`src/app/api/generate-plan/route.ts`)
- `loadKnowledgeBase()` - Smart loader picks relevant files based on age, problems, comfort level
- `calculateAge()` - Handles premature baby adjustment
- Format helpers convert DB values to readable text
- User-provided fields wrapped with `sanitizeForPrompt()` before prompt interpolation
- 120 second timeout on Gemini calls, 5 minute overall generation timeout
- Auth: accepts `INTERNAL_API_KEY` bearer token (for webhook-triggered calls) or verifies user owns the plan

### Plan Display (`src/app/dashboard/plans/[id]/`)
- `page.tsx` - Server component, three states (generating/failed/complete)
- `plan-content.tsx` - Custom ReactMarkdown components
- `download-pdf-button.tsx` - PDF generation with @react-pdf/renderer
- `sleep-plan-pdf.tsx` - PDF document component

### Sleep Diary (`src/app/dashboard/diary/` + `src/app/dashboard/plans/[id]/diary/`)
- Diary hub page for multi-plan access
- Plan diary page with week grid, daily summaries, and update prompts
- Uses `PlanContent` to render reviews and updates consistently

### Diary APIs (`src/app/api/diary/`)
- `route.ts` - Fetch/save daily entries (upsert)
- `review/route.ts` - Weekly review generation (sanitizes user fields before AI prompt)
- `plan-update/route.ts` - Append plan updates + plan revisions (sanitizes user fields before AI prompt)
- `seed/route.ts` - Dev-only diary seeding

### Knowledge Base (`src/data/knowledge/`)
Plain text files loaded at runtime. The loader selects files based on:
- Baby's age (adjusted for premature)
- Selected problems from intake
- Parent's crying comfort level (1-5 scale)

Results are cached in memory to avoid repeated file reads.

## Security Architecture

### Environment Variable Validation
`src/lib/env.ts` validates all required env vars at server startup (imported in root layout). Skipped during the Next.js build phase. Throws a clear error listing all missing variables.

### Input Sanitization (`src/lib/sanitize.ts`)
Shared utilities used across the app:
- `escapeHtml(str)` - Escapes `&`, `<`, `>`, `"`, `'` for safe HTML email rendering
- `stripHtml(str)` - Removes HTML tags (used in contact form storage)
- `sanitizeEmailSubject(subject)` - Strips `\r\n` to prevent email header injection
- `sanitizeForPrompt(input, maxLength)` - Truncates, strips prompt injection patterns, wraps in `<user_input>` delimiters

### API Security
- **Internal API key:** `INTERNAL_API_KEY` env var with no hardcoded fallback. Used for service-to-service calls (webhook → generate-plan). Must be a strong random secret (32+ chars).
- **Error responses:** Generic error messages in API responses. Detailed errors logged server-side only.
- **Defense-in-depth:** API queries filter by `user_id` even though RLS provides DB-level protection.

### HTTP Security Headers (`next.config.ts`)
Applied to all routes via Next.js `headers()` config:
- `Content-Security-Policy` - Restricts script/style/image/frame/connect sources
- `Strict-Transport-Security` - HSTS with includeSubDomains
- `X-Frame-Options: DENY` - Prevents clickjacking
- `X-Content-Type-Options: nosniff` - Prevents MIME-type sniffing
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` - Disables camera, microphone, geolocation
- `X-XSS-Protection: 0` - Modern best practice (rely on CSP instead)

### Production Guards
- Stripe dev bypass returns 503 in production if `NEXT_PUBLIC_STRIPE_ENABLED=false`
- Admin debug panels and test controls require `NODE_ENV !== 'production'`
- Sensitive `console.log` calls gated behind `isDev` / `NODE_ENV !== 'production'`
- `console.error` retained for production error tracking

### Email Security
- All interpolated values (names, baby names, amounts) passed through `escapeHtml()`
- Email subjects sanitized with `sanitizeEmailSubject()` to prevent header injection

### AI Prompt Security
- User-controlled fields sanitized with `sanitizeForPrompt()` before interpolation
- Common prompt injection patterns stripped (e.g. "ignore previous instructions")
- Fields truncated to reasonable max lengths
- Content wrapped in `<user_input>` delimiters for clear separation

## Database Design

### Row Level Security
All tables have RLS enabled. Users can only access rows where `user_id = auth.uid()`. API routes also apply explicit `user_id` filters as defense-in-depth.

### Relationships
```
profiles (1) ←→ (many) babies
profiles (1) ←→ (many) intake_submissions
babies (1) ←→ (many) intake_submissions
intake_submissions (1) ←→ (1) plans
plans (1) ←→ (many) sleep_diary_entries
plans (1) ←→ (many) weekly_reviews
plans (1) ←→ (many) plan_revisions
```

### Intake Data Storage
Most fields are dedicated columns for easy querying. The `data` JSONB column stores additional/overflow data.

## Authentication

Using Supabase Auth with email/password (8 character minimum):
- `src/lib/supabase/server.ts` - Server-side client
- `src/lib/supabase/client.ts` - Client-side client
- `src/lib/auth.ts` - Auth helpers (`requireAuth`, `getUser`)
- `src/middleware.ts` - Route protection
- `src/components/forms/signup-form.tsx` - Signup with 8-char min enforcement
- `src/components/forms/update-password-form.tsx` - Password reset with 8-char min enforcement

## Dev Mode

When `NEXT_PUBLIC_STRIPE_ENABLED=false`:
- Skips payment, directly creates plan
- Shows regenerate/cancel/retry buttons
- Useful for testing prompt changes
- Enables diary seed, weekly review regenerate, and force plan update
- Admin debug panels visible (show user ID, Stripe customer ID, subscription status)
- Test subscription controls available

**Production safety:** The Stripe dev bypass is blocked when `NODE_ENV=production` (returns 503). Debug panels and test controls are also hidden in production.

## PDF Generation

Uses @react-pdf/renderer for client-side PDF generation:
- `src/components/pdf/sleep-plan-pdf.tsx` - Document component
- Custom markdown parser (regex-based)
- Roboto font loaded from Google Fonts
- Aggressive character cleaning (emojis break PDF rendering)
- Baby-friendly design with soft pastels

## Email

Using Resend:
- `src/lib/email/send.ts` - Send functions (welcome, plan ready, payment confirmation)
- All user-provided values HTML-escaped via `escapeHtml()` before interpolation
- Subject lines sanitized via `sanitizeEmailSubject()` to prevent header injection
- Sends "plan ready" notification after generation
- Sends payment confirmation after Stripe checkout
