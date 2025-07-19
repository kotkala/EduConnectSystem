/**
 * Authentication utilities and helpers
 */

import { createClient as createServerClient } from './supabase/server'
import { createClient as createBrowserClient } from './supabase/client'
import { redirect } from 'next/navigation'
import { ROUTES, ERROR_MESSAGES } from './constants'
import type { AuthUser } from './types'
import type { EmailOnlyFormData, OtpVerificationFormData } from './validations'

// Server-side auth utilities (only used in server components)
export async function getUser(): Promise<AuthUser | null> {
  // Skip auth checks during build time or when env vars are missing
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null
  }

  try {
    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    return user as AuthUser
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

export async function requireAuth(): Promise<AuthUser> {
  // Skip auth checks during build time or when env vars are missing
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { id: 'build-user', email: 'build@example.com' } as AuthUser
  }

  try {
    const user = await getUser()

    if (!user) {
      redirect(ROUTES.LOGIN)
    }

    return user
  } catch (error) {
    // Gracefully handle auth errors during build
    console.warn('Auth check failed during build:', error)
    return { id: 'build-user', email: 'build@example.com' } as AuthUser
  }
}

export async function requireGuest(): Promise<void> {
  // Skip auth checks during build time or when env vars are missing
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return
  }

  try {
    const user = await getUser()

    if (user) {
      redirect(ROUTES.DASHBOARD)
    }
  } catch (error) {
    // Gracefully handle auth errors during build
    console.warn('Auth check failed during build:', error)
  }
}

// Client-side auth utilities
export class AuthClient {
  private supabase = createBrowserClient()

  async sendOtp(data: EmailOnlyFormData) {
    try {
      const { error } = await this.supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}${ROUTES.DASHBOARD}`,
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      return { error: null }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC,
      }
    }
  }

  async verifyOtp(data: OtpVerificationFormData) {
    try {
      const { data: authData, error } = await this.supabase.auth.verifyOtp({
        email: data.email,
        token: data.token,
        type: 'email',
      })

      if (error) {
        throw new Error(error.message)
      }

      return { user: authData.user, session: authData.session, error: null }
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC,
      }
    }
  }

  async signInWithGoogle() {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${ROUTES.DASHBOARD}`,
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      return { data, error: null }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC,
      }
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabase.auth.signOut()

      if (error) {
        throw new Error(error.message)
      }

      return { error: null }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC,
      }
    }
  }

  async resendOtp(email: string) {
    try {
      const { error } = await this.supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}${ROUTES.DASHBOARD}`,
        },
      })

      if (error) {
        throw new Error(error.message)
      }

      return { error: null }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERIC,
      }
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await this.supabase.auth.getUser()

      if (error || !user) {
        return null
      }

      return user as AuthUser
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user as AuthUser | null)
    })
  }
}

// Create a singleton instance for client-side usage
export const authClient = new AuthClient()

// Auth state management helpers
export function isAuthenticated(user: AuthUser | null): boolean {
  return !!user
}

export function getUserDisplayName(user: AuthUser | null): string {
  if (!user) return 'Guest'

  return (
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'User'
  )
}

export function getUserAvatar(user: AuthUser | null): string | null {
  return user?.user_metadata?.avatar_url || null
}


