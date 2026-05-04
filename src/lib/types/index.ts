import type { components } from './api.generated'

// ─── DTO (request body) — da spec generata ──────────────────────────────────
export type RegisterDto = components['schemas']['RegisterDto']
export type LoginDto = components['schemas']['LoginDto']
export type VerifyEmailConfirmDto = components['schemas']['VerifyEmailConfirmDto']
export type VerifyEmailResendDto = components['schemas']['VerifyEmailResendDto']
export type ForgotPasswordDto = components['schemas']['ForgotPasswordDto']
export type ResetPasswordDto = components['schemas']['ResetPasswordDto']
export type ChangePasswordDto = components['schemas']['ChangePasswordDto']
export type TwoFactorCodeDto = components['schemas']['TwoFactorCodeDto']
export type BackupCodeDto = components['schemas']['BackupCodeDto']
export type CreateDonorProfileDto = components['schemas']['CreateDonorProfileDto']
export type UpdateDonorProfileDto = components['schemas']['UpdateDonorProfileDto']
export type UpdateConsentDto = components['schemas']['UpdateConsentDto']
export type CreateBookingDto = components['schemas']['CreateBookingDto']
export type CancelBookingDto = components['schemas']['CancelBookingDto']
export type RescheduleBookingDto = components['schemas']['RescheduleBookingDto']
export type CreateAnamnesisDto = components['schemas']['CreateAnamnesisDto']
export type CreateSlotDto = components['schemas']['CreateSlotDto']
export type UpdateSlotDto = components['schemas']['UpdateSlotDto']
export type CreateDonationDto = components['schemas']['CreateDonationDto']
export type CreateMedicalReportDto = components['schemas']['CreateMedicalReportDto']
export type CreateClinicalNoteDto = components['schemas']['CreateClinicalNoteDto']
export type CreateExclusionDto = components['schemas']['CreateExclusionDto']
export type CloseExclusionDto = components['schemas']['CloseExclusionDto']
export type CreateCenterDto = components['schemas']['CreateCenterDto']
export type UpdateCenterDto = components['schemas']['UpdateCenterDto']
export type CreateDonationTypeDto = components['schemas']['CreateDonationTypeDto']
export type UpdateDonationTypeDto = components['schemas']['UpdateDonationTypeDto']
export type CreateDonationTypeIntervalDto = components['schemas']['CreateDonationTypeIntervalDto']
export type UpdateDonationTypeIntervalDto = components['schemas']['UpdateDonationTypeIntervalDto']
export type CreateStaffUserDto = components['schemas']['CreateStaffUserDto']
export type UpdateUserRoleDto = components['schemas']['UpdateUserRoleDto']
export type CreateStaffProfileDto = components['schemas']['CreateStaffProfileDto']
export type UpdateStaffProfileDto = components['schemas']['UpdateStaffProfileDto']
export type CreateAnamnesisQuestionDto = components['schemas']['CreateAnamnesisQuestionDto']
export type UpdateAnamnesisQuestionDto = components['schemas']['UpdateAnamnesisQuestionDto']
export type CreateGdprRequestDto = components['schemas']['CreateGdprRequestDto']
export type HandleGdprRequestDto = components['schemas']['HandleGdprRequestDto']

// ─── Enum ────────────────────────────────────────────────────────────────────
// Gli enum non sono definiti come tipi autonomi nel generato: vengono estratti
// dai DTO di riferimento per rimanere single source of truth.
export type Role = components['schemas']['AuthMeResponseDto']['role']
export type BiologicalSex = components['schemas']['DonorProfileResponseDto']['biologicalSex']
export type BloodGroup = components['schemas']['DonorProfileResponseDto']['bloodGroup']
export type BookingStatus = components['schemas']['BookingResponseDto']['status']
export type CancellationReason = NonNullable<components['schemas']['BookingResponseDto']['cancellationReason']>
export type ExclusionType = components['schemas']['ExclusionResponseDto']['type']
export type GdprRequestType = components['schemas']['GdprRequestResponseDto']['type']
export type GdprRequestStatus = components['schemas']['GdprRequestResponseDto']['status']

// ─── Paginazione ─────────────────────────────────────────────────────────────
// Tipo generico frontend: non ha corrispondente generico nel generato (che usa
// tipi paginated specializzati per ogni entità).
export type PaginatedResponse<T> = {
  items: T[]
  nextCursor?: string
}

// ─── Response types ───────────────────────────────────────────────────────────
export type AuthMeResponse = components['schemas']['AuthMeResponseDto']

// LoginResponse è una union discriminata: solo la variante accessToken è in
// LoginSuccessResponseDto. Le varianti 2FA (preAuthToken) non sono negli schemas
// generati (sono logica frontend) e devono restare definite manualmente.
export type LoginResponse =
  | components['schemas']['LoginSuccessResponseDto']
  | { action: '2FA_REQUIRED'; preAuthToken: string }
  | { action: 'SETUP_2FA_REQUIRED'; preAuthToken: string }

export type TwoFactorSetupResponse = components['schemas']['TwoFactorSetupResponseDto']
export type TwoFactorActivateResponse = components['schemas']['TwoFactorActivateResponseDto']

// ─── Entity types ─────────────────────────────────────────────────────────────
export type DonorProfile = components['schemas']['DonorProfileResponseDto']
export type StaffProfile = components['schemas']['StaffProfileResponseDto']
export type Center = components['schemas']['CenterResponseDto']
export type DonationType = components['schemas']['DonationTypeResponseDto']
export type Slot = components['schemas']['SlotResponseDto']
export type Booking = components['schemas']['BookingResponseDto'] & {
  donor?: {
    donorProfile?: {
      firstName: string | null
      lastName: string | null
      phone: string | null
    } | null
  } | null
}
export type Donation = components['schemas']['DonationResponseDto']
export type AnamnesisQuestion = components['schemas']['AnamnesisQuestionResponseDto']
export type AnamnesisAnswer = components['schemas']['AnamnesisAnswerResponseDto']
export type AnamnesisForm = components['schemas']['AnamnesisFormResponseDto']
export type ReportEntry = components['schemas']['ReportEntryResponseDto']
export type MedicalReport = components['schemas']['MedicalReportResponseDto']
export type ClinicalNote = components['schemas']['ClinicalNoteResponseDto']
export type Exclusion = components['schemas']['ExclusionResponseDto']
export type User = components['schemas']['UserResponseDto']
export type GdprRequest = components['schemas']['GdprRequestResponseDto']

// ─── Staff own profile (non generato — endpoint /staff/profile aggiunto manualmente) ──
export interface StaffOwnProfile {
  id: string
  name: string
  email: string
  role: string
  center: {
    id: string
    name: string
    city: string
    address: string
  } | null
}

// ─── DonorBasicProfile (endpoint /donors/:id/basic-profile) ──────────────────
// Non presente nel generato: aggiunto manualmente per l'area OPERATOR.
export interface DonorBasicProfile {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string
}

// ─── Stats ───────────────────────────────────────────────────────────────────
export type DonationStats = components['schemas']['DonationStatsResponseDto']
export type DonorStats = components['schemas']['DonorStatsResponseDto']
export type SlotOccupancyStat = components['schemas']['SlotOccupancyStatResponseDto']
export type BookingStats = components['schemas']['BookingStatsResponseDto']

