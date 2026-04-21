'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { apiClient } from '@/lib/api/axios'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { CheckCircle2, XCircle } from 'lucide-react'

type Status = 'loading' | 'success' | 'error'

interface Props {
  token: string
}

export function VerifyEmailConfirm({ token }: Props) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setErrorMessage('Link di verifica non valido. Richiedi un nuovo link.')
      setStatus('error')
      return
    }

    const confirm = async () => {
      try {
        await apiClient.post('/auth/verify-email/confirm', { token })
        setStatus('success')
      } catch (err: unknown) {
        const axiosError = err as { response?: { status?: number } }
        const httpStatus = axiosError?.response?.status
        if (httpStatus === 400) {
          setErrorMessage(
            'Il link di verifica è scaduto o non è valido. Richiedi un nuovo link.',
          )
        } else {
          setErrorMessage('Si è verificato un errore. Riprova più tardi.')
        }
        setStatus('error')
      }
    }

    confirm()
  }, [token])

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Spinner className="size-8" />
        <p className="text-sm text-muted-foreground">Verifica in corso...</p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
          <CheckCircle2 className="size-7 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">Email verificata</h1>
          <p className="text-sm text-muted-foreground">
            Il tuo account è stato attivato con successo. Puoi ora accedere.
          </p>
        </div>
        <Button className="w-full" onClick={() => router.push('/auth/login')}>
          Accedi
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <XCircle className="size-7 text-destructive" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Verifica fallita</h1>
        <p className="text-sm text-muted-foreground">{errorMessage}</p>
      </div>
      <Link
        href="/auth/verify-email"
        className="text-sm text-primary underline underline-offset-4 hover:opacity-80"
      >
        Torna alla pagina di verifica
      </Link>
    </div>
  )
}
