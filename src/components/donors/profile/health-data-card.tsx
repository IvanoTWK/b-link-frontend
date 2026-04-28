'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { HeartPulse, Scale, Smartphone } from 'lucide-react'

import { apiClient } from '@/lib/api/axios'
import {
  updateDonorProfileSchema,
  type UpdateDonorProfileFormValues,
} from '@/lib/schemas/donors/update-donor-profile.schema'
import type { BloodGroup, DonorProfile } from '@/lib/types'

import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const BLOOD_GROUP_LABELS: Record<BloodGroup, string> = {
  A_POSITIVE: 'A+', A_NEGATIVE: 'A-',
  B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-',
  O_POSITIVE: '0+', O_NEGATIVE: '0-',
  UNKNOWN: 'Sconosciuto',
}

function CardHeader({ icon: Icon, title, description }: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="bg-muted rounded-lg p-2.5 shrink-0">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

interface HealthDataCardProps {
  profile: DonorProfile
}

export function HealthDataCard({ profile }: HealthDataCardProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateDonorProfileFormValues>({
    resolver: zodResolver(updateDonorProfileSchema),
    values: {
      phone: profile.phone,
      weight: profile.weight,
      bloodGroup: profile.bloodGroup,
    },
  })

  const onSubmit = async (values: UpdateDonorProfileFormValues) => {
    try {
      await apiClient.patch('/donors/profile', values)
      await queryClient.invalidateQueries({ queryKey: ['donor', 'profile'] })
      toast.success('Profilo aggiornato.')
    } catch {
      toast.error('Errore durante il salvataggio.')
    }
  }

  return (
    <Card className="border-border relative">
      <CardContent className="p-5">
        <CardHeader icon={HeartPulse} title="Dati sanitari" description="Aggiorna telefono, peso e gruppo sanguigno" />
        <form onSubmit={handleSubmit(onSubmit)}>
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
          <div className="absolute bottom-4 right-4 min-w-32">
            <Button type="submit" size="sm" disabled={isSubmitting || !isDirty}>
              {isSubmitting ? <><Spinner className="mr-2" />Salvataggio...</> : 'Salva modifiche'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
