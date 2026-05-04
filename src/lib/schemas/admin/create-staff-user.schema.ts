import { z } from 'zod'

export const createStaffUserSchema = z.object({
  name: z
    .string()
    .min(2, 'Il nome deve contenere almeno 2 caratteri')
    .max(100, 'Il nome è troppo lungo'),
  email: z.string().email('Inserisci un indirizzo email valido'),
  role: z.enum(['OPERATOR', 'DOCTOR', 'ADMIN'] as const, {
    error: 'Seleziona un ruolo',
  }),
})

export type CreateStaffUserFormValues = z.infer<typeof createStaffUserSchema>
