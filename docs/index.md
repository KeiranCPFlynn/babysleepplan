# Documentation Index

## Quick Start
- [README](../README.md) - Project overview, setup, and development

## Architecture
- [Architecture Overview](./ARCHITECTURE.md) - Data flow, key components, design decisions

## Database
- [Database Schema](./database-schema.sql) - Full SQL schema with RLS policies
- [Migrations](./migrations/) - Incremental schema changes

## Planned Features
- [Sleep Diary Plan](../PLAN-sleep-diary.md) - Diary iteration plan + future enhancements

## Key Files

### API Routes
| File | Purpose |
|------|---------|
| `src/app/api/generate-plan/route.ts` | AI plan generation with knowledge base |
| `src/app/api/diary/route.ts` | Sleep diary read/write (daily entries) |
| `src/app/api/diary/review/route.ts` | Weekly diary review generation |
| `src/app/api/diary/plan-update/route.ts` | 7-day plan updates + history |
| `src/app/api/intake/[id]/route.ts` | Intake CRUD operations |
| `src/app/api/stripe/webhook/route.ts` | Stripe payment handling |

### Core Components
| File | Purpose |
|------|---------|
| `src/components/forms/intake/intake-form.tsx` | Multi-step intake wizard |
| `src/app/dashboard/plans/[id]/page.tsx` | Plan view page |
| `src/app/dashboard/plans/[id]/diary/page.tsx` | Plan diary page |
| `src/app/dashboard/diary/page.tsx` | Diary hub for multi-plan access |
| `src/components/pdf/sleep-plan-pdf.tsx` | PDF document generation |

### Configuration
| File | Purpose |
|------|---------|
| `src/lib/gemini.ts` | Gemini AI client setup |
| `src/lib/supabase/server.ts` | Server-side Supabase client |
| `src/middleware.ts` | Route protection |

## Knowledge Base

Sleep training knowledge in `src/data/knowledge/`:

**By Age:**
- `age-0-3-months.txt` through `age-18-24-months.txt`

**By Problem:**
- `problems-night-wakings.txt`
- `problems-short-naps.txt`
- `problems-bedtime-resistance.txt`
- `problems-early-waking.txt`
- `problems-falling-asleep.txt`

**By Method (based on crying comfort 1-5):**
- `methods-gentle.txt` (level 1-2)
- `methods-gradual.txt` (level 3)
- `methods-direct.txt` (level 4-5)

**General:**
- `core-principles.txt`
- `red-flags.txt`
- `sleep-environment.txt`
- `bedtime-routines.txt`
- `regressions.txt`
- `nap-transitions.txt`
- `night-weaning.txt`
- `parent-factors.txt`
