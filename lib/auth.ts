import { createClient } from '@/utils/supabase/client'
import { UserProfile, OTPFormData } from './types'

export class AuthService {
  private supabase = createClient()

  async signInWithOTP(email: string) {
    const { error } = await this.supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        // Remove emailRedirectTo to get OTP code instead of magic link
      },
    })

    if (error) throw error
  }

  async verifyOTP(data: OTPFormData) {
    const { error } = await this.supabase.auth.verifyOtp({
      email: data.email,
      token: data.token,
      type: 'email',
    })
    
    if (error) throw error
  }

  async signInWithGoogle() {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/profile/setup`,
      },
    })

    if (error) throw error
    return data
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut()
    if (error) throw error
  }

  async getCurrentUser() {
    const { data: { user }, error } = await this.supabase.auth.getUser()
    if (error) throw error
    return user
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async createUserProfile(profile: Omit<UserProfile, 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    const { data, error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  onAuthStateChange(callback: (user: unknown) => void) {
    return this.supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null)
    })
  }
}

export const authService = new AuthService()
