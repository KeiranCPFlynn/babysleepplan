import { createClient } from '@/lib/supabase/client'
import type { IntakeSubmission } from '@/types/database.types'
import type { IntakeFormData } from '@/lib/validations/intake'

export async function getIntakeSubmissions(): Promise<IntakeSubmission[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('intake_submissions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getIntakeById(id: string): Promise<IntakeSubmission> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('intake_submissions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getDraftIntakeForBaby(babyId: string): Promise<IntakeSubmission | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('intake_submissions')
    .select('*')
    .eq('baby_id', babyId)
    .eq('status', 'draft')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function createIntakeSubmission(babyId: string): Promise<IntakeSubmission> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('intake_submissions')
    .insert({
      baby_id: babyId,
      user_id: user.id,
      data: {}, // Required JSONB column
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateIntakeSubmission(
  id: string,
  data: Partial<IntakeFormData>
): Promise<IntakeSubmission> {
  const response = await fetch(`/api/intake/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.details || result.error || 'Failed to update intake')
  }

  return result.intake
}

export async function submitIntake(id: string): Promise<IntakeSubmission> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('intake_submissions')
    .update({ status: 'submitted' })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteIntake(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('intake_submissions')
    .delete()
    .eq('id', id)

  if (error) throw error
}
