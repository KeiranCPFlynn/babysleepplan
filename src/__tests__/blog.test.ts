import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'fs'
import { getPostSlugs, getPostBySlug, getAllPosts } from '@/lib/blog'

vi.mock('fs')

const mockFs = vi.mocked(fs)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getPostSlugs', () => {
  it('returns slugs from .md files', () => {
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readdirSync.mockReturnValue([
      'first-post.md',
      'second-post.md',
    ] as unknown as ReturnType<typeof fs.readdirSync>)

    const slugs = getPostSlugs()
    expect(slugs).toEqual(['first-post', 'second-post'])
  })

  it('filters out non-lowercase filenames', () => {
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readdirSync.mockReturnValue([
      'valid-post.md',
      'BLOG-GUIDE.md',
      'Another-Post.md',
    ] as unknown as ReturnType<typeof fs.readdirSync>)

    const slugs = getPostSlugs()
    expect(slugs).toEqual(['valid-post'])
  })

  it('returns empty array when directory does not exist', () => {
    mockFs.existsSync.mockReturnValue(false)

    const slugs = getPostSlugs()
    expect(slugs).toEqual([])
  })

  it('strips .md extension from slugs', () => {
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readdirSync.mockReturnValue([
      'my-post.md',
    ] as unknown as ReturnType<typeof fs.readdirSync>)

    const slugs = getPostSlugs()
    expect(slugs).toEqual(['my-post'])
    expect(slugs[0]).not.toContain('.md')
  })
})

describe('getPostBySlug', () => {
  const frontmatter = `---
title: Test Post
description: A test description
date: "2025-06-15"
author: Test Author
tags:
  - sleep
  - baby
---

This is the post content with some words here.`

  it('parses frontmatter fields', () => {
    mockFs.readFileSync.mockReturnValue(frontmatter)

    const post = getPostBySlug('test-post')
    expect(post.title).toBe('Test Post')
    expect(post.description).toBe('A test description')
    expect(post.date).toBe('2025-06-15')
    expect(post.author).toBe('Test Author')
    expect(post.tags).toEqual(['sleep', 'baby'])
    expect(post.slug).toBe('test-post')
  })

  it('calculates word count correctly', () => {
    mockFs.readFileSync.mockReturnValue(`---
title: Test
---

one two three four five`)

    const post = getPostBySlug('test')
    expect(post.wordCount).toBe(5)
  })

  it('calculates reading time (ceil of wordCount / 200, min 1)', () => {
    // 5 words -> 5/200 = 0.025 -> ceil = 1, but min is 1
    mockFs.readFileSync.mockReturnValue(`---
title: Short
---

one two three four five`)

    const post = getPostBySlug('short')
    expect(post.readingTime).toBe(1)
  })

  it('calculates reading time for longer posts', () => {
    const words = Array(450).fill('word').join(' ')
    mockFs.readFileSync.mockReturnValue(`---
title: Long
---

${words}`)

    const post = getPostBySlug('long')
    expect(post.wordCount).toBe(450)
    expect(post.readingTime).toBe(3) // ceil(450/200) = 3
  })

  it('returns empty string defaults for missing frontmatter fields', () => {
    mockFs.readFileSync.mockReturnValue(`---
title: Only Title
---

Content`)

    const post = getPostBySlug('minimal')
    expect(post.description).toBe('')
    expect(post.author).toBe('')
    expect(post.image).toBe('')
    expect(post.imageAlt).toBe('')
    expect(post.dateModified).toBe('')
  })

  it('returns empty array for missing tags', () => {
    mockFs.readFileSync.mockReturnValue(`---
title: No Tags
---

Content`)

    const post = getPostBySlug('no-tags')
    expect(post.tags).toEqual([])
  })
})

describe('getAllPosts', () => {
  it('sorts posts by date descending (newest first)', () => {
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readdirSync.mockReturnValue([
      'old-post.md',
      'new-post.md',
    ] as unknown as ReturnType<typeof fs.readdirSync>)

    mockFs.readFileSync.mockImplementation((filePath) => {
      const path = String(filePath)
      if (path.includes('old-post')) {
        return `---
title: Old Post
date: "2024-01-01"
---

Old content`
      }
      return `---
title: New Post
date: "2025-06-01"
---

New content`
    })

    const posts = getAllPosts()
    expect(posts).toHaveLength(2)
    expect(posts[0].title).toBe('New Post')
    expect(posts[1].title).toBe('Old Post')
  })

  it('returns all posts from directory', () => {
    mockFs.existsSync.mockReturnValue(true)
    mockFs.readdirSync.mockReturnValue([
      'post-a.md',
      'post-b.md',
      'post-c.md',
    ] as unknown as ReturnType<typeof fs.readdirSync>)

    mockFs.readFileSync.mockReturnValue(`---
title: A Post
date: "2025-01-01"
---

Content`)

    const posts = getAllPosts()
    expect(posts).toHaveLength(3)
  })
})
