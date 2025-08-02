import type { NotificationPageConfig } from './shared-notifications-page'

// Configuration constants for different notification page roles
export const NOTIFICATION_CONFIGS: Record<string, NotificationPageConfig> = {
  parent: {
    role: 'parent',
    title: 'Notifications',
    description: 'View notifications about your children from teachers and school administration',
    emptyStateMessage: "You'll see notifications about your children here",
    dashboardPath: '/dashboard/parent'
  },
  student: {
    role: 'student',
    title: 'Notifications',
    description: 'View notifications from your teachers and school administration',
    emptyStateMessage: "You'll see notifications from your teachers here",
    dashboardPath: '/dashboard/student'
  },
  teacher: {
    role: 'teacher',
    title: 'Notifications',
    description: 'View notifications from school administration and other teachers',
    emptyStateMessage: "You'll see notifications from school administration here",
    dashboardPath: '/dashboard/teacher'
  },
  admin: {
    role: 'admin',
    title: 'Notifications',
    description: 'View all system notifications and administrative messages',
    emptyStateMessage: "You'll see system notifications and administrative messages here",
    dashboardPath: '/dashboard/admin'
  }
} as const
