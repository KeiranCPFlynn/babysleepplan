# GLM handoff: migrate LunaCradle from Gemini to OpenAI

Prepared 8 October 2026. Repository: `/Users/Kdog/Code-Projects/babysleep`.

## Task and approved scope

Implement the user's chosen OpenAI switch locally. The user accepted the recommendation of GPT-6.1 Sol for paid plans and GPT-6 Luna for free schedules. This document is the implementation handoff; no application code has been migrated yet.

Use these exact model IDs. Do not silently substitute another model if access fails.

| Workload | Model | Initial reasoning effort |
| --- | --- | --- |
| Paid plan generation | `gpt-6.1-sol` | `low` |
| Diary review | `gpt-6.1-sol` | `low` |
| Diary plan update | `gpt-6.1-sol` | `low` |
| Free schedule generation | `gpt-6-luna` | `none` |
| Free schedule extraction and YES/NO topic check | `gpt-6-luna` | `none` |
| Admin social schedule primary | `gpt-6.1-sol` | `low` |
| Admin social fallback and repair | `gpt-6-luna` | `none` |

Diary routing to Sol is the conservative implementation choice: it preserves the existing higher-capability role. Moving diary calls to Luna is a separate optimization after comparing quality. The initial effort settings above are recommendations to test, not a demonstrated quality result.

Preserve prompts, curated knowledge selection, sanitization, evidence appendices, Markdown/PDF compatibility, API response shapes, authentication, billing gates, rate limits, plan locks, and persistence behavior. Do not add streaming, chat features, a provider router, schema migrations, or a broad prompt rewrite.

## Working tree and permissions

At handoff preparation, the branch was `main`, with pre-existing changes to `package.json` and an untracked `scripts/indexnow.mjs`. Recheck before editing. Preserve and exclude unrelated changes from commits. Use a `codex/` task branch and make focused local commits after verification.

Follow the user's agent working agreement. Local implementation and installed-tool tests are authorized. New dependencies require approval: prefer server-side native `fetch`, already available in this Next.js/Node project, rather than adding an SDK. Do not push, merge, deploy, change hosted secrets or billing, create cloud resources, or enable recurring work without specific approval. Do not send emails, including test emails, without approval of the exact final draft and recipients. Mock or intercept email paths during testing.

## Files and behavior to migrate

- `src/lib/gemini.ts`: current shared client. `getModel()` uses `gemini-3.1-pro-preview`; `getFlashModel()` uses `gemini-3.8-flash`.
- `src/app/api/generate-plan/route.ts`: paid generation, provider-specific transient error checks, two maximum attempts, 100-second attempt timeout, 1.5-second base backoff, 300-second route budget. Preserve lease and status handling, knowledge loading, and evidence assembly.
- `src/app/api/diary/review/route.ts`: short diary review; current timeout is 60 seconds.
- `src/app/api/diary/plan-update/route.ts`: appends an update to the existing plan; current timeout is 60 seconds. Preserve the exact update heading and the existing `Why this change` fallback.
- `src/lib/free-schedule/extractor.ts`: rename `extractWithGemini` to a provider-neutral name and update callers. Preserve heuristic-first extraction, confidence calculation, sanitation, null handling, and empty-field fallback on extraction failure.
- `src/app/api/free-schedule/generate/route.ts`: extraction, YES/NO topic check, standard schedule, admin social generation, fallback, and repair. Preserve classification failure behavior (returns true), validation, repair gates, daily caps, and response contracts. Standard generation is bounded to 20 seconds; admin primary to 30 seconds, fallback to 20 seconds, repair to 12 seconds.
- `src/lib/env.ts` and `src/__tests__/env.test.ts`: replace required `GEMINI_API_KEY` with `OPENAI_API_KEY`; preserve client/build skips and unrelated requirements. Test that the Gemini key is no longer required.
- `.env.example`, `README.md`, `docs/index.md`, `docs/ARCHITECTURE.md`, and `docs/SECURITY.md`: update active provider setup and accurate timeout information. Historical planning documents and migration comments need not be rewritten.

Search the repository for remaining active Gemini imports, `generateContent`, `response.text()`, and provider-specific names. The extractor and admin fallback are easy to miss. Remove the obsolete client only after all active callers are migrated. The unused Google dependency can remain temporarily to avoid touching the unrelated dirty manifest; record that explicitly. Do not edit `.env.local` or copy credentials into documentation.

## Integration approach

Create a small server-only OpenAI helper, for example `src/lib/openai.ts`, using `POST https://api.openai.com/v1/responses` with the server-side `OPENAI_API_KEY`. Confirm the current request schema in official documentation before implementing. Use standard processing, `store: false`, no hosted tools, and no external search. Keep model constants and role selection in this helper; optional server-only model overrides are acceptable if simple and documented.

Return a provider-neutral result with text and usage; do not recreate Gemini's response shape. With raw REST, extract text from documented assistant output message content blocks of type `output_text`. Do not assume the SDK convenience property `output_text` exists on REST JSON, or assume `output[0]` is always a text message. Refusal, incomplete/truncated output, empty text, malformed JSON, and HTTP failures must not be saved as successful plans.

Use `AbortController` for request deadlines and clear timers in `finally`. A `Promise.race` timeout alone leaves the underlying request running. Retain current route budgets and avoid nested retries: paid generation must remain bounded to two attempts. Retry transient connection errors, retryable rate limits, and server failures; do not retry invalid parameters, missing model access, authentication errors, or exhausted billing quota as if they were temporary. Handle error bodies without exposing keys, prompts, baby information, or diary content in logs or public errors. Treat upstream error text as data.

Set output limits appropriate to each task, accounting for reasoning tokens. Inspect completion status before accepting text and test that a full plan fits. Sol does not support `none` or `minimal`; use `low`. Omit sampling parameters such as `temperature` for reasoning-enabled requests. Luna supports `none`. If using structured output for extraction, confirm Responses `text.format` syntax and preserve existing unknown/null and failure behavior; do not use Chat Completions parameters accidentally.

Capture model and available input/output/reasoning/cached token counts in privacy-safe server logs or existing instrumentation. No new database columns or analytics service are needed. Record actual billed usage during any authorized smoke test rather than treating estimates as measurements.

## Validation and acceptance

Add meaningful mocked tests around the helper and migrated flows. Verify model routing, REST text extraction with reasoning blocks before messages, refusal/incomplete/empty output handling, missing key behavior, request abort, bounded retry, extraction JSON fallback, admin primary/fallback/repair, and unchanged response shapes. Preserve evidence and append-only diary behavior. Do not call live services in unit tests.

Run the installed checks: `npm run test:run`, `npm run lint`, and `npm run build`. Inspect script changes first; report pre-existing failures separately. Do not install or auto-download missing components to make checks pass.

For live verification, use only an existing user-owned OpenAI account with access to the chosen models. Small, bounded synthetic tests are allowed by the working agreement within existing ordinary service usage; check the account and usage implications first. Never use real family records for a comparison, automatically trigger email delivery, or create a new billed resource. If an OpenAI key/account is unavailable, complete mocked validation and report live verification as unverified. Missing credentials do not prevent preparing the implementation.

Before rollout, compare representative synthetic cases: young infant, prematurity/adjusted age, medical caution, gentle-method preference, conflicting constraints, multiple sleep challenges, and a diary-driven adjustment. Check adherence to existing safety rules, schedule consistency, personalization, Markdown rendering, latency, and total cost. Do not claim clinical quality based only on passing code tests. A full provider benchmark is not required for the local code migration; record the amount of actual quality review performed.

Done means every active AI call uses the chosen OpenAI role, env/docs/tests agree, core behavior is preserved, checks are reported accurately, and focused changes are locally committed. Deliver a concise summary with commit ID, checks, measured or unverified live results, and required rollout steps. Preparing code is authorized; production deployment remains a separate approval boundary.

## Costs and rollout notes

Standard short-context list rates checked 8 October 2026: Sol input $2 and output $10 per million tokens; Luna input $0.10 and output $0.50. At an illustrative 8,000 input and 2,000 billable output tokens, 1,000 Sol plans cost about $36. This is not measured usage; extra reasoning, retries, classifier/extraction calls, and caching charges or savings affect the bill. Recheck prices at implementation time.

Prepare instructions for setting `OPENAI_API_KEY` in the existing deployment environment and selecting the model defaults. The user or a separately authorized action must apply hosted secret changes and deployment. Leave existing Google credentials intact so a revert remains possible. Rollback is a revert of the focused migration commits and restoration of the previous deployment; it does not reverse API spend or change existing saved plans.

## Official references

- [GPT-6 model guidance and migration compatibility](https://developers.openai.com/api/docs/guides/latest-model)
- [Responses API reference](https://developers.openai.com/api/reference/resources/responses/methods/create)
- [Responses migration guide](https://developers.openai.com/api/docs/guides/migrate-to-responses)
- [Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [API pricing](https://developers.openai.com/api/docs/pricing)

Verify exact IDs, schema, and account availability against these sources. If access to the selected models is unavailable, explain the concrete issue and smallest alternative; do not choose a replacement without the user.
