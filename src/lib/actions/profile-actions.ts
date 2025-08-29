'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface UpdateProfileData {
  full_name?: string
  phone_number?: string
  gender?: string
  date_of_birth?: string
  address?: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// Update user profile
export async function updateProfileAction(data: UpdateProfileData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Yêu cầu xác thực")
    }

    // Update profile in database
    const { error } = await supabase
      .from('profiles')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/profile')
    return { success: true }
  } catch (error: unknown) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' 
    }
  }
}

// Change password
export async function changePasswordAction(data: ChangePasswordData): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Yêu cầu xác thực")
    }

    // Validate passwords match
    if (data.newPassword !== data.confirmPassword) {
      throw new Error("Mật khẩu xác nhận không khớp")
    }

    // Validate password strength
    if (data.newPassword.length < 6) {
      throw new Error("Mật khẩu phải có ít nhất 6 ký tự")
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: data.newPassword
    })

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  } catch (error: unknown) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' 
    }
  }
}

// Get user sessions
export async function getUserSessionsAction(): Promise<{ success: boolean; data?: unknown[]; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Yêu cầu xác thực")
    }

    // Note: Supabase doesn't provide session management API in the client
    // This would typically require admin API access
    // For now, return current session info
    const currentSession = {
      id: 'current',
      device: 'Current Device',
      location: 'Unknown',
      last_active: new Date().toISOString(),
      is_current: true
    }

    return { success: true, data: [currentSession] }
  } catch (error: unknown) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' 
    }
  }
}

// Export user data
export async function exportUserDataAction(): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error("Yêu cầu xác thực")
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      throw new Error(profileError.message)
    }

    // Prepare export data
    const exportData = {
      user_info: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      profile: profile,
      export_date: new Date().toISOString()
    }

    return { success: true, data: exportData }
  } catch (error: unknown) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Đã xảy ra lỗi không mong muốn' 
    }
  }
}
