'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'
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
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          await handleUserSession(session.user)
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes using consolidated auth
    const { data: { subscription } } = clientAuth.onAuthStateChange(
      async (user) => {
        if (user) {
          await handleUserSession(user)
        } else {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleUserSession = async (authUser: User) => {
    try {
      setError(null)
      const userProfile = await clientAuth.getUserProfile(authUser.id)

      const enhancedUser: AuthUser = {
        ...authUser,
        profile: userProfile || undefined,
      }

      setUser(enhancedUser)
      setProfile(userProfile)
    } catch (err: any) {
      console.error('Error fetching user profile:', err)
      setError(err.message)
      // Still set the user even if profile fetch fails
      setUser(authUser as AuthUser)
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
    } catch (err: any) {
      setError(err.message)
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
    } catch (err: any) {
      setError(err.message)
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
    } catch (err: any) {
      setError(err.message)
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
