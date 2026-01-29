# Baby Sleep Plan App

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
│   │   └── stripe/          # Payment webhooks
│   ├── auth/            # Auth callbacks
│   └── dashboard/       # Protected app pages
│       ├── diary/           # Sleep diary hub
│       ├── intake/          # Questionnaire flow
│       └── plans/           # View generated plans
│
├── components/
│   ├── forms/           # Form components (intake wizard)
│   ├── pdf/             # PDF generation components
│   └── ui/              # Base UI components
│
├── data/
│   └── knowledge/       # Sleep training knowledge base (txt files)
│
├── lib/
│   ├── supabase/        # Supabase client setup
│   ├── gemini.ts        # Gemini AI client
│   ├── auth.ts          # Auth helpers
│   └── email/           # Email templates
│
└── types/               # TypeScript types
```

## Knowledge Base

The app uses a curated knowledge base in `src/data/knowledge/`:

- **Age-specific:** `age-0-3-months.txt`, `age-4-6-months.txt`, etc.
- **Problem-specific:** `problems-night-wakings.txt`, `problems-short-naps.txt`, etc.
- **Methods:** `methods-gentle.txt`, `methods-gradual.txt`, `methods-direct.txt`
- **Core:** `core-principles.txt`, `red-flags.txt`, `sleep-environment.txt`

The plan generator loads relevant files based on baby's age, selected problems, and parent's crying comfort level.

## Database Schema

See `docs/database-schema.sql` for the full schema. Key tables:

- **profiles** - User accounts (extends Supabase auth)
- **babies** - Baby info (name, DOB, temperament)
- **intake_submissions** - Questionnaire responses
- **plans** - Generated sleep plans
- **plan_revisions** - Living plan history
- **sleep_diary_entries** - Daily logs per plan
- **weekly_reviews** - AI weekly diary reviews

All tables use Row Level Security (RLS) so users can only access their own data.

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google AI
GEMINI_API_KEY=

# Stripe (optional - set NEXT_PUBLIC_STRIPE_ENABLED=false to skip)
NEXT_PUBLIC_STRIPE_ENABLED=true
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=

# Email
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
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

## Roadmap Notes

See `PLAN-sleep-diary.md` for the sleep diary iteration plan and future enhancements.

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/intake/create` | POST | Create new intake submission |
| `/api/intake/[id]` | GET, PATCH, POST | Read/update intake |
| `/api/generate-plan` | POST | Trigger AI plan generation |
| `/api/plans/[id]/reset` | POST | Reset plan for regeneration (dev only) |
| `/api/diary` | GET, POST | Fetch/save diary entries |
| `/api/diary/review` | POST | Generate weekly diary review |
| `/api/diary/plan-update` | POST | Generate 7-day plan update |
| `/api/diary/seed` | POST | Seed diary entries (dev only) |
| `/api/stripe/checkout` | POST | Create Stripe checkout session |
| `/api/stripe/webhook` | POST | Handle Stripe webhooks |

## Testing

```bash
# Run all tests
npm test

# Run tests once
npm run test:run
```

Tests are in `src/__tests__/`.

## Deployment

Designed for Vercel deployment. Ensure all environment variables are set in Vercel dashboard.

## License

Private project.
