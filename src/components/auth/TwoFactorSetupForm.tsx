'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { QRCodeSVG } from 'qrcode.react'
import Link from 'next/link'

import { apiClient } from '@/lib/api/axios'
import { useAuthStore } from '@/lib/store/auth.store'
import { ROLE_REDIRECT } from '@/lib/auth/constants'
import { twoFactorCodeSchema, type TwoFactorCodeInput } from '@/lib/auth/schemas/two-factor-code.schema'
import type { AuthMeResponse } from '@/lib/types'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'

interface Props {
  token: string
}

export function TwoFactorSetupForm({ token }: Props) {
  const router = useRouter()
  const { setAccessToken, setUser } = useAuthStore()

  const [step, setStep] = useState<'qr' | 'backup'>('qr')
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TwoFactorCodeInput>({
    resolver: zodResolver(twoFactorCodeSchema),
    defaultValues: { code: '' },
  })

  useEffect(() => {
    if (!token) return
    const init = async () => {
      setIsLoading(true)
      try {
        const { data } = await apiClient.post(
          '/auth/2fa/setup-init',
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
        setOtpauthUrl(data.otpauthUrl)
        setSecret(data.secret)
      } catch {
        setServerError('Errore durante il caricamento. Riprova.')
      } finally {
        setIsLoading(false)
      }
    }
    init()
  }, [token])

  const onSubmit = async (values: TwoFactorCodeInput) => {
    setServerError(null)
    try {
      const { data } = await apiClient.post(
        '/auth/2fa/activate',
        { code: values.code },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setAccessToken(data.accessToken)
      setBackupCodes(data.backupCodes)
      setStep('backup')
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { status?: number; data?: { message?: string; error?: string } }
      }
      const status = axiosError?.response?.status
      const resData = axiosError?.response?.data
      if (status === 401) setServerError('Codice non valido.')
      else if (status === 429) setServerError('Troppi tentativi. Attendi qualche minuto.')
      else setServerError(resData?.message ?? resData?.error ?? 'Si è verificato un errore.')
    }
  }

  const handleComplete = async () => {
    try {
      const { data: me } = await apiClient.get<AuthMeResponse>('/auth/me')
      setUser(me)
      router.push(ROLE_REDIRECT[me.role])
    } catch {
      setServerError('Errore durante il reindirizzamento. Riprova.')
    }
  }

  if (!token) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-bold">Accesso non autorizzato</h1>
          <p className="text-sm text-muted-foreground">
            Il token di configurazione non è valido o mancante.{' '}
            <Link
              href="/auth/login"
              className="text-primary underline underline-offset-4 hover:opacity-80"
            >
              Torna al login
            </Link>
            .
          </p>
        </div>
      </div>
    )
  }

  if (step === 'backup') {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-bold">Salva i codici di backup</h1>
          <p className="text-sm text-muted-foreground">
            Conserva questi codici in un posto sicuro. Vengono mostrati una sola volta e ti
            permetteranno di accedere se perdi accesso alla tua app di autenticazione.
          </p>
        </div>

        <ul className="flex flex-col gap-2">
          {backupCodes.map((code) => (
            <li key={code} className="text-center">
              <code className="rounded bg-muted px-2 py-1 font-mono text-sm">{code}</code>
            </li>
          ))}
        </ul>

        {serverError && <FieldError>{serverError}</FieldError>}

        <Button type="button" className="w-full" onClick={handleComplete}>
          Ho salvato i codici
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold">Configura autenticazione a due fattori</h1>
        <p className="text-sm text-muted-foreground">
          Scansiona il QR code con la tua app di autenticazione (es. Google Authenticator, Authy),
          poi inserisci il codice generato per completare la configurazione.
        </p>
      </div>

      {isLoading && (
        <div className="flex justify-center">
          <Spinner className="size-8" />
        </div>
      )}

      {!isLoading && otpauthUrl && (
        <div className="flex flex-col items-center gap-3 py-2">
          <QRCodeSVG value={otpauthUrl} size={120} />
          {secret && (
            <p className="text-xs text-muted-foreground text-center">
              Codice manuale:{' '}
              <code className="rounded bg-muted px-1 py-0.5 font-mono">{secret}</code>
            </p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="code">Codice di verifica</FieldLabel>
            <div className="flex justify-center">
              <Controller
                name="code"
                control={control}
                render={({ field }) => (
                  <InputOTP maxLength={6} {...field} id="code" autoComplete="one-time-code">
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSeparator />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                )}
              />
            </div>
            <FieldError errors={[errors.code]} />
          </Field>

          {serverError && <FieldError>{serverError}</FieldError>}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Spinner className="mr-2 size-4" />
                Verifica in corso...
              </>
            ) : (
              'Attiva autenticazione a due fattori'
            )}
          </Button>
        </FieldGroup>
      </form>
    </div>
  )
}
