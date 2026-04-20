import type { Role } from '@/lib/types'

export const ROLE_REDIRECT: Record<Role, string> = {
  GUEST: '/',
  DONOR: '/donatori',
  OPERATOR: '/operatori',
  DOCTOR: '/dottori',
  ADMIN: '/admin',
}
