import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CheckCircle, Sparkles } from 'lucide-react'

const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'false'

export default async function PaymentSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ session_id?: string; dev_mode?: string }>
}) {
  await requireAuth()

  const { id } = await params
  const { session_id, dev_mode } = await searchParams

  const supabase = await createClient()

  // Get intake with baby info
  const { data: intake } = await supabase
    .from('intake_submissions')
    .select('*, baby:babies(name)')
    .eq('id', id)
    .single()

  if (!intake) {
    redirect('/dashboard')
  }

  // Get the plan if it exists
  const { data: plan } = await supabase
    .from('plans')
    .select('id, status')
    .eq('intake_submission_id', id)
    .single()

  const isDevMode = dev_mode === 'true' || !isStripeEnabled

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {isDevMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm font-medium">
            Free Mode: Your plan is being generated at no cost.
          </p>
        </div>
      )}

      <Card className="border-green-200 bg-green-50">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">
            {isDevMode ? 'Plan Generation Started!' : 'Payment Successful!'}
          </CardTitle>
          <CardDescription className="text-green-700">
            {isDevMode
              ? 'Your sleep plan is being generated.'
              : 'Thank you for your purchase. Your payment has been processed.'}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <CardTitle>{intake.baby?.name || 'Baby'}'s Sleep Plan</CardTitle>
          </div>
          <CardDescription>
            {plan?.status === 'generating' ? (
              'Your personalized sleep plan is being generated...'
            ) : plan?.status === 'completed' ? (
              'Your sleep plan is ready!'
            ) : (
              'We\'re preparing your sleep plan.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {plan?.status === 'generating' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                Our AI is analyzing your questionnaire responses and creating a
                personalized sleep plan for {intake.baby?.name || 'your baby'}.
                This usually takes 1-2 minutes.
              </p>
              <div className="mt-4 flex justify-center">
                <div className="animate-pulse flex space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animation-delay-200"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animation-delay-400"></div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-center pt-4">
            {plan?.status === 'completed' ? (
              <Button asChild>
                <Link href={`/dashboard/plans/${plan.id}`}>
                  View Your Sleep Plan
                </Link>
              </Button>
            ) : (
              <Button asChild>
                <Link href="/dashboard/plans">
                  Go to My Plans
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {!isDevMode && (
        <p className="text-center text-sm text-gray-500">
          Order ID: {session_id ? session_id.slice(0, 20) + '...' : id}
        </p>
      )}
    </div>
  )
}
