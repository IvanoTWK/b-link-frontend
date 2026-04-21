'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { apiClient } from "@/lib/api/axios"

import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/auth/schemas/reset-password.schema";

import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import Link from "next/link";
import { toast } from "sonner";

interface Props {
  token: string
}

export function ResetPasswordForm({ token }: Props) {
  const router = useRouter()

  const [serverError, setServerError] = useState<string | null>(null)
  const [tokenExpired, setTokenExpired] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  // Submit
  const onSubmit = async (values: ResetPasswordFormValues) => {
    setServerError(null)
    setTokenExpired(false)

    try {
      await apiClient.post('/auth/reset-password', {
        token,
        newPassword: values.newPassword,
      })
      toast.success('Password reimpostata con successo')
      router.push('/auth/login')
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { status?: number; data?: { message?: string; error?: string } }
      }
      const status = axiosError?.response?.status

      if (status === 400) {
        setTokenExpired(true)
      } else if (status === 429) {
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

  if (!token) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-bold">Link non valido</h1>
          <p className="text-sm text-muted-foreground">
            Il link per reimpostare la password non è valido o mancante.{' '}
            <Link
              href="/auth/forgot-password"
              className="text-primary underline underline-offset-4 hover:opacity-80"
            >
              Richiedi un nuovo link
            </Link>
            .
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-bold">Reimposta password</h1>
        <p className="text-xs text-muted-foreground">
          Inserisci la tua nuova password.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="newPassword">Nuova password</FieldLabel>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              aria-invalid={!!errors.newPassword}
              {...register('newPassword')}
            />
            <FieldError errors={[errors.newPassword]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="confirmPassword">Conferma password</FieldLabel>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              aria-invalid={!!errors.confirmPassword}
              {...register('confirmPassword')}
            />
            <FieldError errors={[errors.confirmPassword]} />
          </Field>

          {serverError && <FieldError>{serverError}</FieldError>}

          {tokenExpired && (
            <FieldError>
              Token non valido o scaduto.{' '}
              <Link
                href="/auth/forgot-password"
                className="underline underline-offset-4 hover:opacity-80"
              >
                Richiedi un nuovo link
              </Link>
              .
            </FieldError>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Spinner className="mr-2 size-4" />
                Reset in corso...
              </>
            ) : (
              'Reimposta password'
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