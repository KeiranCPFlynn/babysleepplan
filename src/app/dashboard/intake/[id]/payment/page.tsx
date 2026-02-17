import { notFound, redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getIntakeByIdServer } from '@/lib/api/intake.server'
import { getBabyByIdServer } from '@/lib/api/babies.server'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { CheckoutButton } from './checkout-button'
import { CheckCircle, Shield, Sparkles, Ticket } from 'lucide-react'
import { hasActiveSubscription, ADDITIONAL_BABY_PRICE, MONTHLY_PRICE, TRIAL_DAYS } from '@/lib/subscription'

const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'false'
const foundingOffer = {
  active: true,
  code: 'FOUNDING50',
  discount: '50% off your first 3 months',
}

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

    const showFoundingOffer = foundingOffer.active && isStripeEnabled && !isAdditionalBaby

    return (
      <div className="dashboard-surface max-w-3xl mx-auto space-y-6 p-5 sm:p-6">
        {!isStripeEnabled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 dark:bg-amber-950/35 dark:border-amber-700/60">
            <p className="text-yellow-800 text-sm font-medium dark:text-amber-200">
              Development Mode: Payments are disabled. Click the button below to generate a plan for free.
            </p>
          </div>
        )}

        <div className="text-center space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-700 dark:text-sky-300">
            One step left
          </p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {isAdditionalBaby ? 'Add Another Baby' : isReturningUser ? 'Resubscribe' : 'Start Your Free Trial'}
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            {isAdditionalBaby
              ? `Add ${baby.name}'s personalized sleep plan to your subscription.`
              : isReturningUser
                ? `Get ${baby.name}'s personalized sleep plan and full access.`
                : `Get ${baby.name}'s personalized sleep plan and full access with ${TRIAL_DAYS} days free.`
            }
          </p>
        </div>

        {showFoundingOffer && (
          <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-rose-50 shadow-sm dark:border-amber-700/60 dark:from-slate-900/75 dark:to-rose-950/30">
            <CardContent className="py-3">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
                <div className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800 dark:border-amber-700/60 dark:bg-slate-800/70 dark:text-amber-200">
                  <Ticket className="h-3.5 w-3.5" />
                  Founding Families
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-200">
                  <span className="font-semibold">{foundingOffer.discount}</span> with code{' '}
                    <span className="font-bold text-amber-900 dark:text-amber-200">{foundingOffer.code}</span> on checkout.
                  </p>
                </div>
              </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-sky-200 bg-gradient-to-br from-sky-50 via-white to-rose-50 shadow-md dark:border-slate-700 dark:from-slate-900/75 dark:via-slate-900/80 dark:to-rose-950/25">
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-2xl text-slate-900 dark:text-slate-100">
                {isAdditionalBaby ? 'Additional Baby Plan' : 'LunaCradle'}
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300">Everything you need for better sleep</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                {isAdditionalBaby ? (
                  <>
                    <p className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                      ${ADDITIONAL_BABY_PRICE}<span className="text-lg font-normal text-slate-500 dark:text-slate-300">/month</span>
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      Added to your existing subscription. Cancel anytime.
                    </p>
                  </>
                ) : isReturningUser ? (
                  <>
                    <p className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                      ${MONTHLY_PRICE}<span className="text-lg font-normal text-slate-500 dark:text-slate-300">/month</span>
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      Billed monthly. Cancel anytime.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-4xl font-bold text-slate-900 dark:text-slate-100">$0 <span className="text-lg font-normal text-slate-500 dark:text-slate-300">today</span></p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">then ${MONTHLY_PRICE}/month after {TRIAL_DAYS} days. Cancel anytime.</p>
                  </>
                )}
              </div>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
                <li className="flex items-center gap-2 rounded-lg bg-white/80 px-2.5 py-1.5 dark:bg-slate-800/70">
                  <CheckCircle className="h-4 w-4 text-sky-600" />
                  Personalized sleep plan ready tonight
                </li>
                <li className="flex items-center gap-2 rounded-lg bg-white/80 px-2.5 py-1.5 dark:bg-slate-800/70">
                  <CheckCircle className="h-4 w-4 text-sky-600" />
                  Living sleep diary and daily logging
                </li>
                <li className="flex items-center gap-2 rounded-lg bg-white/80 px-2.5 py-1.5 dark:bg-slate-800/70">
                  <CheckCircle className="h-4 w-4 text-sky-600" />
                  Weekly plan updates from your logs
                </li>
                <li className="flex items-center gap-2 rounded-lg bg-white/80 px-2.5 py-1.5 dark:bg-slate-800/70">
                  <CheckCircle className="h-4 w-4 text-sky-600" />
                  Troubleshooting + daily checklist
                </li>
              </ul>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <CheckoutButton
                intakeId={id}
                babyName={baby.name}
                isAdditionalBaby={isAdditionalBaby}
                isReturningUser={isReturningUser}
              />
              {isStripeEnabled && !isAdditionalBaby && (
                <>
                  <div className="w-full rounded-lg border border-sky-200 bg-sky-50/70 px-3 py-2 text-center dark:border-slate-600 dark:bg-slate-800/70">
                    <p className="text-xs text-slate-700 dark:text-slate-200">
                      Have a coupon code? Enter it on the secure Stripe checkout page after you continue.
                    </p>
                  </div>
                  <p className="text-xs text-center text-gray-400 dark:text-slate-400">
                    Credit card required. Cancel anytime. Secure payment powered by Stripe.
                  </p>
                </>
              )}
            </CardFooter>
          </Card>

          <Card className="border-sky-200 bg-gradient-to-br from-white via-sky-50/40 to-rose-50/40 dark:border-slate-700 dark:from-slate-900/75 dark:via-slate-900/80 dark:to-rose-950/20">
            <CardHeader>
              <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Why Parents Start Now</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300">What happens after you enter payment details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-700 dark:text-slate-200">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 mt-0.5 text-sky-600" />
                <p>
                  Your payment is confirmed and plan generation starts immediately.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 mt-0.5 text-sky-600" />
                <p>
                  Most families receive their personalized plan in 1-2 minutes.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 mt-0.5 text-sky-600" />
                <p>
                  No long-term contract. Cancel anytime from your account.
                </p>
              </div>
              <div className="rounded-xl border border-sky-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800/70">
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  &ldquo;Night 2 already felt calmer. We finally had a clear plan.&rdquo;
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">- Sarah M., mom of 7-month-old</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Link
            href={`/dashboard/intake/${id}`}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-slate-300 dark:hover:text-slate-100"
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
