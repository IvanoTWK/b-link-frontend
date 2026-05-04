'use client'

import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

// ── Componente ─────────────────────────────────────────────────────────────────

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

    // Pre-compila unità e range di riferimento in base al sesso biologico
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
                  {/* Selezione parametro */}
                  <Field>
                    <FieldLabel htmlFor={`entries.${index}.parameterName`}>
                      Parametro
                    </FieldLabel>
                    <Select
                      value={currentParamName}
                      onValueChange={(v) => handleParameterSelect(index, v)}
                    >
                      <SelectTrigger id={`entries.${index}.parameterName`} className="w-full">
                        <SelectValue placeholder="Seleziona parametro…" />
                      </SelectTrigger>
                      <SelectContent>
                        {examParameters.map((p) => (
                          <SelectItem key={p.id} value={p.name}>
                            {p.name} ({p.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
