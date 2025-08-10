import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { SidebarLayout } from '@/components/dashboard/sidebar-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Clock, Award, Calendar } from 'lucide-react'

export default async function StudentDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Check if user is student
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  if (!profile || profile.role !== 'student') {
    redirect('/dashboard')
  }

  return (
    <SidebarLayout role="student" title="Bảng điều khiển học sinh">
      <div className="space-y-6">
        <div className="space-y-2 sm:space-y-3">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
            Chào mừng trở lại, {profile.full_name || 'Học sinh'}!
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Tiếp tục hành trình học tập và theo dõi tiến độ của bạn.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          <Card className="p-3 sm:p-4 md:p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium">Môn học đã đăng ký</CardTitle>
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold">4</div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Đang theo học
              </p>
            </CardContent>
          </Card>

          <Card className="p-3 sm:p-4 md:p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium min-w-0 flex-1 pr-2">Giờ học</CardTitle>
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold">24</div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Tuần này
              </p>
            </CardContent>
          </Card>

          <Card className="p-3 sm:p-4 md:p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium">Thành tích</CardTitle>
              <Award className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold">7</div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Huy hiệu đạt được
              </p>
            </CardContent>
          </Card>

          <Card className="p-3 sm:p-4 md:p-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium">Sắp đến hạn</CardTitle>
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xl sm:text-2xl font-bold">3</div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Bài tập đến hạn
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Khoá học của tôi</CardTitle>
              <CardDescription>
                Các khoá học đã đăng ký và tiến độ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">Nhập môn Toán học</h4>
                    <p className="text-sm text-muted-foreground">Tiến độ: 75%</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Tiếp tục</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">Cơ sở Vật lý</h4>
                    <p className="text-sm text-muted-foreground">Tiến độ: 45%</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Tiếp tục</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">Hoá học cơ bản</h4>
                    <p className="text-sm text-muted-foreground">Tiến độ: 90%</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Tiếp tục</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bài tập sắp đến hạn</CardTitle>
              <CardDescription>
                Bài tập và hạn nộp cần theo dõi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Bài tập Toán 4</h4>
                    <p className="text-sm text-muted-foreground">Hạn: Ngày mai</p>
                  </div>
                  <Badge variant="destructive">Khẩn cấp</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Báo cáo thí nghiệm Vật lý</h4>
                    <p className="text-sm text-muted-foreground">Hạn: Sau 3 ngày</p>
                  </div>
                  <Badge variant="secondary">Đang chờ</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Bài kiểm tra Hoá học</h4>
                    <p className="text-sm text-muted-foreground">Hạn: Tuần sau</p>
                  </div>
                  <Badge variant="outline">Sắp tới</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarLayout>
  )
}
