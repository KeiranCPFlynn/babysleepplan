'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { ChatMessage } from '@/lib/free-schedule/types'

interface ChatInterfaceProps {
  messages: ChatMessage[]
  quickReplies: string[]
  isLoading: boolean
  loadingStatus?: string | null
  onSend: (text: string) => void
}

export function ChatInterface({
  messages,
  quickReplies,
  isLoading,
  loadingStatus = null,
  onSend,
}: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

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

  return (
    <div className="flex flex-col gap-4">
      {/* Message list */}
      <div className="flex flex-col gap-3 min-h-[200px]">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} message-enter`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
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
      <div className="flex gap-2 items-end">
        <Textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your baby's sleep situation…"
          disabled={isLoading}
          rows={2}
          className="flex-1 resize-none text-sm rounded-xl border-slate-200 focus:border-sky-300 dark:border-slate-700 dark:bg-slate-900"
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="bg-sky-700 hover:bg-sky-800 text-white rounded-xl px-4 py-2 self-end shrink-0"
        >
          Send
        </Button>
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500 text-center">
        Enter to send · Shift+Enter for new line
      </p>

    </div>
  )
}
