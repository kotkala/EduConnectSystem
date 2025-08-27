import React from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { ContentLayout } from '@/shared/components/dashboard/content-layout'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/shared/components/ui/breadcrumb'
import Link from 'next/link'
import { Users, GraduationCap, UserPlus, Heart, ArrowRight } from "lucide-react"

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  const userTypes = [
    {
      title: "Giáo viên",
      description: "Quản lý tài khoản và thông tin giáo viên",
      icon: Users,
      count: "Quản lý toàn bộ đội ngũ giảng dạy",
      href: "/dashboard/admin/users/teachers",
      color: "bg-blue-500",
      features: [
        "Tạo và chỉnh sửa hồ sơ giáo viên",
        "Quản lý mã nhân viên",
        "Bật/tắt quyền GVCN",
        "Xem thống kê giáo viên"
      ]
    },
    {
      title: "Học sinh & Phụ huynh",
      description: "Quản lý tài khoản học sinh kèm mối quan hệ phụ huynh bắt buộc",
      icon: GraduationCap,
      count: "Học sinh bắt buộc có tài khoản phụ huynh",
      href: "/dashboard/admin/users/students",
      color: "bg-green-500",
      features: [
        "Tạo học sinh + phụ huynh cùng lúc",
        "Quản lý mã học sinh",
        "Mối quan hệ phụ huynh - học sinh",
        "Xem kết nối gia đình"
      ]
    }
  ]

  return (
    <ContentLayout title="Quản lý người dùng" role="admin">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/admin">Quản trị</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Người dùng</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className="rounded-lg border-none mt-6">
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2 sm:space-y-3 animate-in fade-in duration-700">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                Quản lý người dùng
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Quản lý toàn bộ tài khoản trong hệ thống EduConnect
              </p>
            </div>

            {/* Overview Cards */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {userTypes.map((userType, index) => {
                const Icon = userType.icon
                return (
                  <div
                    key={userType.title}
                    className="relative overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex flex-col space-y-1.5 p-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${userType.color} flex items-center justify-center`}>
                            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg sm:text-xl font-semibold leading-none tracking-tight">{userType.title}</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {userType.description}
                            </p>
                          </div>
                        </div>
                        <Button asChild className="w-full sm:w-auto shrink-0">
                          <Link href={userType.href}>
                            Quản lý
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                    <div className="p-6 pt-0">
                      <div className="space-y-4">
                        <div className="text-sm font-medium text-muted-foreground">
                          {userType.count}
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Chức năng chính:</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {userType.features.map((feature) => (
                              <li key={feature} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Important Notes */}
            <div className="border-amber-200 bg-amber-50 rounded-lg border bg-card text-card-foreground shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="text-2xl font-semibold leading-none tracking-tight text-amber-800 flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Ghi chú quan trọng
                </h3>
              </div>
              <div className="p-6 pt-0 text-amber-700 space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2 shrink-0" />
                  <p>
                    <strong>Mối quan hệ Học sinh - Phụ huynh:</strong> Khi tạo tài khoản học sinh,
                    bạn phải tạo kèm tài khoản phụ huynh trong cùng biểu mẫu. Không thể thêm phụ huynh độc lập.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2 shrink-0" />
                  <p>
                    <strong>Giáo viên chủ nhiệm (GVCN):</strong> Admin có thể bật/tắt quyền GVCN
                    cho giáo viên, cho phép họ quản lý học sinh và liên lạc với phụ huynh.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2 shrink-0" />
                  <p>
                    <strong>Vai trò người dùng:</strong> Hệ thống duy trì 4 vai trò: Admin, Giáo viên,
                    Học sinh và Phụ huynh. Giữ hệ thống vai trò đơn giản và tập trung.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="text-2xl font-semibold leading-none tracking-tight">Thao tác nhanh</h3>
                <p className="text-sm text-muted-foreground">
                  Các tác vụ quản lý người dùng thường dùng
                </p>
              </div>
              <div className="p-6 pt-0">
                <div className="grid gap-4 md:grid-cols-2">
                  <Button
                    variant="outline"
                    className="h-auto p-4 justify-start"
                    asChild
                  >
                    <Link href="/dashboard/admin/users/teachers">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <UserPlus className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Thêm giáo viên</div>
                          <div className="text-sm text-muted-foreground">Tạo tài khoản giáo viên</div>
                        </div>
                      </div>
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto p-4 justify-start"
                    asChild
                  >
                    <Link href="/dashboard/admin/users/students">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                          <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Thêm học sinh & phụ huynh</div>
                          <div className="text-sm text-muted-foreground">Tạo tài khoản được liên kết</div>
                        </div>
                      </div>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </ContentLayout>
  )
}
