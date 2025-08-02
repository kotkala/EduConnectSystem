'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { UserRole } from '@/lib/types'

interface NotificationCounts {
  unread: number
  total: number
}

export function useNotificationCount(role: UserRole, userId?: string) {
  const [counts, setCounts] = useState<NotificationCounts>({
    unread: 0,
    total: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Helper function to check if notification targets the user
  const isNotificationForUser = (notification: any, profile: any, userId: string) => {
    // Direct notification: check recipient_id
    if (notification.recipient_id === userId) {
      return true
    }

    // Broadcast notification: check target_roles and target_classes
    if (notification.target_roles?.includes(profile.role)) {
      // If no target_classes specified, or user's class is included
      if (!notification.target_classes?.length ||
          (profile.class_id && notification.target_classes.includes(profile.class_id))) {
        return true
      }
    }

    return false
  }

  // Helper function to check if notification is unread for the user
  const isNotificationUnread = (notification: any, userId: string) => {
    return !notification.notification_reads.some((read: { user_id: string }) => read.user_id === userId)
  }

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    // Move notification counting logic inside useEffect (Context7 pattern)
    const fetchNotificationCounts = async () => {
      try {
        const supabase = createClient()

        // Get user profile to check role for filtering
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, class_id')
          .eq('id', userId)
          .single()

        if (profileError) {
          console.error('Error fetching user profile:', profileError)
          return
        }

        // Query all active notifications with read status
        const { data: allNotifications, error: notificationsError } = await supabase
          .from('notifications')
          .select(`
            id,
            recipient_id,
            target_roles,
            target_classes,
            notification_reads!left(user_id, read_at)
          `)
          .eq('is_active', true)

        if (notificationsError) {
          console.error('Error fetching notifications:', notificationsError)
          return
        }

        // Filter notifications that target this user (Context7 pattern: handle both direct and broadcast)
        const userNotifications = allNotifications?.filter(notification =>
          isNotificationForUser(notification, profile, userId)
        ) || []

        // Count unread notifications (those without a read record for this user)
        const unreadNotifications = userNotifications.filter(notification =>
          isNotificationUnread(notification, userId)
        )

        setCounts({
          unread: unreadNotifications.length,
          total: userNotifications.length
        })
      } catch (error) {
        console.error('Error in fetchNotificationCounts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotificationCounts()

    // Set up real-time subscription for notification updates
    const supabase = createClient()
    const subscription = supabase
      .channel('notification_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        () => {
          // Refetch counts when notifications change
          fetchNotificationCounts()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notification_reads'
        },
        () => {
          // Refetch counts when read status changes
          fetchNotificationCounts()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId, refreshTrigger]) // ✅ Include refreshTrigger for manual updates

  const refreshCounts = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return { counts, loading, refreshCounts }
}
