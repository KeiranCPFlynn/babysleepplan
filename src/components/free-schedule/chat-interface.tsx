'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { ChatMessage } from '@/lib/free-schedule/types'

interface ChatInterfaceProps {
  messages: ChatMessage[]
  quickReplies: string[]
  isLoading: boolean
  onSend: (text: string) => void
}

export function ChatInterface({ messages, quickReplies, isLoading, onSend }: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const [showPasteModal, setShowPasteModal] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const hasUserMessage = messages.some((m) => m.role === 'user')

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

  function handlePasteSubmit() {
    const trimmed = pasteText.trim()
    if (!trimmed || isLoading) return
    setShowPasteModal(false)
    setPasteText('')
    onSend(trimmed)
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

      {/* Starter buttons (shown before first user message) */}
      {!hasUserMessage && !isLoading && (
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPasteModal(true)}
            className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
          >
            Paste a post
          </Button>
          <Button
            variant="outline"
            onClick={() => inputRef.current?.focus()}
            className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
          >
            Just tell me what's happening
          </Button>
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

      {/* Paste modal */}
      {showPasteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowPasteModal(false)}
        >
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg p-6 flex flex-col gap-4">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              Paste your post or message
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Copy and paste from Reddit, Facebook, or anywhere — we'll extract the key details automatically.
            </p>
            <Textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste your text here…"
              rows={8}
              autoFocus
              className="resize-none text-sm border-slate-200 dark:border-slate-700 dark:bg-slate-800"
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowPasteModal(false)}
                className="border-slate-200 text-slate-600"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePasteSubmit}
                disabled={!pasteText.trim()}
                className="bg-sky-700 hover:bg-sky-800 text-white"
              >
                Analyse this
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
