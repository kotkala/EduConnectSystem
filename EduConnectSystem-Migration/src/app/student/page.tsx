import { createClient } from '@/shared/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { getUserNotificationsAction } from '@/lib/actions/notification-actions'
import { Bell, BookOpen, FileText, Award } from 'lucide-react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'

export default async function StudentHome() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'student') redirect('/dashboard')

  // Fetch real notifications (no fake stats)
  const notificationsResult = await getUserNotificationsAction()
  const notifications = notificationsResult.success ? (notificationsResult.data || []) : []
  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="py-6 sm:py-8 md:py-10">
      <div className="mb-6 sm:mb-8 flex items-start justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
          Chào {profile.full_name || 'bạn'} 👋
        </h1>
      </div>
      <p className="text-muted-foreground -mt-4 mb-6">Cổng thông tin tinh gọn cho học sinh: thông báo, bài tập và điểm số.</p>

      {/* Quick links - compact, no fake numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Thông báo</CardTitle>
            <Bell className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">Xem các thông báo mới nhất từ giáo viên và nhà trường.</p>
            {unreadCount > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">{unreadCount} thông báo chưa đọc</div>
            )}
            <Button className="mt-3" size="sm" asChild>
              <a href="/student/notifications">Mở thông báo</a>
            </Button>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Bài tập</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">Theo dõi các bài tập được giao và hạn nộp.</p>
            <Button className="mt-3" variant="outline" size="sm" asChild>
              <a href="/student/assignments">Xem bài tập</a>
            </Button>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Điểm số</CardTitle>
            <Award className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground">Xem bảng điểm và tiến độ học tập của bạn.</p>
            <Button className="mt-3" variant="outline" size="sm" asChild>
              <a href="/student/grades">Xem điểm số</a>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Real notifications preview */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="lg:col-span-2 rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle>Thông báo gần đây</CardTitle>
            <CardDescription>Hiển thị tối đa 5 thông báo mới nhất.</CardDescription>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <div className="text-sm text-muted-foreground">Chưa có thông báo.</div>
            ) : (
              <div className="flex flex-col divide-y">
                {notifications.slice(0, 5).map((n) => (
                  <div key={n.id} className="py-3 flex items-start gap-3">
                    <div className="mt-1"><Bell className="w-4 h-4 text-primary" /></div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{n.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-2">{n.content}</div>
                    </div>
                    {!n.is_read && <Badge variant="secondary" className="ml-auto shrink-0">Mới</Badge>}
                  </div>
                ))}
              </div>
            )}
            <Button className="mt-4" variant="outline" size="sm" asChild>
              <a href="/student/notifications">Xem tất cả</a>
            </Button>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle>Liên kết nhanh</CardTitle>
            <CardDescription>Truy cập nhanh các mục quan trọng.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="/student/assignments"><FileText className="w-4 h-4 mr-2" />Bài tập</a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/student/grades"><Award className="w-4 h-4 mr-2" />Điểm số</a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/student/courses"><BookOpen className="w-4 h-4 mr-2" />Khoá học</a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/student/notifications"><Bell className="w-4 h-4 mr-2" />Thông báo</a>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm">
          <CardHeader>
            <CardTitle>Tài khoản</CardTitle>
            <CardDescription>Thông tin nhanh về bạn</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback>{(profile.full_name || 'U').slice(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{profile.full_name || 'Học sinh'}</div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              </div>
            </div>
            <Button className="mt-3" variant="outline" size="sm" asChild>
              <Link href="/profile">Xem hồ sơ</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


