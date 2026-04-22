import { VerifyEmailPending } from '@/components/auth/VerifyEmailPending'

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const { email } = await searchParams

  return (
    <VerifyEmailPending email={email ?? ''} />
  )
}
