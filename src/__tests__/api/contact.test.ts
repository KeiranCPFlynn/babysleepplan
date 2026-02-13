import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase admin client
const mockInsert = vi.fn()
const mockFrom = vi.fn(() => ({ insert: mockInsert }))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

// Mock email send
vi.mock('@/lib/email/send', () => ({
  sendContactNotificationEmail: vi.fn().mockResolvedValue(undefined),
}))

// Mock sanitize (pass-through real implementation)
vi.mock('@/lib/sanitize', async () => {
  const actual = await vi.importActual<typeof import('@/lib/sanitize')>('@/lib/sanitize')
  return actual
})

import { POST } from '@/app/api/contact/route'
import { sendContactNotificationEmail } from '@/lib/email/send'

function createRequest(
  body: unknown,
  headers: Record<string, string> = {}
): NextRequest {
  const req = new NextRequest('http://localhost:3000/api/contact', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
  return req
}

beforeEach(() => {
  vi.clearAllMocks()
  mockInsert.mockResolvedValue({ error: null })
  // Reset the rate limit map by reimporting module state
  // The rate limit is in-memory so we need to manage it carefully
})

describe('Contact API - Validation', () => {
  it('returns 400 when fields are missing', async () => {
    const req = createRequest({ name: 'John' })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBeDefined()
  })

  it('returns 400 when name is missing', async () => {
    const req = createRequest({
      email: 'john@example.com',
      topic: 'Help',
      message: 'Test',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid email format', async () => {
    const req = createRequest({
      name: 'John',
      email: 'not-an-email',
      topic: 'Help',
      message: 'Test message',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('email')
  })

  it('returns 400 for invalid JSON body', async () => {
    const req = new NextRequest('http://localhost:3000/api/contact', {
      method: 'POST',
      body: 'not json',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '192.168.50.1',
      },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('accepts valid complete submission', async () => {
    const req = createRequest(
      {
        name: 'John Doe',
        email: 'john@example.com',
        topic: 'Help',
        message: 'I need help with sleep training',
      },
      { 'x-forwarded-for': '1.1.1.1' }
    )
    const res = await POST(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })
})

describe('Contact API - Sanitization', () => {
  it('strips HTML from name, topic, message before DB insert', async () => {
    const req = createRequest(
      {
        name: '<b>John</b>',
        email: 'john@example.com',
        topic: '<script>alert</script>Help',
        message: '<p>Hello</p>',
      },
      { 'x-forwarded-for': '10.0.0.1' }
    )
    await POST(req)

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'John',
        topic: 'alertHelp',
        message: 'Hello',
      })
    )
  })

  it('truncates fields to max lengths', async () => {
    const req = createRequest(
      {
        name: 'a'.repeat(300),
        email: 'b'.repeat(400) + '@example.com',
        topic: 'c'.repeat(100),
        message: 'd'.repeat(6000),
      },
      { 'x-forwarded-for': '10.0.0.2' }
    )
    await POST(req)

    const insertArg = mockInsert.mock.calls[0][0]
    expect(insertArg.name.length).toBeLessThanOrEqual(200)
    expect(insertArg.email.length).toBeLessThanOrEqual(320)
    expect(insertArg.topic.length).toBeLessThanOrEqual(50)
    expect(insertArg.message.length).toBeLessThanOrEqual(5000)
  })
})

describe('Contact API - Rate limiting', () => {
  // Use unique IPs per test to avoid cross-test pollution from the
  // module-level rate limit map
  it('allows first 3 requests from same IP', async () => {
    const ip = '192.168.100.1'
    for (let i = 0; i < 3; i++) {
      const req = createRequest(
        {
          name: 'John',
          email: 'john@example.com',
          topic: 'Help',
          message: 'Test message',
        },
        { 'x-forwarded-for': ip }
      )
      const res = await POST(req)
      expect(res.status).toBe(200)
    }
  })

  it('returns 429 on 4th request from same IP', async () => {
    const ip = '192.168.100.2'
    for (let i = 0; i < 3; i++) {
      const req = createRequest(
        {
          name: 'John',
          email: 'john@example.com',
          topic: 'Help',
          message: 'Test',
        },
        { 'x-forwarded-for': ip }
      )
      await POST(req)
    }

    const req = createRequest(
      {
        name: 'John',
        email: 'john@example.com',
        topic: 'Help',
        message: 'Test',
      },
      { 'x-forwarded-for': ip }
    )
    const res = await POST(req)
    expect(res.status).toBe(429)
  })

  it('different IPs have independent limits', async () => {
    // Use up IP A's limit
    const ipA = '192.168.100.3'
    for (let i = 0; i < 3; i++) {
      await POST(
        createRequest(
          { name: 'A', email: 'a@example.com', topic: 'T', message: 'M' },
          { 'x-forwarded-for': ipA }
        )
      )
    }

    // IP B should still be allowed
    const ipB = '192.168.100.4'
    const res = await POST(
      createRequest(
        { name: 'B', email: 'b@example.com', topic: 'T', message: 'M' },
        { 'x-forwarded-for': ipB }
      )
    )
    expect(res.status).toBe(200)
  })

  it('reads IP from x-forwarded-for header (first value)', async () => {
    const ip = '192.168.100.5'
    // The route splits on comma and takes the first
    const req = createRequest(
      { name: 'John', email: 'john@example.com', topic: 'T', message: 'M' },
      { 'x-forwarded-for': `${ip}, 10.0.0.1` }
    )
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('falls back to x-real-ip header', async () => {
    const req = createRequest(
      { name: 'John', email: 'john@example.com', topic: 'T', message: 'M' },
      { 'x-real-ip': '192.168.100.6' }
    )
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('falls back to "unknown"', async () => {
    // No IP headers at all — uses 'unknown'. Since 'unknown' may be shared
    // across tests, just check we don't crash
    const req = createRequest({
      name: 'John',
      email: 'john@example.com',
      topic: 'T',
      message: 'M',
    })
    const res = await POST(req)
    // Might be 200 or 429 depending on test order, but should not be 500
    expect([200, 429]).toContain(res.status)
  })
})

describe('Contact API - Email notification', () => {
  it('calls sendContactNotificationEmail with sanitized values', async () => {
    const req = createRequest(
      {
        name: '<b>John</b>',
        email: 'john@example.com',
        topic: 'Help',
        message: '<p>Hello</p>',
      },
      { 'x-forwarded-for': '192.168.200.1' }
    )
    await POST(req)

    expect(sendContactNotificationEmail).toHaveBeenCalledWith(
      'John',
      'john@example.com',
      'Help',
      'Hello'
    )
  })

  it('email failure does not affect response (fire-and-forget)', async () => {
    vi.mocked(sendContactNotificationEmail).mockRejectedValue(new Error('email failed'))

    const req = createRequest(
      {
        name: 'John',
        email: 'john@example.com',
        topic: 'Help',
        message: 'Message',
      },
      { 'x-forwarded-for': '192.168.200.2' }
    )
    const res = await POST(req)
    expect(res.status).toBe(200)
  })
})
