'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SidebarLayout } from '@/components/dashboard/sidebar-layout'
import { useAuth } from '@/hooks/use-auth'
import { useNotificationCount } from '@/hooks/use-notification-count'
import {
  getUserNotificationsAction,
  markNotificationAsReadAction,
  type Notification
} from '@/lib/actions/notification-actions'
import { Bell, Clock, User, AlertCircle, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

export default function ParentNotificationsPage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  const { refreshCounts } = useNotificationCount('parent', user?.id)
  
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'parent')) {
      router.push('/dashboard')
    }
  }, [loading, user, profile, router])

  const loadNotifications = useCallback(async () => {
    setNotificationsLoading(true)
    try {
      const result = await getUserNotificationsAction()
      if (result.success && result.data) {
        // Store all notifications for pagination
        const allNotifications = result.data
        const totalItems = allNotifications.length
        const calculatedTotalPages = Math.ceil(totalItems / pageSize) || 1

        setTotalCount(totalItems)
        setTotalPages(calculatedTotalPages)

        // Get current page notifications
        const startIndex = (currentPage - 1) * pageSize
        const endIndex = startIndex + pageSize
        setNotifications(allNotifications.slice(startIndex, endIndex))

      } else {
        setError(result.error || 'Failed to load notifications')
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
  }, [currentPage, pageSize])

  useEffect(() => {
    if (!loading && user && profile?.role === 'parent') {
      loadNotifications()
    }
  }, [loading, user, profile, loadNotifications])

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

  // Show loading state
  if (loading) {
    return (
      <SidebarLayout role="parent" title="Notifications">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </SidebarLayout>
    )
  }

  // Show access denied if no permission
  if (!user || profile?.role !== 'parent') {
    return (
      <SidebarLayout role="parent" title="Access Denied">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle className="h-16 w-16 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">You don&apos;t have permission to access notifications.</p>
          <Button onClick={() => router.push('/dashboard/parent')}>
            Return to Dashboard
          </Button>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout role="parent" title="Notifications">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              View notifications about your children from teachers and school administration
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Notifications List */}
        <div className="space-y-4">
          {notificationsLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-32">
                <Bell className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No notifications yet</p>
                <p className="text-sm text-gray-400">You&apos;ll see notifications about your children here</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                  !notification.is_read ? 'border-blue-200 bg-blue-50' : ''
                }`}
                onClick={() => setSelectedNotification(notification)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg">{notification.title}</CardTitle>
                        {!notification.is_read && (
                          <Badge variant="secondary" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {notification.sender?.full_name || 'Unknown'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
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
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {notification.content}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Trang {currentPage} / {totalPages} - Tổng {totalCount} thông báo
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Trước
                  </Button>

                  {/* Page Numbers */}
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                      if (pageNum > totalPages) return null

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Sau
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notification Detail Dialog */}
        <Dialog 
          open={!!selectedNotification} 
          onOpenChange={() => setSelectedNotification(null)}
        >
          <DialogContent className="max-w-2xl">
            {selectedNotification && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedNotification.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {selectedNotification.sender?.full_name || 'Unknown'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(selectedNotification.created_at), { addSuffix: true })}
                    </div>
                  </div>

                  {selectedNotification.image_url && (
                    <div className="mt-4">
                      <Image
                        src={selectedNotification.image_url}
                        alt="Notification attachment"
                        width={600}
                        height={400}
                        className="max-w-full h-auto rounded-lg"
                      />
                    </div>
                  )}

                  <div className="mt-4">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedNotification.content}
                    </p>
                  </div>

                  {!selectedNotification.is_read && (
                    <div className="flex justify-end mt-6">
                      <Button
                        onClick={() => {
                          handleMarkAsRead(selectedNotification.id)
                          setSelectedNotification(null)
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Mark as Read
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SidebarLayout>
  )
}
