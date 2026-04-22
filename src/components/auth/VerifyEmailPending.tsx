'use client'

import { useState } from 'react'
import { apiClient } from '@/lib/api/axios'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Mail, CheckCircle2 } from 'lucide-react'

interface Props {
  email: string
}

export function VerifyEmailPending({ email }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startCooldown = () => {
    let seconds = 60
    setCooldown(seconds)
    const interval = setInterval(() => {
      seconds -= 1
      setCooldown(seconds)
      if (seconds <= 0) clearInterval(interval)
    }, 1000)
  }

  const handleResend = async () => {
    if (!email || cooldown > 0 || isLoading) return
    setError(null)
    setResent(false)
    setIsLoading(true)
    try {
      await apiClient.post('/auth/verify-email/resend', { email })
      setResent(true)
      startCooldown()
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number } }
      if (axiosError?.response?.status === 429) {
        setError('Troppi tentativi. Attendi qualche minuto e riprova.')
      } else {
        setError('Errore durante il reinvio. Riprova.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
        <Mail className="size-7 text-primary" />
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Controlla la tua email</h1>
        <p className="text-sm text-muted-foreground">
          Abbiamo inviato un link di verifica a{' '}
          <span className="font-medium text-foreground">
            {email || 'il tuo indirizzo email'}
          </span>
          . Clicca il link per attivare il tuo account.
        </p>
      </div>

      {resent && (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2 className="size-4" />
          Email inviata nuovamente.
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex w-full flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleResend}
          disabled={isLoading || cooldown > 0}
        >
          {isLoading ? (
            <>
              <Spinner className="mr-2" />
              Invio in corso...
            </>
          ) : cooldown > 0 ? (
            `Reinvia tra ${cooldown}s`
          ) : (
            "Non hai ricevuto l'email? Reinvia"
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          Ricorda di controllare la cartella spam.
        </p>
      </div>
    </div>
  )
}
