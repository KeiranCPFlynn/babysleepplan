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

### Image fields — READ THIS CAREFULLY

The `image`, `imageCredit`, and `imageCreditUrl` fields require you to find a real photo on Unsplash and extract specific information. **Do not guess or fabricate these values.**

#### Step 1: Find a photo

Go to [unsplash.com](https://unsplash.com) and search for a term related to the post topic (e.g., "baby sleeping in crib", "toddler bedtime"). Click on a photo you like.

#### Step 2: Get the CDN image URL

The photo page URL will look like this:
```
https://unsplash.com/photos/some-description-XXXXXXXXX
```

**You need the CDN URL, NOT the page URL.** These are completely different things:

| WRONG (page URL) | RIGHT (CDN URL) |
|---|---|
| `https://unsplash.com/photos/newborn-baby-sleeping-9_5P8JjSxIk` | `https://images.unsplash.com/photo-1770059706518-ece8f7264055?w=1200&h=630&fit=crop` |

To get the CDN URL:
1. On the photo page, **right-click the image** and select "Copy Image Address" (or "Open Image in New Tab")
2. The URL will start with `https://images.unsplash.com/photo-` followed by a **long numeric ID** like `1555252333-9f8e92e65df9`
3. Take everything up to and including the photo ID, then append `?w=1200&h=630&fit=crop`

**Final format:**
```
https://images.unsplash.com/photo-XXXXXXXXXX-XXXXXXXXXXXX?w=1200&h=630&fit=crop
```

Real examples from existing posts:
```
https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=1200&h=630&fit=crop
https://images.unsplash.com/photo-1544126592-807ade215a0b?w=1200&h=630&fit=crop
https://images.unsplash.com/photo-1770059706518-ece8f7264055?w=1200&h=630&fit=crop
```

#### Step 3: Get the photographer credit

On the Unsplash photo page, the photographer's name is displayed prominently near the top.

- `imageCredit`: The photographer's **display name** exactly as shown (e.g., `"Ana Curcan"`)
- `imageCreditUrl`: Click the photographer's name to go to their profile. The URL will be `https://unsplash.com/@username`. Use that URL (e.g., `"https://unsplash.com/@annaacurcan"`)

#### If you cannot browse the web

If you cannot access unsplash.com to look up real photos, **leave all three image fields as empty strings** and add this note at the very end of your output:

```
<!-- IMAGE TODO: Search Unsplash for "[suggested search term]" and fill in image, imageCredit, and imageCreditUrl -->
```

**Never invent an image URL, photographer name, or profile URL.** Incorrect URLs will break the site.

---

### Brand voice

- Warm, empathetic, and reassuring — like a knowledgeable friend, not a lecturer
- Evidence-based: weave in research findings naturally ("Research published in Pediatrics shows...", "According to the AAP...")
- Practical: every post should include actionable advice parents can use tonight
- Non-judgmental: never shame parents for current habits; frame everything as "building skills"
- Confident but not preachy: state what the research says without hedging excessively

### Structure and formatting

- Use `##` (H2) for main sections and `###` (H3) for subsections. **Never use `#` (H1)** — the page already renders the title as H1.
- Use `**bold**` for key terms and emphasis.
- Use bullet lists and numbered lists for scannable information.
- Use `>` blockquotes sparingly for standout tips.
- Do **NOT** use inline images (`![]()`), raw HTML, or code blocks.
- Aim for **800-1200 words** (4-6 minute read at 200 words/min).

### Required post structure

Follow this outline (adapt section names to your topic):

1. **Opening hook** — Empathize with the parent's struggle. State the problem using the primary keyword. 1-2 paragraphs.
2. **Why this happens / The science** — Explain the underlying cause with references to research. Help parents understand *why* so the advice feels credible.
3. **What the research says** — Specific numbers, age ranges, or findings from AAP/NHS/peer-reviewed studies. Use a table or bullet list for scannability if appropriate.
4. **Evidence-based strategies** — 3-6 actionable steps. Each should be a ### subsection with a clear heading. Explain *why* each works, not just *what* to do.
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

---

## Phase 3: Output

Output the complete markdown file (frontmatter + body), then after the file output these items:

1. **Title options considered** — List your 3 title candidates and briefly explain why you chose the winner.
2. **Key sources used** — List the specific AAP guidelines, NHS pages, or studies you drew from so the publisher can verify.
3. **Suggested filename slug** — lowercase, hyphens, no special characters. Example: `baby-wont-sleep-in-cot-gentle-evidence-based-solutions`
4. **3 Unsplash search terms** to find a good hero image (in case the image fields were left empty).
