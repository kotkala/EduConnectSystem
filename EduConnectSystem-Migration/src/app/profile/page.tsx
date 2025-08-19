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
import { useAuth } from '@/hooks/use-auth'
import AvatarEditor from '@/shared/components/profile/avatar-editor'
import { toast } from 'sonner'
import { User, Settings, Shield } from 'lucide-react'

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
    email: profile?.email || user?.email || '',
  })

  // Handle tab parameter from URL
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['profile', 'settings', 'security'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      await updateProfile({
        full_name: formData.full_name,
        email: formData.email,
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
      email: profile?.email || user?.email || '',
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <AvatarEditor
                  uid={user.id}
                  url={profile.avatar_url}
                  size={80}
                  onUpload={handleAvatarUpload}
                  onRemove={handleAvatarRemove}
                  fallback={profile.full_name ? getInitials(profile.full_name) : 'U'}
                />
                <div className="flex-1">
                  <CardTitle className="text-2xl">
                    {profile.full_name || 'Hồ sơ người dùng'}
                  </CardTitle>
                  <CardDescription className="flex items-center space-x-2 mt-1">
                    <span>{profile.email}</span>
                    <Badge variant="secondary" className={config.color}>
                      {config.label}
                    </Badge>
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </MotionDiv>

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
                <CardContent className="space-y-4">
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
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
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
                      <span className="text-sm text-muted-foreground">
                        Liên hệ quản trị viên để thay đổi vai trò
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Ngày tạo tài khoản</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(profile.created_at).toLocaleDateString('vi-VN')}
                    </p>
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
    </div>
  )
}
