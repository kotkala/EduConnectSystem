'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { UserRole } from '@/lib/types'

interface NotificationCounts {
  unread: number
  total: number
}

export function useNotificationCount(_role: UserRole, userId?: string) {
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
        
        // Query unread notifications for the current user
        const { data: unreadData, error: unreadError } = await supabase
          .from('notifications')
          .select('id')
          .eq('recipient_id', userId)
          .eq('is_read', false)

        if (unreadError) {
          console.error('Error fetching unread notifications:', unreadError)
          return
        }

        // Query total notifications for the current user
        const { data: totalData, error: totalError } = await supabase
          .from('notifications')
          .select('id')
          .eq('recipient_id', userId)

        if (totalError) {
          console.error('Error fetching total notifications:', totalError)
          return
        }

        setCounts({
          unread: unreadData?.length || 0,
          total: totalData?.length || 0
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
