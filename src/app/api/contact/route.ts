import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripHtml } from '@/lib/sanitize'
import { sendContactNotificationEmail } from '@/lib/email/send'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Simple in-memory rate limiter: max 3 submissions per IP per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 3
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  entry.count++
  return entry.count > RATE_LIMIT_MAX
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many messages. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { name, email, topic, message } = body

    if (!name || !email || !topic || !message) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      )
    }

    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { error } = await supabase
      .from('contact_messages')
      .insert({
        name: stripHtml(name).slice(0, 200),
        email: email.slice(0, 320),
        topic: stripHtml(topic).slice(0, 50),
        message: stripHtml(message).slice(0, 5000),
      })

    if (error) {
      console.error('Contact form error:', error)
      return NextResponse.json(
        { error: 'Unable to send message. Please try again later.' },
        { status: 500 }
      )
    }

    // Fire-and-forget: send notification email without blocking the response
    sendContactNotificationEmail(
      stripHtml(name).slice(0, 200),
      email.slice(0, 320),
      stripHtml(topic).slice(0, 50),
      stripHtml(message).slice(0, 5000),
    ).catch((err) => {
      console.error('Failed to send contact notification email:', err)
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Invalid request.' },
      { status: 400 }
    )
  }
}
