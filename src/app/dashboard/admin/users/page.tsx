"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Users, GraduationCap, UserPlus, Heart, ArrowRight } from "lucide-react"

export default function UsersPage() {
  const router = useRouter()

  const userTypes = [
    {
      title: "GiÃ¡o viÃªn",
      description: "Quáº£n lÃ½ tÃ i khoáº£n vÃ  thÃ´ng tin giÃ¡o viÃªn",
      icon: Users,
      count: "Quáº£n lÃ½ toÃ n bá»™ Ä‘á»™i ngÅ© giáº£ng dáº¡y",
      href: "/dashboard/admin/users/teachers",
      color: "bg-blue-500",
      features: [
        "Táº¡o vÃ  chá»‰nh sá»­a há»“ sÆ¡ giÃ¡o viÃªn",
        "Quáº£n lÃ½ mÃ£ nhÃ¢n viÃªn",
        "Báº­t/táº¯t quyá»n GVCN",
        "Xem thá»‘ng kÃª giÃ¡o viÃªn"
      ]
    },
    {
      title: "Há»c sinh & Phá»¥ huynh",
      description: "Quáº£n lÃ½ tÃ i khoáº£n há»c sinh kÃ¨m má»‘i quan há»‡ phá»¥ huynh báº¯t buá»™c",
      icon: GraduationCap,
      count: "Há»c sinh báº¯t buá»™c cÃ³ tÃ i khoáº£n phá»¥ huynh",
      href: "/dashboard/admin/users/students",
      color: "bg-green-500",
      features: [
        "Táº¡o há»c sinh + phá»¥ huynh cÃ¹ng lÃºc",
        "Quáº£n lÃ½ mÃ£ há»c sinh",
        "Má»‘i quan há»‡ phá»¥ huynh - há»c sinh",
        "Xem káº¿t ná»‘i gia Ä‘Ã¬nh"
      ]
    }
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2 sm:space-y-3">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Quáº£n lÃ½ ngÆ°á»i dÃ¹ng</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Quáº£n lÃ½ toÃ n bá»™ tÃ i khoáº£n trong há»‡ thá»‘ng EduConnect
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
                    Quáº£n lÃ½
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
                    <h4 className="text-sm font-medium">Chá»©c nÄƒng chÃ­nh:</h4>
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
            Ghi chÃº quan trá»ng
          </CardTitle>
        </CardHeader>
        <CardContent className="text-amber-700 space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2 shrink-0" />
            <p>
              <strong>Má»‘i quan há»‡ Há»c sinh - Phá»¥ huynh:</strong> Khi táº¡o tÃ i khoáº£n há»c sinh,
              báº¡n pháº£i táº¡o kÃ¨m tÃ i khoáº£n phá»¥ huynh trong cÃ¹ng biá»ƒu máº«u. KhÃ´ng thá»ƒ thÃªm phá»¥ huynh Ä‘á»™c láº­p.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2 shrink-0" />
            <p>
              <strong>GiÃ¡o viÃªn chá»§ nhiá»‡m (GVCN):</strong> Admin cÃ³ thá»ƒ báº­t/táº¯t quyá»n GVCN
              cho giÃ¡o viÃªn, cho phÃ©p há» quáº£n lÃ½ há»c sinh vÃ  liÃªn láº¡c vá»›i phá»¥ huynh.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2 shrink-0" />
            <p>
              <strong>Vai trÃ² ngÆ°á»i dÃ¹ng:</strong> Há»‡ thá»‘ng duy trÃ¬ 4 vai trÃ²: Admin, GiÃ¡o viÃªn,
              Há»c sinh vÃ  Phá»¥ huynh. Giá»¯ há»‡ thá»‘ng vai trÃ² Ä‘Æ¡n giáº£n vÃ  táº­p trung.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Thao tÃ¡c nhanh</CardTitle>
          <CardDescription>
            CÃ¡c tÃ¡c vá»¥ quáº£n lÃ½ ngÆ°á»i dÃ¹ng thÆ°á»ng dÃ¹ng
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
                  <div className="font-medium">ThÃªm giÃ¡o viÃªn</div>
                  <div className="text-sm text-muted-foreground">Táº¡o tÃ i khoáº£n giÃ¡o viÃªn</div>
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
                  <div className="font-medium">ThÃªm há»c sinh & phá»¥ huynh</div>
                  <div className="text-sm text-muted-foreground">Táº¡o tÃ i khoáº£n Ä‘Æ°á»£c liÃªn káº¿t</div>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
