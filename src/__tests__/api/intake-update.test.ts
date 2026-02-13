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

import { PATCH, POST, DELETE } from '@/app/api/intake/[id]/route'

function createRequest(body: unknown, method = 'PATCH'): NextRequest {
  return new NextRequest('http://localhost:3000/api/intake/test-id', {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

function makeParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) }
}

// Helper: set up the admin chain for intake lookup
function setupIntakeLookup(intake: { id: string; user_id: string; status: string } | null, error: unknown = null) {
  const singleFn = vi.fn().mockResolvedValue({
    data: intake,
    error: error || (intake ? null : { message: 'not found' }),
  })
  const eqId = vi.fn().mockReturnValue({ single: singleFn })
  const selectFn = vi.fn().mockReturnValue({ eq: eqId })

  return { select: selectFn }
}

// Helper: set up the admin chain for intake update
function setupIntakeUpdate(updated: unknown, error: unknown = null) {
  const singleFn = vi.fn().mockResolvedValue({ data: updated, error })
  const selectFn = vi.fn().mockReturnValue({ single: singleFn })
  const eqFn = vi.fn().mockReturnValue({ select: selectFn })
  const updateFn = vi.fn().mockReturnValue({ eq: eqFn })

  return { update: updateFn }
}

// Helper: set up the admin chain for intake delete
function setupIntakeDelete(error: unknown = null) {
  const eqFn = vi.fn().mockResolvedValue({ error })
  const deleteFn = vi.fn().mockReturnValue({ eq: eqFn })

  return { delete: deleteFn }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockGetUser.mockResolvedValue({
    data: { user: { id: 'user-123' } },
    error: null,
  })
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
})

describe('Intake Update (PATCH/POST) - Authentication', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } })

    const res = await PATCH(createRequest({ data: {} }), makeParams('intake-1'))
    expect(res.status).toBe(401)
  })
})

describe('Intake Update (PATCH/POST) - Intake lookup', () => {
  it('returns 404 when intake does not exist', async () => {
    const lookupChain = setupIntakeLookup(null)
    mockAdminFrom.mockReturnValue(lookupChain)

    const res = await PATCH(createRequest({ data: {} }), makeParams('nonexistent'))
    expect(res.status).toBe(404)
  })

  it('returns 403 when intake belongs to different user', async () => {
    const lookupChain = setupIntakeLookup({
      id: 'intake-1',
      user_id: 'other-user',
      status: 'draft',
    })
    mockAdminFrom.mockReturnValue(lookupChain)

    const res = await PATCH(createRequest({ data: {} }), makeParams('intake-1'))
    expect(res.status).toBe(403)
  })
})

describe('Intake Update (PATCH/POST) - Status check', () => {
  it('skips update when intake is not draft', async () => {
    const lookupChain = setupIntakeLookup({
      id: 'intake-1',
      user_id: 'user-123',
      status: 'submitted',
    })
    mockAdminFrom.mockReturnValue(lookupChain)

    const res = await PATCH(createRequest({ data: {} }), makeParams('intake-1'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.skipped).toBe(true)
  })
})

describe('Intake Update (PATCH/POST) - Field stripping', () => {
  it('strips protected fields from update payload', async () => {
    const lookupChain = setupIntakeLookup({
      id: 'intake-1',
      user_id: 'user-123',
      status: 'draft',
    })

    const updatedData = { id: 'intake-1', data: { step: 2 } }
    const updateChain = setupIntakeUpdate(updatedData)

    let callCount = 0
    mockAdminFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return lookupChain
      return updateChain
    })

    await PATCH(
      createRequest({
        id: 'should-be-stripped',
        user_id: 'should-be-stripped',
        status: 'should-be-stripped',
        created_at: 'should-be-stripped',
        updated_at: 'should-be-stripped',
        data: { step: 2 },
      }),
      makeParams('intake-1')
    )

    const updateFn = updateChain.update
    const updatePayload = updateFn.mock.calls[0][0]
    expect(updatePayload).not.toHaveProperty('id')
    expect(updatePayload).not.toHaveProperty('user_id')
    expect(updatePayload).not.toHaveProperty('status')
    expect(updatePayload).not.toHaveProperty('created_at')
    expect(updatePayload).not.toHaveProperty('updated_at')
    expect(updatePayload).toHaveProperty('data')
  })
})

describe('Intake Update (PATCH/POST) - Success and errors', () => {
  it('successfully updates draft intake', async () => {
    const lookupChain = setupIntakeLookup({
      id: 'intake-1',
      user_id: 'user-123',
      status: 'draft',
    })

    const updateChain = setupIntakeUpdate({
      id: 'intake-1',
      data: { step: 3 },
    })

    let callCount = 0
    mockAdminFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return lookupChain
      return updateChain
    })

    const res = await PATCH(
      createRequest({ data: { step: 3 } }),
      makeParams('intake-1')
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.intake).toBeDefined()
  })

  it('returns 500 on database error', async () => {
    const lookupChain = setupIntakeLookup({
      id: 'intake-1',
      user_id: 'user-123',
      status: 'draft',
    })

    const updateChain = setupIntakeUpdate(null, { message: 'DB error' })

    let callCount = 0
    mockAdminFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return lookupChain
      return updateChain
    })

    const res = await PATCH(
      createRequest({ data: {} }),
      makeParams('intake-1')
    )
    expect(res.status).toBe(500)
  })

  it('returns 400 on invalid JSON body', async () => {
    const req = new NextRequest('http://localhost:3000/api/intake/test-id', {
      method: 'PATCH',
      body: 'not json',
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await PATCH(req, makeParams('intake-1'))
    expect(res.status).toBe(400)
  })
})

describe('Intake Update - POST handler (sendBeacon)', () => {
  it('uses the same handler as PATCH', async () => {
    const lookupChain = setupIntakeLookup({
      id: 'intake-1',
      user_id: 'user-123',
      status: 'draft',
    })

    const updateChain = setupIntakeUpdate({ id: 'intake-1', data: {} })

    let callCount = 0
    mockAdminFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return lookupChain
      return updateChain
    })

    const req = createRequest({ data: {} }, 'POST')
    const res = await POST(req, makeParams('intake-1'))
    expect(res.status).toBe(200)
  })
})

describe('Intake DELETE - Authentication', () => {
  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } })

    const req = new NextRequest('http://localhost:3000/api/intake/test-id', {
      method: 'DELETE',
    })
    const res = await DELETE(req, makeParams('intake-1'))
    expect(res.status).toBe(401)
  })
})

describe('Intake DELETE - Intake lookup', () => {
  it('returns 404 when intake does not exist', async () => {
    const lookupChain = setupIntakeLookup(null)
    mockAdminFrom.mockReturnValue(lookupChain)

    const req = new NextRequest('http://localhost:3000/api/intake/test-id', {
      method: 'DELETE',
    })
    const res = await DELETE(req, makeParams('nonexistent'))
    expect(res.status).toBe(404)
  })

  it('returns 403 when intake belongs to different user', async () => {
    const lookupChain = setupIntakeLookup({
      id: 'intake-1',
      user_id: 'other-user',
      status: 'draft',
    })
    mockAdminFrom.mockReturnValue(lookupChain)

    const req = new NextRequest('http://localhost:3000/api/intake/test-id', {
      method: 'DELETE',
    })
    const res = await DELETE(req, makeParams('intake-1'))
    expect(res.status).toBe(403)
  })
})

describe('Intake DELETE - Status check', () => {
  it('returns 400 when trying to delete non-draft intake', async () => {
    const lookupChain = setupIntakeLookup({
      id: 'intake-1',
      user_id: 'user-123',
      status: 'submitted',
    })
    mockAdminFrom.mockReturnValue(lookupChain)

    const req = new NextRequest('http://localhost:3000/api/intake/test-id', {
      method: 'DELETE',
    })
    const res = await DELETE(req, makeParams('intake-1'))
    expect(res.status).toBe(400)
  })
})

describe('Intake DELETE - Success and errors', () => {
  it('successfully deletes draft intake', async () => {
    const lookupChain = setupIntakeLookup({
      id: 'intake-1',
      user_id: 'user-123',
      status: 'draft',
    })

    const deleteChain = setupIntakeDelete(null)

    let callCount = 0
    mockAdminFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return lookupChain
      return deleteChain
    })

    const req = new NextRequest('http://localhost:3000/api/intake/test-id', {
      method: 'DELETE',
    })
    const res = await DELETE(req, makeParams('intake-1'))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  it('returns 500 on database error', async () => {
    const lookupChain = setupIntakeLookup({
      id: 'intake-1',
      user_id: 'user-123',
      status: 'draft',
    })

    const deleteChain = setupIntakeDelete({ message: 'DB error' })

    let callCount = 0
    mockAdminFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) return lookupChain
      return deleteChain
    })

    const req = new NextRequest('http://localhost:3000/api/intake/test-id', {
      method: 'DELETE',
    })
    const res = await DELETE(req, makeParams('intake-1'))
    expect(res.status).toBe(500)
  })
})
