'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, X, Send, Loader2 } from 'lucide-react'
import { 
  createNotificationAction, 
  getNotificationTargetOptions,
  uploadNotificationImageAction,
  type NotificationFormData 
} from '@/lib/actions/notification-actions'

interface NotificationFormProps {
  readonly onSuccess?: () => void
  readonly onCancel?: () => void
}

export function NotificationForm({ onSuccess, onCancel }: NotificationFormProps) {
  const [formData, setFormData] = useState<NotificationFormData>({
    title: '',
    content: '',
    target_roles: [],
    target_classes: []
  })
  const [targetOptions, setTargetOptions] = useState<{
    roles: string[]
    classes: { id: string; name: string; grade: string }[]
  }>({ roles: [], classes: [] })
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadTargetOptions()
  }, [])

  const loadTargetOptions = async () => {
    const result = await getNotificationTargetOptions()
    if (result.success && result.data) {
      setTargetOptions(result.data)
    } else {
      setError(result.error || 'Failed to load target options')
    }
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setFormData(prev => ({ ...prev, image_url: undefined }))
  }

  const handleRoleChange = (role: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      target_roles: checked 
        ? [...prev.target_roles, role]
        : prev.target_roles.filter(r => r !== role)
    }))
  }

  const handleClassChange = (classId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      target_classes: checked 
        ? [...(prev.target_classes || []), classId]
        : (prev.target_classes || []).filter(c => c !== classId)
    }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Upload image if selected
      let imageUrl = formData.image_url
      if (selectedImage) {
        setUploading(true)
        const uploadResult = await uploadNotificationImageAction(selectedImage)
        setUploading(false)
        
        if (uploadResult.success && uploadResult.data) {
          imageUrl = uploadResult.data.url
        } else {
          throw new Error(uploadResult.error || 'Failed to upload image')
        }
      }

      // Create notification
      const result = await createNotificationAction({
        ...formData,
        image_url: imageUrl
      })

      if (result.success) {
        setSuccess('Notification sent successfully!')
        setFormData({
          title: '',
          content: '',
          target_roles: [],
          target_classes: []
        })
        removeImage()
        onSuccess?.()
      } else {
        throw new Error(result.error)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'teacher': return 'Teachers'
      case 'student': return 'Students'
      case 'parent': return 'Parents'
      default: return role
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Send Notification</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter notification title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Enter notification content"
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Image (Optional)</Label>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="image-upload"
              />
              <Label
                htmlFor="image-upload"
                className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <Upload className="w-4 h-4" />
                Choose Image
              </Label>
              {imagePreview && (
                <div className="relative">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    width={80}
                    height={80}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 w-6 h-6 p-0"
                    onClick={removeImage}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Label>Target Audience</Label>
            
            {targetOptions.roles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Roles</Label>
                <div className="space-y-2">
                  {targetOptions.roles.map(role => (
                    <div key={role} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${role}`}
                        checked={formData.target_roles.includes(role)}
                        onCheckedChange={(checked: boolean) => handleRoleChange(role, checked)}
                      />
                      <Label htmlFor={`role-${role}`} className="text-sm">
                        {getRoleDisplayName(role)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {targetOptions.classes.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Classes</Label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {targetOptions.classes.map(cls => (
                    <div key={cls.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`class-${cls.id}`}
                        checked={formData.target_classes?.includes(cls.id) || false}
                        onCheckedChange={(checked: boolean) => handleClassChange(cls.id, checked)}
                      />
                      <Label htmlFor={`class-${cls.id}`} className="text-sm">
                        {cls.grade} - {cls.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={loading || uploading || formData.target_roles.length === 0}
              className="flex-1"
            >
              {loading || uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {uploading ? 'Uploading...' : 'Sending...'}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Notification
                </>
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
