'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import Link from 'next/link'
import { toast } from 'sonner'
import { KeyRound, Loader2 } from 'lucide-react'

export function UpdatePasswordForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [sessionValid, setSessionValid] = useState(false)
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })

  // Supabase exchanges the token from the URL hash on page load
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionValid(true)
      }
      setChecking(false)
    })
    // Also check if already in a valid session (e.g. token already exchanged)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionValid(true)
      }
      setChecking(false)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({
      password: formData.password,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Password updated successfully!')
    router.push('/dashboard')
    router.refresh()
  }

  if (checking) {
    return (
      <Card className="w-full max-w-md border-white/60 bg-white/80 backdrop-blur-sm shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 text-sky-600 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  if (!sessionValid) {
    return (
      <Card className="w-full max-w-md border-white/60 bg-white/80 backdrop-blur-sm shadow-lg">
        <CardHeader className="text-center pb-2">
          <h1 className="text-2xl font-bold text-slate-900">Invalid or expired link</h1>
          <p className="text-sm text-slate-500 mt-1">
            This password reset link is no longer valid. Please request a new one.
          </p>
        </CardHeader>
        <CardFooter className="flex flex-col space-y-4 pt-2">
          <Button asChild className="w-full bg-sky-700 hover:bg-sky-800 text-white">
            <Link href="/reset-password">Request new reset link</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md border-white/60 bg-white/80 backdrop-blur-sm shadow-lg">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-3">
          <KeyRound className="h-5 w-5 text-sky-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Set new password</h1>
        <p className="text-sm text-slate-500 mt-1">
          Enter your new password below
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-700">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              minLength={6}
              className="bg-white/70 border-slate-200 focus:border-sky-400 focus:ring-sky-400/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-700">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              required
              minLength={6}
              className="bg-white/70 border-slate-200 focus:border-sky-400 focus:ring-sky-400/20"
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-2">
          <Button
            type="submit"
            className="w-full bg-sky-700 hover:bg-sky-800 text-white"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update password'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
