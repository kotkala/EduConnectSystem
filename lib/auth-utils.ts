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

  // Use environment variable for consistent URLs
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
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

// Create user profile (client-side)
export async function createUserProfileClient(profileData: { full_name: string; role: string }) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('No authenticated user found')
  }

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

  if (error) {
    throw new Error(error.message)
  }

  return data
}

// Update user profile (client-side)
export async function updateUserProfileClient(userId: string, updates: Partial<{ full_name: string; role: string; avatar_url: string }>) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

// Upload avatar to storage (client-side)
export async function uploadAvatarClient(file: File, userId: string) {
  const supabase = createClient()

  const fileExt = file.name.split('.').pop()
  const filePath = `${userId}-${Math.random()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file)

  if (error) {
    throw new Error(error.message)
  }

  return data.path
}

// Get avatar public URL (client-side)
export async function getAvatarUrlClient(path: string) {
  const supabase = createClient()

  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(path)

  return data.publicUrl
}
