'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { apiClient } from '@/lib/api/axios'
import { useAuthStore } from '@/lib/store/auth.store'
import type { LoginResponse, AuthMeResponse } from '@/lib/types'

import { loginSchema, type LoginFormValues } from '@/lib/auth/schemas/login.schema'
import { ROLE_REDIRECT } from '@/lib/auth/constants'

import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'


export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const login = useAuthStore((state) => state.login)

  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null)

    try {
      const { data } = await apiClient.post<LoginResponse>('/auth/login', {
        email: values.email,
        password: values.password,
      })

      if ('accessToken' in data) {
        useAuthStore.getState().setAccessToken(data.accessToken)
        const { data: me } = await apiClient.get<AuthMeResponse>('/auth/me')
        login(data.accessToken, me)

        const redirectParam = searchParams.get('redirect')
        const destination = redirectParam ?? ROLE_REDIRECT[me.role]
        router.push(destination)
        return
      }

      if (data.action === '2FA_REQUIRED') {
        router.push(`/auth/2fa/verifica?token=${encodeURIComponent(data.preAuthToken)}`)
        return
      }

      if (data.action === 'SETUP_2FA_REQUIRED') {
        router.push(`/auth/2fa/configurazione?token=${encodeURIComponent(data.preAuthToken)}`)
        return
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number; data?: { message?: string; error?: string } } }
      const status = axiosError?.response?.status

      if (status === 401) {
        setServerError('Credenziali non corrette. Riprova.')
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
        <h1 className="text-2xl font-bold">Accedi al tuo account</h1>
        <p className="text-xs text-muted-foreground">
          Non hai un account?{' '}
          <Link
            href="/auth/register"
            className="text-primary underline underline-offset-4 hover:opacity-80"
          >
            Registrati
          </Link>
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

          <Field>
            <div className="flex items-center justify-between">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                Password dimenticata?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
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

          {serverError && (
            <FieldError>{serverError}</FieldError>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner className="mr-2" />
                Accesso in corso...
              </>
            ) : (
              'Accedi'
            )}
          </Button>
        </FieldGroup>
      </form>
    </div>
  )
}