// Error messages for authentication
export const ERROR_MESSAGES = {
  GENERIC: 'An unexpected error occurred. Please try again.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_OTP: 'Invalid OTP code. Please check and try again.',
  OTP_EXPIRED: 'OTP code has expired. Please request a new one.',
  USER_NOT_FOUND: 'No account found with this email address.',
  PROFILE_NOT_FOUND: 'User profile not found. Please complete your profile setup.',
  UNAUTHORIZED: 'You are not authorized to access this resource.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  SIGNUP_DISABLED: 'New user registration is currently disabled.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  EMAIL_NOT_CONFIRMED: 'Please check your email and confirm your account.',
  WEAK_PASSWORD: 'Password is too weak. Please choose a stronger password.',
  EMAIL_ALREADY_EXISTS: 'An account with this email already exists.',
  GOOGLE_AUTH_ERROR: 'Google authentication failed. Please try again.',
  OTP_SEND_ERROR: 'Failed to send OTP. Please try again.',
  PROFILE_UPDATE_ERROR: 'Failed to update profile. Please try again.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
} as const

// Route constants
export const ROUTES = {
  HOME: '/',
  PROFILE_SETUP: '/profile/setup',
  DASHBOARD: '/dashboard',
  ADMIN_DASHBOARD: '/dashboard/admin',
  TEACHER_DASHBOARD: '/dashboard/teacher',
  STUDENT_DASHBOARD: '/dashboard/student',
  PARENT_DASHBOARD: '/dashboard/parent',
  AUTH_ERROR: '/auth/auth-code-error',
  CALLBACK: '/auth/callback',
  CONFIRM: '/auth/confirm',
} as const

// User role constants
export const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
  PARENT: 'parent',
} as const

// Authentication provider constants
export const AUTH_PROVIDERS = {
  GOOGLE: 'google',
  EMAIL: 'email',
} as const

// OTP configuration
export const OTP_CONFIG = {
  LENGTH: 6,
  EXPIRY_MINUTES: 10,
  RESEND_COOLDOWN_SECONDS: 60,
} as const

// Validation constants
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 50,
  OTP_REGEX: /^\d{6}$/,
} as const
