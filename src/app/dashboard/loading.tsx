'use client'

import { RouteSandyLoading } from '@/shared/components/ui/sandy-loading'
import { useLoading } from '@/shared/components/ui/loading-provider'

export default function DashboardLoading() {
  const { isLoading: isGlobalLoading } = useLoading()
  
  // Chỉ hiển thị route loading nếu không có global loading active
  // Tránh xung đột với global SandyLoading
  if (isGlobalLoading) {
    return null
  }
  
  return <RouteSandyLoading message="Đang tải bảng điều khiển..." />
}
