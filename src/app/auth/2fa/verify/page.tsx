import { TwoFactorVerifyForm } from "@/components/auth/TwoFactorVerifyForm";

export default async function TwoFactorVerifyPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  return <TwoFactorVerifyForm token={token ?? ''} />
}
