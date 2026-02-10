'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatBabyAge } from '@/lib/age'

interface Baby {
  id: string
  name: string
  date_of_birth: string
}

interface BabySelectorProps {
  babies: Baby[]
  selectedBabyId?: string
}

export function BabySelector({ babies, selectedBabyId }: BabySelectorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(selectedBabyId || null)

  const createIntake = async (babyId: string) => {
    setLoading(babyId)

    try {
      const response = await fetch('/api/intake/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ babyId }),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('API Error:', data)
        throw new Error(data.details || data.error || 'Failed to create intake')
      }

      router.push(`/dashboard/intake/${data.intakeId}`)
    } catch (error) {
      console.error('Intake creation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create intake')
      setLoading(null)
    }
  }

  // Auto-create intake if baby is pre-selected
  useEffect(() => {
    if (selectedBabyId) {
      createIntake(selectedBabyId)
    }
  }, [selectedBabyId])

  // Show loading state when auto-creating
  if (selectedBabyId && loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Setting up your questionnaire...</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {babies.map((baby) => (
        <Card key={baby.id} className="hover:border-blue-300 transition-colors">
          <CardHeader>
            <CardTitle>{baby.name}</CardTitle>
            <CardDescription>{formatBabyAge(baby.date_of_birth)}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => createIntake(baby.id)}
              disabled={loading === baby.id}
            >
              {loading === baby.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                `Start Plan for ${baby.name}`
              )}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
