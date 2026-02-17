import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockGetUser, mockFrom } = vi.hoisted(() => {
  const mockGetUser = vi.fn()
  const mockFrom = vi.fn()
  return { mockGetUser, mockFrom }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

import { POST } from '@/app/api/diary/seed/route'

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/diary/seed', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeSingleChain(result: { data: unknown; error: unknown }) {
  const chain = {
    eq: vi.fn(() => chain),
    single: vi.fn().mockResolvedValue(result),
  }
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUser.mockResolvedValue({
    data: { user: { id: 'user-123' } },
    error: null,
  })
})

describe('Diary Seed API', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const response = await POST(createRequest({ planId: 'plan-1', days: 3 }))
    expect(response.status).toBe(401)
  })

  it('returns 403 for non-admin users', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        const chain = makeSingleChain({
          data: { is_admin: false },
          error: null,
        })
        return { select: vi.fn(() => chain) }
      }
      return {}
    })

    const response = await POST(createRequest({ planId: 'plan-1', days: 3 }))
    expect(response.status).toBe(403)
  })

  it('allows admin seeding in production mode', async () => {
    const previousNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    const upsert = vi.fn().mockResolvedValue({ error: null })

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        const chain = makeSingleChain({
          data: { is_admin: true },
          error: null,
        })
        return { select: vi.fn(() => chain) }
      }

      if (table === 'plans') {
        const chain = makeSingleChain({
          data: { id: 'plan-1' },
          error: null,
        })
        return { select: vi.fn(() => chain) }
      }

      if (table === 'sleep_diary_entries') {
        return { upsert }
      }

      return {}
    })

    try {
      const response = await POST(createRequest({ planId: 'plan-1', days: 3 }))
      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.days).toBe(3)

      expect(upsert).toHaveBeenCalledTimes(1)
      const [entries, options] = upsert.mock.calls[0]
      expect(Array.isArray(entries)).toBe(true)
      expect(entries).toHaveLength(3)
      expect(entries[0].plan_id).toBe('plan-1')
      expect(entries[0].user_id).toBe('user-123')
      expect(options).toEqual({ onConflict: 'plan_id,date' })
    } finally {
      process.env.NODE_ENV = previousNodeEnv
    }
  })
})
