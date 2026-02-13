import { notFound, redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getIntakeByIdServer } from '@/lib/api/intake.server'
import { getBabyByIdServer } from '@/lib/api/babies.server'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { CheckoutButton } from './checkout-button'
import { CheckCircle } from 'lucide-react'
import { hasActiveSubscription, ADDITIONAL_BABY_PRICE, MONTHLY_PRICE, TRIAL_DAYS } from '@/lib/subscription'

const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'false'

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireAuth()
  const supabase = await createClient()

  const { id } = await params

  try {
    const intake = await getIntakeByIdServer(id)

    // If not submitted yet, redirect back to form
    if (intake.status === 'draft') {
      redirect(`/dashboard/intake/${id}`)
    }

    // If already paid, redirect to plans
    if (intake.status === 'paid') {
      redirect(`/dashboard/plans?intake=${id}`)
    }

    const baby = await getBabyByIdServer(intake.baby_id)

    // Check if user already has an active subscription (additional baby flow)
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, has_used_trial')
      .eq('id', user.id)
      .single()

    const isAdditionalBaby = hasActiveSubscription(profile?.subscription_status, isStripeEnabled)
    const isReturningUser = !isAdditionalBaby && profile?.has_used_trial === true

    return (
      <div className="max-w-lg mx-auto space-y-6">
        {!isStripeEnabled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm font-medium">
              Development Mode: Payments are disabled. Click the button below to generate a plan for free.
            </p>
          </div>
        )}

        <div className="text-center">
          <h1 className="text-3xl font-bold">
            {isAdditionalBaby ? 'Add Another Baby' : isReturningUser ? 'Resubscribe' : 'Start Your Free Trial'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isAdditionalBaby
              ? `Add ${baby.name}'s personalized sleep plan to your subscription.`
              : isReturningUser
                ? `Get ${baby.name}'s personalized sleep plan and full access.`
                : `Get ${baby.name}'s personalized sleep plan and full access for ${TRIAL_DAYS} days free.`
            }
          </p>
        </div>

        <Card className="border-sky-200 shadow-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isAdditionalBaby ? 'Additional Baby Plan' : 'LunaCradle'}
            </CardTitle>
            <CardDescription>Everything you need for better sleep</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              {isAdditionalBaby ? (
                <>
                  <p className="text-4xl font-bold text-gray-900">
                    ${ADDITIONAL_BABY_PRICE}<span className="text-lg font-normal text-gray-500">/month</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Added to your existing subscription. Cancel anytime.
                  </p>
                </>
              ) : isReturningUser ? (
                <>
                  <p className="text-4xl font-bold text-gray-900">
                    ${MONTHLY_PRICE}<span className="text-lg font-normal text-gray-500">/month</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Billed monthly. Cancel anytime.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-4xl font-bold text-gray-900">$0 <span className="text-lg font-normal text-gray-500">today</span></p>
                  <p className="text-sm text-gray-500 mt-1">then ${MONTHLY_PRICE}/month after {TRIAL_DAYS} days. Cancel anytime.</p>
                </>
              )}
            </div>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-sky-600" />
                Personalized sleep plan, ready tonight
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-sky-600" />
                Living sleep diary + daily logging
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-sky-600" />
                Weekly plan updates based on your logs
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-sky-600" />
                Troubleshooting guidance + daily checklist
              </li>
            </ul>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <CheckoutButton
              intakeId={id}
              babyName={baby.name}
              isAdditionalBaby={isAdditionalBaby}
              isReturningUser={isReturningUser}
            />
            {isStripeEnabled && !isAdditionalBaby && (
              <p className="text-xs text-center text-gray-400">
                Credit card required. Cancel anytime. Secure payment powered by Stripe.
              </p>
            )}
          </CardFooter>
        </Card>

        <div className="text-center">
          <Link
            href={`/dashboard/intake/${id}`}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            &larr; Back to questionnaire
          </Link>
        </div>
      </div>
    )
  } catch {
    notFound()
  }
}
