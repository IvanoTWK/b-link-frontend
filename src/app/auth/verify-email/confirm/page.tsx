import { VerifyEmailConfirm } from '@/components/auth/VerifyEmailConfirm'

export default async function VerifyEmailConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  return (
    <VerifyEmailConfirm token={token ?? ''} />
  )
}
