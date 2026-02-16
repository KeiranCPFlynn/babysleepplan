import { BabyForm } from '@/components/forms/baby-form'

export default async function NewBabyPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>
}) {
  const params = await searchParams
  const isOnboarding = params.returnTo?.includes('/intake')

  return (
    <div className="space-y-6">
      {isOnboarding && (
        <div>
          <h1 className="text-3xl font-bold">Create Your Sleep Plan</h1>
          <p className="text-gray-600 mt-2">
            Let&apos;s get started! First, tell us about your baby.
          </p>
        </div>
      )}
      <BabyForm mode="create" returnTo={params.returnTo} />
    </div>
  )
}
