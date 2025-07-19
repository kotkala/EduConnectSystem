/**
 * Client-side authentication utilities only
 */

import { createClient } from './supabase/client'
import { ROUTES, ERROR_MESSAGES } from './constants'
import type { AuthUser } from './types'
import type { EmailOnlyFormData, OtpVerificationFormData } from './validations'

// Client-side auth utilities
export class AuthClient {
  private supabase = createClient()

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
