import { cn } from "@/lib/utils"

interface SpinnerProps {
  size?: number
  className?: string
}

export function Spinner({ size = 24, className }: SpinnerProps) {
  return (
    <div
      className={cn("animate-spin rounded-full border-b-2 border-blue-600", className)}
      style={{ width: size, height: size }}
      aria-label="Đang tải"
      role="status"
    />
  )
}

