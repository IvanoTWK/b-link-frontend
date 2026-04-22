import { z } from "zod";

export const twoFactorBackupSchema = z.object({
  backupCode: z
    .string()
    .length(10, "Il codice di backup deve essere di esattamente 10 caratteri")
    .regex(/^[A-F0-9]+$/, "Il codice di backup deve contenere solo lettere maiuscole A-F e cifre 0-9"),
});

export type TwoFactorBackupInput = z.infer<typeof twoFactorBackupSchema>;
