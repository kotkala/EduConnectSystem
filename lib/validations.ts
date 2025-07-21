import { z } from 'zod'
import { VALIDATION } from './constants'

// Email-only form validation (for OTP request)
export const EmailOnlyFormSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .trim()
    .toLowerCase(),
})

export type EmailOnlyFormData = z.infer<typeof EmailOnlyFormSchema>

// OTP verification form validation
export const OtpVerificationFormSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .trim()
    .toLowerCase(),
  token: z
    .string()
    .min(6, 'OTP must be 6 digits')
    .max(6, 'OTP must be 6 digits')
    .regex(VALIDATION.OTP_REGEX, 'OTP must contain only numbers'),
})

export type OtpVerificationFormData = z.infer<typeof OtpVerificationFormSchema>

// Profile setup form validation
export const ProfileSetupFormSchema = z.object({
  full_name: z
    .string()
    .min(VALIDATION.MIN_NAME_LENGTH, `Name must be at least ${VALIDATION.MIN_NAME_LENGTH} characters`)
    .max(VALIDATION.MAX_NAME_LENGTH, `Name must be less than ${VALIDATION.MAX_NAME_LENGTH} characters`)
    .trim(),
  role: z.enum(['admin', 'teacher', 'student', 'parent'], {
    message: 'Please select a valid role',
  }),
})

export type ProfileSetupFormData = z.infer<typeof ProfileSetupFormSchema>

// Profile update form validation (partial)
export const ProfileUpdateFormSchema = z.object({
  full_name: z
    .string()
    .min(VALIDATION.MIN_NAME_LENGTH, `Name must be at least ${VALIDATION.MIN_NAME_LENGTH} characters`)
    .max(VALIDATION.MAX_NAME_LENGTH, `Name must be less than ${VALIDATION.MAX_NAME_LENGTH} characters`)
    .trim()
    .optional(),
  avatar_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
})

export type ProfileUpdateFormData = z.infer<typeof ProfileUpdateFormSchema>

// Validation helper functions
export const validateEmail = (email: string): boolean => {
  return VALIDATION.EMAIL_REGEX.test(email)
}

export const validateOtp = (otp: string): boolean => {
  return VALIDATION.OTP_REGEX.test(otp)
}

export const validateName = (name: string): boolean => {
  return name.length >= VALIDATION.MIN_NAME_LENGTH && name.length <= VALIDATION.MAX_NAME_LENGTH
}
