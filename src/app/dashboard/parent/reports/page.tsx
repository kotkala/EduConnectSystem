import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ContentLayout } from '@/shared/components/dashboard/content-layout'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from '@/shared/components/ui/breadcrumb'
import { Card, CardContent } from '@/shared/components/ui/card'
import Link from 'next/link'
import ParentReportsClient from './parent-reports-client'
import { BookCheck } from 'lucide-react'

export default async function ParentReportsPage() {
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
    <ContentLayout title="Báo cáo" role="parent">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/parent">Phụ huynh</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Báo cáo</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <BookCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Báo cáo học tập
                </h1>
                <p className="text-muted-foreground">
                  Xem báo cáo học tập và rèn luyện của con em từ giáo viên chủ nhiệm
                </p>
              </div>
            </div>

            {/* Main Content */}
            <Suspense fallback={
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded-lg animate-pulse"></div>
                <div className="h-64 bg-muted rounded-lg animate-pulse"></div>
              </div>
            }>
              <ParentReportsClient />
            </Suspense>
          </div>
        </CardContent>
      </Card>
    </ContentLayout>
  )
}
