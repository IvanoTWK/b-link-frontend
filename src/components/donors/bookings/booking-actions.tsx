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

interface BookingActionsProps {
  bookingId: string
  hasAnamnesis: boolean
}

export function BookingActions({ bookingId, hasAnamnesis }: BookingActionsProps) {
  const queryClient = useQueryClient()
  const [cancelling, setCancelling] = useState(false)

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
    <div className="flex gap-3 flex-wrap">
      <Button asChild size="lg" variant="outline" disabled={cancelling}>
        <Link href={`/donors/bookings/${bookingId}/anamnesis`}>
          <ClipboardList className="h-4 w-4 mr-2" />
          {hasAnamnesis ? 'Visualizza questionario' : 'Compila questionario'}
        </Link>
      </Button>

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
