import { z } from 'zod'

export const updateStaffProfileSchema = z.object({
  name: z.string().min(2, 'Il nome deve contenere almeno 2 caratteri').max(100, 'Il nome è troppo lungo'),
})

export type UpdateStaffProfileFormValues = z.infer<typeof updateStaffProfileSchema>
