'use client'
import { Loader2 } from 'lucide-react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'

import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Input } from '@/shared/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'

import { SidebarLayout } from '@/shared/components/dashboard/sidebar-layout'
import { AdminPageTemplate } from '@/shared/components/dashboard/admin-page-template'
import { useAuth } from '@/features/authentication/hooks/use-auth'
import { useNotificationCount } from '@/features/notifications/hooks/use-notification-count'
import {
  getUserNotificationsAction,
  markNotificationAsReadAction,
  type Notification
} from '@/features/notifications/actions/notification-actions'
import { NotificationForm } from '@/features/notifications/components/notifications/notification-form'
import { Bell, Clock, User, AlertCircle, Eye, Plus, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { SharedPaginationControls } from '@/shared/components/shared/shared-pagination-controls'



import { Skeleton } from "@/shared/components/ui/skeleton";// Helper functions
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
                  <div className="h-4 w-20 md:w-24 lg:w-28 bg-gray-100 rounded-lg animate-pulse"></div>
                </div>
                <div className="h-4 w-full bg-gray-50 rounded-lg animate-pulse"></div>
                <div className="h-4 w-2/3 bg-gray-50 rounded-lg animate-pulse"></div>
              </div>
              <div className="h-8 md:h-9 lg:h-10 w-16 md:w-20 lg:w-24 bg-orange-50 rounded-xl animate-pulse"></div>
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
          <div className="h-16 w-16 md:w-20 lg:w-24 rounded-2xl bg-orange-50 flex items-center justify-center">
            <Bell className="h-8 md:h-9 lg:h-10 w-8 text-orange-400" />
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
          className="absolute top-4 right-4 h-8 md:h-9 lg:h-10 w-8 p-0 rounded-xl hover:bg-orange-100 hover:text-orange-700 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center"
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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)




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

  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false)
    loadNotifications()
    toast.success('Thông báo đã được tạo thành công!')
  }

  const filteredNotifications = useMemo(() => {
    let filtered = notifications
    if (selectedFilter === 'unread') filtered = filtered.filter(n => !n.is_read)
    if (selectedFilter === 'read') filtered = filtered.filter(n => n.is_read)
    if (searchQuery) {
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.sender?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    return filtered
  }, [notifications, selectedFilter, searchQuery])

  const filters = [
    { value: 'all', label: 'Tất cả', count: notifications.length },
    { value: 'unread', label: 'Chưa đọc', count: unreadCount },
    { value: 'read', label: 'Đã đọc', count: notifications.length - unreadCount }
  ]

  // Loading content
  const loadingContent = (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-4 w-4 animate-spin" />
    </div>
  )

  // Access denied content
  const accessDeniedContent = (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <AlertCircle className="h-16 w-16 md:w-20 lg:w-24 text-red-500" />
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

  // Clean main content inspired by Gmail/Google Workspace
  const mainContent = (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Filter tabs */}
          <div className="flex items-center border rounded-lg p-1">
            {filters.map((filter) => (
              <Button
                key={filter.value}
                variant={selectedFilter === filter.value ? "default" : "ghost"}
                size="sm"
                className="h-8 px-3 text-sm"
                onClick={() => setSelectedFilter(filter.value)}
              >
                {filter.label}
                {filter.count > 0 && (
                  <span className="ml-1 text-xs opacity-60">({filter.count})</span>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Tìm kiếm thông báo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-80"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Bell className="h-4 w-4" />
                Lọc
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48" align="end">
              <div className="space-y-2">
                {filters.map((filter) => (
                  <Button
                    key={filter.value}
                    variant={selectedFilter === filter.value ? "default" : "ghost"}
                    size="sm"
                    className="w-full justify-between"
                    onClick={() => setSelectedFilter(filter.value)}
                  >
                    {filter.label}
                    <Badge variant="secondary" className="ml-2">
                      {filter.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Notifications List - Gmail style */}
      <div className="border rounded-lg">
        {notificationsLoading ? (
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có thông báo</h3>
            <p className="text-gray-500">
              {searchQuery ? 'Không tìm thấy thông báo phù hợp.' : config.emptyStateMessage}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notification.is_read ? 'bg-blue-50/50' : ''
                }`}
                onClick={() => setExpandedId(expandedId === notification.id ? null : notification.id)}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={`https://avatar.vercel.sh/${notification.sender?.full_name || 'system'}`} />
                    <AvatarFallback className="text-sm">
                      {notification.sender?.full_name?.charAt(0) || 'S'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {notification.sender?.full_name || 'Hệ thống'}
                        </span>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: vi })}
                      </span>
                    </div>

                    <h3 className="text-sm font-medium text-gray-900 mb-1 truncate">
                      {notification.title}
                    </h3>

                    <p className="text-sm text-gray-600 line-clamp-2">
                      {notification.content}
                    </p>

                    {expandedId === notification.id && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">
                          {notification.content}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            {notification.target_roles?.map(role => (
                              <Badge key={role} variant="outline" className="text-xs">
                                {getRoleDisplayName(role)}
                              </Badge>
                            ))}
                          </div>

                          {!notification.is_read && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleMarkAsRead(notification.id)
                              }}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Đánh dấu đã đọc
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredNotifications.length > 0 && (
        <SharedPaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={filteredNotifications.length}
          onPageChange={setCurrentPage}
          itemName="thông báo"
        />
      )}






    </div>
  )

  // Use AdminPageTemplate for admin role
  if (config.role === 'admin') {
    return (
      <>
        <AdminPageTemplate
          title={config.title}
          description={config.description}
          actions={
            config.canSendNotifications ? (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Plus className="h-4 w-4" />
                    Tạo thông báo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Tạo thông báo mới</DialogTitle>
                    <DialogDescription>
                      Tạo và gửi thông báo đến các đối tượng mục tiêu trong hệ thống
                    </DialogDescription>
                  </DialogHeader>
                  <NotificationForm
                    isEditMode={false}
                    onSuccess={handleCreateSuccess}
                    onCancel={() => setIsCreateDialogOpen(false)}
                    showCard={false}
                  />
                </DialogContent>
              </Dialog>
            ) : undefined
          }
          showCard={true}
        >
          {mainContent}
        </AdminPageTemplate>
      </>
    )
  }

  if (config.useSidebarLayout) {
    return (
      <SidebarLayout role={config.role} title="Thông báo">
        {mainContent}
      </SidebarLayout>
    )
  }

  return <div className="p-6">{mainContent}</div>
}
