/**
 * Consolidated Authentication Module
 * Following Context7 Supabase SSR patterns and user preference for simple architecture
 * Single responsibility: Handle all auth operations with proper server/client separation
 */

import { createClient as createBrowserClient } from '@/shared/utils/supabase/client'
import type { AuthUser } from './types'

// Note: Server auth operations moved to separate server-only file
// Import from '@/lib/auth-server' for server-side operations

export const clientAuth = {
  async getUser(): Promise<AuthUser | null> {
    const supabase = createBrowserClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) return null
    return user as AuthUser
  },

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    const supabase = createBrowserClient()
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user as AuthUser | null)
    })
  },

  async sendOtp(email: string) {
    const supabase = createBrowserClient()
    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: { shouldCreateUser: true },
    })
    if (error) throw new Error(error.message)
  },

  async verifyOtp(email: string, token: string) {
    const supabase = createBrowserClient()
    const { data: authData, error } = await supabase.auth.verifyOtp({
      email: email,
      token: token,
      type: 'email',
    })
    if (error) throw new Error(error.message)
    return { user: authData.user, session: authData.session }
  },

  async signInWithGoogle() {
    const supabase = createBrowserClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${siteUrl}/auth/callback` },
    })
    if (error) throw new Error(error.message)
    return data
  },

  async signOut() {
    const supabase = createBrowserClient()
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(error.message)
  },

  async getUserProfile(userId: string) {
    try {
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // PGRST116 = No rows returned (user has no profile yet)
      if (error && error.code !== 'PGRST116') {
        console.warn('Profile fetch error:', error.message)
        return null
      }

      return data
    } catch (err: unknown) {
      // Handle any unexpected errors (network, etc.)
      console.warn('Unexpected error fetching user profile:', err)
      return null
    }
  },

  async createUserProfile(profileData: { full_name: string; role: string }) {
    const supabase = createBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('No authenticated user found')

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email!,
        full_name: profileData.full_name,
        role: profileData.role,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data
  },

  async updateUserProfile(userId: string, updates: Partial<{
    full_name: string | null;
    role: string;
    avatar_url: string | null;
    phone_number: string | null;
    gender: string | null;
    date_of_birth: string | null;
    address: string | null;
  }>) {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()

    if (error) throw new Error(error.message)

    // Return the first item if data exists, otherwise fetch the updated profile
    if (data && data.length > 0) {
      return data[0]
    }

    // Fallback: fetch the updated profile
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select()
      .eq('id', userId)
      .single()

    if (fetchError) throw new Error(fetchError.message)
    return profile
  }
}

// Utility functions (isomorphic - work on both server and client)
export const authUtils = {
  isAuthenticated(user: AuthUser | null): boolean {
    return !!user
  },

  getUserDisplayName(user: AuthUser | null): string {
    if (!user) return 'Guest'
    return (
      user.user_metadata?.full_name ||
      user.email?.split('@')[0] ||
      'User'
    )
  },

  getUserAvatar(user: AuthUser | null): string | null {
    return user?.user_metadata?.avatar_url || null
  }
}

// Export for backward compatibility (will be removed in cleanup phase)
export const getCurrentUser = clientAuth.getUser
export const onAuthStateChange = clientAuth.onAuthStateChange
export const isAuthenticated = authUtils.isAuthenticated
export const getUserDisplayName = authUtils.getUserDisplayName
export const getUserAvatar = authUtils.getUserAvatar
