'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/lib/api/axios'
import {
  createDonorProfileSchema,
  type CreateDonorProfileFormValues,
} from '@/lib/schemas/donors/create-donor-profile.schema'

import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertTriangle, Calendar, ChevronsUpDown, CreditCard, HeartPulse, MapPin, Scale, Smartphone, User, UserCheck, Users } from 'lucide-react'
import { toast } from 'sonner'
import { belfioreConnector } from '@marketto/belfiore-connector-embedded'
import type { BelfiorePlace } from '@marketto/belfiore-connector'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

const BLOOD_GROUP_LABELS: Record<CreateDonorProfileFormValues['bloodGroup'], string> = {
  A_POSITIVE: 'A+',
  A_NEGATIVE: 'A-',
  B_POSITIVE: 'B+',
  B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+',
  AB_NEGATIVE: 'AB-',
  O_POSITIVE: '0+',
  O_NEGATIVE: '0-',
  UNKNOWN: 'Sconosciuto',
}

interface CreateDonorProfileFormProps {
  onSuccess: () => void
}

export function CreateDonorProfileForm({ onSuccess }: CreateDonorProfileFormProps) {
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState<string | null>(null)
  const [placeOfBirthOpen, setPlaceOfBirthOpen] = useState(false)
  const [comuniOptions, setComuniOptions] = useState<BelfiorePlace[]>([])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CreateDonorProfileFormValues>({
    resolver: zodResolver(createDonorProfileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      fiscalCode: '',
      dateOfBirth: '',
      biologicalSex: undefined,
      bloodGroup: undefined,
      weight: undefined,
      phone: '',
      placeOfBirth: '',
      consentHealthData: false,
      consentPersonalData: false,
    },
  })

  const onSubmit = async (values: CreateDonorProfileFormValues) => {
    setServerError(null)

    try {
      await apiClient.post('/donors/profile', values)
      await queryClient.invalidateQueries({ queryKey: ['donor', 'profile'] })
      onSuccess()
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { data?: { message?: string; error?: string } }
      }
      const responseData = axiosError?.response?.data
      const message =
        responseData?.message ??
        responseData?.error ??
        'Si è verificato un errore. Riprova.'
      toast.error(message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto">
        <FieldGroup>
          <div className="grid grid-cols-6 gap-4">


            {/* Nome */}
            <Field className="col-span-6 sm:col-span-3">
              <FieldLabel htmlFor="firstName">
                <User className="h-4 w-4" />
                Nome*
                {errors.firstName && <AlertTriangle className="ml-auto text-destructive h-4 w-4" />}
              </FieldLabel>
              <Input
                id="firstName"
                type="text"
                placeholder="Mario"
                autoComplete="given-name"
                aria-invalid={!!errors.firstName}
                {...register('firstName')}
              />
              <FieldError errors={[errors.firstName]} />
            </Field>

            {/* Cognome */}
            <Field className="col-span-6 sm:col-span-3">
              <FieldLabel htmlFor="lastName">
                <UserCheck className="h-4 w-4" />
                Cognome*
                {errors.lastName && <AlertTriangle className="ml-auto text-destructive h-4 w-4" />}
              </FieldLabel>
              <Input
                id="lastName"
                type="text"
                placeholder="Rossi"
                autoComplete="family-name"
                aria-invalid={!!errors.lastName}
                {...register('lastName')}
              />
              <FieldError errors={[errors.lastName]} />
            </Field>


            {/* Codice fiscale */}
            <Field className="col-span-6 md:col-span-4 lg:col-span-2">
              <FieldLabel htmlFor="fiscalCode">
                <CreditCard className="h-4 w-4" />
                Codice fiscale*
                {errors.fiscalCode && <AlertTriangle className="ml-auto text-destructive h-4 w-4" />}
              </FieldLabel>
              <Input
                id="fiscalCode"
                type="text"
                placeholder="RSSMRA85M01H501Z"
                autoComplete="off"
                aria-invalid={!!errors.fiscalCode}
                {...register('fiscalCode')}
              />
              <FieldError errors={[errors.fiscalCode]} />
            </Field>

            {/* Data di nascita */}
            <Field className="col-span-6 md:col-span-2 xl:col-span-1">
              <FieldLabel htmlFor="dateOfBirth">
                <Calendar className="h-4 w-4" />
                Data di nascita*
                {errors.dateOfBirth && <AlertTriangle className="ml-auto text-destructive h-4 w-4" />}
              </FieldLabel>
              <Input
                id="dateOfBirth"
                type="date"
                aria-invalid={!!errors.dateOfBirth}
                {...register('dateOfBirth')}
              />
              <FieldError errors={[errors.dateOfBirth]} />
            </Field>

            {/* Comune di nascita */}
            <Field className="col-span-6 md:col-span-2">
              <FieldLabel htmlFor="placeOfBirth">
                <MapPin className="h-4 w-4" />
                Comune di nascita
                {errors.placeOfBirth && <AlertTriangle className="ml-auto text-destructive h-4 w-4" />}
              </FieldLabel>
              <Controller
                name="placeOfBirth"
                control={control}
                render={({ field }) => (
                  <Popover open={placeOfBirthOpen} onOpenChange={setPlaceOfBirthOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-invalid={!!errors.placeOfBirth}
                        className="w-full justify-between font-normal"
                      >
                        {field.value || 'Cerca comune...'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder="Cerca comune..."
                          onValueChange={async (query) => {
                            if (query.length < 2) { setComuniOptions([]); return; }
                            const results = await belfioreConnector.searchByName(query)
                            setComuniOptions(Array.isArray(results) ? results : [])
                          }}
                        />
                        <CommandList>
                          <CommandEmpty>Nessun comune trovato</CommandEmpty>
                          <CommandGroup>
                            {comuniOptions.map((place) => (
                              <CommandItem
                                key={place.belfioreCode}
                                value={place.name}
                                onSelect={(value) => {
                                  field.onChange(value)
                                  setPlaceOfBirthOpen(false)
                                }}
                              >
                                {place.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              />
              <FieldError errors={[errors.placeOfBirth]} />
            </Field>

            {/* Sesso biologico */}
            <Field className="col-span-6 md:col-span-2 xl:col-span-1">
              <FieldLabel htmlFor="biologicalSex">
                <Users className="h-4 w-4" />
                Sesso biologico*
                {errors.biologicalSex && <AlertTriangle className="ml-auto text-destructive h-4 w-4" />}
              </FieldLabel>
              <Controller
                name="biologicalSex"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="biologicalSex"
                      className="w-full"
                      aria-invalid={!!errors.biologicalSex}
                    >
                      <SelectValue placeholder="Seleziona..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Maschio</SelectItem>
                      <SelectItem value="FEMALE">Femmina</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.biologicalSex]} />
            </Field>

            {/* Gruppo sanguigno */}
            <Field className="col-span-6 md:col-span-2 xl:col-span-1">
              <FieldLabel htmlFor="bloodGroup">
                <HeartPulse className="h-4 w-4" />
                Gruppo sanguigno*
                {errors.bloodGroup && <AlertTriangle className="ml-auto text-destructive h-4 w-4" />}
              </FieldLabel>
              <Controller
                name="bloodGroup"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="bloodGroup"
                      className="w-full"
                      aria-invalid={!!errors.bloodGroup}
                    >
                      <SelectValue placeholder="Seleziona..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(BLOOD_GROUP_LABELS) as [CreateDonorProfileFormValues['bloodGroup'], string][]).map(
                        ([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.bloodGroup]} />
            </Field>

            {/* Peso */}
            <Field className="col-span-3 md:col-span-2 lg:col-span-1">
              <FieldLabel htmlFor="weight">
                <Scale className="h-4 w-4" />
                Peso(kg)*
                {errors.weight && <AlertTriangle className="ml-auto text-destructive h-4 w-4" />}
              </FieldLabel>
              <Input
                id="weight"
                type="number"
                placeholder="70"
                min={45}
                aria-invalid={!!errors.weight}
                {...register('weight', { valueAsNumber: true })}
              />
              <FieldError errors={[errors.weight]} />
            </Field>

            {/* Telefono */}
            <Field className="col-span-3 lg:col-span-2">
              <FieldLabel htmlFor="phone">
                <Smartphone className="h-4 w-4" />
                Telefono*
                {errors.phone && <AlertTriangle className="ml-auto text-destructive h-4 w-4" />}
              </FieldLabel>
              <Input
                id="phone"
                type="tel"
                placeholder="+39 333 1234567"
                autoComplete="tel"
                aria-invalid={!!errors.phone}
                {...register('phone')}
              />
              <FieldError errors={[errors.phone]} />
            </Field>



            <div className='col-span-6 flex flex-col gap-6 my-4'>
              {/* Consenso dati sanitari */}
              <Field>
                <div className="flex items-start gap-2">
                  <Controller
                    name="consentHealthData"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="consentHealthData"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-invalid={!!errors.consentHealthData}
                      />
                    )}
                  />
                  <div className="flex flex-col gap-1">
                    <FieldLabel htmlFor="consentHealthData" className="cursor-pointer text-xs font-medium leading-snug">
                      Consenso al trattamento dei dati sanitari*
                    </FieldLabel>
                    <p className="text-[10px] text-muted-foreground">
                      Autorizzo il trattamento dei miei dati sanitari per la gestione delle donazioni di sangue, ai sensi dell'Art. 9 del Regolamento UE 2016/679 (GDPR). Senza questo consenso non sarà possibile effettuare prenotazioni.
                    </p>
                    <FieldError className='text-[10px]' errors={[errors.consentHealthData]} />
                  </div>
                </div>
              </Field>

              {/* Consenso dati personali */}
              <Field>
                <div className="flex items-start gap-2">
                  <Controller
                    name="consentPersonalData"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="consentPersonalData"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <div className="flex flex-col gap-1">
                    <FieldLabel htmlFor="consentPersonalData" className="cursor-pointer text-xs font-medium leading-snug">
                      Consenso al trattamento dei dati personali
                    </FieldLabel>
                    <p className="text-[10px] text-muted-foreground">
                      Autorizzo il trattamento dei miei dati personali (nome, cognome, codice fiscale, contatti) per le comunicazioni relative all'attività di donazione, ai sensi dell'Art. 6 del Regolamento UE 2016/679 (GDPR).
                    </p>
                  </div>
                </div>
              </Field>
            </div>

            {serverError && (
              <div className="col-span-6">
                <FieldError>{serverError}</FieldError>
              </div>
            )}

          </div>
        </FieldGroup>
      </div>

      <div className="sticky bottom-0 bg-background pt-4 pb-2">
        <div className="max-w-sm">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner className="mr-2" />
                Salvataggio in corso...
              </>
            ) : (
              'Completa il profilo'
            )}
          </Button>
        </div>
      </div>
    </form>
  )
}
