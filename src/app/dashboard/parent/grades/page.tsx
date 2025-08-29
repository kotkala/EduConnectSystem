import { Suspense } from 'react'
import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import { ContentLayout } from '@/shared/components/dashboard/content-layout'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from '@/shared/components/ui/breadcrumb'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'

import ParentGradesClient from './parent-grades-client'

export default async function ParentGradesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'parent') {
    redirect('/dashboard')
  }

  return (
    <ContentLayout title="Bảng điểm" role="parent">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Bảng điểm</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-16">
              <div className="space-y-4 mb-4">
                <Skeleton className="h-12 md:h-14 lg:h-16 w-12 rounded-full mx-auto" aria-label="Loading content" role="status" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px] mx-auto" aria-label="Loading content" role="status" />
                  <Skeleton className="h-4 w-[150px] mx-auto" aria-label="Loading content" role="status" />
                </div>
              </div>
              <p className="text-muted-foreground font-medium">Đang tải bảng điểm...</p>
            </div>
          }>
            <ParentGradesClient />
          </Suspense>
        </CardContent>
      </Card>
    </ContentLayout>
  )
}