'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'

import { SidebarLayout } from '@/shared/components/dashboard/sidebar-layout'
import { useAuth } from '@/features/authentication/hooks/use-auth'
import { useNotificationCount } from '@/features/notifications/hooks/use-notification-count'
import {
  getUserNotificationsAction,
  markNotificationAsReadAction,
  type Notification
} from '@/features/notifications/actions/notification-actions'
import { Bell, Clock, User, AlertCircle, Eye, Plus, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { SharedPaginationControls } from '@/shared/components/shared/shared-pagination-controls'


// Helper functions
const getBasePath = (role: string) => {
  switch (role) {
    case 'admin': return '/dashboard/admin'
    case 'teacher': return '/dashboard/teacher'
    case 'parent': return '/dashboard/parent'
    default: return '/student'
  }
}

const getRoleDisplayName = (role: string) => {
  switch (role) {
    case 'admin': return 'Quản trị'
    case 'teacher': return 'Giáo viên'
    case 'parent': return 'Phụ huynh'
    case 'student': return 'Học sinh'
    default: return role
  }
}

// Helper function to render notifications content
function renderNotificationsContent(
  notificationsLoading: boolean,
  notifications: Notification[],
  config: NotificationPageConfig,
  router: { push: (path: string) => void },
  handleMarkAsRead: (id: string) => void
) {
  if (notificationsLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="card-modern p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <div className="h-5 w-3/4 bg-orange-100 rounded-xl animate-pulse"></div>
                <div className="flex space-x-4">
                  <div className="h-4 w-24 bg-gray-100 rounded-lg animate-pulse"></div>
                  <div className="h-4 w-20 bg-gray-100 rounded-lg animate-pulse"></div>
                </div>
                <div className="h-4 w-full bg-gray-50 rounded-lg animate-pulse"></div>
                <div className="h-4 w-2/3 bg-gray-50 rounded-lg animate-pulse"></div>
              </div>
              <div className="h-8 w-16 bg-orange-50 rounded-xl animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (notifications.length === 0) {
    return (
      <div className="card-modern p-12 text-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-orange-50 flex items-center justify-center">
            <Bell className="h-8 w-8 text-orange-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Chưa có thông báo</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {config.emptyStateMessage}
            </p>
          </div>
        </div>
      </div>
    )
  }



  return notifications.map((notification) => (
    <div
      key={notification.id}
      className={`card-modern p-6 transition-all duration-200 hover:shadow-medium group relative ${
        !notification.is_read
          ? 'border-orange-200 bg-orange-50/30 hover:bg-orange-50/50'
          : 'hover:bg-gray-50/50'
      }`}
    >
      {/* Main clickable area */}
      <button
        className="cursor-pointer text-left w-full"
        onClick={() => {
          const basePath = getBasePath(config.role)
          router.push(`${basePath}/notifications/${notification.id}`)
        }}
        aria-label={`View notification: ${notification.title}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-3">
            {/* Title and New Badge */}
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-foreground group-hover:text-orange-700 transition-colors">
                {notification.title}
              </h3>
              {!notification.is_read && (
                <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs px-2 py-1 rounded-xl">
                  Mới
                </Badge>
              )}
            </div>

          {/* Metadata */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-orange-100 flex items-center justify-center">
                <User className="h-3 w-3 text-orange-600" />
              </div>
              <span className="font-medium">
                {notification.sender?.full_name || 'Hệ thống'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <div className="flex flex-col">
                <span>
                  Tạo: {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: vi })}
                </span>
                {notification.edited_at && (
                  <span className="text-xs text-blue-600">
                    Sửa: {formatDistanceToNow(new Date(notification.edited_at), { addSuffix: true, locale: vi })}
                  </span>
                )}
              </div>
            </div>
            {/* Attachment indicator */}
            {notification.attachments && notification.attachments.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <FileText className="h-3 w-3" />
                <span>{notification.attachments.length} tệp</span>
              </div>
            )}
          </div>

          {/* Content Preview */}
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {notification.content}
          </p>
        </div>

        {/* Right Side Actions */}
        <div className="flex flex-col items-end gap-3 ml-4">
          {/* Target Roles */}
          <div className="flex flex-wrap gap-1 justify-end">
            {notification.target_roles?.map(role => (
              <Badge
                key={role}
                variant="outline"
                className="text-xs px-2 py-1 rounded-lg border-gray-200 text-gray-600"
              >
                {getRoleDisplayName(role)}
              </Badge>
            ))}
          </div>


          </div>
        </div>
      </button>

      {/* Mark as Read Button - Separate clickable area */}
      {!notification.is_read && (
        <button
          className="absolute top-4 right-4 h-8 w-8 p-0 rounded-xl hover:bg-orange-100 hover:text-orange-700 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation()
            handleMarkAsRead(notification.id)
          }}
          aria-label="Mark notification as read"
        >
          <Eye className="h-4 w-4" />
        </button>
      )}
    </div>
  ))
}

// Configuration interface for different roles
export interface NotificationPageConfig {
  readonly role: 'parent' | 'student' | 'teacher' | 'admin'
  readonly title: string
  readonly description: string
  readonly emptyStateMessage: string
  readonly dashboardPath: string
  readonly canSendNotifications?: boolean
  readonly useSidebarLayout?: boolean
}

interface SharedNotificationsPageProps {
  readonly config: NotificationPageConfig
}

export function SharedNotificationsPage({ config }: SharedNotificationsPageProps) {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const { refreshCounts } = useNotificationCount(config.role, user?.id)
  
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)




  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!loading && (!user || profile?.role !== config.role)) {
      router.push('/dashboard')
    }
  }, [loading, user, profile, router, config.role])

  const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications])

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return

    setNotificationsLoading(true)
    try {
      const result = await getUserNotificationsAction(currentPage, pageSize)
      if (result.success && result.data) {
        setNotifications(result.data)
        if (result.pagination) {
          setTotalCount(result.pagination.total)
          setTotalPages(result.pagination.totalPages)
        } else {
          // Fallback if pagination missing
          setTotalCount(result.data.length)
          setTotalPages(Math.ceil(result.data.length / pageSize) || 1)
        }
      } else {
        setError(result.error || 'Không thể tải thông báo')
        setNotifications([])
        setTotalCount(0)
        setTotalPages(1)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
      setError('Đã xảy ra lỗi khi tải thông báo')
      setNotifications([])
      setTotalCount(0)
      setTotalPages(1)
    }
    setNotificationsLoading(false)
  }, [currentPage, user?.id])

  useEffect(() => {
    if (!loading && user && profile?.role === config.role) {
      loadNotifications()
    }
  }, [loading, user?.id, profile?.role, config.role, currentPage]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markNotificationAsReadAction(notificationId)
    if (result.success) {
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      )
      // Refresh notification count in sidebar
      refreshCounts()
      toast.success('Notification marked as read')
    } else {
      toast.error(result.error || 'Failed to mark notification as read')
    }
  }





  // Loading content
  const loadingContent = (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  )

  // Access denied content
  const accessDeniedContent = (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <AlertCircle className="h-16 w-16 text-red-500" />
      <h2 className="text-2xl font-bold text-gray-900">Từ chối truy cập</h2>
      <p className="text-gray-600">Bạn không có quyền truy cập mục thông báo.</p>
      <Button onClick={() => router.push(config.dashboardPath)}>
        Quay lại bảng điều khiển
      </Button>
    </div>
  )

  // Show loading state
  if (loading) {
    if (config.useSidebarLayout) {
      return (
        <SidebarLayout role={config.role} title="Thông báo">
          {loadingContent}
        </SidebarLayout>
      )
    }
    return <div className="p-6">{loadingContent}</div>
  }

  // Show access denied if no permission
  if (!user || profile?.role !== config.role) {
    if (config.useSidebarLayout) {
      return (
        <SidebarLayout role={config.role} title="Access Denied">
          {accessDeniedContent}
        </SidebarLayout>
      )
    }
    return <div className="p-6">{accessDeniedContent}</div>
  }

  // Main content
  const mainContent = (
    <div className="container-modern spacing-desktop">
      {/* Modern Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between mb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-orange-100 flex items-center justify-center">
              <Bell className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{config.title}</h1>
              <p className="text-base text-muted-foreground mt-1">
                {config.description}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-orange-500"></div>
              <span className="text-muted-foreground">
                Tổng: <span className="font-medium text-foreground">{totalCount}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <span className="text-muted-foreground">
                Chưa đọc: <span className="font-medium text-foreground">
                  {unreadCount}
                </span>
              </span>
            </div>
          </div>
        </div>

        {config.canSendNotifications && (
          <Button
            onClick={() => {
              const basePath = getBasePath(config.role)
              router.push(`${basePath}/notifications/create`)
            }}
            className="btn-modern bg-orange-brand hover:bg-orange-600 text-white shadow-soft w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tạo thông báo
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Notifications List */}
      <div className="space-y-4">
        {renderNotificationsContent(notificationsLoading, notifications, config, router, handleMarkAsRead)}
      </div>

      {/* Pagination Controls */}
      <SharedPaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setCurrentPage}
        itemName="thông báo"
      />






    </div>
  )

  if (config.useSidebarLayout) {
    return (
      <SidebarLayout role={config.role} title="Thông báo">
        {mainContent}
      </SidebarLayout>
    )
  }

  return <div className="p-6">{mainContent}</div>
}
