'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SidebarLayout } from '@/components/dashboard/sidebar-layout'
import { NotificationForm } from '@/components/notifications/notification-form'
import { useAuth } from '@/hooks/use-auth'
import { 
  getUserNotificationsAction, 
  markNotificationAsReadAction,
  type Notification 
} from '@/lib/actions/notification-actions'
import { Plus, Bell, Clock, User, AlertCircle, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function AdminNotificationsPage() {
  const router = useRouter()
  const { profile, loading } = useAuth()
  const isAdmin = profile?.role === 'admin'
  
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/dashboard/admin')
    }
  }, [loading, isAdmin, router])

  useEffect(() => {
    if (!loading && isAdmin) {
      loadNotifications()
    }
  }, [loading, isAdmin])

  const loadNotifications = async () => {
    setNotificationsLoading(true)
    const result = await getUserNotificationsAction()
    if (result.success && result.data) {
      setNotifications(result.data)
    } else {
      setError(result.error || 'Failed to load notifications')
    }
    setNotificationsLoading(false)
  }

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markNotificationAsReadAction(notificationId)
    if (result.success) {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      )
    }
  }

  const handleCreateSuccess = () => {
    setShowCreateDialog(false)
    loadNotifications()
  }

  // Show loading state
  if (loading) {
    return (
      <SidebarLayout role="admin" title="Notifications">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </SidebarLayout>
    )
  }

  // Show access denied if no permission
  if (!isAdmin) {
    return (
      <SidebarLayout role="admin" title="Access Denied">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle className="h-16 w-16 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">You don&apos;t have permission to access notifications.</p>
          <Button onClick={() => router.push('/dashboard/admin')}>
            Return to Dashboard
          </Button>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout role="admin" title="Notifications">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              Send and manage notifications to teachers, students, and parents
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Send Notification
          </Button>
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
                <p className="text-sm text-gray-400">Send your first notification to get started</p>
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
                      {notification.target_roles.map(role => (
                        <Badge key={role} variant="outline" className="text-xs">
                          {role}
                        </Badge>
                      ))}
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

        {/* Create Notification Dialog */}
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
                  
                  <div className="flex gap-2">
                    {selectedNotification.target_roles.map(role => (
                      <Badge key={role} variant="outline">
                        {role}
                      </Badge>
                    ))}
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
