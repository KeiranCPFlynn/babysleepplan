import { notFound, redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import { getIntakeByIdServer } from '@/lib/api/intake.server'
import { getBabyByIdServer } from '@/lib/api/babies.server'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { CheckoutButton } from './checkout-button'

const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'false'

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAuth()

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

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {!isStripeEnabled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm font-medium">
              Development Mode: Payments are disabled. Click the button below to generate a plan for free.
            </p>
          </div>
        )}

        <div>
          <h1 className="text-3xl font-bold">
            {isStripeEnabled ? 'Complete Your Purchase' : 'Generate Your Plan'}
          </h1>
          <p className="text-gray-600 mt-2">
            You're one step away from getting {baby.name}'s personalized sleep plan.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Personalized Sleep Plan</CardTitle>
            <CardDescription>
              AI-generated sleep plan tailored specifically for {baby.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Customized to your baby's age and temperament
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Based on evidence-based sleep science
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Tailored to your comfort level with crying
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Considers your specific challenges
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Detailed step-by-step implementation guide
              </li>
            </ul>

            {isStripeEnabled && (
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold">$29</span>
                </div>
                <p className="text-sm text-gray-500">One-time payment</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <CheckoutButton intakeId={id} babyName={baby.name} />
            {isStripeEnabled && (
              <p className="text-xs text-center text-gray-500">
                Secure payment powered by Stripe. 30-day money-back guarantee.
              </p>
            )}
          </CardFooter>
        </Card>

        <div className="text-center">
          <Link
            href={`/dashboard/intake/${id}`}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Back to questionnaire
          </Link>
        </div>
      </div>
    )
  } catch {
    notFound()
  }
}
