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

// Subject form validation
export const SubjectFormSchema = z.object({
  code: z
    .string()
    .min(2, 'Subject code must be at least 2 characters')
    .max(10, 'Subject code must be less than 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Subject code must contain only uppercase letters and numbers')
    .trim(),
  name_vietnamese: z
    .string()
    .min(1, 'Vietnamese name is required')
    .max(100, 'Vietnamese name must be less than 100 characters')
    .trim(),
  name_english: z
    .string()
    .min(1, 'English name is required')
    .max(100, 'English name must be less than 100 characters')
    .trim(),
  category: z.enum(['core', 'specialized'], {
    message: 'Please select a valid category',
  }),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional()
    .or(z.literal('')),
})

export type SubjectFormData = z.infer<typeof SubjectFormSchema>

// Subject update form validation (for editing existing subjects)
export const SubjectUpdateFormSchema = SubjectFormSchema.partial().extend({
  id: z.string().uuid('Invalid subject ID'),
})

export type SubjectUpdateFormData = z.infer<typeof SubjectUpdateFormSchema>
