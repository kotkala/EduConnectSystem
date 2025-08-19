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
import { User, Settings, Shield } from 'lucide-react'

// Lazy-load framer-motion to keep initial bundle small
import { LoadingFallback } from '@/shared/components/ui/loading-fallback'
const MotionDiv = nextDynamic(() => import('framer-motion').then(mod => mod.motion.div), {
  ssr: false,
  loading: () => <LoadingFallback size="sm" />,
})

const roleConfig = {
  admin: { label: 'Quáº£n trá»‹ viÃªn', color: 'bg-red-500' },
  teacher: { label: 'GiÃ¡o viÃªn', color: 'bg-blue-500' },
  student: { label: 'Há»c sinh', color: 'bg-green-500' },
  parent: { label: 'Phá»¥ huynh', color: 'bg-purple-500' },
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
              Vui lÃ²ng Ä‘Äƒng nháº­p Ä‘á»ƒ xem há»“ sÆ¡ cá»§a báº¡n.
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
                    {profile.full_name || 'Há»“ sÆ¡ ngÆ°á»i dÃ¹ng'}
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
              <span>Há»“ sÆ¡</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>CÃ i Ä‘áº·t</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Báº£o máº­t</span>
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
                      <CardTitle>ThÃ´ng tin cÃ¡ nhÃ¢n</CardTitle>
                      <CardDescription>
                        Cáº­p nháº­t thÃ´ng tin cÃ¡ nhÃ¢n vÃ  liÃªn há»‡ cá»§a báº¡n
                      </CardDescription>
                    </div>
                    {!isEditing && (
                      <Button onClick={() => setIsEditing(true)}>
                        Chá»‰nh sá»­a há»“ sÆ¡
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Há» vÃ  tÃªn</Label>
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
                    <Label>Vai trÃ²</Label>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className={config.color}>
                        {config.label}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        LiÃªn há»‡ quáº£n trá»‹ viÃªn Ä‘á»ƒ thay Ä‘á»•i vai trÃ²
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>NgÃ y táº¡o tÃ i khoáº£n</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(profile.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>

                  {isEditing && (
                    <div className="flex space-x-2 pt-4">
                      <Button onClick={handleSave} disabled={loading}>
                        {loading ? 'Äang lÆ°u...' : 'LÆ°u thay Ä‘á»•i'}
                      </Button>
                      <Button variant="outline" onClick={handleCancel}>
                        Há»§y
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
                  <CardTitle>CÃ i Ä‘áº·t tÃ i khoáº£n</CardTitle>
                  <CardDescription>
                    Quáº£n lÃ½ tuá»³ chá»n tÃ i khoáº£n vÃ  thÃ´ng bÃ¡o
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">ThÃ´ng bÃ¡o Email</h4>
                        <p className="text-sm text-muted-foreground">
                          Nháº­n cáº­p nháº­t qua email vá» tÃ i khoáº£n cá»§a báº¡n
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Cáº¥u hÃ¬nh
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">CÃ i Ä‘áº·t quyá»n riÃªng tÆ°</h4>
                        <p className="text-sm text-muted-foreground">
                          Kiá»ƒm soÃ¡t ai cÃ³ thá»ƒ xem thÃ´ng tin há»“ sÆ¡ cá»§a báº¡n
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Quáº£n lÃ½
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Xuáº¥t dá»¯ liá»‡u</h4>
                        <p className="text-sm text-muted-foreground">
                          Táº£i xuá»‘ng báº£n sao dá»¯ liá»‡u cá»§a báº¡n
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Xuáº¥t
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
                  <CardTitle>CÃ i Ä‘áº·t báº£o máº­t</CardTitle>
                  <CardDescription>
                    Quáº£n lÃ½ báº£o máº­t tÃ i khoáº£n vÃ  phÆ°Æ¡ng thá»©c xÃ¡c thá»±c
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Äá»•i máº­t kháº©u</h4>
                        <p className="text-sm text-muted-foreground">
                          Cáº­p nháº­t máº­t kháº©u tÃ i khoáº£n cá»§a báº¡n
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Äá»•i
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">XÃ¡c thá»±c hai lá»›p</h4>
                        <p className="text-sm text-muted-foreground">
                          ThÃªm má»™t lá»›p báº£o máº­t cho tÃ i khoáº£n cá»§a báº¡n
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Báº­t
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">PhiÃªn Ä‘Äƒng nháº­p hiá»‡n táº¡i</h4>
                        <p className="text-sm text-muted-foreground">
                          Quáº£n lÃ½ cÃ¡c thiáº¿t bá»‹ Ä‘ang Ä‘Äƒng nháº­p vÃ o tÃ i khoáº£n cá»§a báº¡n
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
