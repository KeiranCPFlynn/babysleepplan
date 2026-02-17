'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import Link from 'next/link'
import { toast } from 'sonner'
import { Mail, Sparkles } from 'lucide-react'
import {
  getPasswordPolicyErrors,
  PASSWORD_POLICY_HINT,
  PASSWORD_POLICY_REGEX,
} from '@/lib/password-policy'

export function SignupForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmEmail, setConfirmEmail] = useState('')
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      setLoading(false)
      return
    }

    const passwordErrors = getPasswordPolicyErrors(formData.password)
    if (passwordErrors.length > 0) {
      toast.error(`Password must include ${passwordErrors.join(', ')}`)
      setLoading(false)
      return
    }

    const supabase = createClient()
    const emailRedirectTo = `${window.location.origin}/auth/callback?next=/dashboard`

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo,
        data: {
          full_name: formData.fullName,
        },
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    if (data.user && !data.session) {
      // Email confirmation required — show check-email screen
      setConfirmEmail(formData.email)
      setLoading(false)
      return
    }

    if (data.user) {
      toast.success('Account created successfully!')
      router.push('/dashboard')
      router.refresh()
    }

    setLoading(false)
  }

  const handleGoogleSignup = async () => {
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
    }
  }

  if (confirmEmail) {
    return (
      <Card className="w-full max-w-md border-white/60 bg-white/80 backdrop-blur-sm shadow-lg dark:border-slate-700/70 dark:bg-slate-900/80">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <Mail className="h-8 w-8 text-sky-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Check your email</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            We&apos;ve sent a confirmation link to
          </p>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1">{confirmEmail}</p>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Click the link in your email to verify your account, then you can log in.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">Go to login</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md border-white/60 bg-white/80 backdrop-blur-sm shadow-lg dark:border-slate-700/70 dark:bg-slate-900/80">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-3">
          <Sparkles className="h-5 w-5 text-sky-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Create an account</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Create your account to get started
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-slate-700 dark:text-slate-200">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Jane Smith"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              autoComplete="name"
              required
              className="bg-white/70 border-slate-200 focus:border-sky-400 focus:ring-sky-400/20 dark:bg-slate-800/80 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700 dark:text-slate-200">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              autoComplete="email"
              inputMode="email"
              required
              className="bg-white/70 border-slate-200 focus:border-sky-400 focus:ring-sky-400/20 dark:bg-slate-800/80 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700 dark:text-slate-200">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              autoComplete="new-password"
              required
              minLength={8}
              pattern={PASSWORD_POLICY_REGEX.source}
              title={PASSWORD_POLICY_HINT}
              className="bg-white/70 border-slate-200 focus:border-sky-400 focus:ring-sky-400/20 dark:bg-slate-800/80 dark:border-slate-600 dark:text-slate-100 dark:placeholder:text-slate-400"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">{PASSWORD_POLICY_HINT}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-slate-200">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              autoComplete="new-password"
              required
              minLength={8}
              pattern={PASSWORD_POLICY_REGEX.source}
              title={PASSWORD_POLICY_HINT}
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
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>

          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200 dark:border-slate-700" />
            </div>
            <span className="relative block mx-auto w-fit bg-white/80 px-2 text-xs text-slate-400 dark:bg-slate-900/80 dark:text-slate-500">or</span>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-slate-300 bg-white hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            onClick={handleGoogleSignup}
            disabled={loading}
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" className="mr-2 shrink-0">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.229 36 24 36c-6.627 0-12-5.373-12-12S17.373 12 24 12c3.059 0 5.844 1.154 7.962 3.038l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.651-.389-3.917z" />
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.844 1.154 7.962 3.038l5.657-5.657C34.046 6.053 29.268 4 24 4c-7.681 0-14.297 4.337-17.694 10.691z" />
              <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.145 35.091 26.715 36 24 36c-5.209 0-9.623-3.323-11.283-7.946l-6.522 5.025C9.558 39.556 16.227 44 24 44z" />
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.044 12.044 0 0 1-4.084 5.571l.003-.002 6.19 5.238C36.971 39.183 44 34 44 24c0-1.341-.138-2.651-.389-3.917z" />
            </svg>
            Continue with Google
          </Button>

          <p className="text-sm text-center text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link href="/login" className="text-sky-700 font-medium hover:text-sky-800 hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
