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

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    // Move notification counting logic inside useEffect (Context7 pattern)
    const fetchNotificationCounts = async () => {
      try {
        const supabase = createClient()

        // Get all active notifications with read status
        const { data: notifications, error } = await supabase
          .from('notifications')
          .select(`
            id,
            notification_reads!left(user_id, read_at)
          `)
          .eq('is_active', true)

        if (error) {
          console.error('Error fetching notifications:', error)
          return
        }

        if (!notifications) {
          setCounts({ unread: 0, total: 0 })
          return
        }

        // Count unread notifications (those without a read record for this user)
        const unreadCount = notifications.filter(notification =>
          !notification.notification_reads.some((read: { user_id: string }) => read.user_id === userId)
        ).length

        setCounts({
          unread: unreadCount,
          total: notifications.length
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
