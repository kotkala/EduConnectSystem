'use client'
import { Loader2 } from 'lucide-react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Input } from '@/shared/components/ui/input'
import {
  Dialog,
  DialogContent,
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
import { Bell, AlertCircle, Eye, Plus, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { SharedPaginationControls } from '@/shared/components/shared/shared-pagination-controls'
import { ImageViewer } from '@/shared/components/ui/image-viewer'
import Image from 'next/image'


// Helper functions

const getRoleDisplayName = (role: string) => {
  switch (role) {
    case 'admin': return 'Quản trị'
    case 'teacher': return 'Giáo viên'
    case 'parent': return 'Phụ huynh'
    case 'student': return 'Học sinh'
    default: return role
  }
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
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)




  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
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
          setTotalPages(result.pagination.totalPages)
        } else {
          // Fallback if pagination missing
          setTotalPages(Math.ceil(result.data.length / pageSize) || 1)
        }
      } else {
        setError(result.error || 'Không thể tải thông báo')
        setNotifications([])
        setTotalPages(1)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
      setError('Đã xảy ra lỗi khi tải thông báo')
      setNotifications([])
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
    refreshCounts() // Refresh sidebar count
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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Filter tabs */}
        <div className="flex items-center border rounded-lg p-1 overflow-x-auto">
          {filters.map((filter) => (
            <Button
              key={filter.value}
              variant={selectedFilter === filter.value ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3 text-sm whitespace-nowrap"
              onClick={() => setSelectedFilter(filter.value)}
            >
              {filter.label}
              {filter.count > 0 && (
                <span className="ml-1 text-xs opacity-60">({filter.count})</span>
              )}
            </Button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="Tìm kiếm thông báo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-80 min-w-0"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 shrink-0">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Lọc</span>
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
                onClick={() => setSelectedNotification(notification)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {notification.sender?.full_name || 'Hệ thống'}
                        </span>
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200 text-xs">
                          Cán bộ nhà trường
                        </Badge>
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

                    {/* Attachments and Image indicators */}
                    <div className="flex items-center gap-3 mt-2">
                      {notification.image_url && (
                        <div className="flex items-center gap-1 text-xs text-blue-600">
                          <div className="h-3 w-3 bg-blue-500 rounded-sm"></div>
                          <span>Có hình ảnh</span>
                        </div>
                      )}
                      {notification.attachments && notification.attachments.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <FileText className="h-3 w-3" />
                          <span>{notification.attachments.length} tệp đính kèm</span>
                        </div>
                      )}
                    </div>

                    {/* Target roles */}
                    {notification.target_roles && notification.target_roles.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        {notification.target_roles.slice(0, 2).map(role => (
                          <Badge key={role} variant="outline" className="text-xs">
                            {getRoleDisplayName(role)}
                          </Badge>
                        ))}
                        {notification.target_roles.length > 2 && (
                          <span className="text-xs text-gray-500">+{notification.target_roles.length - 2}</span>
                        )}
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

      {/* Notification Detail Dialog */}
      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          {selectedNotification && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <DialogTitle className="text-xl font-semibold">
                      {selectedNotification.title}
                    </DialogTitle>
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <span>{selectedNotification.sender?.full_name || 'Hệ thống'}</span>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                        Cán bộ nhà trường
                      </Badge>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(selectedNotification.created_at), { addSuffix: true, locale: vi })}</span>
                    </div>
                  </div>
                  {!selectedNotification.is_read && (
                    <Button
                      size="sm"
                      onClick={() => {
                        handleMarkAsRead(selectedNotification.id)
                        setSelectedNotification(prev => prev ? { ...prev, is_read: true } : null)
                        refreshCounts() // Refresh sidebar count immediately
                      }}
                      className="gap-2"
                    >
                      <Eye className="h-3 w-3" />
                      Đánh dấu đã đọc
                    </Button>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {/* Content */}
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {selectedNotification.content}
                  </div>
                </div>



                {/* Image */}
                {selectedNotification.image_url && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <div className="h-5 w-5 bg-blue-500 rounded-sm"></div>
                      <h4 className="font-semibold text-gray-900">Hình ảnh</h4>
                    </div>
                                         <div className="border rounded-xl overflow-hidden bg-gray-50">
                       <ImageViewer
                         src={selectedNotification.image_url}
                         alt="Notification image"
                         className="w-full"
                       >
                         <Image
                           src={selectedNotification.image_url}
                           alt="Notification image"
                           className="w-full h-auto max-h-96 object-contain"
                           width={800}
                           height={600}
                           draggable={false}
                           unselectable="on"
                           onContextMenu={(e) => e.preventDefault()}
                         />
                       </ImageViewer>
                     </div>
                    <p className="text-xs text-gray-500 text-center">Click để xem ảnh kích thước đầy đủ • Hover để preview</p>
                  </div>
                )}

                {/* Attachments */}
                {selectedNotification.attachments && selectedNotification.attachments.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-900">
                        Tệp đính kèm ({selectedNotification.attachments.length})
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {selectedNotification.attachments.map((attachment, index) => {
                        const isImage = attachment.mime_type?.startsWith('image/')
                        const fileSize = attachment.file_size ? `${(attachment.file_size / 1024).toFixed(1)} KB` : 'Unknown size'

                        return (
                          <div key={attachment.id || index} className="group flex items-center gap-4 p-4 border rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all">
                            {/* File Icon/Preview */}
                            <div className="flex-shrink-0">
                                                             {isImage ? (
                                 <ImageViewer
                                   src={attachment.public_url}
                                   alt={attachment.file_name}
                                   className="h-12 w-12 rounded-lg overflow-hidden border"
                                 >
                                   <Image
                                     src={attachment.public_url}
                                     alt={attachment.file_name}
                                     className="h-full w-full object-cover"
                                     width={48}
                                     height={48}
                                     draggable={false}
                                     unselectable="on"
                                     onContextMenu={(e) => e.preventDefault()}
                                   />
                                 </ImageViewer>
                              ) : (
                                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                  <FileText className="h-6 w-6 text-blue-600" />
                                </div>
                              )}
                            </div>

                            {/* File Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {attachment.file_name || `Attachment ${index + 1}`}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                <span>{fileSize}</span>
                                <span>•</span>
                                <span className="truncate">
                                  {attachment.mime_type?.split('/')[1]?.toUpperCase() || 'Unknown'}
                                </span>
                              </div>
                            </div>

                            {/* Action Button */}
                            <Button
                              size="sm"
                              variant="outline"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => window.open(attachment.public_url, '_blank')}
                            >
                              {isImage ? 'Xem' : 'Tải xuống'}
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Target Roles */}
                {selectedNotification.target_roles && selectedNotification.target_roles.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Đối tượng nhận thông báo</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedNotification.target_roles.map(role => (
                        <Badge key={role} variant="outline">
                          {getRoleDisplayName(role)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Ngày tạo:</span>
                      <span className="ml-2">{new Date(selectedNotification.created_at).toLocaleString('vi-VN')}</span>
                    </div>
                    <div>
                      <span className="font-medium">Trạng thái:</span>
                      <span className="ml-2">
                        {selectedNotification.is_read ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">Đã đọc</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">Chưa đọc</Badge>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>






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
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Tạo thông báo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Tạo thông báo mới</DialogTitle>
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
