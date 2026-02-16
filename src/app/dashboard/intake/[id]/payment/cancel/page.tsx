import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { XCircle } from 'lucide-react'

export default async function PaymentCancelPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAuth()

  const { id } = await params
  const supabase = await createClient()

  // Get intake with baby info
  const { data: intake } = await supabase
    .from('intake_submissions')
    .select('*, baby:babies(name)')
    .eq('id', id)
    .single()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card className="border-gray-200">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-8 w-8 text-gray-500" />
          </div>
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
          <CardDescription>
            Your payment was cancelled. No charges were made.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            Your questionnaire responses have been saved. You can complete your
            purchase whenever you&apos;re ready.
          </p>

          <div className="flex gap-4 justify-center pt-4">
            <Button asChild>
              <Link href={`/dashboard/intake/${id}/payment`}>
                Try Again
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/intake/${id}`}>
                Edit Questionnaire
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            Why choose LunaCradle?
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Personalized plan based on your baby&apos;s unique needs</li>
            <li>• Evidence-based sleep science approach</li>
            <li>• Methods tailored to your comfort level</li>
            <li>• 30-day money-back guarantee</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
