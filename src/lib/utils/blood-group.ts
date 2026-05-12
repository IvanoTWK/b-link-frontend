export const BLOOD_GROUP_LABELS: Record<string, string> = {
  A_POSITIVE:  'A+',
  A_NEGATIVE:  'A-',
  B_POSITIVE:  'B+',
  B_NEGATIVE:  'B-',
  AB_POSITIVE: 'AB+',
  AB_NEGATIVE: 'AB-',
  O_POSITIVE:  'O+',
  O_NEGATIVE:  'O-',
  UNKNOWN:     '—',
}

export function formatBloodGroup(value: string | null | undefined): string {
  if (!value) return '—'
  return BLOOD_GROUP_LABELS[value] ?? value
}
