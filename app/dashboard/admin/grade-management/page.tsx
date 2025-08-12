import { Metadata } from 'next'
import { Suspense } from 'react'
import { checkAdminPermissions } from '@/lib/utils/permission-utils'
import { GradeManagementClient } from './grade-management-client'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export const metadata: Metadata = {
  title: 'Quản lý điểm số | EduConnect',
  description: 'Quản lý kỳ báo cáo điểm số, nhập điểm từ Excel và theo dõi thay đổi điểm số',
}

export default async function GradeManagementPage() {
  // Check admin permissions
  await checkAdminPermissions()

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Quản lý điểm số</h1>
        <p className="text-muted-foreground">
          Tạo kỳ báo cáo điểm số, nhập điểm từ Excel và quản lý thay đổi điểm số
        </p>
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
        <GradeManagementClient />
      </Suspense>
    </div>
  )
}
