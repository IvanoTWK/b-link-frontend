import { TwoFactorSetupForm } from "@/components/auth/TwoFactorSetupForm";

export default async function TwoFactorSetupPage({
  searchParams
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  return <TwoFactorSetupForm token={token ?? ''} />
}
