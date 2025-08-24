'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import nextDynamic from 'next/dynamic'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'

import { useAuth } from '@/features/authentication/hooks/use-auth'
import AvatarEditor from '@/features/authentication/components/profile/avatar-editor'
import { toast } from 'sonner'
import {
  User,
  Settings,
  Shield,
  Mail,
  Phone,
  MapPin,
  Calendar,
  IdCard,
  GraduationCap
} from 'lucide-react'

// Lazy-load framer-motion to keep initial bundle small
import { LoadingFallback } from '@/shared/components/ui/loading-fallback'
const MotionDiv = nextDynamic(() => import('framer-motion').then(mod => mod.motion.div), {
  ssr: false,
  loading: () => <LoadingFallback size="sm" />,
})

const roleConfig = {
  admin: { label: 'Quản trị viên', color: 'bg-red-500' },
  teacher: { label: 'Giáo viên', color: 'bg-blue-500' },
  student: { label: 'Học sinh', color: 'bg-green-500' },
  parent: { label: 'Phụ huynh', color: 'bg-purple-500' },
}

export default function ProfilePage() {
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
    try {
      await updateProfile({
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth,
        address: formData.address,
      })
      setIsEditing(false)
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile')
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <AvatarEditor
                uid={user.id}
                url={profile.avatar_url}
                size={48}
                onUpload={handleAvatarUpload}
                onRemove={handleAvatarRemove}
                fallback={profile.full_name ? getInitials(profile.full_name) : 'U'}
              />
              <div>
                <h3 className="font-semibold text-sm">{profile.full_name || 'Chưa cập nhật'}</h3>
                <Badge variant="secondary" className={`${config.color} text-xs`}>
                  {config.label}
                </Badge>
              </div>
            </div>

            <nav className="space-y-2">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  activeTab === 'profile'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Thông tin cá nhân</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  activeTab === 'settings'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Cài đặt</span>
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  activeTab === 'security'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Bảo mật</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-4xl mx-auto space-y-6">

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Hồ sơ</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Cài đặt</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Bảo mật</span>
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
                        <select
                          id="gender"
                          value={formData.gender}
                          onChange={(e) => handleInputChange('gender', e.target.value)}
                          disabled={!isEditing}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Chọn giới tính</option>
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                          <option value="other">Khác</option>
                        </select>
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
                      <Button variant="outline" size="sm">
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
                      <Button variant="outline" size="sm">
                        Quản lý
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Xuất dữ liệu</h4>
                        <p className="text-sm text-muted-foreground">
                          Tải xuống bản sao dữ liệu của bạn
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Xuất
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
                  <CardTitle>Cài đặt bảo mật</CardTitle>
                  <CardDescription>
                    Quản lý bảo mật tài khoản và phương thức xác thực
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Đổi mật khẩu</h4>
                        <p className="text-sm text-muted-foreground">
                          Cập nhật mật khẩu tài khoản của bạn
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Đổi
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Xác thực hai lớp</h4>
                        <p className="text-sm text-muted-foreground">
                          Thêm một lớp bảo mật cho tài khoản của bạn
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Bật
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Phiên đăng nhập hiện tại</h4>
                        <p className="text-sm text-muted-foreground">
                          Quản lý các thiết bị đang đăng nhập vào tài khoản của bạn
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Xem
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </MotionDiv>
          </TabsContent>
        </Tabs>
            </div>
          </MotionDiv>
        </div>
      </div>
    </div>
  )
}
