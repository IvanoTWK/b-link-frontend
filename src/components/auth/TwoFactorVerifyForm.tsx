'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'

import { apiClient } from '@/lib/api/axios'
import { useAuthStore } from '@/lib/store/auth.store'
import type { AuthMeResponse } from '@/lib/types'

import { twoFactorCodeSchema, type TwoFactorCodeInput } from '@/lib/auth/schemas/two-factor-code.schema'
import { twoFactorBackupSchema, type TwoFactorBackupInput } from '@/lib/auth/schemas/two-factor-backup.schema'
import { ROLE_REDIRECT } from '@/lib/auth/constants'

import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

interface Props {
  token: string
}

export function TwoFactorVerifyForm({ token }: Props) {
  const router = useRouter()
  const { setAccessToken, setUser } = useAuthStore()

  const [serverError, setServerError] = useState<string | null>(null)
  const [isBackupMode, setIsBackupMode] = useState(false)

  const {
    control: controlCode,
    handleSubmit: handleSubmitCode,
    formState: { errors: errorsCode, isSubmitting: isSubmittingCode },
  } = useForm<TwoFactorCodeInput>({
    resolver: zodResolver(twoFactorCodeSchema),
    defaultValues: { code: '' },
  })

  const {
    register: registerBackup,
    handleSubmit: handleSubmitBackup,
    formState: { errors: errorsBackup, isSubmitting: isSubmittingBackup },
  } = useForm<TwoFactorBackupInput>({
    resolver: zodResolver(twoFactorBackupSchema),
    defaultValues: { backupCode: '' },
  })

  if (!token) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-bold">Accesso non autorizzato</h1>
          <p className="text-sm text-muted-foreground">
            Il token di pre-autenticazione non è valido o mancante.{' '}
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

  const handlePostSuccess = async (accessToken: string) => {
    setAccessToken(accessToken)
    const { data: me } = await apiClient.get<AuthMeResponse>('/auth/me')
    setUser(me)
    router.push(ROLE_REDIRECT[me.role])
  }

  const handleError = (err: unknown) => {
    const axiosError = err as {
      response?: { status?: number; data?: { message?: string; error?: string } }
    }
    const status = axiosError?.response?.status
    const resData = axiosError?.response?.data
    if (status === 401) setServerError('Codice non valido.')
    else if (status === 429) setServerError('Troppi tentativi. Attendi qualche minuto.')
    else setServerError(resData?.message ?? resData?.error ?? 'Si è verificato un errore.')
  }

  const onSubmitCode = async (values: TwoFactorCodeInput) => {
    setServerError(null)
    try {
      const { data } = await apiClient.post('/auth/2fa/verify', { code: values.code }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      await handlePostSuccess(data.accessToken)
    } catch (err: unknown) {
      handleError(err)
    }
  }

  const onSubmitBackup = async (values: TwoFactorBackupInput) => {
    setServerError(null)
    try {
      const { data } = await apiClient.post('/auth/2fa/verify-backup', { backupCode: values.backupCode }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      await handlePostSuccess(data.accessToken)
    } catch (err: unknown) {
      handleError(err)
    }
  }

  const toggleMode = () => {
    setIsBackupMode((prev) => !prev)
    setServerError(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold">Verifica a due fattori</h1>
        <p className="text-sm text-muted-foreground">
          {isBackupMode
            ? 'Inserisci uno dei tuoi codici di backup per accedere.'
            : 'Inserisci il codice generato dalla tua app di autenticazione.'}
        </p>
      </div>

      {!isBackupMode && (
        <form onSubmit={handleSubmitCode(onSubmitCode)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="code">Codice di autenticazione</FieldLabel>
              <Controller
                name="code"
                control={controlCode}
                render={({ field }) => (
                  <InputOTP maxLength={6} {...field} id="code" autoComplete="one-time-code">
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                )}
              />
              <FieldError errors={[errorsCode.code]} />
            </Field>

            {serverError && <FieldError>{serverError}</FieldError>}

            <Button type="submit" disabled={isSubmittingCode} className="w-full">
              {isSubmittingCode ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Verifica in corso...
                </>
              ) : (
                'Verifica'
              )}
            </Button>
          </FieldGroup>
        </form>
      )}

      {isBackupMode && (
        <form onSubmit={handleSubmitBackup(onSubmitBackup)} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="backupCode">Codice di backup</FieldLabel>
              <Input
                id="backupCode"
                type="text"
                autoComplete="off"
                placeholder="••••••••••"
                aria-invalid={!!errorsBackup.backupCode}
                {...registerBackup('backupCode')}
              />
              <FieldError errors={[errorsBackup.backupCode]} />
            </Field>

            {serverError && <FieldError>{serverError}</FieldError>}

            <Button type="submit" disabled={isSubmittingBackup} className="w-full">
              {isSubmittingBackup ? (
                <>
                  <Spinner className="mr-2 size-4" />
                  Verifica in corso...
                </>
              ) : (
                'Verifica codice di backup'
              )}
            </Button>
          </FieldGroup>
        </form>
      )}

      <div className="text-center">
        <button
          type="button"
          onClick={toggleMode}
          className="text-sm text-primary underline underline-offset-4 hover:opacity-80"
        >
          {isBackupMode
            ? 'Usa il codice di autenticazione'
            : 'Usa un codice di backup'}
        </button>
      </div>
    </div>
  )
}
