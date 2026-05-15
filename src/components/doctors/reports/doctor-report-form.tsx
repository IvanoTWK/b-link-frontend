'use client'

import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, ChevronsUpDown, Plus, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from '@/components/ui/field'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// ── Tipi ───────────────────────────────────────────────────────────────────────

export interface ExamParameter {
  id: string
  name: string
  unit: string
  refMinMale: number
  refMaxMale: number
  refMinFemale: number
  refMaxFemale: number
}

// ── Schema Zod ─────────────────────────────────────────────────────────────────

const ReportEntrySchema = z.object({
  parameterName: z.string().min(1, 'Seleziona un parametro.'),
  unit: z.string().min(1, 'Unità obbligatoria.'),
  measuredValue: z
    .string()
    .min(1, 'Valore obbligatorio.')
    .refine((v) => !isNaN(Number(v)), 'Deve essere un numero.'),
  refMin: z
    .string()
    .min(1, 'Minimo obbligatorio.')
    .refine((v) => !isNaN(Number(v)), 'Deve essere un numero.'),
  refMax: z
    .string()
    .min(1, 'Massimo obbligatorio.')
    .refine((v) => !isNaN(Number(v)), 'Deve essere un numero.'),
})

const ReportFormSchema = z.object({
  entries: z
    .array(ReportEntrySchema)
    .min(1, 'Inserisci almeno un parametro.'),
})

type ReportFormValues = z.infer<typeof ReportFormSchema>

// ── Props ──────────────────────────────────────────────────────────────────────

interface DoctorReportFormProps {
  examParameters: ExamParameter[]
  biologicalSex?: 'MALE' | 'FEMALE' | null
  onSubmit: (entries: Array<{
    parameterName: string
    unit: string
    measuredValue: number
    refMin: number
    refMax: number
  }>) => void
  isPending: boolean
}

// ── Combobox parametro ─────────────────────────────────────────────────────────

function ParameterCombobox({
  examParameters,
  value,
  onSelect,
}: {
  examParameters: ExamParameter[]
  value: string
  onSelect: (name: string) => void
}) {
  const [open, setOpen] = useState(false)

  const selected = examParameters.find((p) => p.name === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">
            {selected ? `${selected.name} (${selected.unit})` : 'Seleziona parametro…'}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        side="bottom"
        sideOffset={4}
        avoidCollisions={false}
      >
        <Command>
          <CommandInput placeholder="Cerca parametro…" />
          <CommandList className="max-h-56 overflow-y-auto">
            <CommandEmpty>Nessun parametro trovato.</CommandEmpty>
            <CommandGroup>
              {examParameters.map((p) => (
                <CommandItem
                  key={p.id}
                  value={p.name}
                  onSelect={(v) => {
                    onSelect(v)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === p.name ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {p.name}
                  <span className="ml-1 text-muted-foreground">({p.unit})</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ── Componente principale ──────────────────────────────────────────────────────

export function DoctorReportForm({
  examParameters,
  biologicalSex,
  onSubmit,
  isPending,
}: DoctorReportFormProps) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReportFormValues>({
    resolver: zodResolver(ReportFormSchema),
    defaultValues: {
      entries: [{ parameterName: '', unit: '', measuredValue: '', refMin: '', refMax: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'entries' })

  // ── Gestione selezione parametro ──────────────────────────────────────────────

  const handleParameterSelect = (index: number, paramName: string) => {
    const param = examParameters.find((p) => p.name === paramName)
    if (!param) return

    const refMin =
      biologicalSex === 'FEMALE'
        ? param.refMinFemale
        : param.refMinMale
    const refMax =
      biologicalSex === 'FEMALE'
        ? param.refMaxFemale
        : param.refMaxMale

    setValue(`entries.${index}.parameterName`, param.name)
    setValue(`entries.${index}.unit`, param.unit)
    setValue(`entries.${index}.refMin`, String(refMin))
    setValue(`entries.${index}.refMax`, String(refMax))
  }

  // ── Submit ─────────────────────────────────────────────────────────────────────

  const handleFormSubmit = (values: ReportFormValues) => {
    onSubmit(
      values.entries.map((e) => ({
        parameterName: e.parameterName,
        unit: e.unit,
        measuredValue: Number(e.measuredValue),
        refMin: Number(e.refMin),
        refMax: Number(e.refMax),
      }))
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        {fields.map((field, index) => {
          const currentParamName = watch(`entries.${index}.parameterName`)

          return (
            <Card key={field.id} className="border-border">
              <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  Parametro {index + 1}
                </CardTitle>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>

              <CardContent className="p-4 pt-3">
                <FieldGroup>
                  {/* Selezione parametro con ricerca */}
                  <Field>
                    <FieldLabel>Parametro</FieldLabel>
                    <ParameterCombobox
                      examParameters={examParameters}
                      value={currentParamName}
                      onSelect={(v) => handleParameterSelect(index, v)}
                    />
                    {errors.entries?.[index]?.parameterName && (
                      <FieldError>
                        {errors.entries[index]!.parameterName!.message}
                      </FieldError>
                    )}
                  </Field>

                  {/* Grid: valore misurato | unità | ref min | ref max */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Field>
                      <FieldLabel htmlFor={`entries.${index}.measuredValue`}>
                        Valore misurato
                      </FieldLabel>
                      <Input
                        id={`entries.${index}.measuredValue`}
                        type="number"
                        step="any"
                        placeholder="Es. 14.5"
                        {...register(`entries.${index}.measuredValue`)}
                      />
                      {errors.entries?.[index]?.measuredValue && (
                        <FieldError>
                          {errors.entries[index]!.measuredValue!.message}
                        </FieldError>
                      )}
                    </Field>

                    <Field>
                      <FieldLabel htmlFor={`entries.${index}.unit`}>
                        Unità
                      </FieldLabel>
                      <Input
                        id={`entries.${index}.unit`}
                        placeholder="Es. g/dL"
                        {...register(`entries.${index}.unit`)}
                      />
                      {errors.entries?.[index]?.unit && (
                        <FieldError>
                          {errors.entries[index]!.unit!.message}
                        </FieldError>
                      )}
                    </Field>

                    <Field>
                      <FieldLabel htmlFor={`entries.${index}.refMin`}>
                        Rif. minimo
                      </FieldLabel>
                      <Input
                        id={`entries.${index}.refMin`}
                        type="number"
                        step="any"
                        placeholder="Es. 12.0"
                        {...register(`entries.${index}.refMin`)}
                      />
                      {errors.entries?.[index]?.refMin && (
                        <FieldError>
                          {errors.entries[index]!.refMin!.message}
                        </FieldError>
                      )}
                    </Field>

                    <Field>
                      <FieldLabel htmlFor={`entries.${index}.refMax`}>
                        Rif. massimo
                      </FieldLabel>
                      <Input
                        id={`entries.${index}.refMax`}
                        type="number"
                        step="any"
                        placeholder="Es. 17.5"
                        {...register(`entries.${index}.refMax`)}
                      />
                      {errors.entries?.[index]?.refMax && (
                        <FieldError>
                          {errors.entries[index]!.refMax!.message}
                        </FieldError>
                      )}
                    </Field>
                  </div>
                </FieldGroup>
              </CardContent>
            </Card>
          )
        })}

        {/* Errore a livello di array */}
        {errors.entries?.root && (
          <FieldError>{errors.entries.root.message}</FieldError>
        )}
        {typeof errors.entries?.message === 'string' && (
          <FieldError>{errors.entries.message}</FieldError>
        )}
      </div>

      {/* Pulsanti */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() =>
            append({ parameterName: '', unit: '', measuredValue: '', refMin: '', refMax: '' })
          }
        >
          <Plus className="h-4 w-4" />
          Aggiungi parametro
        </Button>

        <Button type="submit" disabled={isPending} className="ml-auto">
          {isPending ? 'Salvataggio…' : 'Salva referto'}
        </Button>
      </div>
    </form>
  )
}
