import type { NotificationPageConfig } from './shared-notifications-page'

// Configuration constants for different notification page roles
export const NOTIFICATION_CONFIGS: Record<string, NotificationPageConfig> = {
  parent: {
    role: 'parent',
    title: 'Thông báo',
    description: 'Xem thông báo về con em từ giáo viên và nhà trường',
    emptyStateMessage: 'Bạn sẽ thấy thông báo về con em tại đây',
    dashboardPath: '/dashboard/parent'
  },
  student: {
    role: 'student',
    title: 'Thông báo',
    description: 'Xem thông báo từ giáo viên và nhà trường',
    emptyStateMessage: 'Bạn sẽ thấy thông báo từ giáo viên tại đây',
    dashboardPath: '/dashboard/student'
  },
  teacher: {
    role: 'teacher',
    title: 'Thông báo',
    description: 'Xem thông báo từ ban giám hiệu và giáo viên khác',
    emptyStateMessage: 'Bạn sẽ thấy thông báo từ ban giám hiệu tại đây',
    dashboardPath: '/dashboard/teacher'
  },
  admin: {
    role: 'admin',
    title: 'Thông báo',
    description: 'Xem tất cả thông báo hệ thống và tin nhắn quản trị',
    emptyStateMessage: 'Bạn sẽ thấy thông báo hệ thống và tin nhắn quản trị tại đây',
    dashboardPath: '/dashboard/admin'
  }
} as const
