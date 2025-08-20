'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/shared/utils/supabase/client'
import { clientAuth } from '@/lib/auth'
import { UserProfile, AuthUser } from '@/lib/types'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.warn('Session error:', sessionError)
          setError(null) // Don't show session errors to user
          return
        }

        if (session?.user) {
          await handleUserSession(session.user)
        } else {
          // No session found - this is normal for logged out users
          setLoading(false)
        }
      } catch (err: unknown) {
        // Only log critical errors, don't show to user unless it's severe
        console.error('Critical session error:', err)
        const errorMessage = err instanceof Error ? err.message : 'Authentication system error'
        setError(errorMessage)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes using consolidated auth
    const { data: { subscription } } = clientAuth.onAuthStateChange(
      async (user) => {
        try {
          if (user) {
            await handleUserSession(user)
          } else {
            setUser(null)
            setProfile(null)
            setError(null) // Clear any previous errors on logout
            setLoading(false)
          }
        } catch (err: unknown) {
          console.error('Auth state change error:', err)
          // Don't set loading to false here - let handleUserSession handle it
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleUserSession = async (authUser: User) => {
    try {
      setError(null)
      setLoading(true)

      // Safely fetch user profile with proper error handling
      let userProfile = null
      try {
        userProfile = await clientAuth.getUserProfile(authUser.id)
      } catch (profileError) {
        // Log profile fetch error but don't throw - this is not critical
        console.warn('Could not fetch user profile:', profileError)
        // Don't set error state for profile fetch failures as user can still use the app
      }

      const enhancedUser: AuthUser = {
        ...authUser,
        profile: userProfile || undefined,
      }

      setUser(enhancedUser)
      setProfile(userProfile)
    } catch (err: unknown) {
      // Only set error for critical authentication failures
      const errorMessage = err instanceof Error ? err.message : 'Authentication error occurred'
      console.error('Critical authentication error:', err)
      setError(errorMessage)

      // Still set the user even if profile fetch fails - user can still access the app
      setUser(authUser as AuthUser)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      await clientAuth.signOut()
      setUser(null)
      setProfile(null)
      // Redirect to home page after sign out
      window.location.href = '/'
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Sign out failed'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return

    try {
      setLoading(true)
      // Filter out undefined values and include supported fields (null is allowed for avatar_url)
      const filteredUpdates: {
        full_name?: string | null
        avatar_url?: string | null
        role?: 'admin' | 'teacher' | 'student' | 'parent'
      } = {}

      if (updates.full_name !== undefined) {
        filteredUpdates.full_name = updates.full_name
      }
      if (updates.avatar_url !== undefined) {
        filteredUpdates.avatar_url = updates.avatar_url
      }
      if (updates.role !== undefined) {
        filteredUpdates.role = updates.role
      }

      const updatedProfile = await clientAuth.updateUserProfile(user.id, filteredUpdates)
      setProfile(updatedProfile)
      // Update user object with new profile
      setUser(prev => prev ? { ...prev, profile: updatedProfile } : null)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Profile update failed'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (!user) return

    try {
      const userProfile = await clientAuth.getUserProfile(user.id)
      setProfile(userProfile)
      setUser(prev => prev ? { ...prev, profile: userProfile || undefined } : null)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Profile refresh failed'
      setError(errorMessage)
    }
  }

  return {
    user,
    profile,
    loading,
    error,
    signOut,
    updateProfile,
    refreshProfile,
    isAuthenticated: !!user,
    hasProfile: !!profile,
  }
}
