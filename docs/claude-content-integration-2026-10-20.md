# Claude content integration — 20 October 2026

Integrated from `/private/tmp/lunacradle-claude-content-2026-10-20`, starting with `00-INDEX.md`, onto `codex/free-schedule-funnel-clarity`. Integration base: `2d2f4dd`. Everything remains local.

## Included

- Replaced the schedule-creator and moving-to-own-room articles with the supplied drafts, retaining filenames, publication dates and URL paths. The own-room draft received the verification corrections below.
- Applied only the nine specified replacement blocks to the 18-month article: metadata/FAQ/sources, quick answer, total-sleep section, illustrative days and checklist, contextual CTA, regression section, two nap-refusal sentences, clinician paragraph and closing disclaimer. Unlisted sections remain unchanged. Three blocked publisher citations were replaced with the same papers' public PubMed records across the guides.
- Applied apps audit **A1, A2, R1–R3, C1, C2, C5, P1 and P2**, plus the related unsupported product, credential and efficacy corrections. The owner’s four “no” answers are reflected in the article. Retained the original article URL while changing its title and summary from an untested effectiveness ranking to a product comparison.
- Added a visible, explicitly illustrative example with a wake/nap/bedtime summary. “Use this example” fills and focuses an editable text box. It does not submit, fetch or track a start. The visitor's first submit button says “Build my schedule”; subsequent clarification turns say “Send”.
- Replaced the collapsed example and shortened the hero. The unsupported Evidence-based/Ages 0–5 tags remain removed. Email is optional and its full-guidance/PDF/tips terms remain visible. No generator, pricing, gating or email-delivery implementation was changed.
- Preserved GFM task-list classes and suppressed the decorative bullet beside checkboxes, leaving ordinary bullets intact.
- Files 04 and 05 remain reference material in the supplied package. No prospects were contacted and no outreach was published.

## Claim decisions and verification

| Claim or uncertainty | Decision |
|---|---|
| Hands-on app testing, independent self-ranking, implied efficacy and affiliate ambiguity | Added ownership/no-commission disclosure and an explicit public-information methodology. Removed hands-on language and the “Top Picks” ranking. No independent clinical review is implied. |
| “5.8 hours” Sleep Health survey; faster improvement from logging attributed to Behavioral Sleep Medicine | Removed. No supporting citation was provided or verified. |
| Diary entry takes under a minute; a specific nap-to-night-sleep pattern is reliably detected | Removed. Described the existing diary/AI weekly-review feature without a measured duration or outcome claim. Standard LunaCradle price/trial/card terms were checked against `src/lib/subscription.ts`. |
| Huckleberry free versus paid features | Confirmed against [current vendor pricing/features](https://huckleberrycare.com/pricing): free tracking, Plus predictions/insights/schedule creator, Premium sleep plans and AI chat. Removed misleading limitations and dollar figures rather than confuse annual equivalents with monthly billing. |
| Hatch product, price, membership term and toddler cues | Used Hatch Baby and confirmed basic lights/sounds plus Time-for-Rise/Time-for-Bed cues from [Hatch's support page](https://help.hatch.co/hc/en-us/articles/34903995447959-Your-Hatch-Baby-Purchase). That page states both three- and six-month inclusions, so no definite included term remains. Hardware price could not be independently verified on the product offer and is omitted. No early-waking effectiveness claim remains. |
| Taking Cara Babies course prices and credentials | Removed the unverified $129–$199 range and first-hand course endorsement. Used the [current provider biography](https://www.takingcarababies.com/pages/about-taking-cara-babies) for nursing/NICU experience and linked current classes instead of asserting prices. |
| Other competitor details | Checked retained descriptions against Baby Connect, Glow Baby, Sprout, SNOOZ, Calm, Headspace and The Baby Sleep Site's public pages, linked inline. Removed Baby Connect PDF-format specificity, untested caregiver usability, Sprout schedule-template claims, infant/toddler suitability claims for general audio apps, and unsupported superiority language. Removed the Sleepeasy paragraph rather than present unverified credentials, current app availability, method efficacy or press claims. |
| AAP room-sharing advice | Confirmed the six-month wording in the [AAP 2022 release](https://www.aap.org/en/news-room/news-releases/aap/2022/american-academy-of-pediatrics-updates-safe-sleep-recommendations-back-is-best/) and [current parent guide](https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/a-parents-guide-to-safe-sleep.aspx). Qualified the draft FAQ so six months does not read as a guarantee of safety. Clarified that age/safe-space checklist items are essential. |
| NHS bedding and temperature | Corrected the draft's blanket statement: NHS distinguishes loose/unsafe bedding from lightweight bedding used safely or a sleeping bag. Updated the NHS URL to its current destination. Added the [Lullaby Trust's hot-weather context](https://www.lullabytrust.org.uk/baby-safety/safer-sleep-information/room-temperature/) instead of implying every home can maintain 16–20°C. |
| Sleep ranges and studies | Confirmed AASM ranges/endorsement, the NSF newborn range, Mindell 2009 bedtime-routine trial, Mindell 2006 review, INSIGHT's observational design/40-minute comparison, and the sound-machine paper's hospital-nursery threshold against primary records. WHO's 11–14-hour figure is also confirmed by its [official 2019 guidance announcement](https://www.who.int/EN/news-room/detail/24-04-2019-to-grow-up-healthy-children-need-to-sit-less-and-play-more); the direct PDF was unavailable to the web fetch. The article continues attributing its numerical recommendation to AASM. |
| Static example and timing promises | The example is illustrative, within the guide's practical ranges, and uses the same timetable-plus-tips format as the verified preview. It is not a model output or clinical recommendation. Did not add the proposed “under a minute” promise because actual reliability at that speed is unmeasured. |

## Validation

- **28 tests passed** across `blog.test.ts`, `blog-content-integration.test.tsx` and `free-schedule-client.test.tsx`, excluding ignored `.claude` worktree copies. Coverage includes frontmatter parsing, retained internal targets, task-list rendering, example-fill/edit/send behavior, analytics counts and existing mocked delivery failure/success tests. All email sends and generation calls in tests are mocked.
- **ESLint passed** for all six changed/new TypeScript files. `git diff --check` passed.
- All four local article routes returned **HTTP 200**. Rendered JSON-LD parsed successfully: BlogPosting/citations, BreadcrumbList and four FAQ entries on each; the own-room guide additionally has five ordered HowTo steps. Canonical **paths** are unchanged; the local preview uses its existing localhost base setting. This checks the rendered structures, not eligibility for Google's rich results.
- **Nine unique internal article/route targets** resolve in the repo, including the corrected `/#pricing` destination. **32 public external URLs** were checked: 29 returned HTTP 2xx, while three Unsplash profile URLs returned 401 to the scripted checker but were retrieved and verified through the web tool. Original attribution links remain intact. Publisher DOI destinations that returned 403 were replaced with the same papers' accessible PubMed records.
- Chrome at **390 × 844** showed no horizontal overflow. Both input and Build button fit above the fold even with the existing development-only admin strip; button bottom was 791 px. The example-fill browser check left the editable text visible and the Build button enabled. Automated tests separately confirmed no fetch or analytics event until Send/Build.
- The GFM checklist was visually checked in Chrome: six disabled checkboxes on the own-room guide, with no extra bullets. The 18-month checklist's four boxes also passed rendered-component tests.
- The root project's TypeScript check still reports the same four pre-existing errors: readonly `NODE_ENV` assignments in `api/diary-seed.test.ts` (two) and `api/free-schedule-generate.test.ts` (one), and nullable `AbortSignal` in `openai.test.ts`. A temporary config excluded ignored `.claude` worktree copies; project source and root Next-generated types were included. No errors were reported in changed files. No production build is claimed.

Evidence in the traffic-audit artifact directory: `integration-link-check.json`, `integration-render-check.json`, `integrated-tool-mobile.png`. Local preview analytics were disabled and no local generator API was called. The preview server is stopped at handoff.

## Before an approved release

Recheck **every retained competitor feature, price link and subscription term on the actual release day**; this integration check is dated October 20, not a promise about a later publication date. In particular, resolve Hatch's inconsistent membership terms if adding an exact term or price. Recheck LunaCradle's price/trial and active founding offer. Resolve the existing TypeScript release-check failures, then review the full release diff before deployment approval. No scheduled job was created to perform these checks.

The five older guides flagged by the package were addressed in the subsequent file-06 accuracy pass below. Other passages have not received a full clinical review; there is no claim that the entire site has been medically reviewed.

Uncommitted `package.json` and `scripts/indexnow.mjs` are preserved and excluded from commits. No push, deployment, indexing request, email, signup, checkout, contact or external publication was performed.

## File 06 accuracy follow-up

Applied after items 1–3 as a separate local commit, **Correct outdated AAP room-sharing and white-noise claims**. Updated the five specified posts: bassinet transition, safe sleep/SIDS, co-sleeping, sleep environment and white noise. Their publication dates and URLs are unchanged; modification dates reflect October 20, 2026, with no future dates. No indexing request was submitted for the environment guide or any other page.

Corrected the room-sharing duration, qualified the SIDS reduction as “as much as”, separated product-manual bassinet limits from the AAP's stop-swaddling advice, attributed the numeric temperature range to NHS/Lullaby Trust, removed the unsupported monitor false-alarm claim and replaced blanket monitor discouragement with the AAP's specific warning against using them to prevent SIDS. Corrected sound-machine thresholds, authorship and practical precautions, and added primary sources. Spencer's 16/20 versus 5/20 finding and Hugh's three outputs above 85 dBA were checked against primary abstracts ([Spencer](https://pubmed.ncbi.nlm.nih.gov/2405784/), [Hugh publisher record](https://publications.aap.org/pediatrics/article-pdf/133/4/677/1099550/peds_2013-3617.pdf)). The draft's first-author given name was incorrect; the publisher lists Sarah C. Hugh. Article citations use “Hugh et al.”.

The draft's blanket “no guidance” wording was narrowed: [AAP's current parent guidance](https://www.healthychildren.org/English/safety-prevention/all-around/Pages/how-noise-affects-your-child.aspx) recommends greater distance and short use. A hospital-nursery threshold is not presented as a universal safe home setting. Fixed-volume and distance instructions elsewhere in the same white-noise article were made consistent. The old room-sharing quotation in the previously integrated own-room guide was paraphrased, retaining the historical explanation while allowing the requested global grep to return no matches.

Two directly unsafe statements encountered in the affected posts were also corrected against [AAP safe-sleep guidance](https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/a-parents-guide-to-safe-sleep.aspx): recommending a chair if a feeding parent might fall asleep, and unconditionally endorsing a floor mattress for infant sleep. These are narrow corrections, not a full rewrite or review of those posts. The environment guide's unrelated introductory claims remain outside this pass, as specified in file 06.

Validation: **23 tests passed** (`blog.test.ts` plus expanded content integration tests covering all nine edited articles), ESLint passed for the changed test, and `git diff --check` passed. No application code changed in this follow-up. The previously reported TypeScript failures and unverified production build remain unchanged.

Ran the exact requested command against the whole blog directory:

```sh
grep -rniE "ideally (the )?(first year|12 months)|optimally|AAP[^.]{0,80}50 ?(dB|decibels)" content/blog
```

Result: **no output, zero matches**. Grep exit status 1 means no matches; it was not a command failure.
