'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Calendar, CreditCard, Droplets, HeartPulse,
  Lock, MapPin, Scale, Shield, Smartphone, Users,
} from 'lucide-react'

import { apiClient } from '@/lib/api/axios'
import { useDonorProfile } from '@/hooks/use-donor-profile'
import {
  updateDonorProfileSchema,
  type UpdateDonorProfileFormValues,
} from '@/lib/schemas/donors/update-donor-profile.schema'
import type { BloodGroup } from '@/lib/types'

import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

// ── Costanti ──────────────────────────────────────────────────────────────────

const BLOOD_GROUP_LABELS: Record<BloodGroup, string> = {
  A_POSITIVE: 'A+', A_NEGATIVE: 'A-',
  B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-',
  O_POSITIVE: '0+', O_NEGATIVE: '0-',
  UNKNOWN: 'Sconosciuto',
}

const BIOLOGICAL_SEX_LABELS: Record<string, string> = {
  MALE: 'Maschio',
  FEMALE: 'Femmina',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

function getInitials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

function InfoRow({ icon: Icon, label, value }: {
  icon: React.ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  )
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const { profile, isLoading } = useDonorProfile()
  const [consentSubmitting, setConsentSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateDonorProfileFormValues>({
    resolver: zodResolver(updateDonorProfileSchema),
    values: profile
      ? {
        phone: profile.phone,
        weight: profile.weight,
        bloodGroup: profile.bloodGroup,
      }
      : undefined,
  })

  const onSubmitProfile = async (values: UpdateDonorProfileFormValues) => {
    try {
      await apiClient.patch('/donors/profile', values)
      await queryClient.invalidateQueries({ queryKey: ['donor', 'profile'] })
      toast.success('Profilo aggiornato.')
    } catch {
      toast.error('Errore durante il salvataggio.')
    }
  }

  const handleConsentChange = async (value: boolean) => {
    setConsentSubmitting(true)
    try {
      await apiClient.patch('/donors/profile/consent', { consentPersonalData: value })
      await queryClient.invalidateQueries({ queryKey: ['donor', 'profile'] })
      toast.success('Consenso aggiornato.')
    } catch {
      toast.error('Errore durante l\'aggiornamento del consenso.')
    } finally {
      setConsentSubmitting(false)
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (!profile) return null

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl space-y-0 border border-border overflow-hidden">
      {/* Hero */}
      <div className="bg-primary/5 border-b border-border px-6 py-8">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-semibold">
            {getInitials(profile.firstName, profile.lastName)}
          </div>
          <div>
            <h1 className="text-xl font-semibold">
              {profile.firstName} {profile.lastName}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {profile.bloodGroup && profile.bloodGroup !== 'UNKNOWN' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary">
                  <Droplets className="h-3 w-3" />
                  {BLOOD_GROUP_LABELS[profile.bloodGroup as BloodGroup]}
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 font-medium">
                <Users className="h-3 w-3" />
                {BIOLOGICAL_SEX_LABELS[profile.biologicalSex] ?? profile.biologicalSex}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Corpo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">

        {/* Colonna sinistra — anagrafica + consensi */}
        <div className="px-6 py-6 space-y-6">
          {/* Anagrafica */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Dati anagrafici
            </p>
            <div className="divide-y divide-border">
              <InfoRow icon={CreditCard} label="Codice fiscale" value={profile.fiscalCode} />
              <InfoRow icon={Calendar} label="Data di nascita" value={formatDate(profile.dateOfBirth)} />
              <InfoRow icon={MapPin} label="Comune di nascita" value={profile.placeOfBirth} />
              <InfoRow icon={Users} label="Sesso biologico" value={BIOLOGICAL_SEX_LABELS[profile.biologicalSex] ?? profile.biologicalSex} />
            </div>
          </div>

          {/* Consensi GDPR */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Privacy e consensi
              </p>
            </div>

            <div className="space-y-4">
              {/* Consenso dati sanitari — bloccato */}
              <div className="flex items-start gap-3 opacity-60">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-snug">
                    Trattamento dati sanitari
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Art. 9 GDPR — obbligatorio per effettuare prenotazioni. Non modificabile.                     {profile.consentHealthData ? 'Fornito' : 'Non fornito'}

                  </p>

                </div>
              </div>

              <div className="border-t border-border" />

              {/* Consenso dati personali — modificabile */}
              <div className="flex items-start gap-3">
                <Checkbox
                  id="consentPersonalData"
                  checked={profile.consentPersonalData}
                  disabled={consentSubmitting}
                  onCheckedChange={(checked) => handleConsentChange(checked === true)}
                  className="mt-0.5"
                />
                <div>
                  <label htmlFor="consentPersonalData" className="text-sm font-medium cursor-pointer leading-snug">
                    Comunicazioni sulla donazione
                  </label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Art. 6 GDPR — per comunicazioni relative all&apos;attività di donazione.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colonna destra — dati sanitari */}
        <div className="px-6 py-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Dati sanitari
          </p>
          <form onSubmit={handleSubmit(onSubmitProfile)}>
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <Field className="col-span-2">
                  <FieldLabel htmlFor="phone">
                    <Smartphone className="h-4 w-4" />
                    Telefono
                  </FieldLabel>
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    aria-invalid={!!errors.phone}
                    {...register('phone')}
                  />
                  <FieldError errors={[errors.phone]} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="bloodGroup">
                    <HeartPulse className="h-4 w-4" />
                    Gruppo sanguigno
                  </FieldLabel>
                  <Controller
                    name="bloodGroup"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value ?? ''} onValueChange={field.onChange}>
                        <SelectTrigger id="bloodGroup" className="w-full">
                          <SelectValue placeholder="Seleziona..." />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.entries(BLOOD_GROUP_LABELS) as [BloodGroup, string][]).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError errors={[errors.bloodGroup]} />
                </Field>

                <Field>
                  <FieldLabel htmlFor="weight">
                    <Scale className="h-4 w-4" />
                    Peso (kg)
                  </FieldLabel>
                  <Input
                    id="weight"
                    type="number"
                    min={45}
                    aria-invalid={!!errors.weight}
                    {...register('weight', { valueAsNumber: true })}
                  />
                  <FieldError errors={[errors.weight]} />
                </Field>
              </div>
            </FieldGroup>

            <div className="mt-4">
              <Button type="submit" size="sm" disabled={isSubmitting || !isDirty}>
                {isSubmitting ? <><Spinner className="mr-2" />Salvataggio...</> : 'Salva modifiche'}
              </Button>
            </div>
          </form>
        </div>

      </div>
    </div>
  )
}
