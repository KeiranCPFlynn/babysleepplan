'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChatInterface } from '@/components/free-schedule/chat-interface'
import { SchedulePreview } from '@/components/free-schedule/schedule-preview'
import { EmailGate } from '@/components/free-schedule/email-gate'
import type { ChatMessage, ExtractedFields, SessionPhase } from '@/lib/free-schedule/types'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    turnstile?: {
      render: (container: string | HTMLElement, options: Record<string, unknown>) => string
      reset: (widgetId?: string) => void
    }
  }
}

const INITIAL_MESSAGE: ChatMessage = {
  role: 'assistant',
  content:
    "Hi! Tell me about your baby — their age and what's going on with sleep. You can paste a post from Reddit or Facebook, or just describe the situation.",
}

export function FreeScheduleClient() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE])
  const [extractedFields, setExtractedFields] = useState<ExtractedFields | null>(null)
  const [scheduleMarkdown, setScheduleMarkdown] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [questionsAsked, setQuestionsAsked] = useState(0)
  const [quickReplies, setQuickReplies] = useState<string[]>([])
  const [phase, setPhase] = useState<SessionPhase>('chat')
  const [isLoading, setIsLoading] = useState(false)
  const [hasTrackedFirstMessage, setHasTrackedFirstMessage] = useState(false)
  const [isUnlocked, setIsUnlocked] = useState(false)

  // Turnstile
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<HTMLDivElement>(null)
  const turnstileWidgetId = useRef<string | null>(null)

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    if (!siteKey || !turnstileRef.current) return

    function tryRender() {
      if (window.turnstile && turnstileRef.current && !turnstileWidgetId.current) {
        turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
          sitekey: siteKey,
          appearance: 'interaction-only',
          callback: (token: unknown) => setTurnstileToken(token as string),
          'refresh-expired': 'auto',
        })
      }
    }

    tryRender()
    const intervalId = setInterval(tryRender, 200)
    const timeoutId = setTimeout(() => clearInterval(intervalId), 5000)

    return () => {
      clearInterval(intervalId)
      clearTimeout(timeoutId)
    }
  }, [])

  const handleSend = useCallback(
    async (text: string) => {
      if (isLoading) return

      // Client-side guard: only on the very first message, before hitting the API.
      // Follow-up answers (questionsAsked > 0) are always short/expected so we skip this.
      if (!hasTrackedFirstMessage) {
        const trimmed = text.trim()
        const lower = trimmed.toLowerCase()
        // Disqualifiers override everything — explicit self-contradiction or cancellation.
        const DISQUALIFIERS = [
          "don't have a baby", "dont have a baby", "i have no baby",
          "don't have a child", "dont have a child",
          "just testing", "just kidding", "just joking", "just a test",
          "not real", "i made it up", "fake",
          "nevermind", "never mind", "ignore this",
        ]
        const isDisqualified = DISQUALIFIERS.some((d) => lower.includes(d))
        // A sleep word is required — child words alone (e.g. "baby drinks beer") are not sufficient.
        const SLEEP_WORDS = [
          'sleep', 'nap', 'bedtime', 'wake', 'wak', 'night', 'tired',
          'overtired', 'schedule', 'routine', 'feed', 'milk', 'bottle', 'breast',
          'swaddle', 'settl', 'cry', 'fuss', 'pacif', 'dummy',
        ]
        const CHILD_WORDS = ['baby', 'infant', 'newborn', 'toddler', 'child', 'kid']
        const hasSleepWord = SLEEP_WORDS.some((kw) => lower.includes(kw))
        // Child word alone only qualifies if the message is long enough to suggest real context
        const hasChildContext = CHILD_WORDS.some((kw) => lower.includes(kw)) && trimmed.length > 60
        const isOnTopic = !isDisqualified && (hasSleepWord || hasChildContext)

        if (trimmed.length < 10 || !isOnTopic) {
          setMessages((prev) => [
            ...prev,
            { role: 'user', content: text },
            {
              role: 'assistant',
              content:
                "I'm set up specifically to help with baby and toddler sleep schedules. " +
                "Tell me about your little one's sleep — their age and what's been happening — " +
                "and I'll put together a free schedule for you.",
            },
          ])
          return
        }
      }

      // Track first message
      if (!hasTrackedFirstMessage) {
        window.gtag?.('event', 'free_schedule_first_message', { free_schedule: true })
      }

      // Add user message
      const userMsg: ChatMessage = { role: 'user', content: text }
      const newMessages = [...messages, userMsg]
      setMessages(newMessages)
      setQuickReplies([])
      setIsLoading(true)

      try {
        const res = await fetch('/api/free-schedule/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: newMessages,
            sessionId,
            extractedFields,
            questionsAsked,
            // Include Turnstile token only on the first message
            ...(!hasTrackedFirstMessage && turnstileToken ? { turnstileToken } : {}),
          }),
        })

        // Reset Turnstile after first send so the token can't be reused
        if (!hasTrackedFirstMessage) {
          if (turnstileWidgetId.current) {
            window.turnstile?.reset(turnstileWidgetId.current)
          }
          setTurnstileToken(null)
          setHasTrackedFirstMessage(true)
        }

        const json = await res.json()

        if (!res.ok || json.status === 'error') {
          const errMsg =
            json.error || "Something went wrong. Please try again or rephrase your message."
          setMessages((prev) => [...prev, { role: 'assistant', content: errMsg }])
          return
        }

        if (json.status === 'rate_limited') {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content:
                json.message ||
                "You've reached the daily limit for schedule generation. Please try again tomorrow.",
            },
          ])
          return
        }

        if (json.extractedFields) {
          setExtractedFields(json.extractedFields)
        }

        if (json.sessionId) {
          setSessionId(json.sessionId)
        }

        if (json.status === 'needs_info') {
          // Track follow-up question
          const newQ = json.questionsAsked as number
          window.gtag?.('event', 'free_schedule_follow_up', { question_number: newQ })

          setQuestionsAsked(newQ)
          setQuickReplies(json.quickReplies || [])
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: json.followUpQuestion },
          ])
          return
        }

        if (json.status === 'complete' && json.scheduleMarkdown) {
          // Track report generated
          window.gtag?.('event', 'free_schedule_report_generated', {
            age_months: json.extractedFields?.age_months,
            confidence_score: json.extractedFields?.confidence_score,
          })

          setScheduleMarkdown(json.scheduleMarkdown)
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content:
                json.introMessage ||
                "I've put together a schedule based on what you've shared. You'll find it below.",
            },
          ])
          setPhase('preview')
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: "Network error. Please check your connection and try again.",
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [messages, sessionId, extractedFields, questionsAsked, isLoading, hasTrackedFirstMessage, turnstileToken]
  )

  const handleEmailSuccess = useCallback(() => {
    setIsUnlocked(true)
    setPhase('email_sent')
  }, [])

  return (
    <div className="flex flex-col gap-6">
      {/* Hidden Turnstile widget container */}
      <div ref={turnstileRef} className="hidden" aria-hidden="true" />

      {/* Chat section */}
      {(phase === 'chat' || phase === 'preview' || phase === 'email_sent') && (
        <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 sm:p-6 ${phase !== 'chat' ? 'opacity-90' : ''}`}>
          <ChatInterface
            messages={messages}
            quickReplies={phase === 'chat' ? quickReplies : []}
            isLoading={isLoading && phase === 'chat'}
            onSend={phase === 'chat' ? handleSend : () => {}}
          />
        </div>
      )}

      {/* Schedule preview + email gate (combined card) */}
      {(phase === 'preview' || phase === 'email_sent') && scheduleMarkdown && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Your Schedule
            </h2>
            <span
              className={
                isUnlocked
                  ? 'text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-full font-medium'
                  : 'text-xs bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300 px-2.5 py-1 rounded-full font-medium'
              }
            >
              {isUnlocked ? 'Full schedule' : 'Free preview'}
            </span>
          </div>

          <SchedulePreview
            markdown={scheduleMarkdown}
            extractedFields={extractedFields!}
            isUnlocked={isUnlocked}
          />

          {/* Email gate — shown inline below blurred content until unlocked */}
          {!isUnlocked && sessionId && (
            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <EmailGate sessionId={sessionId} onSuccess={handleEmailSuccess} />
            </div>
          )}
        </div>
      )}

      {/* Post-email CTA */}
      {phase === 'email_sent' && (
        <div className="bg-gradient-to-br from-indigo-50 to-sky-50 dark:from-indigo-950/30 dark:to-sky-950/30 border border-indigo-100 dark:border-indigo-900 rounded-xl p-6 text-center flex flex-col gap-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Want this schedule to adapt each week as your baby grows?
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            A full LunaCradle plan includes a step-by-step sleep method, weekly diary tracking,
            and updates tailored to your family.
          </p>
          <Link
            href="/signup"
            onClick={() =>
              window.gtag?.('event', 'free_schedule_cta_click', { source: 'post_email' })
            }
            className="inline-flex items-center justify-center bg-sky-700 hover:bg-sky-800 text-white text-sm font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Start a full personalised plan
          </Link>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            5-day free trial · $19/month · Cancel anytime
          </p>
        </div>
      )}
    </div>
  )
}
