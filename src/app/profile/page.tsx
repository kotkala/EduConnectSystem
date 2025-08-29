'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'

import { SidebarLayout } from '@/shared/components/dashboard/sidebar-layout'

import { useAuth } from '@/features/authentication/hooks/use-auth'
import AvatarEditor from '@/features/authentication/components/profile/avatar-editor'
import {
  updateProfileAction,
  getUserSessionsAction,
  exportUserDataAction
} from '@/lib/actions/profile-actions'
import { toast } from 'sonner'

interface Session {
  id: string
  device?: string
  location?: string
  last_active: string
  is_current?: boolean
}

import {
  User,
  Settings,
  Shield,
  Mail,
  Phone,
  MapPin,
  Calendar,
  IdCard,
  GraduationCap,
  Download,
  Loader2,
  Monitor,
  Smartphone
} from 'lucide-react'

// Lazy-load framer-motion to keep initial bundle small
import { Skeleton } from '@/shared/components/ui/skeleton'

const MotionDiv = nextDynamic(() => import('framer-motion').then(mod => mod.motion.div), {
  ssr: false,
      loading: () => <Skeleton className="h-4 w-4 rounded-full"  aria-label="Loading content" role="status" />,
})

const roleConfig = {
  admin: { label: 'Quản trị viên', color: 'bg-red-500' },
  teacher: { label: 'Giáo viên', color: 'bg-blue-500' },
  student: { label: 'Học sinh', color: 'bg-green-500' },
  parent: { label: 'Phụ huynh', color: 'bg-purple-500' },
}

function ProfileContent() {
  const { user, profile, updateProfile, loading } = useAuth()
  const searchParams = useSearchParams()
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone_number: profile?.phone_number || '',
    gender: profile?.gender || '',
    date_of_birth: profile?.date_of_birth || '',
    address: profile?.address || '',
  })



  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)

  // Export state
  const [isExporting, setIsExporting] = useState(false)

  // Handle tab parameter from URL
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['profile', 'settings', 'security'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Update form data when profile changes
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone_number: profile.phone_number || '',
        gender: profile.gender || '',
        date_of_birth: profile.date_of_birth || '',
        address: profile.address || '',
      })
    }
  }, [profile])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!profile) return

    try {
      const result = await updateProfileAction(formData)
      if (result.success) {
        setIsEditing(false)
        toast.success('Cập nhật hồ sơ thành công!')
        // Refresh the page to get updated data
        window.location.reload()
      } else {
        toast.error(result.error || 'Có lỗi xảy ra khi cập nhật hồ sơ')
      }
    } catch {
      toast.error('Có lỗi xảy ra khi cập nhật hồ sơ')
    }
  }



  // Load user sessions
  const loadSessions = async () => {
    setIsLoadingSessions(true)
    try {
      const result = await getUserSessionsAction()
      if (result.success && result.data) {
        setSessions(result.data as Session[])
      } else {
        toast.error(result.error || 'Không thể tải danh sách phiên đăng nhập')
      }
    } catch {
      toast.error('Có lỗi xảy ra khi tải danh sách phiên đăng nhập')
    } finally {
      setIsLoadingSessions(false)
    }
  }

  // Export user data
  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const result = await exportUserDataAction()
      if (result.success && result.data) {
        // Create and download file
        const dataStr = JSON.stringify(result.data, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `educonnect-data-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.success('Xuất dữ liệu thành công!')
      } else {
        toast.error(result.error || 'Có lỗi xảy ra khi xuất dữ liệu')
      }
    } catch {
      toast.error('Có lỗi xảy ra khi xuất dữ liệu')
    } finally {
      setIsExporting(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      full_name: profile?.full_name || '',
      phone_number: profile?.phone_number || '',
      gender: profile?.gender || '',
      date_of_birth: profile?.date_of_birth || '',
      address: profile?.address || '',
    })
    setIsEditing(false)
  }

  const handleAvatarUpload = async (filePath: string) => {
    try {
      await updateProfile({
        avatar_url: filePath,
      })
      toast.success('Avatar updated successfully!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update avatar')
    }
  }

  const handleAvatarRemove = async () => {
    try {
      await updateProfile({
        avatar_url: null,
      })
      toast.success('Avatar removed successfully!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove avatar')
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-12 md:h-14 lg:h-16 w-12 rounded-full mx-auto"  aria-label="Loading content" role="status" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px] mx-auto"  aria-label="Loading content" role="status" />
            <Skeleton className="h-4 w-[150px] mx-auto"  aria-label="Loading content" role="status" />
          </div>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Vui lòng đăng nhập để xem hồ sơ của bạn.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const config = roleConfig[profile.role]

  return (
    <SidebarLayout role={profile.role} title="Hồ sơ cá nhân">
      <div className="max-w-4xl mx-auto">
        {/* Modern Profile Header */}
        <Card className="mb-6 relative overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-br ${config.color.replace('bg-', 'from-').replace('-500', '-500 to-').replace('500', '600')} opacity-5`} />
          <CardContent className="pt-6 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className="relative">
                <AvatarEditor
                  uid={user.id}
                  url={profile.avatar_url}
                  size={100}
                  onUpload={handleAvatarUpload}
                  onRemove={handleAvatarRemove}
                  fallback={profile.full_name ? getInitials(profile.full_name) : 'U'}
                />
                <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full ${config.color} flex items-center justify-center shadow-lg`}>
                  <User className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">
                    {profile.full_name || 'Chưa cập nhật tên'}
                  </h2>
                  <p className="text-gray-600 mt-1">{profile.email}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="secondary" className={`${config.color} text-white px-3 py-1`}>
                    {config.label}
                  </Badge>

                  {profile.employee_id && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <IdCard className="w-3 h-3" />
                      {profile.employee_id}
                    </Badge>
                  )}

                  {profile.student_id && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" />
                      {profile.student_id}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Tham gia {new Date(profile.created_at).toLocaleDateString('vi-VN')}</span>
                  </div>
                  {profile.phone_number && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      <span>{profile.phone_number}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Thông tin cá nhân</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Bảo mật</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Cài đặt</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
              <MotionDiv
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Thông tin cá nhân</CardTitle>
                      <CardDescription>
                        Cập nhật thông tin cá nhân và liên hệ của bạn
                      </CardDescription>
                    </div>
                    {!isEditing && (
                      <Button onClick={() => setIsEditing(true)}>
                        Chỉnh sửa hồ sơ
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span>Thông tin cơ bản</span>
                    </h3>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Họ và tên</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => handleInputChange('full_name', e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            value={profile.email}
                            disabled={true}
                            className="bg-muted"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Email không thể thay đổi</p>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="phone_number">Số điện thoại</Label>
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <Input
                            id="phone_number"
                            value={formData.phone_number}
                            onChange={(e) => handleInputChange('phone_number', e.target.value)}
                            disabled={!isEditing}
                            placeholder="Nhập số điện thoại"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender">Giới tính</Label>
                        <Select
                          value={formData.gender}
                          onValueChange={(value) => handleInputChange('gender', value)}
                          disabled={!isEditing}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn giới tính" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">Nam</SelectItem>
                            <SelectItem value="female">Nữ</SelectItem>
                            <SelectItem value="other">Khác</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="date_of_birth">Ngày sinh</Label>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <Input
                            id="date_of_birth"
                            type="date"
                            value={formData.date_of_birth}
                            onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Vai trò</Label>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={config.color}>
                            {config.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Liên hệ quản trị viên để thay đổi
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Địa chỉ</Label>
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-3" />
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          disabled={!isEditing}
                          placeholder="Nhập địa chỉ"
                        />
                      </div>
                    </div>
                  </div>

                  {/* System Information */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold flex items-center space-x-2">
                      <Settings className="w-5 h-5" />
                      <span>Thông tin hệ thống</span>
                    </h3>

                    <div className="grid gap-4 md:grid-cols-2">
                      {profile.employee_id && (
                        <div className="space-y-2">
                          <Label>Mã nhân viên</Label>
                          <div className="flex items-center space-x-2">
                            <IdCard className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                              {profile.employee_id}
                            </span>
                          </div>
                        </div>
                      )}
                      {profile.student_id && (
                        <div className="space-y-2">
                          <Label>Mã học sinh</Label>
                          <div className="flex items-center space-x-2">
                            <GraduationCap className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                              {profile.student_id}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Ngày tạo tài khoản</Label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(profile.created_at).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex space-x-2 pt-4">
                      <Button onClick={handleSave} disabled={loading}>
                        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </Button>
                      <Button variant="outline" onClick={handleCancel}>
                        Hủy
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </MotionDiv>
          </TabsContent>

          <TabsContent value="settings">
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Cài đặt tài khoản</CardTitle>
                  <CardDescription>
                    Quản lý tuỳ chọn tài khoản và thông báo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Thông báo Email</h4>
                        <p className="text-sm text-muted-foreground">
                          Nhận cập nhật qua email về tài khoản của bạn
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.info('Tính năng đang được phát triển')}
                      >
                        Cấu hình
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Cài đặt quyền riêng tư</h4>
                        <p className="text-sm text-muted-foreground">
                          Kiểm soát ai có thể xem thông tin hồ sơ của bạn
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.info('Tính năng đang được phát triển')}
                      >
                        Quản lý
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Xuất dữ liệu</h4>
                        <p className="text-sm text-muted-foreground">
                          Tải xuống bản sao dữ liệu của bạn (JSON)
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportData}
                        disabled={isExporting}
                        className="flex items-center gap-2"
                      >
                        {isExporting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        {isExporting ? 'Đang xuất...' : 'Xuất'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </MotionDiv>
          </TabsContent>

          <TabsContent value="security">
            <MotionDiv
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Bảo mật tài khoản</CardTitle>
                  <CardDescription>
                    Quản lý phiên đăng nhập và theo dõi hoạt động tài khoản
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Security Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Thông tin bảo mật</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Tài khoản của bạn được bảo vệ bởi hệ thống xác thực an toàn.
                          Vui lòng liên hệ quản trị viên nếu bạn gặp sự cố.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Phiên đăng nhập hiện tại</h4>
                        <p className="text-sm text-muted-foreground">
                          Quản lý các thiết bị đang đăng nhập vào tài khoản của bạn
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          loadSessions()
                          toast.info('Hiển thị phiên đăng nhập hiện tại')
                        }}
                        disabled={isLoadingSessions}
                        className="flex items-center gap-2"
                      >
                        {isLoadingSessions ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Monitor className="h-4 w-4" />
                        )}
                        {isLoadingSessions ? 'Đang tải...' : 'Xem'}
                      </Button>
                    </div>

                    {/* Sessions List */}
                    {sessions.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h5 className="font-medium text-sm">Phiên đăng nhập:</h5>
                        {sessions.map((session) => (
                          <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                {session.device?.includes('Mobile') ? (
                                  <Smartphone className="h-4 w-4 text-blue-600" />
                                ) : (
                                  <Monitor className="h-4 w-4 text-blue-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-sm">{session.device}</p>
                                <p className="text-xs text-muted-foreground">
                                  {session.location} • {new Date(session.last_active).toLocaleString('vi-VN')}
                                </p>
                              </div>
                            </div>
                            {session.is_current && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700">
                                Hiện tại
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </MotionDiv>
          </TabsContent>
        </Tabs>
      </div>
    </SidebarLayout>
  )
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-12 md:h-14 lg:h-16 w-12 rounded-full mx-auto" aria-label="Loading content" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[200px] mx-auto" aria-label="Loading content" />
            <Skeleton className="h-4 w-[150px] mx-auto" aria-label="Loading content" />
          </div>
        </div>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  )
}
