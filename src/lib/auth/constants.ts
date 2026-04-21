import type { Role } from '@/lib/types'

export const ROLE_REDIRECT: Record<Role, string> = {
  GUEST: '/',
  DONOR: '/donors',
  OPERATOR: '/operators',
  DOCTOR: '/doctors',
  ADMIN: '/admin',
}
