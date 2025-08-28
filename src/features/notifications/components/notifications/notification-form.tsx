'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Separator } from '@/shared/components/ui/separator'
import { Badge } from '@/shared/components/ui/badge'

import { Upload, X, Send, FileText, Image as ImageIcon, Loader2 } from 'lucide-react'
import {
  createNotificationAction,
  getNotificationTargetOptions,
  uploadNotificationImageAction,
  uploadNotificationAttachmentsAction,
  editNotificationAction,
  getNotificationForEditAction,
  deleteNotificationAttachmentAction,
  type NotificationFormData,
  type NotificationAttachment
} from '@/features/notifications/actions/notification-actions'

interface NotificationFormProps {
  readonly onSuccess?: () => void
  readonly onCancel?: () => void
  readonly editNotificationId?: string
  readonly isEditMode?: boolean
  readonly showCard?: boolean // New prop to control card wrapper
}

export function NotificationForm({ onSuccess, onCancel, editNotificationId, isEditMode, showCard = true }: NotificationFormProps) {
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [existingAttachments, setExistingAttachments] = useState<NotificationAttachment[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(isEditMode || false)

  useEffect(() => {
    loadTargetOptions()
    if (isEditMode && editNotificationId) {
      loadNotificationForEdit()
    }
  }, [isEditMode, editNotificationId]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadTargetOptions = async () => {
    const result = await getNotificationTargetOptions()
    if (result.success && result.data) {
      setTargetOptions(result.data)
    } else {
      setError(result.error || 'Không thể tải tùy chọn đối tượng')
    }
  }

  const loadNotificationForEdit = async () => {
    if (!editNotificationId) return

    setInitialLoading(true)
    try {
      const result = await getNotificationForEditAction(editNotificationId)
      if (result.success && result.data) {
        const notification = result.data
        setFormData({
          title: notification.title,
          content: notification.content,
          image_url: notification.image_url,
          target_roles: notification.target_roles,
          target_classes: notification.target_classes || []
        })

        if (notification.image_url) {
          setImagePreview(notification.image_url)
        }

        if (notification.attachments) {
          setExistingAttachments(notification.attachments)
        }
      } else {
        setError(result.error || 'Không thể tải thông báo để chỉnh sửa')
      }
    } catch {
      setError('Không thể tải thông báo để chỉnh sửa')
    } finally {
      setInitialLoading(false)
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newFiles = Array.from(files)
      setSelectedFiles(prev => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const removeExistingAttachment = async (attachmentId: string) => {
    try {
      const result = await deleteNotificationAttachmentAction(attachmentId)
      if (result.success) {
        setExistingAttachments(prev => prev.filter(att => att.id !== attachmentId))
      } else {
        setError(result.error || 'Không thể xóa tệp đính kèm')
      }
    } catch {
      setError('Không thể xóa tệp đính kèm')
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4" />
    }
    return <FileText className="w-4 h-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
          throw new Error(uploadResult.error || 'Không thể tải lên hình ảnh')
        }
      }

      // Upload new file attachments if any
      let newAttachments: NotificationAttachment[] = []
      if (selectedFiles.length > 0) {
        setUploading(true)
        const uploadResult = await uploadNotificationAttachmentsAction(selectedFiles)
        setUploading(false)

        if (uploadResult.success && uploadResult.data) {
          newAttachments = uploadResult.data
        } else {
          throw new Error(uploadResult.error || 'Không thể tải lên tệp đính kèm')
        }
      }

      let result
      if (isEditMode && editNotificationId) {
        // Edit existing notification
        result = await editNotificationAction(editNotificationId, {
          ...formData,
          image_url: imageUrl
        }, newAttachments)
      } else {
        // Create new notification
        result = await createNotificationAction({
          ...formData,
          image_url: imageUrl
        }, newAttachments)
      }

      if (result.success) {
        setSuccess(isEditMode ? 'Cập nhật thông báo thành công!' : 'Gửi thông báo thành công!')
        if (!isEditMode) {
          setFormData({
            title: '',
            content: '',
            target_roles: [],
            target_classes: []
          })
          removeImage()
          setSelectedFiles([])
        }
        onSuccess?.()
      } else {
        throw new Error(result.error)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Đã xảy ra lỗi')
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Quản trị viên'
      case 'teacher': return 'Giáo viên'
      case 'student': return 'Học sinh'
      case 'parent': return 'Phụ huynh'
      default: return role
    }
  }

  if (initialLoading) {
    const loadingContent = (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="ml-2">Đang tải thông báo...</span>
      </div>
    )

    return showCard ? (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent>{loadingContent}</CardContent>
      </Card>
    ) : loadingContent
  }

  const formContent = (
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
            <Label htmlFor="title">Tiêu đề</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Nhập tiêu đề thông báo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Nội dung</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Nhập nội dung thông báo"
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
                Chọn ảnh
              </Label>
              {imagePreview && (
                <div className="relative">
                  <Image
                    src={imagePreview}
                    alt="Xem trước"
                    width={80}
                    height={80}
                    className="w-20 md:w-24 lg:w-28 h-20 object-cover rounded-lg"
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

          {/* File Attachments */}
          <div className="space-y-2">
            <Label>File Attachments (Optional)</Label>
            <div className="space-y-4">
              {/* File Upload */}
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                  multiple
                />
                <Label
                  htmlFor="file-upload"
                  className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <Upload className="w-4 h-4" />
                  Chọn tệp đính kèm
                </Label>
                <span className="text-sm text-gray-500">
                  Hỗ trợ: Hình ảnh, PDF, Word, Excel, Text (tối đa 10MB mỗi tệp)
                </span>
              </div>

              {/* Existing Attachments (Edit Mode) */}
              {existingAttachments.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tệp đính kèm hiện tại</Label>
                  <div className="space-y-2">
                    {existingAttachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getFileIcon(attachment.mime_type)}
                          <div>
                            <p className="text-sm font-medium">{attachment.file_name}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(attachment.file_size)} • {attachment.file_type}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="w-6 h-6 p-0"
                          onClick={() => removeExistingAttachment(attachment.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tệp mới được chọn</Label>
                  <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={`${file.name}-${file.size}-${index}`} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.type)}
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)} • {file.type.startsWith('image/') ? 'Hình ảnh' : 'Tài liệu'}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="w-6 h-6 p-0"
                          onClick={() => removeFile(index)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
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
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploading ? 'Đang tải lên...' : 'Đang gửi...'}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {isEditMode ? 'Cập nhật thông báo' : 'Gửi thông báo'}
                </>
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Hủy
              </Button>
            )}
          </div>
        </form>
  )

  return showCard ? (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditMode ? 'Chỉnh sửa thông báo' : 'Gửi thông báo'}</CardTitle>
      </CardHeader>
      <CardContent>
        {formContent}
      </CardContent>
    </Card>
  ) : formContent
}
