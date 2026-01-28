import { createClient } from '@/lib/supabase/client'
import type { Baby } from '@/types/database.types'
import type { BabyFormData } from '@/lib/validations/baby'

export async function getBabies(): Promise<Baby[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('babies')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getBabyById(id: string): Promise<Baby> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('babies')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createBaby(baby: BabyFormData): Promise<Baby> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('babies')
    .insert({
      ...baby,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateBaby(id: string, baby: BabyFormData): Promise<Baby> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('babies')
    .update(baby)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteBaby(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('babies').delete().eq('id', id)

  if (error) throw error
}
