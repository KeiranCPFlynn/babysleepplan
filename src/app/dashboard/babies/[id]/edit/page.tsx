import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { BabyForm } from '@/components/forms/baby-form'
import { notFound } from 'next/navigation'
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseAdmin: SupabaseClient | null = null

function getSupabaseAdmin() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null
  }
  if (!supabaseAdmin) {
    supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabaseAdmin
}

export default async function EditBabyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireAuth()
  const { id } = await params

  const adminSupabase = getSupabaseAdmin()
  const supabase = adminSupabase ?? await createClient()

  const { data: baby, error } = await supabase
    .from('babies')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !baby || baby.user_id !== user.id) {
    notFound()
  }

  return (
    <div>
      <BabyForm baby={baby} mode="edit" />
    </div>
  )
}
