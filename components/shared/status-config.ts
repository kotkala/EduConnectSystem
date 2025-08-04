import { CheckCircle, XCircle, Clock } from "lucide-react"

// Shared status configuration for various components
export const statusConfig = {
  pending: {
    label: "Pending",
    variant: "secondary" as const,
    icon: Clock,
    color: "text-yellow-600"
  },
  approved: {
    label: "Approved", 
    variant: "default" as const,
    icon: CheckCircle,
    color: "text-green-600"
  },
  rejected: {
    label: "Rejected",
    variant: "destructive" as const,
    icon: XCircle,
    color: "text-red-600"
  }
} as const

export type StatusType = keyof typeof statusConfig

// Day names mapping for consistent display
export const dayNames: Record<number, string> = {
  1: "Monday", 
  2: "Tuesday", 
  3: "Wednesday",
  4: "Thursday", 
  5: "Friday", 
  6: "Saturday", 
  7: "Sunday"
}

// Helper function to get status configuration
export function getStatusConfig(status: string) {
  return statusConfig[status as StatusType] || statusConfig.pending
}
