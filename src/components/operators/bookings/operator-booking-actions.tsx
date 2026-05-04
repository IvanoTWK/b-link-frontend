'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertTriangle, CheckCircle2, Droplets } from 'lucide-react'

import { apiClient } from '@/lib/api/axios'
import type { Booking } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractApiMessage(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'response' in err) {
    const resp = (err as { response?: { data?: { message?: string | string[] } } }).response
    const msg = resp?.data?.message
    if (Array.isArray(msg)) return msg[0]
    return msg
  }
  return undefined
}

// ── Componente ────────────────────────────────────────────────────────────────

interface OperatorBookingActionsProps {
  booking: Booking
  vertical?: boolean
}

export function OperatorBookingActions({ booking, vertical = false }: OperatorBookingActionsProps) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [cancelling, setCancelling] = useState(false)
  const [completing, setCompleting] = useState(false)

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['operator', 'bookings'] })
    await queryClient.invalidateQueries({ queryKey: ['operator', 'booking', booking.id] })
  }

  // ── Cancella ──────────────────────────────────────────────────────────────

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await apiClient.post(`/bookings/${booking.id}/cancel`, {
        cancellationReason: 'OPERATOR_CANCELLED',
      })
      await invalidate()
      toast.success('Prenotazione cancellata.')
      router.push('/operators/bookings')
    } catch (err) {
      toast.error(extractApiMessage(err) ?? 'Errore durante la cancellazione.')
    } finally {
      setCancelling(false)
    }
  }

  // ── Completa donazione ─────────────────────────────────────────────────────
  // Crea una donation per questo booking (CONFIRMED → IN_AWAITING_REPORT)

  const handleComplete = async () => {
    setCompleting(true)
    try {
      await apiClient.post('/donations', {
        bookingId: booking.id,
        donatedAt: new Date().toISOString(),
      })
      await invalidate()
      toast.success('Donazione registrata. Prenotazione in attesa referto medico.')
      router.push('/operators/bookings')
    } catch (err) {
      toast.error(extractApiMessage(err) ?? 'Errore durante la registrazione della donazione.')
    } finally {
      setCompleting(false)
    }
  }

  const isLoading = cancelling || completing

  // ── Render per stato ──────────────────────────────────────────────────────

  if (booking.status === 'CONFIRMED') {
    return (
      <div className={vertical ? 'flex flex-col gap-2' : 'flex gap-3 flex-wrap'}>
        {/* Completa donazione */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="lg" disabled={isLoading} className="gap-2">
              <Droplets className="h-4 w-4" />
              {completing ? 'Registrazione...' : 'Registra donazione'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                Conferma registrazione donazione
              </AlertDialogTitle>
              <AlertDialogDescription>
                Stai registrando l&apos;avvenuta donazione per questa prenotazione.
                Il booking passerà in stato &quot;In attesa referto medico&quot;.
                L&apos;operazione non può essere annullata.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction onClick={handleComplete}>
                Sì, registra
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Cancella */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="lg" variant="destructive" disabled={isLoading}>
              {cancelling ? 'Cancellazione...' : 'Cancella prenotazione'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Conferma cancellazione
              </AlertDialogTitle>
              <AlertDialogDescription>
                Sei sicuro di voler cancellare questa prenotazione?
                Il donatore verrà notificato via email.
                L&apos;operazione non può essere annullata.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Indietro</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Sì, cancella
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  // Stato IN_AWAITING_REPORT: solo cancellazione di emergenza
  if (booking.status === 'IN_AWAITING_REPORT') {
    return (
      <div className={vertical ? 'flex flex-col gap-2' : 'flex gap-3 flex-wrap'}>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="lg" variant="destructive" disabled={isLoading}>
              {cancelling ? 'Cancellazione...' : 'Cancella prenotazione'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Conferma cancellazione
              </AlertDialogTitle>
              <AlertDialogDescription>
                La donazione è già stata registrata. Sei sicuro di voler cancellare
                questa prenotazione? Contatta il medico responsabile se necessario.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Indietro</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Sì, cancella
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  return null
}
