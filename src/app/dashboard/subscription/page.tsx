import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, CheckCircle, CreditCard, HelpCircle } from 'lucide-react'
import { getDaysRemaining, getSubscriptionLabel, hasActiveSubscription, MONTHLY_PRICE, TRIAL_DAYS } from '@/lib/subscription'
import { TestSubscriptionControls } from '@/components/subscription/test-subscription-controls'
import { ManageSubscriptionButton } from '@/components/subscription/manage-subscription-button'

const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'false'

export default async function SubscriptionPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_period_end, stripe_customer_id, is_admin, has_used_trial, created_at')
    .eq('id', user.id)
    .single()

  const status = profile?.subscription_status
  const label = getSubscriptionLabel(status)
  const isActive = hasActiveSubscription(status, isStripeEnabled)
  const isAdmin = profile?.is_admin === true
  const daysRemaining = getDaysRemaining(profile?.subscription_period_end ?? null)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm text-purple-600 hover:text-purple-800"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-purple-900">Subscription</h1>
        <p className="text-purple-600/80 mt-1">
          Manage your Baby Sleep Plan subscription.
        </p>
      </div>

      {/* Debug Information (Admin Only) */}
      {isAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Debug Information</h3>
          <div className="text-xs text-blue-600 space-y-1">
            <p>User ID: {user.id}</p>
            <p>Current Status: {status || 'null'}</p>
            <p>Stripe Customer ID: {profile?.stripe_customer_id || 'none'}</p>
            <p>Is Active: {isActive ? 'yes' : 'no'}</p>
            <p>Stripe Enabled: {isStripeEnabled ? 'yes' : 'no'}</p>
          </div>
        </div>
      )}

      {/* Test Controls (Admin Only) */}
      {isAdmin && <TestSubscriptionControls />}

      <Card className={isActive ? 'border-green-200 bg-green-50/50' : 'border-amber-200 bg-amber-50/50'}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-green-100' : 'bg-amber-100'}`}>
              {isActive ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <CreditCard className="h-5 w-5 text-amber-600" />
              )}
            </div>
            <div>
              <CardTitle className={isActive ? 'text-green-800' : 'text-amber-800'}>
                {label}
              </CardTitle>
              <CardDescription className={isActive ? 'text-green-600' : 'text-amber-600'}>
                {status === 'trialing'
                  ? daysRemaining !== null
                    ? `Your free trial ends in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`
                    : `Your ${TRIAL_DAYS}-day free trial is active`
                  : status === 'active'
                    ? daysRemaining !== null
                      ? `Renews in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`
                      : 'Your subscription is active'
                    : status === 'cancelled'
                      ? daysRemaining !== null && daysRemaining > 0
                        ? `Access until ${new Date(profile!.subscription_period_end!).toLocaleDateString()}`
                        : 'Your subscription has been cancelled'
                      : 'No active subscription'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {isActive && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-purple-900">Plan Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Plan</span>
              <span className="text-sm font-medium text-purple-800">Baby Sleep Plan</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Price</span>
              <span className="text-sm font-medium text-purple-800">${MONTHLY_PRICE}/month</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Status</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status === 'trialing'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-green-100 text-green-700'
                }`}>
                {label}
              </span>
            </div>
            {profile?.subscription_period_end && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">
                  {status === 'trialing' ? 'Trial ends' : status === 'cancelled' ? 'Access until' : 'Renews'}
                </span>
                <span className="text-sm font-medium text-purple-800">
                  {new Date(profile.subscription_period_end).toLocaleDateString()}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-600">Includes</span>
              <span className="text-sm text-purple-800">All features</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-purple-900">What&apos;s Included</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {[
              'Personalized AI sleep plan',
              'Daily sleep diary with tracking',
              'Weekly plan updates based on your logs',
              'Troubleshooting guidance & daily checklist',
              'PDF download & print',
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-purple-500 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {isActive && (
        <Card className="border-gray-200">
          <CardHeader>
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <CardTitle className="text-base text-gray-800">Need to cancel?</CardTitle>
                <CardDescription>
                  You can cancel anytime. You&apos;ll keep access until the end of your current billing period.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ManageSubscriptionButton hasStripeCustomer={!!profile?.stripe_customer_id} />
          </CardContent>
        </Card>
      )}

      {!isActive && (
        <div className="text-center pt-4">
          <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
            <Link href="/dashboard/intake/new">
              {profile?.has_used_trial ? 'Resubscribe' : 'Start Your Free Trial'}
            </Link>
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            {profile?.has_used_trial
              ? `$${MONTHLY_PRICE}/month. Cancel anytime.`
              : `${TRIAL_DAYS} days free, then $${MONTHLY_PRICE}/month. Cancel anytime.`
            }
          </p>
        </div>
      )}
    </div>
  )
}
