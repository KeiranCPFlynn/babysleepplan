# Free Schedule Builder — Build Plan

Last updated: 2026-02-19
Status: Approved for implementation

## 1. Goal

Build a free public page (`/free-schedule`) that converts social media traffic into app signups by giving parents a high-quality, personalised sleep schedule from minimal input — no account required.

Parents can paste a Reddit/Facebook post or chat conversationally. The system asks at most 3 follow-up questions (one at a time), generates an age-specific schedule, shows it immediately on screen, and emails a PDF after capturing an email address.

**This page also serves as the V2 chat UI prototype.** The chat components and follow-up logic are designed from the start to be reused in the V2 conversational intake flow (see `PLAN-v2-conversational-experience.md`).

---

## 2. Product Principles (inherited from V2 plan)

These apply directly to the free schedule UX:

1. **One thing at a time** — one question, one action per turn.
2. **Fast path first** — generate a usable schedule quickly, let parents get value before asking for anything.
3. **Low typing burden** — quick-reply chips for every question, textarea only for free-form pasting.
4. **Confidence loops** — brief summaries and assumption lines so parents know what the schedule is based on.
5. **Calm visuals** — soft motion, warm colours, no visual noise. Tired parents do not need excitement.
6. **Zero dead ends** — always give a path forward even when extraction fails.

---

## 3. User Flow

```
Landing → Chat (paste or type) → Extraction
       → [0–3 follow-up questions if needed]
       → On-screen schedule preview
       → "Email me the PDF" → email gate → PDF sent
       → "Get a full personalised plan" CTA → /signup
```

**Input options on landing:**
- "Paste a post" — opens a large textarea, then submits into chat
- "Just tell me what's happening" — focuses the standard message input

---

## 4. LLM Strategy

Use **Gemini** (existing integration) for Phase 1. This keeps the build fast and avoids new package dependencies. The chat component architecture is provider-agnostic, so swapping to Claude Haiku + Vercel AI SDK in Phase 2 (when V2 proper begins) is a route-level change only.

See `PLAN-v2-conversational-experience.md` Section 3 for the V2 provider decision matrix.

---

## 5. Tech Stack

No new dependencies required for Phase 1:

| Need | Solution |
|------|----------|
| Chat UI | New React components (shadcn/ui + Tailwind) |
| Extraction | Regex heuristics + Gemini fallback |
| Schedule generation | Gemini via existing `src/lib/gemini.ts` |
| Knowledge base | Existing `src/data/knowledge/` files |
| PDF | Existing `SleepPlanPDF` via `@react-pdf/renderer` |
| Email | Resend via `getResend()` with attachment |
| Rate limiting | Extend existing `src/lib/rate-limit.ts` |
| Animation | CSS-only (`transition`, `@starting-style`) — no motion library needed at this scale |

---

## 6. New Files

```
src/app/free-schedule/
  page.tsx                              # Server shell + metadata, public route
  free-schedule-client.tsx              # 'use client' state machine

src/app/api/free-schedule/
  generate/route.ts                     # POST: extract + generate schedule
  send-pdf/route.ts                     # POST: rate check + render PDF + email

src/lib/free-schedule/
  types.ts                              # ExtractedFields + ChatMessage types
  extractor.ts                          # Regex heuristics + Gemini fallback
  knowledge-loader.ts                   # Simplified age/issue-based knowledge loader

src/components/free-schedule/
  chat-interface.tsx                    # Message list + input + quick-reply chips
  schedule-preview.tsx                  # react-markdown schedule card
  email-gate.tsx                        # Email form + success state

src/lib/email/
  send-free-schedule.ts                 # PDF attachment email function

supabase/migrations/
  017_add_free_schedule_sessions.sql    # Minimal session table
```

## Existing Files to Modify

```
src/lib/rate-limit.ts      # Add 3 limiters + getClientIp() + hashValue()
src/app/page.tsx           # Nav link + hero secondary CTA + footer link
```

---

## 7. Core Types (`src/lib/free-schedule/types.ts`)

```typescript
export interface ExtractedFields {
  age_months: number | null
  wake_time: string | null       // "HH:MM" 24h
  bedtime: string | null         // "HH:MM" 24h
  naps_count: number | null
  nap_lengths: string | null     // e.g. "30–45 min"
  main_issue: string | null
  confidence_score: number       // 0.0–1.0
  assumptions: string[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
```

---

## 8. Extraction Logic (`src/lib/free-schedule/extractor.ts`)

**Heuristic regex parser runs first** (no API call, sub-millisecond). Gemini fallback only when `age_months === null` AND `confidence_score < 0.3`.

Regex patterns:

| Field | Pattern |
|-------|---------|
| Age (months) | `(\d+)\s*(?:month\|months\|mo\b)` |
| Age (weeks → months) | `(\d+)\s*(?:week\|weeks\|wk)` → divide by 4.33 |
| Age (years) | `(\d+)\s*(?:year\|years\|yr)` → × 12 |
| Wake time | "wakes at / up at / morning wake" + `(\d{1,2})(?::(\d{2}))?\s*(am\|pm)?` |
| Bedtime | "bedtime / goes to bed / down at" + time pattern |
| Nap count | `(\d+)\s*(?:x\s*)?naps?`; "no nap"→0, "one nap"→1, etc. |
| Nap length | `(\d+)(?:-(\d+))?\s*min(?:ute)?s?\s*naps?` |
| Main issue | Keyword map: "night waking", "early waking", "short naps", "bedtime battle", "nap resistance" |

**Confidence score:** `0.5` for age + `0.25` for wake_time + `0.1` for bedtime + `0.1` for naps_count + `0.05` for main_issue.

**Gemini extraction prompt** (when fallback triggers): JSON-only schema response. `sanitizeForPrompt(text, 1000)` applied. Max 1 LLM call for extraction per session.

---

## 9. Knowledge Loader (`src/lib/free-schedule/knowledge-loader.ts`)

Mirrors age-band logic in `src/app/api/generate-plan/route.ts` but as a standalone module with a module-level `Map` cache.

**Always loads:** `core-principles.txt`, `bedtime-routines.txt`

**Age-based (one file):** `age-0-3-months.txt` → `age-36-60-months.txt`

**Issue-based (when matched):** `problems-night-wakings.txt`, `problems-bedtime-resistance.txt`, `problems-early-waking.txt`, `problems-short-naps.txt`, `problems-falling-asleep.txt`

**Nap transitions:** Include `nap-transitions.txt` for ages 12–20 months.

All 25 knowledge files exist in `src/data/knowledge/`.

---

## 10. API: `POST /api/free-schedule/generate`

`runtime = 'nodejs'`, `maxDuration = 60`

**Request:**
```typescript
{
  messages: ChatMessage[]
  sessionId?: string
  extractedFields?: ExtractedFields
  questionsAsked: number          // 0, 1, or 2
}
```

**Flow:**
1. Hash client IP → check `freeSchedulePreviewLimiter` (10/day) → 429 if limited
2. Combine user messages into one text blob, run heuristic extraction, merge with `extractedFields` from client
3. Gemini fallback if age still null + low confidence
4. Determine next action:
   - If `age_months === null` and `questionsAsked < 3` → return `needs_info` (Q1: age + chips)
   - If `wake_time === null` and `questionsAsked < 3` → return `needs_info` (Q2: wake time + chips)
   - Optional Q3 for `main_issue` if `questionsAsked < 2`
   - If age still null after 3 questions → return terminal error
5. Assume `wake_time = '07:00'` if still missing, add to assumptions
6. Load knowledge base → build prompt → call Gemini → get schedule markdown
7. Upsert `free_schedule_sessions` via service role Supabase client
8. Return `{ status: 'complete', sessionId, extractedFields, scheduleMarkdown }`

**Follow-up questions (priority order):**

| # | When | Question | Chips |
|---|------|----------|-------|
| 1 | age missing | "How old is your baby?" | Newborn (0–3m), 4–6m, 6–9m, 9–12m, 12–18m, 18–24m, 2yr+ |
| 2 | wake_time missing | "What time do they usually wake up?" | Before 6am, 6–6:30am, 6:30–7am, 7–7:30am, After 7:30am |
| 3 | main_issue missing | "What's the main challenge?" | Night wakings, Hard to settle, Short naps, Early waking, Just need a schedule |

**Gemini prompt output structure** (under 600 words, compatible with `SleepPlanPDF` markdown parser):

```
## Sample Daily Schedule
| Time | Activity |   ← 4–6 rows

## Key Guidance
- [4–6 one-sentence bullets, age-specific and concrete]

## If/Then Adjustments
**If [situation]:** [action]   ← 2–3 blocks

## Assumptions
[One sentence listing any inferred values]

## Next Steps
[One sentence: what a full LunaCradle plan adds beyond this schedule]
```

---

## 11. API: `POST /api/free-schedule/send-pdf`

`runtime = 'nodejs'`, `maxDuration = 60`

**Request:** `{ sessionId: string, email: string }`

**Rate limit checks (in order, hard blocks):**
1. IP: `freeSchedulePdfIpLimiter` → 3 sends/day per IP
2. Email hash (in-memory): `freeSchedulePdfEmailDayLimiter` → 1 send/day per email
3. Email hash (DB monthly): `SELECT COUNT(*) WHERE email_hash = ? AND pdf_sent_at >= NOW() - INTERVAL '30 days'` → block if ≥ 3

**Flow:**
1. Validate email format
2. All rate checks pass
3. Fetch `report_content` + `extracted_fields` from DB by `session_id`
4. `createElement(SleepPlanPDF, { babyName: 'Your Baby', babyAge: 'X months old', createdDate, content })` → `renderToBuffer`
5. Call `sendFreeScheduleEmail(email, pdfBytes)` — uses `getResend()` directly (existing `sendEmail` wrapper doesn't support attachments)
6. Upsert `email_hash` + `pdf_sent_at` on session record
7. Return `{ success: true }`

---

## 12. Database Migration (`supabase/migrations/017_add_free_schedule_sessions.sql`)

```sql
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

CREATE INDEX idx_fss_session_id ON public.free_schedule_sessions (session_id);
CREATE INDEX idx_fss_email_hash_pdf ON public.free_schedule_sessions (email_hash, pdf_sent_at)
  WHERE email_hash IS NOT NULL AND pdf_sent_at IS NOT NULL;

ALTER TABLE public.free_schedule_sessions ENABLE ROW LEVEL SECURITY;
-- No anon/auth policies. All access via service_role key in API routes.
```

No PII stored: emails and IPs are SHA-256 hashed before insert. Pasted post text is never persisted; only structured `extracted_fields` JSON is stored.

---

## 13. Rate Limiter Additions (`src/lib/rate-limit.ts`)

Add to the bottom of the existing file:

```typescript
import { createHash } from 'crypto'
import { type NextRequest } from 'next/server'

export function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip') || '0.0.0.0'
}

export function hashValue(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export const freeSchedulePreviewLimiter = createRateLimiter('free-schedule-preview', {
  max: 10, windowMs: 24 * 60 * 60 * 1000,   // 10 previews/IP/day
})
export const freeSchedulePdfIpLimiter = createRateLimiter('free-schedule-pdf-ip', {
  max: 3, windowMs: 24 * 60 * 60 * 1000,    // 3 PDF sends/IP/day
})
export const freeSchedulePdfEmailDayLimiter = createRateLimiter('free-schedule-pdf-email', {
  max: 1, windowMs: 24 * 60 * 60 * 1000,   // 1 PDF send/email/day
})
```

---

## 14. Frontend Architecture

### `free-schedule-client.tsx` — State Machine

Three phases:

```
'chat'   →  (API status:'complete')   →  'preview'
'preview'  →  (email confirmed)  →  'email_sent'
```

Key state:
```typescript
messages: ChatMessage[]           // full conversation history
extractedFields: ExtractedFields | null
scheduleMarkdown: string | null
sessionId: string | null
questionsAsked: number
quickReplies: string[]
phase: 'chat' | 'preview' | 'email_sent'
isLoading: boolean
```

**Initial assistant message:** *"Hi! Tell me about your baby — their age and what's going on with sleep. You can paste a post from Reddit or Facebook, or just describe the situation."*

**Starter buttons** (shown before first user message):
- "Paste a post" → opens a textarea overlay, submits text as first user message
- "Start chatting" → focuses the main input

**On send:** Set `isLoading = true`, send API call, append assistant response to messages, update `extractedFields` and `quickReplies`. When `status === 'complete'`, set `scheduleMarkdown` and transition to `'preview'` phase.

### `chat-interface.tsx`

Following V2 principles from `PLAN-v2-conversational-experience.md` Section 6:

- Scrollable message list, auto-scrolls to bottom on new message
- User bubbles: right-aligned, sky/indigo tint
- Assistant bubbles: left-aligned, white with soft shadow
- **Typing indicator:** subtle pulse animation (CSS `@keyframes`) shown while `isLoading`
- **Message enter animation:** CSS fade + 8px slide up, 150ms, `prefers-reduced-motion` respected
- **Quick-reply chips:** `Button variant="outline" size="sm"` row below input, clicking sends chip text as user message (chips from V2 spec: pre-generated from known enum values)
- Textarea (not `<input>`): Enter sends, Shift+Enter inserts newline, disabled when loading

### `schedule-preview.tsx`

- `react-markdown` + `remark-gfm` (both already installed) renders the schedule markdown
- Table styled as a card (Tailwind striped rows, mobile-scrollable)
- Assumptions line in `text-slate-500 text-sm` below the card
- Disclaimer: "Informational only. Not medical advice." in muted footer text

### `email-gate.tsx`

- Heading: "Get your full schedule as a PDF — free"
- `react-hook-form` + `zod` email validation (both already installed)
- Submit → spinner overlay on button → success state (check icon + "Check your inbox!")
- Rate-limit error: specific message per limit type
- Network error: `sonner` toast

### `page.tsx` (Server Component)

```typescript
export const metadata: Metadata = {
  title: 'Free Baby Sleep Schedule Builder | LunaCradle',
  description: 'Paste your baby sleep situation or chat — get a free, personalised schedule instantly. No account needed.',
  alternates: { canonical: `${siteUrl}/free-schedule` },
}
```

Public shell: uses same marketing nav/footer as homepage. No auth required.

---

## 15. Analytics Events

Fired via `window.gtag?.('event', name, params)` — same pattern as rest of app.

| Event | Trigger |
|-------|---------|
| `free_schedule_first_message` | First user message sent |
| `free_schedule_follow_up` | `{ question_number }` — each follow-up shown |
| `free_schedule_report_generated` | `{ age_months, confidence_score }` — schedule returned |
| `free_schedule_email_submitted` | Email form submitted |
| `free_schedule_pdf_sent` | API confirms PDF sent |
| `free_schedule_cta_click` | "Get a full plan" link clicked in preview or email |

---

## 16. Homepage Changes (`src/app/page.tsx`)

**Nav** — add after the Blog link (≈ line 116):
```tsx
<Link href="/free-schedule" className="hidden md:inline-flex text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
  Free Schedule
</Link>
```

**Hero** — add a second line after "Credit card required" paragraph (≈ line 156):
```tsx
<p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
  Not ready?{' '}
  <Link href="/free-schedule" className="underline underline-offset-2 hover:text-slate-700">
    Try the free schedule builder
  </Link>{' '}— no account needed.
</p>
```

**Footer** — add `/free-schedule` to existing footer link list.

---

## 17. Email Template (`src/lib/email/send-free-schedule.ts`)

Calls `getResend()` directly (same lazy init as existing `src/lib/email/resend.ts`). Uses `sanitizeEmailSubject()` from `src/lib/sanitize.ts`.

Content: brief intro paragraph → bullet list of what's in the PDF → CTA button → `${NEXT_PUBLIC_APP_URL}/signup` → disclaimer footer.

Attachment: `{ filename: 'LunaCradle_Free_Sleep_Schedule.pdf', content: Buffer.from(pdfBytes) }`.

---

## 18. PDF Template

Reuse `SleepPlanPDF` from `src/components/pdf/sleep-plan-pdf.tsx` unchanged. Props:

```typescript
{
  babyName: 'Your Baby',          // No name collected in free flow
  babyAge: `${age_months} months old`,
  createdDate: '19 Feb 2026',
  content: scheduleMarkdown,      // The markdown from Gemini
}
```

The free schedule Gemini prompt output is structured to be compatible with the existing markdown parser in `SleepPlanPDF` (pipe tables, `##` headers, `- ` bullets, `**bold:**` inline).

---

## 19. Implementation Order

1. `src/lib/free-schedule/types.ts` — types, no logic
2. `src/lib/free-schedule/knowledge-loader.ts` — verify file loading from `src/data/knowledge/`
3. `src/lib/free-schedule/extractor.ts` — regex + Gemini fallback
4. `src/lib/rate-limit.ts` — add 3 limiters + IP/hash helpers
5. `supabase/migrations/017_add_free_schedule_sessions.sql` — apply to Supabase
6. `src/app/api/free-schedule/generate/route.ts` — extraction + generation
7. `src/lib/email/send-free-schedule.ts` — PDF attachment email
8. `src/app/api/free-schedule/send-pdf/route.ts` — rate checks + PDF render + email
9. `src/components/free-schedule/chat-interface.tsx`
10. `src/components/free-schedule/schedule-preview.tsx`
11. `src/components/free-schedule/email-gate.tsx`
12. `src/app/free-schedule/free-schedule-client.tsx`
13. `src/app/free-schedule/page.tsx`
14. `src/app/page.tsx` — nav link + hero secondary CTA + footer link
15. End-to-end test (see Verification below)

---

## 20. V2 Reuse Path

When V2 conversational intake begins (per `PLAN-v2-conversational-experience.md`):

- `chat-interface.tsx` can be lifted into the auth intake flow with zero structural changes — only the API endpoint and session model change
- `schedule-preview.tsx` becomes the base for richer plan display components
- The extraction state machine in `free-schedule-client.tsx` maps directly to the V2 tool-calling flow (each extracted field becomes a tool call)
- Swap Gemini for Claude Haiku + Vercel AI SDK at the route level only — client is provider-agnostic

---

## 21. Verification

```
# Happy path: verbose post
Paste: "My 8 month old wakes every 45 min, bedtime 7pm, up at 6am, 2 naps"
→ Expect: 0 follow-up questions, schedule generated, preview shown

# Minimal input: requires follow-ups
Type: "my 4 month old won't sleep"
→ Expect: Q1 (age) → user selects chip → Q2 (wake time) → user selects chip → schedule generated

# Email gate
Submit email → verify PDF arrives with correct content and LunaCradle branding

# Rate limiting
Hit /api/free-schedule/generate 11× from same IP → 11th returns 429
Submit same email twice for PDFs in one day → second returns rate-limited message

# Data hygiene
Check free_schedule_sessions row: confirm no plain email/IP, only hashed values
Confirm pasted post text is NOT stored (only extracted_fields JSONB)
```
