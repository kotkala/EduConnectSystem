'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/shared/components/ui/button'

import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { SidebarLayout } from '@/shared/components/dashboard/sidebar-layout'
import { useAuth } from '@/features/authentication/hooks/use-auth'
import { 
  getParentStudentsAction,
  type StudentInfo 
} from '@/features/parent-dashboard/actions/parent-actions'
import { 
  createLeaveApplicationAction,
  uploadLeaveAttachmentAction,
  type LeaveApplicationFormData 
} from '@/lib/actions/leave-application-actions'
import { ArrowLeft, Upload, X, AlertCircle, FileText } from 'lucide-react'

export default function LeaveApplicationPage() {
  const router = useRouter()
  const { user, profile, loading } = useAuth()
  
  const [students, setStudents] = useState<StudentInfo[]>([])
  const [formData, setFormData] = useState<LeaveApplicationFormData>({
    student_id: '',
    leave_type: 'sick',
    start_date: '',
    end_date: '',
    reason: ''
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'parent')) {
      router.push('/dashboard')
    }
  }, [loading, user, profile, router])

  useEffect(() => {
    if (!loading && user && profile?.role === 'parent') {
      loadStudents()
    }
  }, [loading, user, profile])

  const loadStudents = async () => {
    const result = await getParentStudentsAction()
    if (result.success && result.data) {
      // Show all students - we'll handle enrollment check in the backend
      setStudents(result.data)
    } else {
      setError(result.error || 'KhÃ´ng thá»ƒ táº£i danh sÃ¡ch há»c sinh')
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        setError('Vui lÃ²ng chá»n hÃ¬nh áº£nh (JPEG, PNG, GIF) hoáº·c tá»‡p PDF')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('KÃ­ch thÆ°á»›c tá»‡p pháº£i nhá» hÆ¡n 5MB')
        return
      }

      setSelectedFile(file)
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      } else {
        setPreviewUrl(null)
      }
      
      setError(null)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate form
      if (!formData.student_id) {
        throw new Error('Vui lÃ²ng chá»n há»c sinh')
      }
      if (!formData.start_date || !formData.end_date) {
        throw new Error('Vui lÃ²ng chá»n ngÃ y báº¯t Ä‘áº§u vÃ  káº¿t thÃºc')
      }
      if (new Date(formData.start_date) > new Date(formData.end_date)) {
        throw new Error('NgÃ y káº¿t thÃºc pháº£i sau ngÃ y báº¯t Ä‘áº§u')
      }
      if (!formData.reason.trim()) {
        throw new Error('Vui lÃ²ng nháº­p lÃ½ do xin nghá»‰')
      }

      let attachmentUrl = ''

      // Upload file if selected
      if (selectedFile) {
        const uploadResult = await uploadLeaveAttachmentAction(selectedFile)
        if (uploadResult.success && uploadResult.data) {
          attachmentUrl = uploadResult.data.url
        } else {
          throw new Error(uploadResult.error || 'Táº£i tá»‡p Ä‘Ã­nh kÃ¨m tháº¥t báº¡i')
        }
      }

      // Create leave application
      const result = await createLeaveApplicationAction({
        ...formData,
        attachment_url: attachmentUrl || undefined
      })

      if (result.success) {
        setSuccess(true)
        // Reset form
        setFormData({
          student_id: '',
          leave_type: 'sick',
          start_date: '',
          end_date: '',
          reason: ''
        })
        removeFile()
        
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/dashboard/parent')
        }, 2000)
      } else {
        throw new Error(result.error || 'KhÃ´ng thá»ƒ táº¡o Ä‘Æ¡n xin nghá»‰')
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'ÄÃ£ xáº£y ra lá»—i')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <SidebarLayout role="parent" title="ÄÆ¡n xin nghá»‰">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </SidebarLayout>
    )
  }

  // Show access denied if no permission
  if (!user || profile?.role !== 'parent') {
    return (
      <SidebarLayout role="parent" title="Tá»« chá»‘i truy cáº­p">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle className="h-16 w-16 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900">Tá»« chá»‘i truy cáº­p</h2>
          <p className="text-gray-600">Báº¡n khÃ´ng cÃ³ quyá»n truy cáº­p trang nÃ y.</p>
          <Button onClick={() => router.push('/dashboard/parent')}>
            Quay láº¡i báº£ng Ä‘iá»u khiá»ƒn
          </Button>
        </div>
      </SidebarLayout>
    )
  }

  if (success) {
    return (
      <SidebarLayout role="parent" title="ÄÆ¡n xin nghá»‰">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">ÄÃ£ gá»­i Ä‘Æ¡n thÃ nh cÃ´ng!</h2>
          <p className="text-gray-600 text-center">
            ÄÆ¡n xin nghá»‰ cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c gá»­i Ä‘áº¿n giÃ¡o viÃªn chá»§ nhiá»‡m Ä‘á»ƒ xem xÃ©t.
          </p>
          <p className="text-sm text-gray-500">Äang chuyá»ƒn hÆ°á»›ng vá» báº£ng Ä‘iá»u khiá»ƒn...</p>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <div className="space-y-8">
          {/* Modern Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg shadow-blue-500/5 p-6 sm:p-8">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard/parent')}
                className="rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay láº¡i báº£ng Ä‘iá»u khiá»ƒn
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Táº¡o Ä‘Æ¡n xin nghá»‰
                </h1>
                <p className="text-gray-600 mt-1">
                  Gá»­i Ä‘Æ¡n xin nghá»‰ cho GVCN cá»§a con em báº¡n
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Modern Form */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg shadow-blue-500/5 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Biá»ƒu máº«u Ä‘Æ¡n xin nghá»‰</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Student Selection */}
              <div className="space-y-3">
                <Label htmlFor="student" className="text-sm font-semibold text-gray-700">Há»c sinh *</Label>
                <Select
                  value={formData.student_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, student_id: value }))}
                >
                  <SelectTrigger className="h-12 bg-white border-gray-200 rounded-lg shadow-sm hover:border-blue-300 transition-colors">
                    <SelectValue placeholder="Chá»n há»c sinh" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-gray-200">
                    {students.map(student => (
                      <SelectItem key={student.id} value={student.id} className="rounded-md">
                        {student.full_name} {student.current_class ? `- ${student.current_class.name}` : '(ChÆ°a cÃ³ lá»›p)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Leave Type */}
              <div className="space-y-3">
                <Label htmlFor="leave_type" className="text-sm font-semibold text-gray-700">Loáº¡i Ä‘Æ¡n *</Label>
                <Select
                  value={formData.leave_type}
                  onValueChange={(value: 'sick' | 'family' | 'emergency' | 'vacation' | 'other') =>
                    setFormData(prev => ({ ...prev, leave_type: value }))
                  }
                >
                  <SelectTrigger className="h-12 bg-white border-gray-200 rounded-lg shadow-sm hover:border-blue-300 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-gray-200">
                    <SelectItem value="sick" className="rounded-md">Nghá»‰ á»‘m</SelectItem>
                    <SelectItem value="family" className="rounded-md">Viá»‡c gia Ä‘Ã¬nh</SelectItem>
                    <SelectItem value="emergency" className="rounded-md">Kháº©n cáº¥p</SelectItem>
                    <SelectItem value="vacation" className="rounded-md">Nghá»‰ phÃ©p</SelectItem>
                    <SelectItem value="other" className="rounded-md">KhÃ¡c</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">NgÃ y báº¯t Ä‘áº§u *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">NgÃ y káº¿t thÃºc *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                    min={formData.start_date || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <Label htmlFor="reason">LÃ½ do xin nghá»‰ *</Label>
                <Textarea
                  id="reason"
                  placeholder="Vui lÃ²ng nÃªu rÃµ lÃ½ do xin nghá»‰..."
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  rows={4}
                  required
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>TÃ i liá»‡u há»— trá»£ (khÃ´ng báº¯t buá»™c)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  {selectedFile ? (
                    <div className="space-y-4">
                      {previewUrl && (
                        <div className="relative w-32 h-32 mx-auto">
                          <Image
                            src={previewUrl}
                            alt="Xem trÆ°á»›c"
                            fill
                            className="object-cover rounded-lg"
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{selectedFile.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={removeFile}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        Táº£i lÃªn giáº¥y khÃ¡m bá»‡nh, thÆ° xÃ¡c nháº­n hoáº·c tÃ i liá»‡u liÃªn quan khÃ¡c
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        Äá»‹nh dáº¡ng há»— trá»£: JPEG, PNG, GIF, PDF (tá»‘i Ä‘a 5MB)
                      </p>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        Chá»n tá»‡p
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/dashboard/parent')}
                  disabled={isSubmitting}
                >
                  Há»§y
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Äang gá»­i...' : 'Gá»­i Ä‘Æ¡n'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
