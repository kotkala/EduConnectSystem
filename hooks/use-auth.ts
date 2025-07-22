'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/client'
import { getUserProfile, onAuthStateChange } from '@/lib/auth-utils'
import { signOutAction, updateUserProfileAction } from '@/lib/auth-actions'
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
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes using simplified utility
    const { data: { subscription } } = onAuthStateChange(
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
      const userProfile = await getUserProfile(authUser.id)

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
      const result = await signOutAction()
      if (result.error) {
        setError(result.error)
      } else {
        setUser(null)
        setProfile(null)
      }
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
      // Filter out null values and only include supported fields
      const filteredUpdates: {
        full_name?: string
        avatar_url?: string
        role?: 'admin' | 'teacher' | 'student' | 'parent'
      } = {}

      if (updates.full_name !== null && updates.full_name !== undefined) {
        filteredUpdates.full_name = updates.full_name
      }
      if (updates.avatar_url !== null && updates.avatar_url !== undefined) {
        filteredUpdates.avatar_url = updates.avatar_url
      }
      if (updates.role !== undefined) {
        filteredUpdates.role = updates.role
      }

      const result = await updateUserProfileAction(user.id, filteredUpdates)
      if (result.error) {
        setError(result.error)
        throw new Error(result.error)
      } else if (result.profile) {
        setProfile(result.profile)
        // Update user object with new profile
        setUser(prev => prev ? { ...prev, profile: result.profile } : null)
      }
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
      const userProfile = await getUserProfile(user.id)
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
