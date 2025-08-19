'use server'

import { createClient } from '@/utils/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

// Common types for permission checking
export interface UserWithProfile {
  user: {
    id: string
    email?: string
  }
  profile: {
    role: string
    homeroom_enabled?: boolean
  }
}

export interface PermissionResult {
  userId: string
  user?: {
    id: string
    email?: string
  }
  profile?: {
    role: string
    homeroom_enabled?: boolean
  }
  supabase?: SupabaseClient
}

// Base permission checking function - eliminates duplication
async function checkUserPermissions(requiredRole: string, additionalChecks?: (profile: { role: string; homeroom_enabled?: boolean }) => boolean): Promise<UserWithProfile> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error("Authentication required")
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, homeroom_enabled')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== requiredRole) {
    throw new Error(`${requiredRole.charAt(0).toUpperCase() + requiredRole.slice(1)} access required`)
  }

  // Run additional checks if provided
  if (additionalChecks && !additionalChecks(profile)) {
    throw new Error("Additional permission requirements not met")
  }

  return { user, profile }
}

// Specific permission checking functions using the base function
export async function checkAdminPermissions(): Promise<PermissionResult> {
  const { user, profile } = await checkUserPermissions('admin')
  const supabase = await createClient()
  return { userId: user.id, user, profile, supabase }
}

export async function checkParentPermissions(): Promise<PermissionResult> {
  const { user, profile } = await checkUserPermissions('parent')
  return { userId: user.id, user, profile }
}

export async function checkTeacherPermissions(): Promise<PermissionResult> {
  const { user, profile } = await checkUserPermissions('teacher')
  return { userId: user.id, user, profile }
}

// Specialized permission checking for specific use cases
export async function checkStudentPermissions(): Promise<PermissionResult> {
  const { user, profile } = await checkUserPermissions('student')
  return { userId: user.id, user, profile }
}

export async function checkHomeroomTeacherPermissions(): Promise<PermissionResult> {
  const { user, profile } = await checkUserPermissions('teacher')

  // Additional check to ensure teacher has homeroom class
  const supabase = await createClient()
  const { data: homeroomClass } = await supabase
    .from('classes')
    .select('id')
    .eq('homeroom_teacher_id', user.id)
    .eq('is_active', true)
    .single()

  if (!homeroomClass) {
    throw new Error("Homeroom teacher access required")
  }

  return { userId: user.id, user, profile }
}

// Helper function to check if user has homeroom class access
export async function checkHomeroomClassAccess(userId: string, classId?: string): Promise<{ classId: string; className: string }> {
  const supabase = await createClient()
  
  let query = supabase
    .from('classes')
    .select('id, name')
    .eq('homeroom_teacher_id', userId)
    .eq('is_active', true)

  if (classId) {
    query = query.eq('id', classId)
  }

  const { data: homeroomClass } = await query.single()

  if (!homeroomClass) {
    throw new Error("Homeroom teacher access required for this class")
  }

  return { classId: homeroomClass.id, className: homeroomClass.name }
}

// Helper function to check parent-student relationship
export async function checkParentStudentAccess(parentId: string, studentId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data: relationship, error } = await supabase
    .from('parent_student_relationships')
    .select('id')
    .eq('parent_id', parentId)
    .eq('student_id', studentId)
    .single()

  if (error || !relationship) {
    throw new Error("You do not have access to this student's information")
  }

  return true
}
