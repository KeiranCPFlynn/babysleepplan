'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import Link from 'next/link'
import { toast } from 'sonner'
import { KeyRound, CheckCircle } from 'lucide-react'
import { buildAuthCallbackUrl } from '@/lib/auth-redirect'

export function ResetPasswordForm() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: buildAuthCallbackUrl('/reset-password/confirm'),
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <Card className="w-full max-w-md border-white/60 bg-white/80 backdrop-blur-sm shadow-lg dark:border-slate-700/70 dark:bg-slate-900/80">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Check your email</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            We sent a password reset link to <strong className="text-slate-700 dark:text-slate-200">{email}</strong>
          </p>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Click the link in the email to set a new password. If you don&apos;t see it, check your spam folder.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-2">
          <Link href="/login" className="text-sm text-sky-700 font-medium hover:text-sky-800 hover:underline">
            &larr; Back to login
          </Link>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md border-white/60 bg-white/80 backdrop-blur-sm shadow-lg dark:border-slate-700/70 dark:bg-slate-900/80">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-3">
          <KeyRound className="h-5 w-5 text-sky-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Reset your password</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700 dark:text-slate-200">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/70 border-slate-200 focus:border-sky-400 focus:ring-sky-400/20 dark:bg-slate-800/80 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-400"
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-2">
          <Button
            type="submit"
            className="w-full bg-sky-700 hover:bg-sky-800 text-white"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </Button>

          <Link href="/login" className="text-sm text-sky-700 font-medium hover:text-sky-800 hover:underline">
            &larr; Back to login
          </Link>
        </CardFooter>
      </form>
    </Card>
  )
}
