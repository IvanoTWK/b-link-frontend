import { z } from 'zod'

const FISCAL_CODE_REGEX = /^[A-Z]{6}[0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{2}[A-Z][0-9LMNPQRSTUV]{3}[A-Z]$/

export const createDonorProfileSchema = z.object({
  fiscalCode: z
    .string()
    .toUpperCase()
    .regex(FISCAL_CODE_REGEX, 'Codice fiscale non valido'),

  firstName: z
    .string()
    .min(1, 'Il nome è obbligatorio')
    .max(100),

  lastName: z
    .string()
    .min(1, 'Il cognome è obbligatorio')
    .max(100),

  dateOfBirth: z
    .iso
    .date('Inserisci una data valida')
    .refine((d) => new Date(d) < new Date(), { message: 'La data di nascita deve essere nel passato' }),

  biologicalSex: z.enum(['MALE', 'FEMALE'], {
    error: 'Seleziona il sesso biologico',
  }),

  bloodGroup: z.enum(
    [
      'A_POSITIVE',
      'A_NEGATIVE',
      'B_POSITIVE',
      'B_NEGATIVE',
      'AB_POSITIVE',
      'AB_NEGATIVE',
      'O_POSITIVE',
      'O_NEGATIVE',
      'UNKNOWN',
    ],
    { error: 'Seleziona il gruppo sanguigno' }
  ),

  weight: z
    .number({ error: 'Inserisci un peso valido' })
    .min(45, 'Il peso minimo è 45 kg'),

  phone: z
    .string()
    .min(5, 'Inserisci un numero di telefono valido')
    .max(30),

  placeOfBirth: z.string().min(2, 'Inserisci il comune di nascita').max(100),

  consentHealthData: z.boolean().refine((v) => v === true, {
    message: 'Il consenso al trattamento dei dati sanitari è obbligatorio per procedere',
  }),
  consentPersonalData: z.boolean(),
})

export type CreateDonorProfileFormValues = z.infer<typeof createDonorProfileSchema>
