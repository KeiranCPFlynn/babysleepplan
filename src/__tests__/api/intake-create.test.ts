import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// --- Mock setup using vi.hoisted() so variables are available in vi.mock factories ---

const { mockGetUser, mockAdminFrom } = vi.hoisted(() => {
  const mockGetUser = vi.fn()
  const mockAdminFrom = vi.fn()
  return { mockGetUser, mockAdminFrom }
})

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
  }),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockAdminFrom,
  })),
}))

import { POST } from '@/app/api/intake/create/route'

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/intake/create', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

beforeEach(() => {
  vi.clearAllMocks()

  // Default: authenticated user
  mockGetUser.mockResolvedValue({
    data: { user: { id: 'user-123' } },
    error: null,
  })

  // Ensure env vars are set
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
})

describe('Intake Create - Authentication', () => {
  it('returns 401 when user not authenticated', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const res = await POST(createRequest({ babyId: 'baby-1' }))
    expect(res.status).toBe(401)
  })

  it('returns 401 on auth error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Auth failed' },
    })

    const res = await POST(createRequest({ babyId: 'baby-1' }))
    expect(res.status).toBe(401)
  })
})

describe('Intake Create - Validation', () => {
  it('returns 400 when babyId is missing', async () => {
    const res = await POST(createRequest({}))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('babyId')
  })

  it('returns 400 for invalid JSON body', async () => {
    const req = new NextRequest('http://localhost:3000/api/intake/create', {
      method: 'POST',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

describe('Intake Create - Baby ownership', () => {
  it('returns 404 when baby does not exist', async () => {
    const babyEq2 = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: null, error: { message: 'not found' } }),
    })
    const babyEq1 = vi.fn().mockReturnValue({ eq: babyEq2 })
    const babySelect = vi.fn().mockReturnValue({ eq: babyEq1 })

    mockAdminFrom.mockReturnValue({ select: babySelect })

    const res = await POST(createRequest({ babyId: 'nonexistent' }))
    expect(res.status).toBe(404)
  })

  it('returns 404 when baby belongs to different user', async () => {
    const babyEq2 = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    })
    const babyEq1 = vi.fn().mockReturnValue({ eq: babyEq2 })
    const babySelect = vi.fn().mockReturnValue({ eq: babyEq1 })

    mockAdminFrom.mockReturnValue({ select: babySelect })

    const res = await POST(createRequest({ babyId: 'other-users-baby' }))
    expect(res.status).toBe(404)
  })
})

describe('Intake Create - Draft detection', () => {
  function setupBabyFound() {
    const babyEq2 = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { id: 'baby-1' }, error: null }),
    })
    const babyEq1 = vi.fn().mockReturnValue({ eq: babyEq2 })
    const babySelect = vi.fn().mockReturnValue({ eq: babyEq1 })
    return { select: babySelect }
  }

  it('returns existing draft ID with { existing: true } if draft exists', async () => {
    const babyChain = setupBabyFound()

    const draftMaybeSingle = vi.fn().mockResolvedValue({ data: { id: 'draft-123' } })
    const draftLimit = vi.fn().mockReturnValue({ maybeSingle: draftMaybeSingle })
    const draftOrder = vi.fn().mockReturnValue({ limit: draftLimit })
    const draftEq3 = vi.fn().mockReturnValue({ order: draftOrder })
    const draftEq2 = vi.fn().mockReturnValue({ eq: draftEq3 })
    const draftEq1 = vi.fn().mockReturnValue({ eq: draftEq2 })
    const draftSelect = vi.fn().mockReturnValue({ eq: draftEq1 })

    mockAdminFrom.mockImplementation((table: string) => {
      if (table === 'babies') return babyChain
      if (table === 'intake_submissions') return { select: draftSelect }
      return {}
    })

    const res = await POST(createRequest({ babyId: 'baby-1' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.intakeId).toBe('draft-123')
    expect(data.existing).toBe(true)
  })

  it('creates new intake with { existing: false } if no draft', async () => {
    const babyChain = setupBabyFound()

    const draftMaybeSingle = vi.fn().mockResolvedValue({ data: null })
    const draftLimit = vi.fn().mockReturnValue({ maybeSingle: draftMaybeSingle })
    const draftOrder = vi.fn().mockReturnValue({ limit: draftLimit })
    const draftEq3 = vi.fn().mockReturnValue({ order: draftOrder })
    const draftEq2 = vi.fn().mockReturnValue({ eq: draftEq3 })
    const draftEq1 = vi.fn().mockReturnValue({ eq: draftEq2 })
    const draftSelect = vi.fn().mockReturnValue({ eq: draftEq1 })

    const insertSingle = vi.fn().mockResolvedValue({
      data: { id: 'new-intake-1' },
      error: null,
    })
    const insertSelect = vi.fn().mockReturnValue({ single: insertSingle })
    const insertFn = vi.fn().mockReturnValue({ select: insertSelect })

    let callCount = 0
    mockAdminFrom.mockImplementation((table: string) => {
      if (table === 'babies') return babyChain
      if (table === 'intake_submissions') {
        callCount++
        if (callCount === 1) return { select: draftSelect }
        return { insert: insertFn }
      }
      return {}
    })

    const res = await POST(createRequest({ babyId: 'baby-1' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.intakeId).toBe('new-intake-1')
    expect(data.existing).toBe(false)
  })
})

describe('Intake Create - Creation', () => {
  it('inserts with correct payload (baby_id, user_id, data: {})', async () => {
    const babyEq2 = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { id: 'baby-1' }, error: null }),
    })
    const babyEq1 = vi.fn().mockReturnValue({ eq: babyEq2 })
    const babySelect = vi.fn().mockReturnValue({ eq: babyEq1 })

    const draftMaybeSingle = vi.fn().mockResolvedValue({ data: null })
    const draftLimit = vi.fn().mockReturnValue({ maybeSingle: draftMaybeSingle })
    const draftOrder = vi.fn().mockReturnValue({ limit: draftLimit })
    const draftEq3 = vi.fn().mockReturnValue({ order: draftOrder })
    const draftEq2 = vi.fn().mockReturnValue({ eq: draftEq3 })
    const draftEq1 = vi.fn().mockReturnValue({ eq: draftEq2 })
    const draftSelect = vi.fn().mockReturnValue({ eq: draftEq1 })

    const insertSingle = vi.fn().mockResolvedValue({
      data: { id: 'new-intake-1' },
      error: null,
    })
    const insertSelect = vi.fn().mockReturnValue({ single: insertSingle })
    const insertFn = vi.fn().mockReturnValue({ select: insertSelect })

    let callCount = 0
    mockAdminFrom.mockImplementation((table: string) => {
      if (table === 'babies') return { select: babySelect }
      if (table === 'intake_submissions') {
        callCount++
        if (callCount === 1) return { select: draftSelect }
        return { insert: insertFn }
      }
      return {}
    })

    await POST(createRequest({ babyId: 'baby-1' }))

    expect(insertFn).toHaveBeenCalledWith({
      baby_id: 'baby-1',
      user_id: 'user-123',
      data: {},
    })
  })

  it('does NOT include status in insert payload (uses DB default)', async () => {
    const babyEq2 = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { id: 'baby-1' }, error: null }),
    })
    const babyEq1 = vi.fn().mockReturnValue({ eq: babyEq2 })
    const babySelect = vi.fn().mockReturnValue({ eq: babyEq1 })

    const draftMaybeSingle = vi.fn().mockResolvedValue({ data: null })
    const draftLimit = vi.fn().mockReturnValue({ maybeSingle: draftMaybeSingle })
    const draftOrder = vi.fn().mockReturnValue({ limit: draftLimit })
    const draftEq3 = vi.fn().mockReturnValue({ order: draftOrder })
    const draftEq2 = vi.fn().mockReturnValue({ eq: draftEq3 })
    const draftEq1 = vi.fn().mockReturnValue({ eq: draftEq2 })
    const draftSelect = vi.fn().mockReturnValue({ eq: draftEq1 })

    const insertSingle = vi.fn().mockResolvedValue({
      data: { id: 'new-intake-1' },
      error: null,
    })
    const insertSelect = vi.fn().mockReturnValue({ single: insertSingle })
    const insertFn = vi.fn().mockReturnValue({ select: insertSelect })

    let callCount = 0
    mockAdminFrom.mockImplementation((table: string) => {
      if (table === 'babies') return { select: babySelect }
      if (table === 'intake_submissions') {
        callCount++
        if (callCount === 1) return { select: draftSelect }
        return { insert: insertFn }
      }
      return {}
    })

    await POST(createRequest({ babyId: 'baby-1' }))

    const payload = insertFn.mock.calls[0][0]
    expect(payload).not.toHaveProperty('status')
  })

  it('returns 500 on database error', async () => {
    const babyEq2 = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { id: 'baby-1' }, error: null }),
    })
    const babyEq1 = vi.fn().mockReturnValue({ eq: babyEq2 })
    const babySelect = vi.fn().mockReturnValue({ eq: babyEq1 })

    const draftMaybeSingle = vi.fn().mockResolvedValue({ data: null })
    const draftLimit = vi.fn().mockReturnValue({ maybeSingle: draftMaybeSingle })
    const draftOrder = vi.fn().mockReturnValue({ limit: draftLimit })
    const draftEq3 = vi.fn().mockReturnValue({ order: draftOrder })
    const draftEq2 = vi.fn().mockReturnValue({ eq: draftEq3 })
    const draftEq1 = vi.fn().mockReturnValue({ eq: draftEq2 })
    const draftSelect = vi.fn().mockReturnValue({ eq: draftEq1 })

    const insertSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'DB error', code: '23505', details: '', hint: '' },
    })
    const insertSelect = vi.fn().mockReturnValue({ single: insertSingle })
    const insertFn = vi.fn().mockReturnValue({ select: insertSelect })

    let callCount = 0
    mockAdminFrom.mockImplementation((table: string) => {
      if (table === 'babies') return { select: babySelect }
      if (table === 'intake_submissions') {
        callCount++
        if (callCount === 1) return { select: draftSelect }
        return { insert: insertFn }
      }
      return {}
    })

    const res = await POST(createRequest({ babyId: 'baby-1' }))
    expect(res.status).toBe(500)
  })
})
