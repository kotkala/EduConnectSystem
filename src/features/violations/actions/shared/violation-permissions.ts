'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Check if user is authenticated (for reference data access)
 * @returns {Promise<{userId: string, supabase: any}>} User ID and Supabase client
 * @throws {Error} If user is not authenticated
 */
export async function checkAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  console.log('🔍 checkAuthenticatedUser - User:', user?.id, user?.email)
  console.log('🔍 checkAuthenticatedUser - Auth Error:', authError)

  if (!user) {
    throw new Error("Yêu cầu xác thực")
  }

  return { userId: user.id, supabase }
}

/**
 * Check if user has admin permissions
 * @returns {Promise<{userId: string, supabase: any}>} User ID and Supabase client
 * @throws {Error} If user is not authenticated or not admin
 */
export async function checkAdminPermissions() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  console.log('🔍 checkAdminPermissions - User:', user?.id, user?.email)
  console.log('🔍 checkAdminPermissions - Auth Error:', authError)

  if (!user) {
    throw new Error("Yêu cầu xác thực")
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  console.log('🔍 checkAdminPermissions - Profile:', profile)
  console.log('🔍 checkAdminPermissions - Profile Error:', profileError)

  if (!profile || profile.role !== 'admin') {
    throw new Error("Yêu cầu quyền quản trị")
  }

  return { userId: user.id, supabase }
}

/**
 * Check if user has homeroom teacher permissions
 * @returns {Promise<{userId: string, homeroomClass: any, supabase: any}>} User info and homeroom class
 * @throws {Error} If user is not authenticated or not homeroom teacher
 */
export async function checkHomeroomTeacherPermissions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Yêu cầu xác thực")
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'teacher') {
    throw new Error("Yêu cầu quyền giáo viên")
  }

  // Get homeroom class assignment
  const { data: homeroomClass, error: homeroomError } = await supabase
    .from('teacher_class_assignments')
    .select(`
      class_id,
      classes!inner(
        id,
        name,
        academic_year:academic_years!inner(name, is_current),
        semester:semesters!inner(name, is_current)
      )
    `)
    .eq('teacher_id', user.id)
    .eq('is_homeroom_teacher', true)
    .eq('classes.academic_years.is_current', true)
    .eq('classes.semesters.is_current', true)
    .single()

  if (homeroomError || !homeroomClass) {
    throw new Error("Không tìm thấy lớp chủ nhiệm")
  }

  return { 
    userId: user.id, 
    homeroomClass: homeroomClass.classes,
    supabase 
  }
}

/**
 * Check if user has teacher permissions (any teacher, not just homeroom)
 * @returns {Promise<{userId: string, supabase: any}>} User ID and Supabase client
 * @throws {Error} If user is not authenticated or not teacher
 */
export async function checkTeacherPermissions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Yêu cầu xác thực")
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'teacher') {
    throw new Error("Yêu cầu quyền giáo viên")
  }

  return { userId: user.id, supabase }
}

/**
 * Check if user has parent permissions
 * @returns {Promise<{userId: string, supabase: any}>} User ID and Supabase client
 * @throws {Error} If user is not authenticated or not parent
 */
export async function checkParentPermissions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Yêu cầu xác thực")
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'parent') {
    throw new Error("Yêu cầu quyền phụ huynh")
  }

  return { userId: user.id, supabase }
}

/**
 * Check if user has admin or teacher permissions
 * @returns {Promise<{userId: string, role: string, supabase: any}>} User info
 * @throws {Error} If user is not authenticated or not admin/teacher
 */
export async function checkAdminOrTeacherPermissions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Yêu cầu xác thực")
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'teacher'].includes(profile.role)) {
    throw new Error("Yêu cầu quyền quản trị hoặc giáo viên")
  }

  return { userId: user.id, role: profile.role, supabase }
}
