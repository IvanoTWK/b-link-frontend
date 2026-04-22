import { z } from "zod";

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'La password deve essere lunga almeno 8 caratteri'),
  confirmPassword: z.string().min(8, 'La password deve essere lunga almeno 8 caratteri'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Le password non coincidono",
  path: ["confirmPassword"],
});

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;