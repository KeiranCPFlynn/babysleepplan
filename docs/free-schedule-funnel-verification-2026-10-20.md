# Free schedule funnel: 20 October 2026

## Live verification before the local changes

One synthetic journey started from `/blog/baby-sleep-schedule-creator-how-to-build-one-in-minutes` and followed its top **Try Free** link. Fictional input was labelled `QA-20261020`; generation happened at approximately **05:12 UTC / 12:12 Bangkok**. It reached a visible daily timetable and guidance preview without an account or email. No clarification was needed. This verifies one successful request, not reliability across every age or input.

Browser inspection showed one of each expected event and requests to Google's collection endpoint with measurement ID `G-6BY828XR9W`. GA4 Realtime subsequently confirmed the same counts in account `384822293`, property `525013476`:

| Event | Received count |
|---|---:|
| `blog_cta_click` | 1 |
| `free_schedule_first_message` | 1 |
| `free_schedule_report_generated` | 1 |

The report event also appeared once under **Key events**. Treat this journey as synthetic when reviewing traffic and conversions on October 20. No account filters or GA4 configuration were changed. The test stopped before the email form, signup and checkout; actual PDF delivery and subscription conversion remain unverified.

Evidence is saved in the local `lunacradle-traffic-audit-2026-10-20` artifact directory alongside the original audit: `ga4-canary-realtime.txt`, `free-schedule-desktop.png`, and `free-schedule-mobile.png`.

## Local changes

- Explain what to enter and what the preview includes, with example input and an expandable explanation. State upfront that email unlocks full guidance/PDF and includes occasional tips.
- Remove the unused initial chat height and initial automatic scrolling so the first screen keeps its heading and input together.
- Scroll/focus the generated schedule when ready. Hide the chat input after completion, because it previously accepted text while its send handler did nothing.
- Count the first message once per mounted journey, including retries after failures; keep successful-session verification separate from that analytics count.
- Handle the API's HTTP 429 `rate_limited` response before generic errors, preserving its useful message.
- Record failures with bounded reasons (`generation`, `verification`, `rate_limited`, `network`, `timeout`). No raw errors or input are analytics parameters.
- Keep the existing report event name/key-event configuration, but remove baby age and extraction confidence from its parameters. Retain only `free_schedule: true`.
- Remove the duplicated brand suffix from the page title.

These are usability and measurement changes; they do not establish that traffic or rankings will increase. Claude's content/research package is a separate input to review and integrate.

## Validation

- **23 tests passed**: nine new browser-component tests plus fourteen existing generation/extraction tests. Coverage includes a pending request, success, clarification, failure/retry counting, rate limits, timeout/network errors, rejected input, analytics parameters, focus/completed-input behavior, and mocked email success/failure. All email delivery and external generation in automated tests were mocked.
- ESLint passed for the four changed/new TypeScript files. `git diff --check` passed.
- Chrome rendered the local route at desktop size and **390 × 844**. No horizontal overflow was observed; the input and Send button fit. The expandable example opened correctly. The screenshots contain the existing development-only admin controls; these are hidden by the existing production condition.
- Local preview analytics were disabled for the preview process so UI checks did not create further production GA4 activity. A placeholder model key was used for rendering only; no local generation API request was made. No environment file was changed.
- The full TypeScript check remains blocked by existing errors: readonly `NODE_ENV` assignments in `api/diary-seed.test.ts` (two) and `api/free-schedule-generate.test.ts` (one), plus nullable `AbortSignal` in `openai.test.ts`. These were also present before this work. An initial generated `.next/dev` diary-page type error disappeared after refreshing the local development output. There are no reported errors in the changed files. A full production build has not been verified.

## Release boundary

Changes remain local on `codex/free-schedule-funnel-clarity`. Existing `package.json` and `scripts/indexnow.mjs` work is unrelated and excluded. No push, deployment, content publication, outreach, email, signup or paid trial was performed.

After integrating and checking Claude's package, resolve the existing release check failures, review the full release diff and obtain deployment approval. Then smoke-test the released preview and its GA4 events. Any real email test requires approval of the exact sender, recipients, subject, full body and attachments before sending, as required by the working agreement.
