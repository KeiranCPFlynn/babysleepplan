# V2 Plan: Conversational Intake and Support Experience

Last updated: 2026-02-16
Status: Draft planning reference

## 1. Goal

Build a high-quality conversational experience that feels calm, supportive, and fast for tired parents, while preserving the reliability and safety of the current MVP.

This plan covers:

- Conversational intake (replacing the step form UX)
- Plan follow-up chat for adjustments and advice
- Optional voice mode (push-to-talk first)
- Motion and visual design direction for a friendlier, premium feel

## 2. Product Principles (for tired parents)

1. One thing at a time: one clear question, one clear action.
2. Fast path first: get to a usable plan quickly, then refine.
3. Low typing burden: chips, suggested replies, and optional voice input.
4. Confidence loops: short confirmations and plain-language summaries.
5. Calm visuals: soft motion, warm colors, no visual noise.
6. Zero dead ends: always provide Back, Edit, Skip, and Continue.

## 3. Recommended Stack

Keep current foundation:

- Next.js 16 (App Router), React 19, TypeScript, Tailwind 4
- Supabase auth + data model
- Gemini plan generation pipeline

Add for v2:

| Layer | Recommendation | Why |
|---|---|---|
| Streaming chat | `ai` + `@ai-sdk/google` | Fast streaming primitives, easier event handling, lower custom plumbing |
| Motion | `framer-motion` | Reliable orchestration for message transitions, stagger, and state changes |
| Conversation state | Keep local React state + persisted draft in Supabase JSON | Minimal complexity, preserves resume behavior |
| Voice capture | Browser `MediaRecorder` + Web Audio meter | No native app requirement, works in web flow |
| Transcription | Server endpoint wrapping one managed STT provider | Better quality and consistency than browser-only speech APIs |
| TTS (optional) | Start with browser SpeechSynthesis, then provider TTS if needed | Fast MVP for read-aloud mode, low initial complexity |

## 4. Architecture Direction

### 4.1 Conversational Intake

Reuse existing schema and validation:

- `src/lib/validations/intake.ts`
- `intake_submissions` columns + `data` JSON

New flow:

1. Parent opens intake chat.
2. Assistant asks one question at a time.
3. Each answer maps to existing intake fields.
4. Draft autosaves after each valid response.
5. Final summary card confirms all captured data.
6. Submit uses the existing intake submission + payment flow.

Implementation note:

- Do not replace database contracts.
- Replace only interaction layer first.

### 4.2 Streaming API Design

Add route:

- `src/app/api/chat/intake/route.ts`

Suggested stream event types:

- `token` (assistant text chunks)
- `field_update` (when parser confidently maps user answer to schema field)
- `validation_error` (friendly follow-up prompt)
- `summary` (review card payload)
- `done`
- `error`

This keeps UI responsive while still updating structured form data safely.

### 4.3 Plan Follow-Up Chat

Add route:

- `src/app/api/chat/plan/route.ts`

Scope:

- Answer parent questions about existing plan and diary trends
- Suggest small plan adjustments conversationally
- Require explicit confirm before writing persistent plan updates

### 4.4 Voice Mode (Phase 2+)

Start with push-to-talk:

1. Hold button to record
2. Upload audio to transcription endpoint
3. Inject transcript as user message
4. Optional "read aloud" toggle for assistant responses

Keep full-duplex realtime voice out of initial rollout. It is higher risk and harder to QA.

## 5. UX and Visual Direction

### 5.1 Visual System

- Warm, family-safe palette with high contrast text
- Soft gradients and low-amplitude ambient background motion
- Rounded, tactile message cards and quick-reply chips
- Typographic hierarchy tuned for scannability on little sleep

### 5.2 Motion System

Use motion intentionally:

- Message enter: short fade + slide (120-180ms)
- Assistant typing indicator: subtle pulse
- Step transitions: crossfade + slight shift
- Confirm/save states: quick, unambiguous feedback

Respect accessibility:

- Honor `prefers-reduced-motion`
- No essential information hidden behind animation

### 5.3 Speed and Ease Targets

- Time to first assistant response: under 1.2s
- Median intake completion time: under 6 minutes
- One-tap quick replies for common answers where possible

## 6. Phased Delivery Plan

### Phase 0: Spike (5-7 days)

Deliverables:

- Streaming chat prototype bound to a small subset of intake fields
- Motion prototype with final message rhythm
- Feature flag in dashboard to switch between form and chat

Exit criteria:

- Stable streaming on desktop + mobile browsers
- Draft save and resume confirmed

### Phase 1: Conversational Intake GA Candidate (1.5-2.5 weeks)

Deliverables:

- Full intake question coverage with existing validation rules
- Review/confirm screen and existing submit path integration
- Analytics events for completion/dropoff/edits
- Form fallback toggle retained

Exit criteria:

- No regression in intake submit success rate
- Completion rate equal to or better than current form baseline

### Phase 2: Plan Follow-Up Chat (1-1.5 weeks)

Deliverables:

- Contextual plan Q&A route and UI
- Guardrails for medical/safety escalation language
- Confirm-before-write behavior for persistent updates

Exit criteria:

- Follow-up usage and satisfaction signals positive
- Support burden does not increase

### Phase 3: Voice Beta (2-3 weeks)

Deliverables:

- Push-to-talk transcription
- Optional assistant read-aloud
- Mic permission UX and fallback handling

Exit criteria:

- Voice success rate acceptable on target mobile devices
- No meaningful increase in abandonment

Total expected range: 5-8 weeks for full v2 scope.

## 7. Branch and Release Strategy

Create long-lived feature branch:

- `codex/v2-conversational-experience`

Recommended flags:

- `NEXT_PUBLIC_CHAT_INTAKE_ENABLED`
- `NEXT_PUBLIC_CHAT_PLAN_ENABLED`
- `NEXT_PUBLIC_VOICE_MODE_ENABLED`

Release in slices:

1. Internal dogfood
2. Small percent of real users
3. Default on only after metric thresholds are met

## 8. Data and Safety Guardrails

1. Keep schema mapping explicit. Never rely on free text only.
2. Reconfirm key safety inputs before final submit:
   - age context
   - night waking severity
   - parent comfort constraints
3. Keep medical disclaimer and red-flag escalation language visible in chat.
4. Log structured events for QA:
   - mapped fields
   - validation retries
   - submit success/fail reasons

## 9. Success Metrics

Primary:

- Intake completion rate
- Time to completed intake
- Plan generation conversion after intake

Secondary:

- Parent follow-up engagement in first 7 days
- Number of edit cycles before submit
- Voice usage rate and transcription failure rate

Quality guardrails:

- No increase in failed/invalid intakes
- No increase in support tickets tied to confusion

## 10. Recommendation

This is a good use of time if done as staged delivery, not a single large rewrite.

Recommended next move:

1. Build Phase 0 spike behind feature flags.
2. Compare against current form using completion and conversion metrics.
3. Continue to full rollout only if metrics improve.
