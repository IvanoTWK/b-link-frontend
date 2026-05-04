'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Building2, Mail, ShieldCheck, UserRound } from 'lucide-react'

import { apiClient } from '@/lib/api/axios'
import type { StaffOwnProfile } from '@/lib/types'
import {
  updateStaffProfileSchema,
  type UpdateStaffProfileFormValues,
} from '@/lib/schemas/staff/update-staff-profile.schema'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchStaffProfile(): Promise<StaffOwnProfile> {
  const { data } = await apiClient.get<StaffOwnProfile>('/staff/profile')
  return data
}

// ── Sezione dati in sola lettura ───────────────────────────────────────────────

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}

// ── Card info account ─────────────────────────────────────────────────────────

function AccountInfoCard({ profile }: { profile: StaffOwnProfile }) {
  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-muted rounded-lg p-2.5 shrink-0">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">Informazioni account</p>
            <p className="text-xs text-muted-foreground">Dati non modificabili</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <ReadonlyField label="Email" value={profile.email} />
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <ReadonlyField label="Ruolo" value={profile.role} />
          </div>
          {profile.center && (
            <div className="flex items-start gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <ReadonlyField
                label="Sede assegnata"
                value={`${profile.center.name} — ${profile.center.city}`}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Card modifica nome ────────────────────────────────────────────────────────

function EditNameCard({ profile }: { profile: StaffOwnProfile }) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateStaffProfileFormValues>({
    resolver: zodResolver(updateStaffProfileSchema),
    values: { name: profile.name },
  })

  const onSubmit = async (values: UpdateStaffProfileFormValues) => {
    try {
      await apiClient.patch('/staff/profile', values)
      await queryClient.invalidateQueries({ queryKey: ['staff', 'profile'] })
      toast.success('Profilo aggiornato.')
    } catch (err: unknown) {
      const message =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined
      toast.error(message ?? 'Errore durante il salvataggio.')
    }
  }

  return (
    <Card className="border-border">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-muted rounded-lg p-2.5 shrink-0">
            <UserRound className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">Modifica profilo</p>
            <p className="text-xs text-muted-foreground">Aggiorna il tuo nome visualizzato</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Nome e cognome</FieldLabel>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              <FieldError errors={[errors.name]} />
            </Field>
          </FieldGroup>

          <div className="mt-5 flex justify-end">
            <Button type="submit" size="sm" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2" />
                  Salvataggio...
                </>
              ) : (
                'Salva modifiche'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

// ── Pagina ────────────────────────────────────────────────────────────────────

export default function OperatorProfilePage() {
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['staff', 'profile'],
    queryFn: fetchStaffProfile,
  })

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100dvh-6.5rem)]">
      <div>
        <h1 className="text-xl font-semibold">Il mio profilo</h1>
        <p className="text-sm text-muted-foreground">
          Visualizza e modifica le informazioni del tuo account.
        </p>
      </div>

      {isError && (
        <p className="text-sm text-destructive">
          Errore nel caricamento del profilo.
        </p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : profile ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
          <AccountInfoCard profile={profile} />
          <EditNameCard profile={profile} />
        </div>
      ) : null}
    </div>
  )
}
