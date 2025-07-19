/**
 * Validation schemas using Zod
 */

import { z } from 'zod'
import { VALIDATION_RULES, ERROR_MESSAGES } from './constants'

// Base schemas
const emailSchema = z
  .string()
  .min(1, ERROR_MESSAGES.AUTH.EMAIL_REQUIRED)
  .email('Please enter a valid email address')
  .max(VALIDATION_RULES.EMAIL.MAX_LENGTH, 'Email is too long')

const nameSchema = z
  .string()
  .min(VALIDATION_RULES.NAME.MIN_LENGTH, `Name must be at least ${VALIDATION_RULES.NAME.MIN_LENGTH} characters`)
  .max(VALIDATION_RULES.NAME.MAX_LENGTH, 'Name is too long')
  .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces')

// Auth validation schemas
export const emailOnlySchema = z.object({
  email: emailSchema,
})

export const otpVerificationSchema = z.object({
  email: emailSchema,
  token: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must contain only numbers'),
})

export const resendOtpSchema = z.object({
  email: emailSchema,
})

// Profile validation schemas
export const updateProfileSchema = z.object({
  fullName: nameSchema.optional(),
  email: emailSchema.optional(),
  avatarUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
})

// Search and filter schemas
export const searchSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(100, 'Search query is too long'),
  limit: z.number().min(1).max(100).default(10),
  offset: z.number().min(0).default(0),
})

// API validation schemas
export const apiResponseSchema = z.object({
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
})

// Environment validation schema
export const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('Invalid Supabase URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'Supabase anon key is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// Type exports
export type EmailOnlyFormData = z.infer<typeof emailOnlySchema>
export type OtpVerificationFormData = z.infer<typeof otpVerificationSchema>
export type ResendOtpFormData = z.infer<typeof resendOtpSchema>
export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>
export type SearchFormData = z.infer<typeof searchSchema>
export type ApiResponse = z.infer<typeof apiResponseSchema>
export type EnvConfig = z.infer<typeof envSchema>

// Validation helper functions
export const validateEmail = (email: string): boolean => {
  return VALIDATION_RULES.EMAIL.PATTERN.test(email)
}

export const validateOtp = (otp: string): boolean => {
  return /^\d{6}$/.test(otp)
}
