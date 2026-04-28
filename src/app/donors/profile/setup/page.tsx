'use client'

import { useRouter } from 'next/navigation'
import { CreateDonorProfileForm } from '@/components/donors/profile/create-donor-profile-form'

export default function SetupPage() {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex flex-col">
        <h1 className="text-xl font-bold">Completa il tuo profilo</h1>
        <p className="text-sm text-muted-foreground">
          Prima di accedere all&apos;area donatori è necessario compilare il proprio profilo sanitario.
        </p>
      </div>
      <CreateDonorProfileForm onSuccess={() => router.replace('/donors')} />
    </div>
  )
}
