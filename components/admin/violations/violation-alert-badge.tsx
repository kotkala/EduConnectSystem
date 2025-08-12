'use client'

import { Badge } from '@/components/ui/badge'
import { useViolationAlert } from '@/contexts/violation-alert-context'

interface ViolationAlertBadgeProps {
  readonly className?: string
}

export default function ViolationAlertBadge({ className }: ViolationAlertBadgeProps) {
  const { alertCount, isLoading } = useViolationAlert()

  if (isLoading || alertCount === 0) {
    return null
  }

  return (
    <Badge variant="destructive" className={className}>
      {alertCount}
    </Badge>
  )
}
