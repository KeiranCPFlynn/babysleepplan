import { createClient } from '@/lib/supabase/server'
import type { Baby } from '@/types/database.types'

export async function getBabyByIdServer(id: string): Promise<Baby> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('babies')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function getBabiesServer(): Promise<Baby[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('babies')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}
