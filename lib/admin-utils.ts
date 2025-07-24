'use server'

import { createClient } from '@/utils/supabase/server'

export type AdminType = 'admin' | 'school_admin' | null

export interface AdminProfile {
  id: string
  role: string
  admin_type: AdminType
  full_name: string | null
  email: string
}

/**
 * Get admin profile with admin_type information
 */
export async function getAdminProfile(userId: string): Promise<AdminProfile | null> {
  const supabase = await createClient()
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, role, admin_type, full_name, email')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    return null
  }

  return profile as AdminProfile
}

/**
 * Check if user has admin permissions (either admin or school_admin)
 */
export async function checkAdminPermissions(): Promise<{ userId: string; adminType: AdminType }> {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error("Authentication required")
  }

  const profile = await getAdminProfile(user.id)
  
  if (!profile || profile.role !== 'admin') {
    throw new Error("Admin permissions required")
  }

  return { userId: user.id, adminType: profile.admin_type }
}

/**
 * Check if user has specific admin type permissions
 */
export async function checkAdminTypePermissions(requiredType: 'admin' | 'school_admin'): Promise<{ userId: string; adminType: AdminType }> {
  const { userId, adminType } = await checkAdminPermissions()
  
  // If admin_type is null, allow full access (backwards compatibility)
  if (adminType === null) {
    return { userId, adminType }
  }
  
  // Check specific admin type
  if (adminType !== requiredType) {
    throw new Error(`${requiredType === 'admin' ? 'User Management' : 'School'} admin permissions required`)
  }

  return { userId, adminType }
}

/**
 * Check if user can access user management functions
 */
export async function checkUserManagementPermissions(): Promise<{ userId: string; adminType: AdminType }> {
  const { userId, adminType } = await checkAdminPermissions()
  
  // If admin_type is null or 'admin', allow access
  if (adminType === null || adminType === 'admin') {
    return { userId, adminType }
  }
  
  throw new Error("User management permissions required")
}

/**
 * Check if user can access school admin functions
 */
export async function checkSchoolAdminPermissions(): Promise<{ userId: string; adminType: AdminType }> {
  const { userId, adminType } = await checkAdminPermissions()
  
  // If admin_type is null or 'school_admin', allow access
  if (adminType === null || adminType === 'school_admin') {
    return { userId, adminType }
  }
  
  throw new Error("School admin permissions required")
}

/**
 * Get navigation items based on admin type
 */
export function getAdminNavigationItems(adminType: AdminType) {
  // Full access for null (backwards compatibility)
  if (adminType === null) {
    return {
      userManagement: true,
      schoolAdmin: true
    }
  }
  
  return {
    userManagement: adminType === 'admin',
    schoolAdmin: adminType === 'school_admin'
  }
}

/**
 * Get admin dashboard title based on admin type
 */
export function getAdminDashboardTitle(adminType: AdminType): string {
  if (adminType === 'admin') {
    return 'User Management Dashboard'
  }
  if (adminType === 'school_admin') {
    return 'School Admin Dashboard'
  }
  return 'Admin Dashboard' // null case
}

/**
 * Get admin role display name
 */
export function getAdminRoleDisplayName(adminType: AdminType): string {
  if (adminType === 'admin') {
    return 'Admin'
  }
  if (adminType === 'school_admin') {
    return 'School Admin'
  }
  return 'Administrator' // null case
}
