import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { BabyForm } from '@/components/forms/baby-form'
import { notFound } from 'next/navigation'

export default async function EditBabyPage({
  params,
}: {
  params: { id: string }
}) {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: baby, error } = await supabase
    .from('babies')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !baby) {
    notFound()
  }

  return (
    <div>
      <BabyForm baby={baby} mode="edit" />
    </div>
  )
}
