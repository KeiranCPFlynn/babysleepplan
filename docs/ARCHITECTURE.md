# Architecture Overview

## Data Flow

### 1. User Registration
```
User signs up → Supabase Auth creates user → Trigger creates profile row
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
  → Triggers POST /api/generate-plan
```

### 4. Plan Generation
```
/api/generate-plan receives planId
  → Fetches plan, baby, intake data from Supabase
  → Loads relevant knowledge base files
  → Builds prompt with all context
  → Calls Gemini API (120s timeout)
  → Saves plan_content to database
  → Sends "plan ready" email
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
After 7 days logged
  → POST /api/diary/review to generate weekly review
  → Review stored in weekly_reviews and rendered in diary page
```

### 7. Living Plan Updates
```
User triggers 7-day plan update
  → POST /api/diary/plan-update
  → Uses diary entries (+ weekly review if available)
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
- `loadKnowledgeBase()` - Smart loader picks relevant files
- `calculateAge()` - Handles premature baby adjustment
- Format helpers convert DB values to readable text
- 120 second timeout on Gemini calls

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
- `review/route.ts` - Weekly review generation
- `plan-update/route.ts` - Append plan updates + plan revisions
- `seed/route.ts` - Dev-only diary seeding

### Knowledge Base (`src/data/knowledge/`)
Plain text files loaded at runtime. The loader selects files based on:
- Baby's age (adjusted for premature)
- Selected problems from intake
- Parent's crying comfort level (1-5 scale)

## Database Design

### Row Level Security
All tables have RLS enabled. Users can only access rows where `user_id = auth.uid()`.

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

Using Supabase Auth with email/password:
- `src/lib/supabase/server.ts` - Server-side client
- `src/lib/supabase/client.ts` - Client-side client
- `src/lib/auth.ts` - Auth helpers (`requireAuth`, `getUser`)
- `src/middleware.ts` - Route protection

## Dev Mode

When `NEXT_PUBLIC_STRIPE_ENABLED=false`:
- Skips payment, directly creates plan
- Shows regenerate/cancel/retry buttons
- Useful for testing prompt changes
 - Enables diary seed, weekly review regenerate, and force plan update

## PDF Generation

Uses @react-pdf/renderer for client-side PDF generation:
- `src/components/pdf/sleep-plan-pdf.tsx` - Document component
- Custom markdown parser (regex-based)
- Roboto font loaded from Google Fonts
- Aggressive character cleaning (emojis break PDF rendering)
- Baby-friendly design with soft pastels

## Email

Using Resend:
- `src/lib/email/send.ts` - Send functions
- `src/lib/email/templates/` - Email templates
- Sends "plan ready" notification after generation
