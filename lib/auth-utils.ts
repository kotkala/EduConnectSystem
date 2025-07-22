'use client'

import { createClient } from '@/utils/supabase/client'
import type { AuthUser } from './types'

/**
 * Simple client-side auth utilities following Context7 patterns
 * Direct Supabase client usage without wrapper classes
 */

// Get current user (client-side only)
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = createClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user as AuthUser
}

// Auth state change listener
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  const supabase = createClient()
  
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user as AuthUser | null)
  })
}

// Client-side profile operations (for real-time updates)
export async function getUserProfile(userId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

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

// Client-side OTP operations (for components that need immediate feedback)
export async function sendOtpClient(email: string) {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      shouldCreateUser: true,
    },
  })

  if (error) {
    throw new Error(error.message)
  }
}

export async function verifyOtpClient(email: string, token: string) {
  const supabase = createClient()
  
  const { data: authData, error } = await supabase.auth.verifyOtp({
    email: email,
    token: token,
    type: 'email',
  })

  if (error) {
    throw new Error(error.message)
  }

  return { user: authData.user, session: authData.session }
}

export async function signInWithGoogleClient() {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function signOutClient() {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    throw new Error(error.message)
  }
}
