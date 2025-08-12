'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { UserRole } from '@/lib/types'
import { getUnreadNotificationCountAction } from '@/lib/actions/notification-actions'

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
        // Use server action which already applies role-based filters and read status
        const result = await getUnreadNotificationCountAction()
        if (result.success && typeof result.data === 'number') {
          setCounts({ unread: result.data, total: result.data })
        } else {
          setCounts({ unread: 0, total: 0 })
        }
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
