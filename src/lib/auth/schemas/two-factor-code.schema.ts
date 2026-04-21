import { z } from "zod";

export const twoFactorCodeSchema = z.object({
  code: z
    .string()
    .length(6, "Il codice deve essere di esattamente 6 cifre")
    .regex(/^\d+$/, "Il codice deve contenere solo cifre numeriche"),
});

export type TwoFactorCodeInput = z.infer<typeof twoFactorCodeSchema>;
