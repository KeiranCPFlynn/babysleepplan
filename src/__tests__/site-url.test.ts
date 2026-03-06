import { afterEach, describe, expect, it } from 'vitest'
import { getSiteUrl } from '@/lib/site-url'

describe('getSiteUrl', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('falls back to canonical production host when unset', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    delete process.env.NEXT_PUBLIC_APP_URL

    expect(getSiteUrl()).toBe('https://www.lunacradle.com')
  })

  it('normalizes apex host to canonical www host', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://lunacradle.com'

    expect(getSiteUrl()).toBe('https://www.lunacradle.com')
  })

  it('keeps localhost for development values', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000/foo'

    expect(getSiteUrl()).toBe('http://localhost:3000')
  })

  it('falls back when value is invalid', () => {
    process.env.NEXT_PUBLIC_SITE_URL = '::://broken-url'

    expect(getSiteUrl()).toBe('https://www.lunacradle.com')
  })
})
