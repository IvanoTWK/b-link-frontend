import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.email("Email non valida"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
