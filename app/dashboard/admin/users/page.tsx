"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { Users, GraduationCap, UserPlus, Heart, ArrowRight, AlertCircle } from "lucide-react"

export default function UsersPage() {
  const router = useRouter()
  const { profile, loading } = useAuth()
  const isAdmin = profile?.role === 'admin'

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!loading && !isAdmin) {
      router.push('/dashboard/admin')
    }
  }, [loading, isAdmin, router])

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Show access denied if no permission
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4 p-6">
        <AlertCircle className="h-16 w-16 text-red-500" />
        <h2 className="text-2xl font-bold text-gray-900">Từ chối truy cập</h2>
        <p className="text-gray-600">Bạn không có quyền truy cập khu vực quản lý người dùng.</p>
        <Button onClick={() => router.push('/dashboard/admin')}>
          Quay lại trang tổng quan
        </Button>
      </div>
    )
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2 sm:space-y-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Quản lý người dùng</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Quản lý toàn bộ tài khoản trong hệ thống EduConnect
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
        {userTypes.map((userType) => {
          const Icon = userType.icon
          return (
            <Card key={userType.title} className="relative overflow-hidden">
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${userType.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg sm:text-xl">{userType.title}</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {userType.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    onClick={() => router.push(userType.href)}
                    className="w-full sm:w-auto shrink-0"
                  >
                    Quản lý
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Important Notes */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="text-amber-800 flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Ghi chú quan trọng
          </CardTitle>
        </CardHeader>
        <CardContent className="text-amber-700 space-y-2">
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
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao tác nhanh</CardTitle>
          <CardDescription>
            Các tác vụ quản lý người dùng thường dùng
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Button
              variant="outline"
              className="h-auto p-4 justify-start"
              onClick={() => router.push("/dashboard/admin/users/teachers")}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Thêm giáo viên</div>
                  <div className="text-sm text-muted-foreground">Tạo tài khoản giáo viên</div>
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-auto p-4 justify-start"
              onClick={() => router.push("/dashboard/admin/users/students")}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Thêm học sinh & phụ huynh</div>
                  <div className="text-sm text-muted-foreground">Tạo tài khoản được liên kết</div>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
