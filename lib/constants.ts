/**
 * Application constants and configuration
 */

// App Configuration
export const APP_CONFIG = {
  name: 'EduConnect',
  description: 'EduConnect: Xác thực hiện đại, bảo mật, mở rộng với Supabase và Next.js. Starter sạch, production-ready.',
  url: process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000',
} as const

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  OTP_VERIFY: '/otp-verify',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  PROTECTED: '/protected',
} as const

// Auth Routes (for middleware)
export const AUTH_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.OTP_VERIFY,
] as const

// Protected Routes (require authentication)
export const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.PROFILE,
  ROUTES.SETTINGS,
  ROUTES.PROTECTED,
] as const

// Public Routes (accessible without authentication)
export const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ...AUTH_ROUTES,
] as const

// API Routes
export const API_ROUTES = {
  AUTH: {
    OTP_SEND: '/api/auth/otp-send',
    OTP_VERIFY: '/api/auth/otp-verify',
    OTP_RESEND: '/api/auth/otp-resend',
    OAUTH_GOOGLE: '/api/auth/oauth-google',
    LOGOUT: '/api/auth/logout',
    CONFIRM: '/api/auth/confirm',
  },
  USER: {
    PROFILE: '/api/user/profile',
    UPDATE: '/api/user/update',
  },
  HEALTH: '/api/health',
} as const

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'An unexpected error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to access this resource.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  AUTH: {
    INVALID_OTP: 'Invalid OTP code. Please try again.',
    OTP_EXPIRED: 'OTP code has expired. Please request a new one.',
    EMAIL_NOT_CONFIRMED: 'Please check your email and confirm your account.',
    EMAIL_REQUIRED: 'Email is required.',
    OTP_REQUIRED: 'OTP code is required.',
    OTP_INVALID_FORMAT: 'OTP must be 6 digits.',
    OAUTH_ERROR: 'OAuth authentication failed. Please try again.',
  },
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
  AUTH: {
    LOGIN: 'Successfully logged in!',
    LOGOUT: 'Successfully logged out!',
    OTP_SENT: 'OTP code sent to your email!',
    OTP_VERIFIED: 'OTP verified successfully!',
    OTP_RESENT: 'New OTP code sent to your email!',
    OAUTH_SUCCESS: 'Successfully authenticated with Google!',
  },
  PROFILE: {
    UPDATE: 'Profile updated successfully!',
  },
} as const

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MAX_LENGTH: 254,
  },
  OTP: {
    LENGTH: 6,
    PATTERN: /^\d{6}$/,
    EXPIRY_MINUTES: 10,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
} as const

// UI Constants
export const UI_CONFIG = {
  MOBILE_BREAKPOINT: 768,
  SIDEBAR_WIDTH: 240,
  HEADER_HEIGHT: 64,
  FOOTER_HEIGHT: 80,
} as const

// Theme Configuration
export const THEME_CONFIG = {
  DEFAULT: 'system',
  OPTIONS: ['light', 'dark', 'system'] as const,
} as const

// Environment Check
export const ENV_VARS = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
} as const

export const hasEnvVars = !!(ENV_VARS.SUPABASE_URL && ENV_VARS.SUPABASE_ANON_KEY)

// Route protection helpers
export function isPublicRoute(pathname: string): boolean {
  return pathname === '/' ||
         pathname.startsWith('/login') ||
         pathname.startsWith('/otp-verify') ||
         pathname.startsWith('/auth/') ||
         pathname.startsWith('/api/')
}

export function isProtectedRoute(pathname: string): boolean {
  return pathname.startsWith('/dashboard') ||
         pathname.startsWith('/profile') ||
         pathname.startsWith('/settings') ||
         pathname.startsWith('/protected')
}
