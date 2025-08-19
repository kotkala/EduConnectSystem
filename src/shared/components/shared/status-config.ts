import { CheckCircle, XCircle, Clock } from "lucide-react"

// Shared status configuration for various components
export const statusConfig = {
  pending: {
    label: "Đang chờ",
    variant: "secondary" as const,
    icon: Clock,
    color: "text-yellow-600"
  },
  approved: {
    label: "Đã chấp thuận",
    variant: "default" as const,
    icon: CheckCircle,
    color: "text-green-600"
  },
  rejected: {
    label: "Đã từ chối",
    variant: "destructive" as const,
    icon: XCircle,
    color: "text-red-600"
  }
} as const

export type StatusType = keyof typeof statusConfig

// Day names mapping for consistent display
export const dayNames: Record<number, string> = {
  1: "Thứ Hai",
  2: "Thứ Ba",
  3: "Thứ Tư",
  4: "Thứ Năm",
  5: "Thứ Sáu",
  6: "Thứ Bảy",
  7: "Chủ Nhật"
}

// Helper function to get status configuration
export function getStatusConfig(status: string) {
  return statusConfig[status as StatusType] || statusConfig.pending
}
