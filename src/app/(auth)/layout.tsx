import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  // If already logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      {children}
    </div>
  )
}
