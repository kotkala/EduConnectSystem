import { Suspense } from 'react'
import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import { ContentLayout } from '@/shared/components/dashboard/content-layout'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from '@/shared/components/ui/breadcrumb'
import { Card, CardContent } from '@/shared/components/ui/card'

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
          <Suspense fallback={<div>Đang tải...</div>}>
            <ParentGradesClient />
          </Suspense>
        </CardContent>
      </Card>
    </ContentLayout>
  )
}