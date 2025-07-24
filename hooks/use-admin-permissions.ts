'use client'

import { useAuth } from './use-auth'
import { type AdminType } from '@/lib/admin-utils'

export function useAdminPermissions() {
  const { user, profile, loading } = useAuth()
  
  const adminType: AdminType = profile?.admin_type || null
  const isAdmin = profile?.role === 'admin'
  
  // Permission checks
  const canManageUsers = isAdmin && (adminType === null || adminType === 'admin')
  const canManageSchool = isAdmin && (adminType === null || adminType === 'school_admin')
  const hasFullAccess = isAdmin && adminType === null
  
  // Navigation permissions
  const permissions = {
    // User management
    users: canManageUsers,
    
    // School administration
    academic: canManageSchool,
    classes: canManageSchool,
    subjects: canManageSchool,
    classrooms: canManageSchool,
    timetable: canManageSchool,
    teacherAssignments: canManageSchool,
    
    // Shared
    analytics: isAdmin,
    settings: isAdmin,
    dashboard: isAdmin
  }
  
  // Helper functions
  const getAdminTypeDisplay = (): string => {
    if (adminType === 'admin') return 'User Management Admin'
    if (adminType === 'school_admin') return 'School Admin'
    return 'Administrator'
  }
  
  const getDashboardTitle = (): string => {
    if (adminType === 'admin') return 'User Management Dashboard'
    if (adminType === 'school_admin') return 'School Admin Dashboard'
    return 'Admin Dashboard'
  }
  
  return {
    user,
    profile,
    loading,
    adminType,
    isAdmin,
    canManageUsers,
    canManageSchool,
    hasFullAccess,
    permissions,
    getAdminTypeDisplay,
    getDashboardTitle
  }
}
