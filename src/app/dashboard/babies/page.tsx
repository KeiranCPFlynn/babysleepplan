import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Baby, Plus, Edit, CreditCard } from 'lucide-react'
import { formatBabyAge } from '@/lib/age'
import { hasActiveSubscription, MONTHLY_PRICE, ADDITIONAL_BABY_PRICE } from '@/lib/subscription'
import { formatUniversalDate } from '@/lib/date-format'
import { DeleteBabyButton } from './delete-baby-button'

const isStripeEnabled = process.env.NEXT_PUBLIC_STRIPE_ENABLED !== 'false'

export default async function BabiesPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: babies } = await supabase
    .from('babies')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single()

  const isActive = hasActiveSubscription(profile?.subscription_status, isStripeEnabled)
  const babyCount = babies?.length ?? 0

  return (
    <div className="dashboard-surface space-y-6 p-5 sm:p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-sky-900">My Babies</h1>
          <p className="text-slate-600 mt-1">
            Manage information about your little ones
          </p>
        </div>
        <Button asChild className="bg-sky-700 hover:bg-sky-800">
          <Link href="/dashboard/babies/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Baby
          </Link>
        </Button>
      </div>

      {isActive && babyCount > 0 && (
        <Card className="border-sky-200/80 bg-gradient-to-br from-sky-50/80 via-white to-rose-50/65">
          <CardContent className="flex items-center gap-3 py-4">
            <CreditCard className="h-5 w-5 text-sky-600" />
            <div className="text-sm text-slate-700">
              {babyCount === 1 ? (
                <span>${MONTHLY_PRICE}/month for 1 baby. Additional babies are ${ADDITIONAL_BABY_PRICE}/month each.</span>
              ) : (
                <span>${MONTHLY_PRICE}/month + ${ADDITIONAL_BABY_PRICE}/month x {babyCount - 1} additional {babyCount - 1 === 1 ? 'baby' : 'babies'}.</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {babies && babies.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2">
          {babies.map((baby) => (
            <Card key={baby.id} className="dashboard-card-soft">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <Baby className="h-10 w-10 text-sky-500" />
                    <div>
                      <CardTitle className="text-sky-900">{baby.name}</CardTitle>
                      <CardDescription className="text-slate-600">
                        {formatBabyAge(baby.date_of_birth)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild className="border-sky-200 bg-white/80 text-slate-700 hover:bg-sky-50">
                      <Link href={`/dashboard/babies/${baby.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <DeleteBabyButton babyId={baby.id} babyName={baby.name} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-700">
                <div>
                  <span className="font-medium">Born:</span>{' '}
                  {formatUniversalDate(baby.date_of_birth)}
                </div>
                {baby.premature_weeks > 0 && (
                  <div>
                    <span className="font-medium">Premature:</span>{' '}
                    {baby.premature_weeks} weeks early
                  </div>
                )}
                {baby.temperament && (
                  <div>
                    <span className="font-medium">Temperament:</span>{' '}
                    <span>
                      {baby.temperament === 'easy'
                        ? 'Easy-going'
                        : baby.temperament === 'moderate'
                        ? 'Moderate / average'
                        : baby.temperament === 'adaptable'
                        ? 'Adaptable / flexible'
                        : baby.temperament === 'sensitive'
                        ? 'Sensitive / easily overstimulated'
                        : baby.temperament === 'slow_to_warm'
                        ? 'Slow to warm up / cautious'
                        : baby.temperament === 'persistent'
                        ? 'Persistent / determined'
                        : baby.temperament === 'not_sure'
                        ? 'Not sure yet'
                        : baby.temperament === 'other'
                        ? 'Other'
                        : 'Spirited / high needs'}
                    </span>
                  </div>
                )}
                {baby.temperament_notes && (
                  <div>
                    <span className="font-medium">Temperament notes:</span>{' '}
                    {baby.temperament_notes}
                  </div>
                )}
                {baby.medical_conditions && (
                  <div>
                    <span className="font-medium">Medical notes:</span>{' '}
                    {baby.medical_conditions}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-sky-200/80 bg-gradient-to-br from-sky-50/80 via-white to-rose-50/70">
          <CardHeader>
            <CardTitle className="text-sky-900">No babies yet</CardTitle>
            <CardDescription className="text-slate-600">
              Add your baby&apos;s information to start creating personalized sleep plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="bg-sky-700 hover:bg-sky-800">
              <Link href="/dashboard/babies/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Baby
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
