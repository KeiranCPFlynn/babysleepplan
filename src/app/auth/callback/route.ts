import { createClient } from '@/lib/supabase/server'
import { EmailOtpType } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

async function ensureProfileExists() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.id || !user.email) {
    return
  }

  const fullName =
    typeof user.user_metadata?.full_name === 'string'
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === 'string'
        ? user.user_metadata.name
        : null

  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email,
      full_name: fullName,
    }, { onConflict: 'id' })

  if (error) {
    console.error('[auth/callback] failed to ensure profile exists:', error.message)
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next')
  const redirectPath = next?.startsWith('/') ? next : '/dashboard'

  const buildRedirect = () => {
    const forwardedHost = request.headers.get('x-forwarded-host')
    const isLocalEnv = process.env.NODE_ENV === 'development'
    if (isLocalEnv) {
      return `${origin}${redirectPath}`
    }
    if (forwardedHost) {
      return `https://${forwardedHost}${redirectPath}`
    }
    return `${origin}${redirectPath}`
  }

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      await ensureProfileExists()
      return NextResponse.redirect(buildRedirect())
    }
  }

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    })

    if (!error) {
      await ensureProfileExists()
      return NextResponse.redirect(buildRedirect())
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
