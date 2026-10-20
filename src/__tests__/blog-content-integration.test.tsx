// @vitest-environment jsdom

import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { getPostBySlug } from '@/lib/blog'
import { PostContent } from '@/components/blog/post-content'

const slugs = [
  'baby-sleep-schedule-creator-how-to-build-one-in-minutes',
  'moving-baby-to-own-room-when-and-how-to-do-it',
  '18-month-old-sleep-schedule-naps-bedtime-and-toddler-tips',
  'best-baby-sleep-apps-2026',
]

afterEach(cleanup)

describe('integrated blog content', () => {
  it.each(slugs)('%s preserves valid metadata and resolves internal article/route links', (slug) => {
    const post = getPostBySlug(slug)
    const raw = matter(fs.readFileSync(path.join(process.cwd(), 'content/blog', `${slug}.md`), 'utf8'))
    expect(post.title).not.toBe('')
    expect(post.dateModified).toBe('2026-10-20')
    expect(post.faq).toHaveLength(raw.data.faq.length)
    expect(post.sources).toHaveLength(raw.data.sources.length)
    expect(post.faq.length).toBeGreaterThan(0)
    expect(post.sources.length).toBeGreaterThan(0)
    for (const faq of post.faq) {
      expect(typeof faq.question).toBe('string')
      expect(typeof faq.answer).toBe('string')
    }
    for (const source of post.sources) expect(new URL(source.url).protocol).toBe('https:')
    if (raw.data.howTo) {
      expect(post.howTo?.steps).toHaveLength(raw.data.howTo.steps.length)
      expect(post.howTo?.steps.every(step => step.name && step.text)).toBe(true)
    }
    const links = [...post.content.matchAll(/\]\((\/[^\s)]+)\)/g)].map(match => match[1])
    expect(links.length).toBeGreaterThan(0)
    for (const href of links) {
      const pathname = href.split(/[?#]/)[0] || '/'
      const target = pathname.startsWith('/blog/')
        ? path.join(process.cwd(), 'content', `${pathname}.md`)
        : path.join(process.cwd(), 'src/app', pathname, 'page.tsx')
      expect(fs.existsSync(target), `Missing target for ${href}`).toBe(true)
    }
  })

  it.each([
    ['moving-baby-to-own-room-when-and-how-to-do-it', 6],
    ['18-month-old-sleep-schedule-naps-bedtime-and-toddler-tips', 4],
  ] as const)('%s renders GFM checklists without extra decorative bullets', (slug, count) => {
    const { container } = render(<PostContent content={getPostBySlug(slug).content} />)
    expect(screen.getAllByRole('checkbox')).toHaveLength(count)
    for (const checkbox of screen.getAllByRole('checkbox')) {
      expect(checkbox).toHaveProperty('disabled', true)
      expect(checkbox.parentElement?.textContent).not.toContain('•')
    }
    expect(container.querySelectorAll('.task-list-item')).toHaveLength(count)
    expect(container.textContent).not.toContain('- [ ]')
  })
})
