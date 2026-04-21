import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2, 'Il nome deve contenere almeno 2 caratteri'),
  email: z.email('Inserisci un indirizzo email valido'),
  password: z.string().min(8, 'La password deve contenere almeno 8 caratteri'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Le password non corrispondono',
  path: ['confirmPassword'],
})

export type RegisterFormValues = z.infer<typeof registerSchema>