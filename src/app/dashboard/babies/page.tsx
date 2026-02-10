import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Baby, Plus, Edit, CreditCard } from 'lucide-react'
import { formatBabyAge } from '@/lib/age'
import { hasActiveSubscription, MONTHLY_PRICE, ADDITIONAL_BABY_PRICE } from '@/lib/subscription'
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-purple-900">My Babies</h1>
          <p className="text-purple-600/80 mt-1">
            Manage information about your little ones
          </p>
        </div>
        <Button asChild className="bg-purple-600 hover:bg-purple-700">
          <Link href="/dashboard/babies/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Baby
          </Link>
        </Button>
      </div>

      {isActive && babyCount > 0 && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="flex items-center gap-3 py-4">
            <CreditCard className="h-5 w-5 text-purple-600" />
            <div className="text-sm text-purple-800">
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
            <Card key={baby.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <Baby className="h-10 w-10 text-primary" />
                    <div>
                      <CardTitle>{baby.name}</CardTitle>
                      <CardDescription>
                        {formatBabyAge(baby.date_of_birth)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/babies/${baby.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <DeleteBabyButton babyId={baby.id} babyName={baby.name} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Born:</span>{' '}
                  {new Date(baby.date_of_birth).toLocaleDateString()}
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
        <Card>
          <CardHeader>
            <CardTitle>No babies yet</CardTitle>
            <CardDescription>
              Add your baby's information to start creating personalized sleep plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
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
