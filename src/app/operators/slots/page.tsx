'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { apiClient } from '@/lib/api/axios'
import type { Slot, DonationType } from '@/lib/types'
import { OperatorSlotsFilters, type SlotFilters } from '@/components/operators/slots/operator-slots-filters'
import { OperatorSlotsTable } from '@/components/operators/slots/operator-slots-table'
import {
  OperatorCreateSlotDialog,
  type CreateSlotData,
} from '@/components/operators/slots/operator-create-slot-dialog'
import type { UpdateSlotData } from '@/components/operators/slots/operator-edit-slot-dialog'

// ── Helpers ───────────────────────────────────────────────────────────────────

function toISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

// ── Fetch ──────────────────────────────────────────────────────────────────────

async function fetchSlots(filters: SlotFilters): Promise<Slot[]> {
  const params: Record<string, string> = {}
  if (filters.date) params.date = filters.date
  if (filters.donationTypeId) params.donationTypeId = filters.donationTypeId
  const { data } = await apiClient.get<Slot[]>('/slots', { params })
  return data
}

async function fetchDonationTypes(): Promise<DonationType[]> {
  const { data } = await apiClient.get<DonationType[]>('/donation-types')
  return data
}

// ── Costanti ──────────────────────────────────────────────────────────────────

const INITIAL_FILTERS: SlotFilters = {
  date: toISO(new Date()),
  donationTypeId: '',
}

// ── Pagina ────────────────────────────────────────────────────────────────────

export default function OperatorSlotsPage() {
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<SlotFilters>(INITIAL_FILTERS)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: slots = [], isLoading, isError } = useQuery({
    queryKey: ['operator', 'slots', filters],
    queryFn: () => fetchSlots(filters),
  })

  const { data: donationTypes = [] } = useQuery({
    queryKey: ['donation-types'],
    queryFn: fetchDonationTypes,
    staleTime: Infinity,
  })

  const createMutation = useMutation({
    mutationFn: (body: CreateSlotData) => apiClient.post('/slots', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operator', 'slots'] })
      setDialogOpen(false)
      toast.success('Slot creato')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Errore nella creazione dello slot')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSlotData }) =>
      apiClient.patch(`/slots/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operator', 'slots'] })
      toast.success('Slot aggiornato')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Errore durante la modifica dello slot')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/slots/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operator', 'slots'] })
      toast.success('Slot eliminato')
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Impossibile eliminare lo slot')
    },
  })

  const handleFiltersChange = useCallback((next: SlotFilters) => {
    setFilters(next)
  }, [])

  const handleCreate = useCallback(
    (data: CreateSlotData) => {
      createMutation.mutate(data)
    },
    [createMutation],
  )

  const handleUpdate = useCallback(
    (id: string, data: UpdateSlotData) => {
      updateMutation.mutate({ id, data })
    },
    [updateMutation],
  )

  const handleDelete = useCallback(
    (id: string) => {
      deleteMutation.mutate(id)
    },
    [deleteMutation],
  )

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100dvh-6.5rem)]">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Slot</h1>
          <p className="text-sm text-muted-foreground">
            Gestisci gli slot di donazione della tua sede.
          </p>
        </div>
        <OperatorCreateSlotDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          donationTypes={donationTypes}
          onCreate={handleCreate}
          isPending={createMutation.isPending}
        />
      </div>

      {/* Filtri */}
      <OperatorSlotsFilters
        filters={filters}
        onChange={handleFiltersChange}
        donationTypes={donationTypes}
      />

      {/* Errore */}
      {isError && (
        <p className="text-sm text-destructive">Errore nel caricamento degli slot.</p>
      )}

      {/* Tabella */}
      <OperatorSlotsTable
        slots={slots}
        isLoading={isLoading}
        onUpdate={handleUpdate}
        isUpdating={updateMutation.isPending}
        onDelete={handleDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}
