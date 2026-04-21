'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { apiClient } from "@/lib/api/axios";

import { registerSchema, type RegisterFormValues } from "@/lib/auth/schemas/register.schema";

import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Eye, EyeOff } from 'lucide-react'


export function RegisterForm() {
  const router = useRouter()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })


  // Submit
  const onSubmit = async (values: RegisterFormValues) => {
    setServerError(null)

    try {
      await apiClient.post('/auth/register', {
        name: values.name,
        email: values.email,
        password: values.password,
        role: 'DONOR',
      })

      router.push(
        `/auth/verifica-email?email=${encodeURIComponent(values.email)}`,
      )
    } catch (err: unknown) {
      const axiosError = err as {
        response?: { status?: number; data?: { message?: string; error?: string } }
      }
      const status = axiosError?.response?.status

      if (status === 409) {
        setServerError('Esiste già un account con questa email. Prova ad accedere.')
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="name">Nome</FieldLabel>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Mario Rossi"
            aria-invalid={!!errors.name}
            {...register('name')}
          />
          <FieldError errors={[errors.name]} />
        </Field>

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

        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              className="pr-10"
              {...register('password')}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground hover:text-foreground"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
            >
              {showPassword ? (
                <EyeOff className="size-4 transition-all duration-200" />
              ) : (
                <Eye className="size-4 transition-all duration-200" />
              )}
            </Button>
          </div>
          <FieldError errors={[errors.password]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="confirmPassword">Conferma password</FieldLabel>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="••••••••"
              aria-invalid={!!errors.confirmPassword}
              className="pr-10"
              {...register('confirmPassword')}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute inset-y-0 right-0 h-full px-3 text-muted-foreground hover:text-foreground"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? 'Nascondi conferma password' : 'Mostra conferma password'}
            >
              {showConfirmPassword ? (
                <EyeOff className="size-4 transition-all duration-200" />
              ) : (
                <Eye className="size-4 transition-all duration-200" />
              )}
            </Button>
          </div>
          <FieldError errors={[errors.confirmPassword]} />
        </Field>

        {serverError && <FieldError>{serverError}</FieldError>}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner className="mr-2" />
              Registrazione in corso...
            </>
          ) : (
            'Crea account'
          )}
        </Button>
      </FieldGroup>
    </form>
  )
}