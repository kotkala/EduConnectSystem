'use client'

import { Badge } from '@/shared/components/ui/badge'
import { useViolationAlert } from '@/providers/violation-alert-context'

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
