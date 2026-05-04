import { z } from 'zod'

export const updateUserRoleSchema = z.object({
  role: z.enum(['GUEST', 'DONOR', 'OPERATOR', 'DOCTOR', 'ADMIN'] as const, {
    error: 'Seleziona un ruolo',
  }),
})

export type UpdateUserRoleFormValues = z.infer<typeof updateUserRoleSchema>
