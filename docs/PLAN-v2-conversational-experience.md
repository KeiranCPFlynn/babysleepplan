# V2 Plan: Conversational Intake and Support Experience

Last updated: 2026-02-17
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

## 3. LLM Provider Strategy

Use the best model for each job rather than defaulting to a single provider. The Vercel AI SDK (`ai` package) supports multiple providers with a unified interface, so switching or mixing providers per route has zero architectural overhead.

| Job                   | Provider / Model                                               | Why                                                                                                                                                                   |
| --------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Conversational intake | Claude Haiku (`@ai-sdk/anthropic`)                             | Excellent at warm, natural conversation with reliable structured output via tool use. Fast and cost-effective for real-time chat (~$0.01 per intake).                 |
| Plan generation       | Keep Gemini (`@ai-sdk/google`) for now, evaluate Claude Sonnet | Current pipeline works and is tuned. Evaluate a swap in Phase 1 by running both in shadow mode and comparing output quality.                                          |
| Diary weekly review   | Claude Haiku or Gemini Flash                                   | Lower-stakes summarization — optimize for cost and speed.                                                                                                             |
| Plan follow-up chat   | Claude Sonnet (`@ai-sdk/anthropic`)                            | Needs to reason over plan content + diary data and produce nuanced guidance. Sonnet balances quality and cost here.                                                   |
| Transcription (STT)   | Deepgram Nova-3 (primary), OpenAI Whisper (fallback)           | Deepgram: ~300ms latency, $0.0043/min — ideal for push-to-talk. Whisper: gold-standard accuracy fallback for poor audio.                                              |
| TTS (read-aloud)      | OpenAI TTS or ElevenLabs                                       | Warm, natural voice matters for tired parents. Browser SpeechSynthesis sounds robotic and varies across devices. Defer to Phase 3 but spec the integration point now. |

Decision: finalize provider choices during Phase 0 spike with a side-by-side quality and latency comparison.

## 4. Recommended Stack

Keep current foundation:

- Next.js 16 (App Router), React 19, TypeScript, Tailwind 4
- Supabase auth + data model
- Existing Gemini plan generation pipeline (until evaluated for swap)

Add for v2:

| Layer                 | Recommendation                                                               | Why                                                                                                                                                    |
| --------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Streaming chat        | `ai` + `@ai-sdk/anthropic` + `@ai-sdk/google`                                | Provider-agnostic streaming primitives. Use the best model per route without changing the client code.                                                 |
| Structured extraction | AI SDK tool calling + Zod schemas                                            | Guarantees valid JSON for intake field mapping. Eliminates custom parsing. Reuses existing Zod schemas from `intake.ts`.                               |
| Motion                | `motion` (lightweight successor to framer-motion) or CSS `@starting-style`   | Evaluate both in spike. `motion` is ~50% smaller than framer-motion. CSS-only may suffice for the described animations (fade+slide, pulse, crossfade). |
| Conversation state    | Local React state + message history persisted in Supabase + structured draft | Enables conversation resume, QA debugging, and potential support handoff.                                                                              |
| Voice capture         | Browser `MediaRecorder` + Web Audio meter                                    | No native app requirement, works in web flow.                                                                                                          |
| Transcription         | Server endpoint calling Deepgram Nova-3 API                                  | ~300ms latency for push-to-talk. Whisper fallback for quality edge cases.                                                                              |
| TTS                   | Server endpoint calling OpenAI TTS API                                       | Warm, consistent voice across devices. Defer to Phase 3.                                                                                               |

## 5. Architecture Direction

### 5.1 Conversational Intake

Reuse existing schema and validation:

- `src/lib/validations/intake.ts`
- `intake_submissions` columns + `data` JSON

New flow:

1. Parent opens intake chat.
2. Assistant asks one question at a time.
3. Each answer is extracted via tool calling and mapped to existing intake fields.
4. Draft autosaves after each successful tool call.
5. Quick-reply chips are shown for questions with known enum values (falling asleep methods, sleep problems, etc.).
6. Final summary card confirms all captured data.
7. Submit uses the existing intake submission + payment flow.

Implementation notes:

- Do not replace database contracts.
- Replace only the interaction layer first.
- Pre-generate quick-reply chips from existing enum values in the Zod schemas to reduce typing burden and token costs.

### 5.2 Structured Extraction via Tool Calling

Instead of custom stream event parsing, use the AI SDK's built-in tool calling to map user answers to intake schema fields. This gives guaranteed structure, native Zod validation, and provider-agnostic behavior.

Add route:

- `src/app/api/chat/intake/route.ts`

Define tools that correspond to intake field groups:

```typescript
// Example: tools map directly to intake schema sections
const intakeTools = {
  updateSleepSchedule: tool({
    description: 'Record the baby\'s current bedtime and wake time',
    parameters: z.object({
      bedtime: z.string(),
      wakeTime: z.string(),
      fallingAsleepMethod: z.string().optional(),
    }),
    execute: async (data) => {
      // Validate against existing intake schema
      // Persist to draft in Supabase
      // Return confirmation message
    }
  }),
  updateNightWakings: tool({
    description: 'Record night waking frequency and duration',
    parameters: z.object({
      count: z.number().min(0).max(20),
      duration: z.string(),
      description: z.string().optional(),
    }),
    execute: async (data) => { /* validate + save */ }
  }),
  updateNaps: tool({
    description: 'Record nap schedule details',
    parameters: z.object({
      napCount: z.number().min(0).max(10),
      napDuration: z.string(),
      napLocation: z.string().optional(),
    }),
    execute: async (data) => { /* validate + save */ }
  }),
  updateSleepProblems: tool({
    description: 'Record selected sleep challenges',
    parameters: z.object({
      problems: z.array(z.string()),
      details: z.string().optional(),
    }),
    execute: async (data) => { /* validate + save */ }
  }),
  updatePreferences: tool({
    description: 'Record parent preferences and comfort level',
    parameters: z.object({
      cryingComfortLevel: z.number().min(1).max(5),
      constraints: z.string().optional(),
    }),
    execute: async (data) => { /* validate + save */ }
  }),
  updateGoals: tool({
    description: 'Record what success looks like for this family',
    parameters: z.object({
      successDescription: z.string(),
      additionalNotes: z.string().optional(),
    }),
    execute: async (data) => { /* validate + save */ }
  }),
  showSummary: tool({
    description: 'Show the review summary card with all collected data',
    parameters: z.object({}),
    execute: async () => { /* fetch draft, return full summary */ }
  }),
}
```

Benefits over custom event parsing:

- Model outputs valid JSON — no regex or custom parsers
- Zod validation happens at the boundary, reusing existing schemas
- The AI SDK handles `tool_call` streaming events natively
- Works identically across Claude, GPT, and Gemini

Stream events the client needs to handle:

- `text-delta` (assistant text chunks — handled by AI SDK)
- `tool-call` (structured field updates — handled by AI SDK)
- `error` (standard error handling)

### 5.3 Conversation State Management

Message history:

- Store the full message array in Supabase alongside the structured draft (`intake_submissions.conversation_history` JSONB column).
- On resume, reconstruct context by loading the conversation history and injecting a system summary of collected fields so far.
- Cap conversations at 50 messages. At 40 messages, prompt the assistant to summarize and wrap up.

Context window management:

- Intake conversations are short (~20-30 turns). No sliding window needed for intake.
- For plan follow-up chat (potentially longer), use a sliding window of the last 20 messages with a system-injected summary of earlier context.

Resume behavior:

- If parent closes tab and returns, reload the persisted conversation history.
- Assistant picks up with: "Welcome back! Here's where we left off..." followed by a summary of what's been captured and what's still needed.

### 5.4 Plan Follow-Up Chat

Add route:

- `src/app/api/chat/plan/route.ts`

Scope:

- Answer parent questions about existing plan and diary trends
- Suggest small plan adjustments conversationally
- Require explicit confirm before writing persistent plan updates

Context injection:

- System prompt includes: current plan content, recent diary entries, baby age and context
- Use sliding window (last 20 messages) for longer conversations

### 5.5 Voice Mode (Phase 3)

Start with push-to-talk:

1. Hold button to record
2. Upload audio to server transcription endpoint (Deepgram Nova-3)
3. Inject transcript as user message
4. Optional "read aloud" toggle using server-side TTS (OpenAI TTS API)

STT provider comparison (evaluate in Phase 0 spike):

| Provider         | Latency | Quality   | Cost        | Best for                   |
| ---------------- | ------- | --------- | ----------- | -------------------------- |
| Deepgram Nova-3  | ~300ms  | Very good | $0.0043/min | Real-time push-to-talk     |
| OpenAI Whisper   | ~1-3s   | Excellent | $0.006/min  | Accuracy on poor audio     |
| AssemblyAI       | ~1-2s   | Excellent | $0.01/min   | Async, speaker diarization |
| Google Cloud STT | ~1s     | Good      | $0.006/min  | Already in GCP ecosystem   |

Recommendation: Deepgram primary (speed wins for short push-to-talk clips), Whisper fallback for retries on low-confidence transcriptions.

Keep full-duplex realtime voice out of initial rollout. It is higher risk and harder to QA.

## 6. UX and Visual Direction

### 6.1 Visual System

- Warm, family-safe palette with high contrast text
- Soft gradients and low-amplitude ambient background motion
- Rounded, tactile message cards and quick-reply chips
- Typographic hierarchy tuned for scannability on little sleep

### 6.2 Quick-Reply Chips

Pre-generate chips from existing enum values to minimize typing:

- Falling asleep methods: "Rocking", "Feeding", "Patting", "Independent", "Other"
- Sleep problems: "Hard to settle", "Frequent wakings", "Early waking", "Short naps", etc.
- Nap locations: "Crib", "Stroller", "Car seat", "Arms", etc.
- Waking durations: "Under 5 min", "5-15 min", "15-30 min", "30-60 min", etc.
- Crying comfort level: visual 1-5 scale with descriptive labels

Chips reduce token costs (shorter user messages) and speed up intake for tired parents.

### 6.3 Motion System

Use motion intentionally:

- Message enter: short fade + slide (120-180ms)
- Assistant typing indicator: subtle pulse
- Step transitions: crossfade + slight shift
- Confirm/save states: quick, unambiguous feedback
- Tool call results (field saved): brief checkmark animation

Evaluate in Phase 0 spike:

- `motion` package (lightweight successor to framer-motion, ~50% smaller bundle)
- CSS-only with `@starting-style` + `transition-behavior: allow-discrete` (no JS dependency, good browser support)
- Choose whichever delivers the target animations with less bundle weight

Respect accessibility:

- Honor `prefers-reduced-motion`
- No essential information hidden behind animation

### 6.4 Speed and Ease Targets

- Time to first token: under 800ms (achievable with Claude Haiku)
- Full response render: under 3s for typical single-question turns
- Median intake completion time: under 6 minutes
- One-tap quick replies for common answers where possible
- Optimistic UI: show typing indicator immediately on send, before API call resolves

## 7. Phased Delivery Plan

### Phase 0: Spike (5-7 days)

Deliverables:

- Streaming chat prototype bound to a small subset of intake fields (sleep schedule + night wakings)
- Tool calling integration with Zod schema validation
- Motion prototype with final message rhythm (evaluate `motion` vs CSS-only)
- Quick-reply chip prototype
- Feature flag in dashboard to switch between form and chat
- LLM provider comparison: run intake conversations against Claude Haiku, Gemini Flash, and GPT-4o-mini — compare latency, output quality, and cost

Exit criteria:

- Stable streaming on desktop + mobile browsers
- Tool calling reliably extracts structured data from conversational input
- Draft save and resume confirmed
- LLM provider decision finalized with documented comparison

### Phase 1: Conversational Intake GA Candidate (1.5-2.5 weeks)

Deliverables:

- Full intake question coverage with existing validation rules via tool calling
- Conversation history persistence and resume behavior
- Quick-reply chips for all enum-based questions
- Review/confirm screen and existing submit path integration
- Analytics events for completion/dropoff/edits
- Form fallback toggle retained
- Conversation flow tests (scripted multi-turn test suites)

Exit criteria:

- No regression in intake submit success rate
- Completion rate equal to or better than current form baseline
- All intake fields correctly captured in 95%+ of test conversations
- Edge cases handled: multi-answer messages, contradictions, out-of-range values

### Phase 2: Plan Follow-Up Chat (1-1.5 weeks)

Deliverables:

- Contextual plan Q&A route and UI
- Sliding window context management for longer conversations
- Guardrails for medical/safety escalation language
- Confirm-before-write behavior for persistent updates

Exit criteria:

- Follow-up usage and satisfaction signals positive
- Support burden does not increase

### Phase 3: Voice Beta (2-3 weeks)

Deliverables:

- Push-to-talk transcription via Deepgram
- Optional assistant read-aloud via OpenAI TTS
- Mic permission UX and fallback handling
- Graceful degradation when mic is denied or unavailable

Exit criteria:

- Voice success rate acceptable on target mobile devices
- Transcription accuracy >90% for typical parent utterances
- No meaningful increase in abandonment

Total expected range: 5-8 weeks for full v2 scope.

## 8. Cost Estimation and Monitoring

### Per-interaction cost estimates

| Interaction                           | Tokens (est.)  | Cost (Claude Haiku)     | Cost (Gemini Flash) |
| ------------------------------------- | -------------- | ----------------------- | ------------------- |
| Full intake conversation (~25 turns)  | ~12-15k tokens | ~$0.01-0.02             | ~$0.005-0.01        |
| Plan follow-up question (single turn) | ~3-5k tokens   | ~$0.005                 | ~$0.003             |
| Diary weekly review                   | ~4-6k tokens   | ~$0.005                 | ~$0.003             |
| Voice transcription (30s clip)        | n/a            | n/a (Deepgram: ~$0.002) | n/a                 |

At scale (1,000 intakes/month): ~$10-20/month for intake conversations. Very manageable.

### Monitoring

- Log token usage per conversation in Supabase (input tokens, output tokens, model, cost).
- Set alerts for anomalous usage: conversations >50 messages, single turns >2k tokens.
- Monthly cost dashboard grouped by interaction type.
- Conversation length limits: cap at 50 messages with a graceful "let's wrap up and review what we have" prompt at message 40.

## 9. Branch and Release Strategy

Create long-lived feature branch:

- `feat/v2-conversational-experience`

Recommended flags:

- `NEXT_PUBLIC_CHAT_INTAKE_ENABLED`
- `NEXT_PUBLIC_CHAT_PLAN_ENABLED`
- `NEXT_PUBLIC_VOICE_MODE_ENABLED`

Release in slices:

1. Internal dogfood
2. Small percent of real users (A/B test against form baseline)
3. Default on only after metric thresholds are met

A/B test setup:

- Use feature flags + user cohort assignment (hash of user ID mod N)
- Track all success metrics per cohort
- Minimum sample size before making rollout decisions

## 10. Data and Safety Guardrails

### Schema and validation

1. Keep schema mapping explicit via tool calling. The model must use defined tools to update fields — free text alone never persists to the intake draft.
2. Reconfirm key safety inputs before final submit:
   - age context
   - night waking severity
   - parent comfort constraints
3. Keep medical disclaimer and red-flag escalation language visible in chat.

### Prompt security

4. Extend `src/lib/sanitize.ts` for chat message sanitization before including in LLM context.
5. System prompt hardening: clear boundaries on assistant scope — sleep guidance only, no medical diagnoses, no medication advice.
6. Output filtering: reject or flag assistant responses that contain medical advice beyond sleep hygiene.
7. Conversation scope enforcement: if parent goes off-topic, the assistant gently redirects to the intake flow.

### Logging and QA

8. Log structured events for QA:
   - tool calls with parameters and results
   - validation retries and error types
   - submit success/fail reasons
   - full conversation history (for debugging, not displayed to other users)

## 11. Testing Strategy

### Conversation flow tests

- Scripted multi-turn test conversations that verify all intake fields get captured correctly.
- Run against each candidate LLM provider to validate tool calling reliability.
- Minimum coverage: happy path, skip-heavy path, verbose single-message path, edit/correction path.

### Edge case coverage

- User gives multiple answers in one message ("bedtime is 7pm and she wakes up at 6am, usually 3 wakings")
- User contradicts a previous answer
- User provides out-of-range values
- User asks a question instead of answering
- User sends empty or very short messages
- Conversation resume after tab close

### Regression testing

- Existing intake validation test suite must pass with no changes.
- A/B comparison: track structured output completeness between chat and form intakes.

### Load and latency testing

- Verify time-to-first-token targets under concurrent load.
- Verify Supabase write latency doesn't degrade with conversation history persistence.

## 12. Success Metrics

Primary:

- Intake completion rate
- Time to completed intake
- Plan generation conversion after intake

Secondary:

- Parent follow-up engagement in first 7 days
- Number of edit cycles before submit
- Voice usage rate and transcription accuracy
- Quick-reply chip usage rate (higher = less typing burden)

Quality guardrails:

- No increase in failed/invalid intakes
- No increase in support tickets tied to confusion
- Tool calling success rate >95% (structured extraction reliability)

Cost guardrails:

- Per-intake LLM cost stays under $0.05
- No runaway conversations (enforce message cap)

## 13. Recommendation

This is a good use of time if done as staged delivery, not a single large rewrite.

Recommended next move:

1. Build Phase 0 spike behind feature flags.
2. Run LLM provider comparison (Claude Haiku vs Gemini Flash vs GPT-4o-mini) for intake chat quality, latency, and tool calling reliability.
3. Compare chat intake against current form using completion and conversion metrics.
4. Continue to full rollout only if metrics improve.
