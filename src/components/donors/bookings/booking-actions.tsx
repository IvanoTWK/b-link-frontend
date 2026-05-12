'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertTriangle, ClipboardList } from 'lucide-react'

import { apiClient } from '@/lib/api/axios'
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

const ANAMNESIS_WINDOW_DAYS = 7

interface BookingActionsProps {
  bookingId: string
  hasAnamnesis: boolean
  slotDate: string // ISO date string
}

export function BookingActions({ bookingId, hasAnamnesis, slotDate }: BookingActionsProps) {
  const queryClient = useQueryClient()
  const [cancelling, setCancelling] = useState(false)

  const daysUntilSlot = Math.floor(
    (new Date(slotDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) /
      (1000 * 60 * 60 * 24),
  )
  const withinWindow = daysUntilSlot <= ANAMNESIS_WINDOW_DAYS

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await apiClient.post(`/bookings/${bookingId}/cancel`, {})
      await queryClient.invalidateQueries({ queryKey: ['donor', 'bookings'] })
      await queryClient.invalidateQueries({ queryKey: ['donor', 'booking', bookingId] })
      toast.success('Prenotazione cancellata.')
    } catch (err: unknown) {
      const message =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      toast.error(message ?? 'Errore durante la cancellazione.')
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {!hasAnamnesis && (
        withinWindow ? (
          <Button asChild size="lg" variant="outline" disabled={cancelling}>
            <Link href={`/donors/bookings/${bookingId}/anamnesis`}>
              <ClipboardList className="h-4 w-4 mr-2" />
              Compila questionario
            </Link>
          </Button>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3.5">
            <ClipboardList className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-sm text-muted-foreground">
              Il questionario sarà disponibile a partire da {ANAMNESIS_WINDOW_DAYS} giorni prima della donazione
              {daysUntilSlot > 0 ? ` (mancano ${daysUntilSlot} giorni)` : ''}.
            </p>
          </div>
        )
      )}

      {hasAnamnesis && (
        <Button asChild size="lg" variant="outline" disabled={cancelling}>
          <Link href={`/donors/bookings/${bookingId}/anamnesis`}>
            <ClipboardList className="h-4 w-4 mr-2" />
            Visualizza questionario
          </Link>
        </Button>
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="lg" variant="destructive" disabled={cancelling}>
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
              L&apos;operazione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
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
