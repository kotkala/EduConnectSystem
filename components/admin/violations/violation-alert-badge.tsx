'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { getUnseenViolationAlertsCountAction } from '@/lib/actions/violation-actions'

interface ViolationAlertBadgeProps {
  readonly className?: string
}

export default function ViolationAlertBadge({ className }: ViolationAlertBadgeProps) {
  const [alertCount, setAlertCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)



  useEffect(() => {
    loadAlertCount()
  }, [])

  const loadAlertCount = async () => {
    setIsLoading(true)
    try {
      const result = await getUnseenViolationAlertsCountAction()

      if (result.success) {
        setAlertCount(result.count || 0)
      } else {
        setAlertCount(0)
      }
    } catch (error) {
      console.error('Lỗi tải số cảnh báo:', error)
      setAlertCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh mỗi 5 phút
  useEffect(() => {
    const interval = setInterval(loadAlertCount, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading || alertCount === 0) {
    return null
  }

  return (
    <Badge variant="destructive" className={className}>
      {alertCount}
    </Badge>
  )
}
