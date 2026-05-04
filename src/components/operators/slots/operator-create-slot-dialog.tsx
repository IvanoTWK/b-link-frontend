'use client'

import { useState, useCallback } from 'react'
import { Plus } from 'lucide-react'

import type { DonationType } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

// ── Tipi ──────────────────────────────────────────────────────────────────────

export interface CreateSlotData {
  date: string
  startTime: string
  endTime: string
  donationTypeId: string
  capacity: number
}

interface CreateSlotForm {
  date: string
  startTime: string
  endTime: string
  donationTypeId: string
  capacity: string
}

interface OperatorCreateSlotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  donationTypes: DonationType[]
  onCreate: (data: CreateSlotData) => void
  isPending: boolean
}

// ── Costanti ──────────────────────────────────────────────────────────────────

const EMPTY_FORM: CreateSlotForm = {
  date: '',
  startTime: '',
  endTime: '',
  donationTypeId: '',
  capacity: '1',
}

// ── Componente ────────────────────────────────────────────────────────────────

export function OperatorCreateSlotDialog({
  open,
  onOpenChange,
  donationTypes,
  onCreate,
  isPending,
}: OperatorCreateSlotDialogProps) {
  const [form, setForm] = useState<CreateSlotForm>(EMPTY_FORM)

  const setField = useCallback((key: keyof CreateSlotForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  const isFormValid =
    !!form.date &&
    !!form.startTime &&
    !!form.endTime &&
    !!form.donationTypeId &&
    Number(form.capacity) > 0

  const handleCreate = useCallback(() => {
    onCreate({
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      donationTypeId: form.donationTypeId,
      capacity: Number(form.capacity),
    })
  }, [form, onCreate])

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) setForm(EMPTY_FORM)
      onOpenChange(next)
    },
    [onOpenChange],
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Nuovo slot
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuovo slot</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Data</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setField('date', e.target.value)}
            />
          </div>
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
            <Label className="text-xs text-muted-foreground">Tipo donazione</Label>
            <Select
              value={form.donationTypeId}
              onValueChange={(v) => setField('donationTypeId', v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleziona tipo" />
              </SelectTrigger>
              <SelectContent>
                {donationTypes.map((dt) => (
                  <SelectItem key={dt.id} value={dt.id}>
                    {dt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            onClick={handleCreate}
          >
            {isPending ? 'Creazione…' : 'Crea slot'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
