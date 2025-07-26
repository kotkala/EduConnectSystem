import { User } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent'

export type SubjectCategory = 'core' | 'specialized'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface AuthUser extends User {
  profile?: UserProfile
}

export interface AuthState {
  user: AuthUser | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
}

// Form data types for authentication
export interface EmailOnlyFormData {
  email: string
}

export interface OtpVerificationFormData {
  email: string
  token: string
}

// Legacy OTP form data (for backward compatibility)
export interface OTPFormData {
  email: string
  token: string
}

// Profile setup form data
export interface ProfileSetupFormData {
  full_name: string
  role: UserRole
}

// Authentication response types
export interface AuthResponse {
  user: AuthUser | null
  session: Session | null
  error: string | null
}

// Session type from Supabase
export interface Session {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at?: number
  token_type: string
  user: User
}

export interface AuthContextType {
  user: AuthUser | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
  signInWithOTP: (email: string) => Promise<void>
  verifyOTP: (data: OTPFormData) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (data: Partial<UserProfile>) => Promise<void>
}

// Subject management types
export interface Subject {
  id: string
  code: string
  name_vietnamese: string
  name_english: string
  category: SubjectCategory
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}
