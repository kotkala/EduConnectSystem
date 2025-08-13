'use client'

import { useState, useEffect, useRef } from 'react'
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
  const debounceRef = useRef<number | null>(null)




  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    // Fetch unread count from API route to avoid calling server action on client
    const fetchNotificationCounts = async () => {
      try {
        const res = await fetch('/api/notifications/unread-count', { cache: 'no-store' })
        const json = await res.json()
        const unread = typeof json?.unread === 'number' ? json.unread : 0
        setCounts({ unread, total: unread })
      } catch (error) {
        console.error('Error in fetchNotificationCounts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotificationCounts()

    // Set up real-time subscription for notification updates
    const supabase = createClient()
    const scheduleRefresh = () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      // Debounce to avoid burst refetches
      debounceRef.current = window.setTimeout(() => {
        fetchNotificationCounts()
      }, 400)
    }
    // Subscribe to updates; notifications table has no per-user recipient field
    const subscription = supabase
      .channel(`notification_changes_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        scheduleRefresh
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notification_reads',
          filter: `user_id=eq.${userId}`,
        },
        scheduleRefresh
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
