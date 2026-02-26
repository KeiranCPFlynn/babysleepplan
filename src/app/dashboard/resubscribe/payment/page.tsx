import { notFound, redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ReactivateCheckoutButton } from './checkout-button'
import { CheckCircle, Shield, Sparkles, Ticket } from 'lucide-react'
import { hasActiveSubscription, MONTHLY_PRICE } from '@/lib/subscription'
import { formatUniversalDate } from '@/lib/date-format'

const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'false'
const foundingOffer = {
  active: true,
  code: 'FOUNDING50',
  discount: '50% off your first 3 months',
}

export default async function ReactivatePaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>
}) {
  const user = await requireAuth()
  const supabase = await createClient()

  const { plan: planId } = await searchParams

  if (!planId) {
    redirect('/dashboard/resubscribe')
  }

  // Fetch the plan with baby info
  const { data: plan } = await supabase
    .from('plans')
    .select(`
      id,
      status,
      created_at,
      baby:babies(id, name, date_of_birth)
    `)
    .eq('id', planId)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .single()

  if (!plan) {
    notFound()
  }

  // Check subscription status
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, has_used_trial, trial_ends_at')
    .eq('id', user.id)
    .single()

  const isActive = hasActiveSubscription(profile?.subscription_status, isStripeEnabled, profile?.trial_ends_at)

  // Already active — no need to resubscribe
  if (isActive) {
    redirect('/dashboard')
  }

  const baby = Array.isArray(plan.baby) ? plan.baby[0] ?? null : plan.baby
  const babyName = baby?.name || 'Baby'
  const showFoundingOffer = foundingOffer.active && isStripeEnabled

  return (
    <div className="dashboard-surface max-w-3xl mx-auto space-y-6 p-5 sm:p-6">
      {!isStripeEnabled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 dark:bg-amber-950/35 dark:border-amber-700/60">
          <p className="text-yellow-800 text-sm font-medium dark:text-amber-200">
            Development Mode: Payments are disabled. Click the button below to reactivate for free.
          </p>
        </div>
      )}

      <div className="text-center space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-700 dark:text-sky-300">
          One step left
        </p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Reactivate Your Plan
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Continue with {babyName}&apos;s existing sleep plan and pick up where you left off.
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Plan created {formatUniversalDate(plan.created_at)}
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
              LunaCradle
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300">Reactivate your existing plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                ${MONTHLY_PRICE}<span className="text-lg font-normal text-slate-500 dark:text-slate-300">/month</span>
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                Billed monthly. Cancel anytime.
              </p>
            </div>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
              <li className="flex items-center gap-2 rounded-lg bg-white/80 px-2.5 py-1.5 dark:bg-slate-800/70">
                <CheckCircle className="h-4 w-4 text-sky-600" />
                Your existing sleep plan, instantly available
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
            <ReactivateCheckoutButton
              planId={plan.id}
              babyName={babyName}
            />
            {isStripeEnabled && (
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
            <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Why Reactivate?</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-300">Continue right where you left off.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700 dark:text-slate-200">
            <div className="flex items-start gap-2">
              <Sparkles className="h-4 w-4 mt-0.5 text-sky-600" />
              <p>
                Your plan is ready immediately — no waiting for generation.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 text-sky-600" />
              <p>
                All your previous diary entries and plan updates are preserved.
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
          href="/dashboard/resubscribe"
          className="text-sm text-gray-500 hover:text-gray-700 dark:text-slate-300 dark:hover:text-slate-100"
        >
          &larr; Back to plan selection
        </Link>
      </div>
    </div>
  )
}
