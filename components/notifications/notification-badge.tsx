'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { getUnreadNotificationCountAction } from '@/lib/actions/notification-actions'
import { createClient } from '@/utils/supabase/client'

interface NotificationBadgeProps {
  readonly className?: string
}

export function NotificationBadge({ className }: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUnreadCount()

    // Set up real-time subscription instead of polling for better performance
    const supabase = createClient()

    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          loadUnreadCount() // Reload count when notifications change
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const loadUnreadCount = async () => {
    try {
      const result = await getUnreadNotificationCountAction()
      if (result.success && typeof result.data === 'number') {
        setUnreadCount(result.data)
      }
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
