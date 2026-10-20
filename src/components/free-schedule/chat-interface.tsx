'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { ChatMessage } from '@/lib/free-schedule/types'

export const SCHEDULE_EXAMPLE = 'My baby is 8 months, wakes at 7am and takes two short naps. Bedtime is 7pm.'

interface ChatInterfaceProps {
  messages: ChatMessage[]
  quickReplies: string[]
  isLoading: boolean
  loadingStatus?: string | null
  isComplete?: boolean
  isFirstMessage?: boolean
  onSend: (text: string) => void
}

export function ChatInterface({
  messages,
  quickReplies,
  isLoading,
  loadingStatus = null,
  isComplete = false,
  isFirstMessage = true,
  onSend,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Leave the completed preview in view instead of scrolling back to the chat.
    if (!isComplete && messages.length > 1) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading, isComplete])

  function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setInput('')
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleChipClick(chip: string) {
    onSend(chip)
  }

  function useExample() {
    setInput(SCHEDULE_EXAMPLE)
    inputRef.current?.focus()
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {isFirstMessage && !isComplete && (
        <section aria-label="Illustrative schedule example" className="rounded-xl border border-sky-100 bg-sky-50/70 p-3 text-xs text-slate-600 dark:border-sky-900 dark:bg-sky-950/30 dark:text-slate-300">
          <p><strong className="text-slate-800 dark:text-slate-100">Example</strong> · Illustrative, not a recommendation</p>
          <p className="mt-1">8 months, wakes at 7am, two short naps, bedtime 7pm</p>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
            <dt className="font-medium">Wake</dt><dd>7:00 am</dd>
            <dt className="font-medium">Naps</dt><dd>9:30–10:30 am · 1:45–2:45 pm</dd>
            <dt className="font-medium">Bedtime</dt><dd>6:45–7:00 pm</dd>
          </dl>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span>+ Two tips for short naps</span>
            <Button type="button" variant="outline" size="sm" disabled={isLoading} onClick={useExample} className="text-xs">
              Use this example
            </Button>
          </div>
        </section>
      )}
      {/* Message list */}
      <div className="flex flex-col gap-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} message-enter`}
          >
            <div
              className={messages.length === 1 ? 'text-sm text-slate-600 dark:text-slate-300' : `max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                msg.role === 'user'
                  ? 'bg-sky-700 text-white rounded-br-sm'
                  : 'bg-white text-slate-800 border border-slate-100 rounded-bl-sm dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm dark:bg-slate-800 dark:border-slate-700">
              <div className="flex gap-1 items-center h-4">
                <span className="typing-dot w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                <span className="typing-dot w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                <span className="typing-dot w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
              </div>
              {loadingStatus && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{loadingStatus}</p>
              )}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick-reply chips */}
      {quickReplies.length > 0 && !isLoading && (
        <div className="flex flex-wrap gap-2">
          {quickReplies.map((chip) => (
            <Button
              key={chip}
              variant="outline"
              size="sm"
              onClick={() => handleChipClick(chip)}
              className="rounded-full text-xs border-sky-200 text-sky-700 hover:bg-sky-50 hover:border-sky-400 dark:border-sky-800 dark:text-sky-300 dark:hover:bg-sky-950"
            >
              {chip}
            </Button>
          ))}
        </div>
      )}

      {/* Input area */}
      {!isComplete && (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Your baby's sleep situation"
              placeholder="Your baby's age, wake time and sleep challenge…"
              disabled={isLoading}
              rows={2}
              className="min-w-0 flex-1 resize-none text-sm rounded-xl border-slate-200 focus:border-sky-300 dark:border-slate-700 dark:bg-slate-900"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="w-full bg-sky-700 hover:bg-sky-800 text-white rounded-xl px-4 py-2 sm:w-auto sm:self-end shrink-0"
            >
              {isFirstMessage ? 'Build my schedule' : 'Send'}
            </Button>
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
            Optional: email the PDF to unlock full adjustments, with occasional sleep tips.
            General information, not medical advice.
          </p>
        </>
      )}

    </div>
  )
}
