import { Loader2 } from 'lucide-react'
'use client'

import { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'

import { Skeleton } from "@/shared/components/ui/skeleton";import { AlertTriangle, RefreshCw, Send } from 'lucide-react'
import { toast } from 'sonner'

interface OutdatedReportsAlertProps {
  semester_id: string
  class_id?: string
  onReportsResent?: () => void
}

export default function OutdatedReportsAlert({ 
  semester_id, 
  class_id, 
  onReportsResent 
}: OutdatedReportsAlertProps) {
  const [outdatedReports, setOutdatedReports] = useState<Array<{
    week_index: number
    needs_resync: boolean
    last_sent: string | null
  }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    loadOutdatedReports()
  }, [semester_id, class_id])

  const loadOutdatedReports = async () => {
    setIsLoading(true)
    try {
      // Mock data for now - in real implementation, this would call an API
      // to check which weekly reports need to be resent
      const mockOutdatedReports = [
        {
          week_index: 1,
          needs_resync: true,
          last_sent: '2025-08-20T10:00:00Z'
        },
        {
          week_index: 2,
          needs_resync: true,
          last_sent: '2025-08-21T10:00:00Z'
        }
      ]
      
      // Only show reports that actually need resyncing
      const needsResync = mockOutdatedReports.filter(report => report.needs_resync)
      setOutdatedReports(needsResync)
    } catch (error) {
      console.error('Error loading outdated reports:', error)
      setOutdatedReports([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendAllReports = async () => {
    setIsResending(true)
    try {
      // Mock implementation - in real app, this would call the API to resend all outdated reports
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call
      
      toast.success(`Đã gửi lại ${outdatedReports.length} báo cáo tuần cho GVCN`)
      setOutdatedReports([]) // Clear outdated reports after successful resend
      onReportsResent?.() // Notify parent component
    } catch (error) {
      console.error('Error resending reports:', error)
      toast.error('Có lỗi xảy ra khi gửi lại báo cáo')
    } finally {
      setIsResending(false)
    }
  }

  if (isLoading) {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <Loader2 className="h-4 w-4 animate-spin" />
        <AlertTitle className="text-blue-800">Đang kiểm tra báo cáo cần cập nhật...</AlertTitle>
        <AlertDescription className="text-blue-700">
          Vui lòng đợi trong giây lát
        </AlertDescription>
      </Alert>
    )
  }

  if (outdatedReports.length === 0) {
    return null // Don't show anything if no outdated reports
  }

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800">
        Có {outdatedReports.length} báo cáo tuần cần cập nhật
      </AlertTitle>
      <AlertDescription className="text-amber-700">
        <div className="space-y-3">
          <p>
            Các báo cáo sau đã được gửi cho GVCN nhưng dữ liệu vi phạm đã thay đổi sau khi gửi:
          </p>
          
          <div className="flex flex-wrap gap-2">
            {outdatedReports.map((report) => (
              <Badge key={report.week_index} variant="outline" className="bg-white">
                Tuần {report.week_index}
                {report.last_sent && (
                  <span className="ml-1 text-xs">
                    (gửi lúc {new Date(report.last_sent).toLocaleDateString('vi-VN')})
                  </span>
                )}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              onClick={handleResendAllReports}
              disabled={isResending}
              size="sm"
              className="flex items-center gap-2"
            >
              {isResending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isResending ? 'Đang gửi lại...' : 'Gửi lại tất cả'}
            </Button>
            
            <Button
              onClick={loadOutdatedReports}
              disabled={isLoading || isResending}
              size="sm"
              variant="outline"
            >
              <RefreshCw className="h-4 w-4" />
              Kiểm tra lại
            </Button>
          </div>

          <p className="text-sm">
            💡 <strong>Lưu ý:</strong> Việc gửi lại sẽ cập nhật dữ liệu mới nhất cho GVCN. 
            Các vi phạm mới được thêm sau lần gửi trước sẽ được bao gồm trong báo cáo.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  )
}
