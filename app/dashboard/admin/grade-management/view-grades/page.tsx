import { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { checkAdminPermissions } from '@/lib/utils/permission-utils'
import { ViewGradesClient } from './view-grades-client'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export const metadata: Metadata = {
  title: 'Xem điểm số | EduConnect',
  description: 'Xem và tìm kiếm điểm số đã được nhập theo lớp, môn học và học sinh',
}

export default async function ViewGradesPage() {
  // Check admin permissions
  try {
    await checkAdminPermissions()
  } catch (error) {
    console.error('Permission check failed:', error)
    // Let the client-side handle authentication
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin/grade-management">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Xem điểm số</h1>
            <p className="text-muted-foreground">
              Xem và tìm kiếm điểm số đã được nhập theo lớp, môn học và học sinh
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Suspense 
        fallback={
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
            <span className="ml-2 text-muted-foreground">Đang tải dữ liệu...</span>
          </div>
        }
      >
        <ViewGradesClient />
      </Suspense>
    </div>
  )
}
