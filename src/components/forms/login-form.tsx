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
import { Star } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      toast.success('Logged in successfully!')
      router.push('/dashboard')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md border-white/60 bg-white/80 backdrop-blur-sm shadow-lg">
      <CardHeader className="text-center pb-2">
        <div className="flex justify-center mb-3">
          <Star className="h-5 w-5 text-amber-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="text-sm text-slate-500 mt-1">
          Log in to access your sleep plans
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-700">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              className="bg-white/70 border-slate-200 focus:border-sky-400 focus:ring-sky-400/20"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-slate-700">Password</Label>
              <Link href="/reset-password" className="text-xs text-sky-700 hover:text-sky-800 hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
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
            {loading ? 'Logging in...' : 'Log in'}
          </Button>

          <p className="text-sm text-center text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-sky-700 font-medium hover:text-sky-800 hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
