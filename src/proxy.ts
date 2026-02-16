import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { MAINTENANCE_BYPASS_COOKIE } from '@/lib/maintenance'

const MAINTENANCE_FLAG_KEY = 'maintenance_mode'
const MAINTENANCE_CACHE_TTL_MS = 10_000

let maintenanceFlagCache: { enabled: boolean; expiresAt: number } | null = null

function parseMaintenanceEnabled(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object' || !('enabled' in payload)) {
    return false
  }

  const enabled = (payload as { enabled?: unknown }).enabled
  if (typeof enabled === 'boolean') return enabled
  if (typeof enabled === 'string') return enabled === 'true'
  return false
}

async function isMaintenanceEnabled() {
  // Emergency env override (still requires redeploy).
  if (process.env.MAINTENANCE_MODE === 'true') return true

  const now = Date.now()
  if (maintenanceFlagCache && maintenanceFlagCache.expiresAt > now) {
    return maintenanceFlagCache.enabled
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) return false

    const baseUrl = supabaseUrl.replace(/\/+$/, '')
    const query = `/rest/v1/runtime_flags?key=eq.${MAINTENANCE_FLAG_KEY}&select=value_json&limit=1`

    const response = await fetch(`${baseUrl}${query}`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      maintenanceFlagCache = { enabled: false, expiresAt: now + MAINTENANCE_CACHE_TTL_MS }
      return false
    }

    const rows = await response.json() as Array<{ value_json?: unknown }>
    const enabled = parseMaintenanceEnabled(rows?.[0]?.value_json)
    maintenanceFlagCache = { enabled, expiresAt: now + MAINTENANCE_CACHE_TTL_MS }
    return enabled
  } catch {
    maintenanceFlagCache = { enabled: false, expiresAt: now + MAINTENANCE_CACHE_TTL_MS }
    return false
  }
}

function isAllowedDuringMaintenance(pathname: string) {
  return (
    pathname === '/maintenance' ||
    pathname.startsWith('/api/') ||
    pathname === '/api' ||
    pathname.startsWith('/auth/callback')
  )
}

export async function proxy(request: NextRequest) {
  if (await isMaintenanceEnabled()) {
    const bypassToken = process.env.MAINTENANCE_BYPASS_TOKEN
    const bypassFromQuery = request.nextUrl.searchParams.get('bypass')
    const bypassFromCookie = request.cookies.get(MAINTENANCE_BYPASS_COOKIE)?.value
    const hasValidBypass = !!bypassToken && bypassFromCookie === bypassToken

    if (bypassToken && bypassFromQuery === bypassToken) {
      const cleanUrl = request.nextUrl.clone()
      cleanUrl.searchParams.delete('bypass')

      const response = NextResponse.redirect(cleanUrl)
      response.cookies.set(MAINTENANCE_BYPASS_COOKIE, bypassToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      })
      return response
    }

    if (!hasValidBypass && !isAllowedDuringMaintenance(request.nextUrl.pathname)) {
      const maintenanceUrl = request.nextUrl.clone()
      maintenanceUrl.pathname = '/maintenance'
      maintenanceUrl.search = ''
      return NextResponse.redirect(maintenanceUrl)
    }
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
