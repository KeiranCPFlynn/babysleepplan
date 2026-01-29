import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Baby, Plus, Edit, Trash2 } from 'lucide-react'
import { differenceInMonths, differenceInDays } from 'date-fns'

export default async function BabiesPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: babies } = await supabase
    .from('babies')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  function calculateAge(dateOfBirth: string) {
    const dob = new Date(dateOfBirth)
    const now = new Date()
    const months = differenceInMonths(now, dob)
    const days = differenceInDays(now, dob)

    if (months < 1) {
      const weeks = Math.floor(days / 7)
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} old`
    } else if (months < 24) {
      return `${months} ${months === 1 ? 'month' : 'months'} old`
    } else {
      const years = Math.floor(months / 12)
      return `${years} ${years === 1 ? 'year' : 'years'} old`
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Babies</h1>
          <p className="text-gray-600 mt-1">
            Manage information about your little ones
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/babies/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Baby
          </Link>
        </Button>
      </div>

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
                        {calculateAge(baby.date_of_birth)}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/babies/${baby.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
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
            <Button asChild>
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
