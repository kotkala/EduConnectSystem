'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { SidebarLayout } from '@/shared/components/dashboard/sidebar-layout'
import { useAuth } from '@/features/authentication/hooks/use-auth'
import { useNotificationCount } from '@/features/notifications/hooks/use-notification-count'
import {
  getUserNotificationsAction,
  markNotificationAsReadAction,
  type Notification
} from '@/features/notifications/actions/notification-actions'
import { Bell, Clock, User, AlertCircle, Eye, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import { SharedPaginationControls } from '@/shared/components/shared/shared-pagination-controls'
import { NotificationForm } from '@/features/notifications/components/notifications/notification-form'

// Helper function to render notifications content
function renderNotificationsContent(
  notificationsLoading: boolean,
  notifications: Notification[],
  config: NotificationPageConfig,
  setSelectedNotification: (notification: Notification) => void,
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
            <h3 className="text-lg font-semibold text-foreground">ChÆ°a cÃ³ thÃ´ng bÃ¡o</h3>
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
      className={`card-modern p-6 cursor-pointer transition-all duration-200 hover:shadow-medium group ${
        !notification.is_read
          ? 'border-orange-200 bg-orange-50/30 hover:bg-orange-50/50'
          : 'hover:bg-gray-50/50'
      }`}
      onClick={() => setSelectedNotification(notification)}
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
                Má»›i
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
                {notification.sender?.full_name || 'Há»‡ thá»‘ng'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span>
                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
              </span>
            </div>
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
                {role === 'admin' ? 'Quáº£n trá»‹' :
                 role === 'teacher' ? 'GiÃ¡o viÃªn' :
                 role === 'parent' ? 'Phá»¥ huynh' :
                 role === 'student' ? 'Há»c sinh' : role}
              </Badge>
            ))}
          </div>

          {/* Mark as Read Button */}
          {!notification.is_read && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-xl hover:bg-orange-100 hover:text-orange-700 opacity-0 group-hover:opacity-100 transition-all duration-200"
              onClick={(e) => {
                e.stopPropagation()
                handleMarkAsRead(notification.id)
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
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
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

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
        setError(result.error || 'KhÃ´ng thá»ƒ táº£i thÃ´ng bÃ¡o')
        setNotifications([])
        setTotalCount(0)
        setTotalPages(1)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
      setError('An error occurred while loading notifications')
      setNotifications([])
      setTotalCount(0)
      setTotalPages(1)
    }
    setNotificationsLoading(false)
  }, [currentPage])

  useEffect(() => {
    if (!loading && user && profile?.role === config.role) {
      loadNotifications()
    }
    // Only depend on primitives and stable callback to avoid loops
  }, [loading, user, profile?.role, config.role, loadNotifications])

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
    setShowCreateDialog(false)
    loadNotifications()
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
      <h2 className="text-2xl font-bold text-gray-900">Tá»« chá»‘i truy cáº­p</h2>
      <p className="text-gray-600">Báº¡n khÃ´ng cÃ³ quyá»n truy cáº­p má»¥c thÃ´ng bÃ¡o.</p>
      <Button onClick={() => router.push(config.dashboardPath)}>
        Quay láº¡i báº£ng Ä‘iá»u khiá»ƒn
      </Button>
    </div>
  )

  // Show loading state
  if (loading) {
    if (config.useSidebarLayout) {
      return (
        <SidebarLayout role={config.role} title="ThÃ´ng bÃ¡o">
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
                Tá»•ng: <span className="font-medium text-foreground">{totalCount}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500"></div>
              <span className="text-muted-foreground">
                ChÆ°a Ä‘á»c: <span className="font-medium text-foreground">
                  {unreadCount}
                </span>
              </span>
            </div>
          </div>
        </div>

        {config.canSendNotifications && (
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="btn-modern bg-orange-brand hover:bg-orange-600 text-white shadow-soft w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Gá»­i thÃ´ng bÃ¡o
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
        {renderNotificationsContent(notificationsLoading, notifications, config, setSelectedNotification, handleMarkAsRead)}
      </div>

      {/* Pagination Controls */}
      <SharedPaginationControls
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        onPageChange={setCurrentPage}
        itemName="thÃ´ng bÃ¡o"
      />

      {/* Create Notification Dialog */}
      {config.canSendNotifications && (
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Send New Notification</DialogTitle>
            </DialogHeader>
            <NotificationForm
              onSuccess={handleCreateSuccess}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Modern Notification Detail Dialog */}
      <Dialog
        open={!!selectedNotification}
        onOpenChange={() => setSelectedNotification(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedNotification && (
            <>
              <DialogHeader className="pb-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <Bell className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-xl font-semibold text-foreground mb-2">
                      {selectedNotification.title}
                    </DialogTitle>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="h-3 w-3 text-gray-600" />
                        </div>
                        <span className="font-medium">
                          {selectedNotification.sender?.full_name || 'Há»‡ thá»‘ng'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span>
                          {formatDistanceToNow(new Date(selectedNotification.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!selectedNotification.is_read && (
                    <Badge className="bg-orange-100 text-orange-700 border-orange-200 rounded-xl">
                      Má»›i
                    </Badge>
                  )}
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {/* Target Roles */}
                {selectedNotification.target_roles && selectedNotification.target_roles.length > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-muted-foreground">Gá»­i tá»›i:</span>
                    <div className="flex gap-2">
                      {selectedNotification.target_roles.map(role => (
                        <Badge
                          key={role}
                          variant="outline"
                          className="text-xs px-3 py-1 rounded-xl border-gray-200"
                        >
                          {role === 'admin' ? 'Quáº£n trá»‹ viÃªn' :
                           role === 'teacher' ? 'GiÃ¡o viÃªn' :
                           role === 'parent' ? 'Phá»¥ huynh' :
                           role === 'student' ? 'Há»c sinh' : role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Image Attachment */}
                {selectedNotification.image_url && (
                  <div className="rounded-2xl overflow-hidden border border-gray-200">
                    <Image
                      src={selectedNotification.image_url}
                      alt="Tá»‡p Ä‘Ã­nh kÃ¨m thÃ´ng bÃ¡o"
                      width={800}
                      height={500}
                      className="w-full h-auto object-cover"
                    />
                  </div>
                )}

                {/* Content */}
                <div className="prose prose-sm max-w-none">
                  <div className="bg-gray-50 rounded-2xl p-6">
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed m-0">
                      {selectedNotification.content}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                {!selectedNotification.is_read && (
                  <div className="flex justify-end pt-4 border-t border-gray-100">
                    <Button
                      onClick={() => {
                        handleMarkAsRead(selectedNotification.id)
                        setSelectedNotification(null)
                      }}
                      className="btn-modern bg-orange-brand hover:bg-orange-600 text-white"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      ÄÃ¡nh dáº¥u Ä‘Ã£ Ä‘á»c
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )

  if (config.useSidebarLayout) {
    return (
      <SidebarLayout role={config.role} title="ThÃ´ng bÃ¡o">
        {mainContent}
      </SidebarLayout>
    )
  }

  return <div className="p-6">{mainContent}</div>
}
