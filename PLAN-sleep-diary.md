# Plan: Sleep Diary & Weekly AI Review

**Status:** Implemented (daily diary logging, weekly reviews, and living plan updates). This doc now tracks what shipped and what remains.

**Related docs:**
- [README](./README.md) - Project overview
- [Architecture](./docs/ARCHITECTURE.md) - Data flow and key components
- [Database Schema](./docs/database-schema.sql) - Current tables

---

## What Shipped

### Core UX
- Daily diary logging per plan (quick form + edits).
- Week grid summary + daily entry summaries.
- Weekly AI review available after 3 logged days.
- 7-day plan update card (triggers living plan update).
- Multi-plan diary hub (`/dashboard/diary`) + Sleep Diary tab in left nav.

### Living Plan Updates
- Plan updates are appended to `plans.plan_content` as a new section:
  `## Plan Update — Week of ...`
- Each update creates a new revision in `plan_revisions`.
- Plan view shows current revision at top + full plan content.
- History view shows "Changes in this update" (extracts the appended section).
- Update content includes a "**Why this change:**" paragraph tied to diary entries.

### Dev/Test Mode (NEXT_PUBLIC_STRIPE_ENABLED=false)
- Seed diary entries (3 or 7 days).
- Regenerate weekly review.
- Force 7-day update.
- These controls are hidden in live mode.

---

## Database

**Tables added for diary + updates:**
- `sleep_diary_entries` (daily logs)
- `weekly_reviews` (AI weekly summaries)
- `plan_revisions` (living plan history)

See:
- `supabase/migrations/005_add_sleep_diary.sql`
- `supabase/migrations/006_add_plan_revisions.sql`

---

## API Surface

- `POST /api/diary` - Create/update diary entry (upsert by plan + date)
- `GET /api/diary` - Fetch diary entries for a plan
- `POST /api/diary/review` - Generate weekly review
- `POST /api/diary/plan-update` - Generate 7-day plan update + revision
- `POST /api/diary/seed` - Seed diary entries (dev only)

---

## Current Prompt Expectations

**Weekly review** (after 3+ days logged):
- 3-4 short paragraphs
- Highlights wins, patterns, and one actionable tip
- Warm, supportive tone, no emojis

**Plan update** (after 7 days logged):
- Appends a new update section only (does not rewrite the full plan)
- Includes:
  - What to keep doing
  - One adjustment
  - "**Why this change:**" paragraph with diary-based evidence
  - Caution/context for next week

---

## Remaining Enhancements

- Per-nap logging (individual nap times)
- Charts/graphs for trends
- Push reminders
- Auto-trigger weekly review / plan update (optional)
- Deeper diffing of plan updates (show changed sections inline)
- Export diary data

---

## Verification Checklist

1. Create/edit diary entry for today.
2. Seed 3 days and generate weekly review.
3. Seed 7 days and trigger plan update.
4. Confirm plan revision shows in history and "Changes in this update" renders.
5. Confirm "Why this change" callout appears in the update.
6. Ensure dev/test buttons are hidden when Stripe is enabled.
