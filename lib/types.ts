/**
 * Global type definitions for the EduConnect application
 */

import { User } from '@supabase/supabase-js'

// Auth Types
export type AuthUser = User

export interface AuthState {
  user: AuthUser | null
  loading: boolean
  error: string | null
}

// Form Types
export interface EmailOnlyFormData {
  email: string
}

export interface OtpVerificationFormData {
  email: string
  token: string
}

export interface ResendOtpFormData {
  email: string
}

export interface OtpResponse {
  user: AuthUser | null
  session: any | null
  error: string | null
}

// Component Props
export interface AuthFormProps {
  className?: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

// API Response Types
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}

// Database Types (extend as needed)
export interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

// UI Types
export interface NavItem {
  title: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  disabled?: boolean
}

export interface SidebarNavItem extends NavItem {
  items?: SidebarNavItem[]
}

// Environment Types
export interface EnvConfig {
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY?: string
}

// Error Types
export interface AppError {
  message: string
  code?: string
  details?: unknown
}

// Utility Types
export type WithClassName<T = object> = T & {
  className?: string
}

export type WithChildren<T = object> = T & {
  children: React.ReactNode
}

export type PageProps<T = object> = T & {
  params: { [key: string]: string }
  searchParams: { [key: string]: string | string[] | undefined }
}
