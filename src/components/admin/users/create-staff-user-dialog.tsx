'use client'

import { useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/axios'
import {
  createStaffUserSchema,
  type CreateStaffUserFormValues,
} from '@/lib/schemas/admin/create-staff-user.schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
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
import { Spinner } from '@/components/ui/spinner'

// ── Costanti ──────────────────────────────────────────────────────────────────

interface CreateStaffUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ── Componente ────────────────────────────────────────────────────────────────

export function CreateStaffUserDialog({ open, onOpenChange }: CreateStaffUserDialogProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateStaffUserFormValues>({
    resolver: zodResolver(createStaffUserSchema),
  })

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) reset()
      onOpenChange(next)
    },
    [onOpenChange, reset],
  )

  const onSubmit = async (values: CreateStaffUserFormValues) => {
    try {
      await apiClient.post('/admin/users', values)
      await queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('Utente creato, email di reset inviata.')
      handleOpenChange(false)
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status
      if (status === 409) {
        toast.error('Email già registrata.')
      } else {
        const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        toast.error(message ?? 'Errore durante la creazione.')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Nuovo utente
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crea utente staff</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Nome e cognome</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="Es. Mario Rossi"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              <FieldError errors={[errors.name]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="Es. mario.rossi@example.com"
                aria-invalid={!!errors.email}
                {...register('email')}
              />
              <FieldError errors={[errors.email]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="role">Ruolo</FieldLabel>
              <Select onValueChange={(v) => setValue('role', v as CreateStaffUserFormValues['role'], { shouldValidate: true })}>
                <SelectTrigger id="role" aria-invalid={!!errors.role}>
                  <SelectValue placeholder="Seleziona ruolo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OPERATOR">Operatore</SelectItem>
                  <SelectItem value="DOCTOR">Medico</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
              <FieldError errors={[errors.role]} />
            </Field>
          </FieldGroup>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner className="mr-2" />
                Creazione...
              </>
            ) : (
              'Crea utente'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
