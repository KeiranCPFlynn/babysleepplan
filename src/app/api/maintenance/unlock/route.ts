import { NextRequest, NextResponse } from 'next/server'
import { MAINTENANCE_BYPASS_COOKIE } from '@/lib/maintenance'

function getSafeRedirectPath(value: unknown) {
  if (typeof value !== 'string') return '/'
  if (!value.startsWith('/')) return '/'
  if (value.startsWith('//')) return '/'
  return value
}

export async function POST(request: NextRequest) {
  try {
    const { token, nextPath } = await request.json().catch(() => ({}))
    const expectedToken = process.env.MAINTENANCE_BYPASS_TOKEN

    if (!expectedToken) {
      return NextResponse.json(
        { error: 'Maintenance bypass is not configured.' },
        { status: 503 }
      )
    }

    if (typeof token !== 'string' || token !== expectedToken) {
      return NextResponse.json({ error: 'Invalid access token.' }, { status: 401 })
    }

    const response = NextResponse.json({
      success: true,
      redirectTo: getSafeRedirectPath(nextPath),
    })

    response.cookies.set(MAINTENANCE_BYPASS_COOKIE, expectedToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 14, // 14 days
    })

    return response
  } catch (error) {
    console.error('Maintenance unlock error:', error)
    return NextResponse.json({ error: 'Failed to unlock access.' }, { status: 500 })
  }
}

