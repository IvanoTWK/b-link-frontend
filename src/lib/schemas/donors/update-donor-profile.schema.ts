import { z } from 'zod'

export const updateDonorProfileSchema = z.object({
  phone: z.string().min(5, 'Inserisci un numero valido').max(30).optional(),
  weight: z
    .number({ error: 'Inserisci un peso valido' })
    .min(45, 'Il peso minimo è 45 kg')
    .optional(),
  bloodGroup: z
    .enum([
      'A_POSITIVE',
      'A_NEGATIVE',
      'B_POSITIVE',
      'B_NEGATIVE',
      'AB_POSITIVE',
      'AB_NEGATIVE',
      'O_POSITIVE',
      'O_NEGATIVE',
      'UNKNOWN',
    ])
    .optional(),
})

export type UpdateDonorProfileFormValues = z.infer<typeof updateDonorProfileSchema>
