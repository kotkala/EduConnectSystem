/**
 * Server-Only Authentication Module
 * Following Context7 Supabase SSR patterns
 * Only for Server Components and API routes
 */

import 'server-only'
import { createClient } from '@/utils/supabase/server'
import type { AuthUser } from './types'

// Server-side auth operations (for Server Components and API routes)
export const serverAuth = {
  async getUser(): Promise<AuthUser | null> {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) return null
    return user as AuthUser
  },

  async getUserProfile(userId: string) {
    const supabase = await createClient()
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
  },

  async createUserProfile(profileData: { full_name: string; role: string }) {
    const supabase = await createClient()
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
  }
}
