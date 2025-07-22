'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { EmailOnlyFormData, OtpVerificationFormData } from './validations'

/**
 * Server Actions for authentication following Context7 patterns
 * Direct Supabase client usage without wrapper classes
 */

export async function sendOtpAction(formData: EmailOnlyFormData) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithOtp({
    email: formData.email,
    options: {
      shouldCreateUser: true,
      // No emailRedirectTo = direct OTP authentication
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

export async function verifyOtpAction(formData: OtpVerificationFormData) {
  const supabase = await createClient()

  const { data: authData, error } = await supabase.auth.verifyOtp({
    email: formData.email,
    token: formData.token,
    type: 'email',
  })

  if (error) {
    return { error: error.message, redirectTo: null }
  }

  // Check if user has complete profile
  if (authData.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profile && profile.role && profile.full_name) {
      return { error: null, redirectTo: '/dashboard' }
    } else {
      return { error: null, redirectTo: '/profile/setup' }
    }
  }

  return { error: null, redirectTo: '/dashboard' }
}

export async function signInWithGoogleAction() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }

  return { error: null }
}

export async function signOutAction() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/auth/login')
}

export async function resendOtpAction(email: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      shouldCreateUser: false, // Don't create new user on resend
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

// Profile management Server Actions
export async function getUserProfileAction(userId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    return { profile: null, error: error.message }
  }

  return { profile: data, error: null }
}

export async function createUserProfileAction(profile: {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'admin' | 'teacher' | 'student' | 'parent'
}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile, {
      onConflict: 'id',
      ignoreDuplicates: false
    })
    .select()
    .single()

  if (error) {
    return { profile: null, error: error.message }
  }

  revalidatePath('/dashboard')
  return { profile: data, error: null }
}

export async function updateUserProfileAction(userId: string, updates: {
  full_name?: string
  avatar_url?: string
  role?: 'admin' | 'teacher' | 'student' | 'parent'
}) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    return { profile: null, error: error.message }
  }

  revalidatePath('/dashboard')
  return { profile: data, error: null }
}
