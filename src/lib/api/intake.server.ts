import { createClient } from '@/lib/supabase/server'
import type { IntakeSubmission } from '@/types/database.types'

export async function getIntakeByIdServer(id: string): Promise<IntakeSubmission> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('intake_submissions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getIntakeSubmissionsServer(): Promise<IntakeSubmission[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('intake_submissions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}
