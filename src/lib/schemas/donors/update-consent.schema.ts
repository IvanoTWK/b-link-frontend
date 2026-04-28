import { z } from 'zod'

export const updateConsentSchema = z.object({
  consentHealthData: z.boolean().optional(),
  consentPersonalData: z.boolean().optional(),
}).refine(
  (data) => data.consentHealthData !== undefined || data.consentPersonalData !== undefined,
  { message: 'Almeno un consenso deve essere specificato.' }
)

export type UpdateConsentFormValues = z.infer<typeof updateConsentSchema>
