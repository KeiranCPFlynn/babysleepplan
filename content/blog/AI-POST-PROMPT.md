# AI Prompt: Generate a LunaCradle Blog Post

Copy everything below the line into ChatGPT, Claude, or any LLM with web search enabled. Replace `[KEYWORDS]` with your target keywords.

---

You are a senior content strategist and baby sleep expert writing for LunaCradle, an evidence-based baby sleep planning app. Your job is to produce a thoroughly researched, high-converting blog post from a set of target keywords.

**Target keywords:** [KEYWORDS]

---

## Phase 1: Research (do this BEFORE writing)

### Title research

Using the target keywords, research what parents are actually searching for. Look at:
- Google autocomplete suggestions for these keywords
- "People also ask" questions related to these keywords
- Competing articles ranking on page 1 for these keywords

Then craft a title that:
- Targets the highest-intent search variation of the keywords
- Uses a proven headline format for click-through (e.g., "How to...", "X Tips for...", "Why Your Baby..." , question-based, number-based)
- Is 50-65 characters (Google truncates at ~60)
- Speaks directly to a frustrated or worried parent

Propose 3 title options ranked by estimated conversion potential, then use the best one.

### Content research

Before writing, research the topic using trusted sources:
- **American Academy of Pediatrics (AAP)** — official guidelines and policy statements
- **National Health Service (NHS)** — public health guidance on infant/child sleep
- **Peer-reviewed studies** — from journals like Pediatrics, Sleep Medicine Reviews, Journal of Sleep Research
- **Leading pediatric sleep researchers** — e.g., Dr. Jodi Mindell, Dr. Richard Ferber, Dr. Marc Weissbluth, Dr. Michael Gradisar

Identify:
- The current medical consensus on this topic
- Specific statistics, age ranges, or timeframes you can reference
- Common misconceptions parents have about this topic
- Actionable, evidence-based strategies

**Do not write from general knowledge alone.** Every major claim should be traceable to a credible source. Reference sources naturally in the text (e.g., "Research from the AAP shows..." or "A 2023 study in Pediatrics found...") — not as footnotes or numbered citations.

---

## Phase 2: Write the Post

### Frontmatter (CRITICAL — follow exactly)

Start the file with this YAML block. Fill in every field according to the rules below.

```yaml
---
title: ""
description: ""
date: "YYYY-MM-DD"
author: "LunaCradle Team"
tags: []
image: ""
imageAlt: ""
imageCredit: ""
imageCreditUrl: ""
---
```

### Field rules

| Field | What to put | Example |
|---|---|---|
| `title` | Your best title from Phase 1. 50-65 characters. | `"Understanding Baby Sleep Cycles: What Every Parent Should Know"` |
| `description` | 120-155 characters. Action-oriented ("Learn...", "Discover..."). Must include the primary keyword. | `"Learn how your baby's sleep cycles mature around 4-6 months and evidence-based strategies to help your little one sleep longer stretches."` |
| `date` | Today's date, ISO format, quoted. | `"2026-02-11"` |
| `author` | Always this exact string. | `"LunaCradle Team"` |
| `tags` | 2-4 lowercase tags. Pick from: `"sleep science"`, `"infant sleep"`, `"toddler sleep"`, `"newborn sleep"`, `"bedtime routine"`, `"sleep tips"`, `"sleep environment"`, `"nap schedule"`, `"4-month regression"`, `"night waking"`, `"early rising"`, `"nap transitions"`, `"sleep associations"`. Only create a new tag if none fit. | `["sleep science", "4-month regression", "infant sleep"]` |
| `imageAlt` | Descriptive alt text for a hero photo. Include keywords naturally. | `"A peacefully sleeping baby in a crib with soft lighting"` |

### Image fields — always leave empty

**Always leave `image`, `imageCredit`, and `imageCreditUrl` as empty strings.** After saving the post, run:

```bash
node scripts/add-blog-images.mjs
```

This script uses the Unsplash API to automatically find a suitable, unique image for the post and fills in all three fields. It uses the post's `imageAlt`, title, and tags to search, checks for uniqueness across all existing posts, and writes the CDN URL + photographer attribution directly into the file.

**Never invent or guess an image URL, photographer name, or profile URL.** Incorrect URLs will break the site. The script handles everything — just leave the fields empty.

The only exception: if you are manually selecting a specific image for editorial reasons, right-click the image on [unsplash.com](https://unsplash.com) and choose "Copy Image Address" to get the CDN URL (starts with `https://images.unsplash.com/photo-`), then append `?w=1200&h=630&fit=crop`.

---

### Brand voice

- Warm, empathetic, and reassuring — like a knowledgeable friend, not a lecturer
- Evidence-based: weave in research findings naturally ("Research published in Pediatrics shows...", "According to the AAP...")
- Practical: every post should include actionable advice parents can use tonight
- Non-judgmental: never shame parents for current habits; frame everything as "building skills"
- Confident but not preachy: state what the research says without hedging excessively
- Human and specific: use natural transitions, occasional plain-language asides, and real-life bedtime context so it reads like an experienced parent coach, not a checklist generator

### Human-sounding writing constraints (IMPORTANT)

- Make prose the default: target roughly **70-80% paragraphs** and **20-30% lists/tables**.
- Limit total lists in the article to **2-4** (combined bullets + numbered lists).
- Avoid list-stacking: never place multiple list-heavy sections back-to-back.
- In strategy sections, use short explanatory paragraphs first; use lists only to summarize key actions.
- Vary sentence length and rhythm. Avoid repetitive "Do X. Do Y. Do Z." patterns.
- Include at least 2 empathetic lines that acknowledge what parents are feeling (without sounding dramatic or generic).
- Use contractions naturally ("you're", "it's", "don't") to keep tone conversational.

### Structure and formatting

- Use `##` (H2) for main sections and `###` (H3) for subsections. **Never use `#` (H1)** — the page already renders the title as H1.
- Use `**bold**` for key terms and emphasis.
- Use bullet lists and numbered lists selectively for scannability; do not let lists dominate the post.
- Use `>` blockquotes sparingly for standout tips.
- Do **NOT** use inline images (`![]()`), raw HTML, or code blocks.
- Aim for **800-1200 words** (4-6 minute read at 200 words/min).

### Required post structure

Follow this outline (adapt section names to your topic):

1. **Opening hook** — Empathize with the parent's struggle. State the problem using the primary keyword. 1-2 paragraphs.
2. **Why this happens / The science** — Explain the underlying cause with references to research. Help parents understand *why* so the advice feels credible.
3. **What the research says** — Specific numbers, age ranges, or findings from AAP/NHS/peer-reviewed studies. Prefer prose; add one concise list or table only if it meaningfully improves clarity.
4. **Evidence-based strategies** — 3-6 actionable steps. Use clear mini-sections and natural transitions; each strategy should include both *what to do* and *why it helps*.
5. **Common mistakes or myths** — Address 2-3 misconceptions. This builds trust and targets "People also ask" queries.
6. **When to seek help** — Brief section on when to talk to a pediatrician. This is important for safety and credibility.
7. **Reassuring close** — 1-2 sentences of encouragement.
8. **Disclaimer** — End with this exact italic text:

*This article is based on published research from the American Academy of Pediatrics (AAP), the National Health Service (NHS), and peer-reviewed pediatric sleep studies. It is not medical advice — always consult your pediatrician for individual guidance.*

### SEO requirements

- The primary keyword should appear in: the title, description, first paragraph, and at least one H2.
- Use the keyword and close variations naturally 3-5 times throughout the post. Do not stuff.
- Structure with clear H2/H3 hierarchy (Google uses this for featured snippets and jump-to links).
- Write H2s as questions or clear statements that match how parents search (e.g., "Why Does My Baby Wake Up Every Hour?" not "Sleep Cycle Disruption Factors").
- Prioritize readability signals: short paragraphs, concrete language, and smooth transitions that keep readers on page.

---

## Phase 3: Output

Output the complete markdown file (frontmatter + body), then after the file output these items:

1. **Title options considered** — List your 3 title candidates and briefly explain why you chose the winner.
2. **Key sources used** — List the specific AAP guidelines, NHS pages, or studies you drew from so the publisher can verify.
3. **Suggested filename slug** — lowercase, hyphens, no special characters. Example: `baby-wont-sleep-in-cot-gentle-evidence-based-solutions`

**Note on images:** Leave `image`, `imageCredit`, and `imageCreditUrl` as empty strings. After saving the file, run `node scripts/add-blog-images.mjs` from the project root to auto-fill them via the Unsplash API.
