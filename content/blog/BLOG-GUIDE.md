# LunaCradle Blog Post Author Guide

A self-contained reference for writing, formatting, and publishing blog posts on LunaCradle.

---

## 1. Quick Start

1. Run `npm run new-post` to scaffold a new post (or create a `.md` file in `content/blog/` manually)
2. The filename becomes the URL slug: `my-post-title.md` → `/blog/my-post-title`
3. Add the required frontmatter (see below) and write your content in markdown
4. Run `npm run dev` to preview locally or `npm run build` to check for errors
5. Commit and deploy — the sitemap and RSS update automatically

---

## 2. Frontmatter Template

Every post **must** start with this YAML block. The first 7 fields are required; the last 3 are optional but recommended.

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
dateModified: ""
---
```

### Field-by-Field Rules

| Field | Format | Rules |
|-------|--------|-------|
| **title** | String in quotes | 50-65 characters ideal. Google truncates at ~60. Include your primary keyword. |
| **description** | String in quotes | 120-155 characters. Action-oriented ("Learn...", "Discover...", "A guide to..."). This appears in Google search results and social shares. |
| **date** | `"YYYY-MM-DD"` | ISO format, quoted. Determines sort order (newest first). |
| **author** | String in quotes | Use `"LunaCradle Team"` for consistency. |
| **tags** | Array of strings | Lowercase. Posts sharing tags appear as "Related Articles." Use 2-4 tags per post. |
| **image** | Unsplash URL | Must include `?w=1200&h=630&fit=crop` query params. See Section 3. |
| **imageAlt** | String in quotes | Descriptive alt text. Include keywords naturally — this helps SEO and accessibility. |
| **imageCredit** | String in quotes | Photographer's name from Unsplash. Required for proper attribution. |
| **imageCreditUrl** | Unsplash profile URL | The photographer's Unsplash profile URL (e.g., `https://unsplash.com/@username`). |
| **dateModified** | `"YYYY-MM-DD"` | Set when you update a published post. Omit for new posts — falls back to `date`. |

### Example (from a real post)

```yaml
---
title: "Understanding Baby Sleep Cycles: What Every Parent Should Know"
description: "Learn how your baby's sleep cycles mature around 4-6 months, what causes the dreaded 4-month sleep regression, and evidence-based strategies to help your little one sleep longer stretches."
date: "2025-01-15"
author: "LunaCradle Team"
tags: ["sleep science", "4-month regression", "infant sleep"]
image: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=1200&h=630&fit=crop"
imageAlt: "A peacefully sleeping baby in a crib with soft lighting"
imageCredit: "Minnie Zhou"
imageCreditUrl: "https://unsplash.com/@minniezhou"
---
```

---

## 3. Finding Unsplash Images

1. Go to [unsplash.com](https://unsplash.com) and search for your topic (e.g., "baby sleeping", "toddler bedtime")
2. Click on the photo you want
3. Look at the browser URL — it will contain something like `photo-1555252333-9f8e92e65df9`
4. Build your image URL using this pattern:

```
https://images.unsplash.com/photo-XXXXXXX?w=1200&h=630&fit=crop
```

Replace `photo-XXXXXXX` with the full photo ID from the URL.

**Dimensions:** `w=1200&h=630` gives you the standard Open Graph ratio (1.91:1), which looks correct on social media shares and the blog hero.

**Attribution:** Unsplash requires crediting the photographer. When you select a photo:
1. Note the **photographer's name** (shown below the photo on Unsplash)
2. Click the photographer's name to go to their profile — the URL will be `https://unsplash.com/@username`
3. Add both to your frontmatter:
   - `imageCredit`: The photographer's display name (e.g., `"Minnie Zhou"`)
   - `imageCreditUrl`: Their profile URL (e.g., `"https://unsplash.com/@minniezhou"`)

The blog automatically renders this as: "Photo by [Name](profile-link) on [Unsplash](unsplash-link)" with proper UTM referral parameters.

### Image Reuse Rule (Important)

Avoid reusing the same Unsplash `photo-...` ID across nearby posts. As a default rule, do not reuse an image ID if it appears in the **most recent 5 published posts** unless there is a clear editorial reason.

Quick local check:

```bash
rg -n '^image:' content/blog/*.md
```

---

## 4. Markdown Formatting Guide

### What Renders Well

| Syntax | Result | Notes |
|--------|--------|-------|
| `## Heading` | H2 section heading | Main sections. Gets nice spacing and weight. |
| `### Heading` | H3 subsection heading | Use under an H2 for hierarchy. |
| `**bold text**` | **bold text** | Renders in darker slate color. Use for emphasis and key terms. |
| `*italic text*` | *italic text* | Lighter color. Good for disclaimers and asides. |
| `- item` | Bullet list | Styled with sky-blue bullet points. |
| `1. item` | Numbered list | Standard decimal numbering. |
| `> blockquote` | Blockquote | Left border with blue-tinted background. |
| `[text](url)` | Hyperlink | Sky-blue color. External links open in a new tab. |
| `---` | Horizontal rule | Clean divider between sections. |
| Tables | Full support | Header row is styled differently from body rows. |

### Keep It Human (Not Checklist-Heavy)

- Make prose the default. Aim for mostly paragraphs, with lists used only when they genuinely improve clarity.
- Limit list-heavy stacking. Avoid back-to-back sections that are all bullets or numbered steps.
- Use transitions between sections so the post reads like a conversation with a tired parent, not a template dump.

### What to Avoid

- **`# H1` headings** — The page already renders the frontmatter `title` as an H1. A second H1 hurts SEO and looks wrong.
- **Inline images** (`![alt](url)`) — These are not rendered in the blog layout. Use the frontmatter `image` field for the hero image.
- **Raw HTML tags** — HTML is not rendered in the blog markdown processor.
- **Code blocks** — They render with generic styling. Code isn't the blog's focus, so only use if truly necessary.

### Recommended Post Structure

```
## Opening Question or Hook
Introductory paragraph with primary keyword. Empathize with the reader.

## Main Section
Core information with **bold key terms** and evidence references.

### Subsection
Break down the details. Use bullet lists for scannable info.

## Practical Advice Section
Actionable steps the reader can take tonight.

## What to Watch For / When to Seek Help
Safety information and pediatrician referral.

## Closing / Reassurance
Encouraging wrap-up.

*Italic disclaimer referencing AAP/NHS research.*
```

---

## 5. SEO Checklist

Verify each item before publishing:

- [ ] **Title** is 50-65 characters
- [ ] **Description** is 120-155 characters and action-oriented ("Learn...", "Discover...", "A guide to...")
- [ ] **Slug** (filename) uses hyphens, all lowercase, and contains the primary keyword
- [ ] **At least 2-3 tags** that overlap with other posts (this powers "Related Articles")
- [ ] **Image alt text** is descriptive and includes keywords naturally
- [ ] **Hero image ID is not reused** in the most recent 5 posts
- [ ] **Post body** has at least 600 words (reading time >= 3 minutes; calculated at 200 words/min)
- [ ] **Ends with italic disclaimer** referencing AAP/NHS research and advising readers to consult their pediatrician
- [ ] **Uses H2/H3 structure** (Google uses heading hierarchy for featured snippets)
- [ ] **Primary keyword** appears in: title, description, first paragraph, and at least one H2

---

## 6. Tag Strategy

### Existing Tags

From the current posts, these tags are in use:

| Tag | Used In |
|-----|---------|
| `sleep science` | Understanding Baby Sleep Cycles |
| `4-month regression` | Understanding Baby Sleep Cycles |
| `infant sleep` | Understanding Baby Sleep Cycles |
| `bedtime routine` | The Perfect Bedtime Routine by Age |
| `sleep tips` | The Perfect Bedtime Routine by Age |
| `toddler sleep` | The Perfect Bedtime Routine by Age |

### Recommended Taxonomy

Keep tags consistent by following these categories:

**Age-based:** `newborn sleep`, `infant sleep`, `toddler sleep`
**Topic-based:** `sleep science`, `bedtime routine`, `sleep tips`, `sleep environment`, `nap schedule`
**Problem-based:** `4-month regression`, `night waking`, `early rising`, `nap transitions`, `sleep associations`

**Rules of thumb:**
- Use 2-4 tags per post
- Always include at least one tag that overlaps with an existing post (this drives "Related Articles")
- Keep tags lowercase
- Prefer established tags over creating new ones unless the topic genuinely doesn't fit

---

## 7. AI Prompt for Generating Posts

The full AI prompt lives in its own file for easy copy-pasting:

**[`content/blog/AI-POST-PROMPT.md`](AI-POST-PROMPT.md)**

Open that file, copy everything below the `---` line, paste it into ChatGPT/Claude (with web search enabled), and replace `[KEYWORDS]` with your target keywords. The prompt instructs the AI to:

1. **Research** — analyze search intent, competing articles, and "People also ask" for the keywords
2. **Craft a title** — propose 3 options optimized for click-through and use the best one
3. **Research content** — draw from AAP, NHS, peer-reviewed studies, and named researchers
4. **Write the post** — following the exact frontmatter format, brand voice, structure, and SEO rules
5. **Source an image** — with step-by-step Unsplash CDN URL instructions (or leave empty with a TODO if it can't browse)
6. **Show its work** — list title options considered, key sources used, and suggested slug

---

## 8. Publishing Workflow

### Step-by-step

1. **Write or generate the post** using the AI prompt above or by hand
2. **Find an Unsplash image** — search on [unsplash.com](https://unsplash.com), grab the photo ID, build the URL with `?w=1200&h=630&fit=crop`
3. **Fill in the frontmatter** — make sure all 7 fields are complete and pass the SEO checklist
4. **Save the file** as `content/blog/your-slug-here.md`
5. **Preview locally** — run `npm run dev` and visit `/blog/your-slug-here` to check formatting
6. **Build** — run `npm run build` to verify there are no errors
7. **Commit and deploy** — the sitemap at `/sitemap.xml` updates automatically to include the new post

### Quick verification after deploy

- Visit `/blog` — your post should appear at the top (sorted by date)
- Visit `/blog/your-slug-here` — check the hero image, formatting, and reading time
- Visit `/sitemap.xml` — confirm the new URL is listed
- Check "Related Articles" on other posts that share tags with yours
