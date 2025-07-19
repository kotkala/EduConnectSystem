/**
 * Database operations and queries
 */

import { createClient as createServerClient } from './supabase/server'
import { createClient as createBrowserClient } from './supabase/client'
import type { Profile, AuthUser } from './types'

// Server-side database operations
export class DatabaseServer {
  private async getClient() {
    return await createServerClient()
  }

  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const supabase = await this.getClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getProfile:', error)
      return null
    }
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    try {
      const supabase = await this.getClient()
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in updateProfile:', error)
      return null
    }
  }

  async createProfile(user: AuthUser): Promise<Profile | null> {
    try {
      const supabase = await this.getClient()
      const profile: Omit<Profile, 'created_at' | 'updated_at'> = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || undefined,
        avatar_url: user.user_metadata?.avatar_url || undefined,
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert(profile)
        .select()
        .single()

      if (error) {
        console.error('Error creating profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in createProfile:', error)
      return null
    }
  }

  async deleteProfile(userId: string): Promise<boolean> {
    try {
      const supabase = await this.getClient()
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) {
        console.error('Error deleting profile:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteProfile:', error)
      return false
    }
  }
}

// Client-side database operations
export class DatabaseClient {
  private supabase = createBrowserClient()

  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in getProfile:', error)
      return null
    }
  }

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error in updateProfile:', error)
      return null
    }
  }

  // Real-time subscriptions
  subscribeToProfile(userId: string, callback: (profile: Profile | null) => void) {
    return this.supabase
      .channel(`profile:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Profile)
        }
      )
      .subscribe()
  }

  // File upload operations
  async uploadAvatar(userId: string, file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await this.supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError)
        return null
      }

      const { data } = this.supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Error in uploadAvatar:', error)
      return null
    }
  }

  async deleteAvatar(filePath: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from('avatars')
        .remove([filePath])

      if (error) {
        console.error('Error deleting avatar:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error in deleteAvatar:', error)
      return false
    }
  }
}

// Create singleton instances
export const databaseServer = new DatabaseServer()
export const databaseClient = new DatabaseClient()

// Helper functions
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function getAvatarFallback(name?: string): string {
  if (!name) return 'U'
  
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
