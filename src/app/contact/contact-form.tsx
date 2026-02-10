'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, Loader2 } from 'lucide-react'

type FormStatus = 'idle' | 'submitting' | 'success' | 'error'

export function ContactForm() {
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMessage('')

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      topic: formData.get('topic') as string,
      message: formData.get('message') as string,
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Something went wrong. Please try again.')
      }

      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-white/70 bg-white/80 p-8 shadow-sm text-center">
        <CheckCircle className="h-10 w-10 text-sky-600 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Message sent</h2>
        <p className="text-sm text-slate-600">
          Thanks for reaching out. We&apos;ll get back to you within 24 hours on business days.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => setStatus('idle')}
        >
          Send another message
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-white/70 bg-white/80 p-8 shadow-sm">
      <h2 className="text-xl font-semibold mb-6">Send us a message</h2>

      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Your name"
              required
              disabled={status === 'submitting'}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              disabled={status === 'submitting'}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="topic">Topic</Label>
          <select
            id="topic"
            name="topic"
            required
            disabled={status === 'submitting'}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          >
            <option value="">Select a topic</option>
            <option value="account">Account &amp; billing</option>
            <option value="plan">My sleep plan</option>
            <option value="cancel">Cancel subscription</option>
            <option value="delete">Delete my data</option>
            <option value="feedback">Feedback &amp; suggestions</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            name="message"
            placeholder="How can we help?"
            rows={5}
            required
            disabled={status === 'submitting'}
          />
        </div>

        {status === 'error' && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}

        <Button
          type="submit"
          className="w-full bg-sky-700 text-white hover:bg-sky-800"
          disabled={status === 'submitting'}
        >
          {status === 'submitting' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            'Send Message'
          )}
        </Button>
      </div>
    </form>
  )
}
