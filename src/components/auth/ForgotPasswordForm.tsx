'use client';

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { apiClient } from "@/lib/api/axios";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/auth/schemas/forgot-password.schema";

import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import Link from "next/link";
import { toast } from "sonner";


export function ForgotPasswordForm() {

  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  // Submit
  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setServerError(null);

    try {
      await apiClient.post('/auth/forgot-password', values);
      toast.success('Link inviato controlla la tua email.')
    } catch (error) {
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string; error?: string } }
      }
      const status = axiosError?.response?.status

      if (status === 429) {
        setServerError('Troppi tentativi. Attendi qualche minuto e riprova.')
      } else {
        const responseData = axiosError?.response?.data
        const message =
          responseData?.message ??
          responseData?.error ??
          'Si è verificato un errore. Riprova.'
        setServerError(message)
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold">Recupera password</h1>
        <p className="text-xs text-muted-foreground">
          Inserisci la tua email e riceverai un link per reimpostare la password.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="nome@esempio.it"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            <FieldError errors={[errors.email]} />
          </Field>

          {serverError && <FieldError>{serverError}</FieldError>}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Spinner className="mr-2 size-4" />
                Invio in corso...
              </>
            ) : (
              'Invia link'
            )}
          </Button>
        </FieldGroup>
      </form>
      <div className="text-center">
        <Link
          href="/auth/login"
          className="text-sm text-primary underline underline-offset-4 hover:opacity-80"
        >
          Torna al login
        </Link>
      </div>
    </div>
  )

}