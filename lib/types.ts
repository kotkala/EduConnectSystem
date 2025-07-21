import { User } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent'

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

export interface OTPFormData {
  email: string
  token: string
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
