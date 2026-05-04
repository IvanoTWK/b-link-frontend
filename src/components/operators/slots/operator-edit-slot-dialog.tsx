'use client'

import { useState, useCallback, useEffect } from 'react'
import { Pencil } from 'lucide-react'

import type { Slot } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

// ── Tipi ──────────────────────────────────────────────────────────────────────

export interface UpdateSlotData {
  startTime?: string
  endTime?: string
  capacity?: number
}

interface EditSlotForm {
  startTime: string
  endTime: string
  capacity: string
}

interface OperatorEditSlotDialogProps {
  slot: Slot
  onUpdate: (id: string, data: UpdateSlotData) => void
  isPending: boolean
}

// ── Componente ────────────────────────────────────────────────────────────────

export function OperatorEditSlotDialog({
  slot,
  onUpdate,
  isPending,
}: OperatorEditSlotDialogProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<EditSlotForm>({
    startTime: slot.startTime,
    endTime: slot.endTime,
    capacity: String(slot.capacity),
  })

  // Resync form quando lo slot cambia (es. dopo refresh query)
  useEffect(() => {
    setForm({
      startTime: slot.startTime,
      endTime: slot.endTime,
      capacity: String(slot.capacity),
    })
  }, [slot.startTime, slot.endTime, slot.capacity])

  const setField = useCallback((key: keyof EditSlotForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  const isFormValid =
    !!form.startTime && !!form.endTime && Number(form.capacity) > 0

  const handleUpdate = useCallback(() => {
    const payload: UpdateSlotData = {}
    if (form.startTime !== slot.startTime) payload.startTime = form.startTime
    if (form.endTime !== slot.endTime) payload.endTime = form.endTime
    if (Number(form.capacity) !== slot.capacity)
      payload.capacity = Number(form.capacity)
    onUpdate(slot.id, payload)
    setOpen(false)
  }, [form, slot, onUpdate])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={slot.bookedCount > 0}
          title={
            slot.bookedCount > 0
              ? 'Non modificabile: ci sono prenotazioni attive'
              : 'Modifica slot'
          }
        >
          <Pencil className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifica slot</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Ora inizio</Label>
              <Input
                type="time"
                value={form.startTime}
                onChange={(e) => setField('startTime', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">Ora fine</Label>
              <Input
                type="time"
                value={form.endTime}
                onChange={(e) => setField('endTime', e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Capacità</Label>
            <Input
              type="number"
              min={1}
              value={form.capacity}
              onChange={(e) => setField('capacity', e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            disabled={!isFormValid || isPending}
            onClick={handleUpdate}
          >
            {isPending ? 'Salvataggio…' : 'Salva modifiche'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
