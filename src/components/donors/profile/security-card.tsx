'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { QRCodeSVG } from 'qrcode.react'
import { QrCode, ShieldCheck, ShieldOff } from 'lucide-react'

import { apiClient } from '@/lib/api/axios'
import { useAuthStore } from '@/lib/store/auth.store'
import type { AuthMeResponse } from '@/lib/types'
import { twoFactorCodeSchema, type TwoFactorCodeInput } from '@/lib/auth/schemas/two-factor-code.schema'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

// ── Tipi ──────────────────────────────────────────────────────────────────────

type Step = 'idle' | 'enabling-qr' | 'enabling-backup' | 'disabling'

// ── Componente ────────────────────────────────────────────────────────────────

export function SecurityCard() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user, setUser, logout } = useAuthStore()
  const twoFactorEnabled = user?.twoFactorEnabled ?? false

  const [step, setStep] = useState<Step>('idle')
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [loadingInit, setLoadingInit] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TwoFactorCodeInput>({
    resolver: zodResolver(twoFactorCodeSchema),
    defaultValues: { code: '' },
  })

  // ── Handlers enable ────────────────────────────────────────────────────────

  const handleStartEnable = async () => {
    setLoadingInit(true)
    try {
      const { data } = await apiClient.post<{ secret: string; otpauthUrl: string }>('/auth/2fa/enable')
      setOtpauthUrl(data.otpauthUrl)
      setSecret(data.secret)
      setStep('enabling-qr')
    } catch {
      toast.error('Errore durante l\'avvio della configurazione 2FA.')
    } finally {
      setLoadingInit(false)
    }
  }

  const onConfirmEnable = async (values: TwoFactorCodeInput) => {
    try {
      const { data } = await apiClient.post<{ backupCodes: string[] }>('/auth/2fa/enable/confirm', {
        code: values.code,
      })
      setBackupCodes(data.backupCodes)
      // Aggiorna utente nello store
      const { data: me } = await apiClient.get<AuthMeResponse>('/auth/me')
      setUser(me)
      reset()
      setStep('enabling-backup')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 401) toast.error('Codice non valido.')
      else toast.error('Errore durante la conferma. Riprova.')
    }
  }

  const handleDoneEnable = () => {
    setStep('idle')
    setOtpauthUrl(null)
    setSecret(null)
    setBackupCodes([])
    toast.success('Autenticazione a due fattori attivata.')
  }

  // ── Handlers disable ───────────────────────────────────────────────────────

  const onConfirmDisable = async (values: TwoFactorCodeInput) => {
    try {
      await apiClient.post('/auth/2fa/disable', { code: values.code })
      toast.success('2FA disabilitato. Verrai reindirizzato al login.')
      logout()
      router.replace('/auth/login')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 401) toast.error('Codice non valido.')
      else toast.error('Errore durante la disabilitazione. Riprova.')
    }
  }

  const handleCloseDialog = () => {
    setStep('idle')
    reset()
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <Card className="border-border relative">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-muted rounded-lg p-2.5 shrink-0">
              {twoFactorEnabled
                ? <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                : <ShieldOff className="h-5 w-5 text-muted-foreground" />
              }
            </div>
            <div>
              <p className="text-sm font-semibold">Sicurezza</p>
              <p className="text-xs text-muted-foreground">
                {twoFactorEnabled
                  ? 'Autenticazione a due fattori attiva — il tuo account è protetto.'
                  : 'Autenticazione a due fattori non attiva.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${twoFactorEnabled ? 'bg-green-500/10' : 'bg-muted'
              }`}>
              {twoFactorEnabled
                ? <QrCode className="h-5 w-5 text-green-600 dark:text-green-400" />
                : <QrCode className="h-5 w-5 text-muted-foreground" />
              }
            </div>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${twoFactorEnabled ? 'text-green-600 dark:text-green-400' : ''}`}>
                {twoFactorEnabled ? '2FA attivo' : '2FA non attivo'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {twoFactorEnabled
                  ? 'Ad ogni accesso viene richiesto il codice dalla tua app di autenticazione.'
                  : 'Abilita il 2FA per proteggere il tuo account con un secondo livello di sicurezza.'}
              </p>
            </div>
            <Button
              size="sm"
              variant={twoFactorEnabled ? 'outline' : 'default'}
              onClick={twoFactorEnabled ? () => setStep('disabling') : handleStartEnable}
              disabled={loadingInit}
              className="absolute bottom-4 right-4 min-w-32"
            >
              {loadingInit ? <Spinner className="mr-2 size-4" /> : null}
              {twoFactorEnabled ? 'Disabilita' : 'Abilita 2FA'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Dialog enable — step QR ─────────────────────────────────────────── */}
      <Dialog open={step === 'enabling-qr'} onOpenChange={(o) => !o && handleCloseDialog()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Configura autenticazione a due fattori</DialogTitle>
            <DialogDescription>
              Scansiona il QR code con la tua app (es. Google Authenticator), poi inserisci il codice generato.
            </DialogDescription>
          </DialogHeader>

          {otpauthUrl && (
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

          <form onSubmit={handleSubmit(onConfirmEnable)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="code-enable">Codice di verifica</FieldLabel>
                <div className="flex justify-center">
                  <Controller
                    name="code"
                    control={control}
                    render={({ field }) => (
                      <InputOTP maxLength={6} {...field} id="code-enable" autoComplete="one-time-code">
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
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? <><Spinner className="mr-2 size-4" />Verifica...</> : 'Attiva 2FA'}
              </Button>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Dialog enable — step backup codes ──────────────────────────────── */}
      <Dialog open={step === 'enabling-backup'} onOpenChange={() => { }}>
        <DialogContent className="max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Salva i codici di backup</DialogTitle>
            <DialogDescription>
              Conserva questi codici in un posto sicuro. Vengono mostrati una sola volta.
            </DialogDescription>
          </DialogHeader>
          <ul className="flex flex-col gap-2 py-2">
            {backupCodes.map((code) => (
              <li key={code} className="text-center">
                <code className="rounded bg-muted px-2 py-1 font-mono text-sm">{code}</code>
              </li>
            ))}
          </ul>
          <Button onClick={handleDoneEnable} className="w-full">
            Ho salvato i codici
          </Button>
        </DialogContent>
      </Dialog>

      {/* ── Dialog disable ──────────────────────────────────────────────────── */}
      <Dialog open={step === 'disabling'} onOpenChange={(o) => !o && handleCloseDialog()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Disabilita autenticazione a due fattori</DialogTitle>
            <DialogDescription>
              Inserisci il codice dalla tua app di autenticazione per confermare. La sessione corrente verrà chiusa.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onConfirmDisable)}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="code-disable">Codice di verifica</FieldLabel>
                <div className="flex justify-center">
                  <Controller
                    name="code"
                    control={control}
                    render={({ field }) => (
                      <InputOTP maxLength={6} {...field} id="code-disable" autoComplete="one-time-code">
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
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={handleCloseDialog}>
                  Annulla
                </Button>
                <Button type="submit" variant="destructive" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? <><Spinner className="mr-2 size-4" />Disabilitazione...</> : 'Disabilita'}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
