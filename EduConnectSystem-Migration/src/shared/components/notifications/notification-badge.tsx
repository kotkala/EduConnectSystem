'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/shared/components/ui/badge'
import { createClient } from '@/shared/utils/supabase/client'

interface NotificationBadgeProps {
  readonly className?: string
}

export function NotificationBadge({ className }: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const supabase = createClient()

    const init = async () => {
      await loadUnreadCount()
      const { data } = await supabase.auth.getUser()
      const userId = data.user?.id
      if (!userId || !active) return

      const channel = supabase
        .channel(`notification_badge_${userId}`)
        // Notifications have no per-recipient column; listen broadly and refetch
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'notifications' },
          () => { loadUnreadCount() }
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'notification_reads', filter: `user_id=eq.${userId}` },
          () => { loadUnreadCount() }
        )
        .subscribe()

      return () => channel.unsubscribe()
    }

    const cleanupPromise = init()

    return () => {
      active = false
      cleanupPromise.then((cleanup) => {
        if (typeof cleanup === 'function') cleanup()
      }).catch(() => {})
    }
  }, [])

  const loadUnreadCount = async () => {
    try {
      const res = await fetch('/api/notifications/unread-count', { cache: 'no-store' })
      const json = await res.json()
      const unread = typeof json?.unread === 'number' ? json.unread : 0
      setUnreadCount(unread)
    } catch (error) {
      console.error('Failed to load unread count:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || unreadCount === 0) {
    return null
  }

  return (
    <Badge 
      variant="destructive" 
      className={`ml-auto text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5 flex items-center justify-center ${className}`}
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </Badge>
  )
}
