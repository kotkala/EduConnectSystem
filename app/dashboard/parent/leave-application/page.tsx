'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SidebarLayout } from '@/components/dashboard/sidebar-layout'
import { useAuth } from '@/hooks/use-auth'
import { 
  getParentStudentsAction,
  type StudentInfo 
} from '@/lib/actions/parent-actions'
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
      setError(result.error || 'Failed to load students')
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        setError('Please select an image (JPEG, PNG, GIF) or PDF file')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
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
        throw new Error('Please select a student')
      }
      if (!formData.start_date || !formData.end_date) {
        throw new Error('Please select start and end dates')
      }
      if (new Date(formData.start_date) > new Date(formData.end_date)) {
        throw new Error('End date must be after start date')
      }
      if (!formData.reason.trim()) {
        throw new Error('Please provide a reason for the leave')
      }

      let attachmentUrl = ''

      // Upload file if selected
      if (selectedFile) {
        const uploadResult = await uploadLeaveAttachmentAction(selectedFile)
        if (uploadResult.success && uploadResult.data) {
          attachmentUrl = uploadResult.data.url
        } else {
          throw new Error(uploadResult.error || 'Failed to upload attachment')
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
        throw new Error(result.error || 'Failed to create leave application')
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <SidebarLayout role="parent" title="Leave Application">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </SidebarLayout>
    )
  }

  // Show access denied if no permission
  if (!user || profile?.role !== 'parent') {
    return (
      <SidebarLayout role="parent" title="Access Denied">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <AlertCircle className="h-16 w-16 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
          <Button onClick={() => router.push('/dashboard/parent')}>
            Return to Dashboard
          </Button>
        </div>
      </SidebarLayout>
    )
  }

  if (success) {
    return (
      <SidebarLayout role="parent" title="Leave Application">
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Application Submitted!</h2>
          <p className="text-gray-600 text-center">
            Your leave application has been sent to the homeroom teacher for review.
          </p>
          <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
        </div>
      </SidebarLayout>
    )
  }

  return (
    <SidebarLayout role="parent" title="Leave Application">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/dashboard/parent')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Leave Application</h1>
            <p className="text-muted-foreground">
              Submit a leave request for your child to their homeroom teacher
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Leave Application Form</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student Selection */}
              <div className="space-y-2">
                <Label htmlFor="student">Student *</Label>
                <Select 
                  value={formData.student_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, student_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map(student => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.full_name} {student.current_class ? `- ${student.current_class.name}` : '(No class assigned)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Leave Type */}
              <div className="space-y-2">
                <Label htmlFor="leave_type">Leave Type *</Label>
                <Select 
                  value={formData.leave_type} 
                  onValueChange={(value: 'sick' | 'family' | 'emergency' | 'vacation' | 'other') => 
                    setFormData(prev => ({ ...prev, leave_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="family">Family Emergency</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="vacation">Vacation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date *</Label>
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
                  <Label htmlFor="end_date">End Date *</Label>
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
                <Label htmlFor="reason">Reason for Leave *</Label>
                <Textarea
                  id="reason"
                  placeholder="Please provide a detailed reason for the leave request..."
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  rows={4}
                  required
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>Supporting Document (Optional)</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  {selectedFile ? (
                    <div className="space-y-4">
                      {previewUrl && (
                        <div className="relative w-32 h-32 mx-auto">
                          <Image
                            src={previewUrl}
                            alt="Preview"
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
                        Upload medical certificate, letter, or other supporting document
                      </p>
                      <p className="text-xs text-gray-500 mb-4">
                        Supported formats: JPEG, PNG, GIF, PDF (max 5MB)
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
                        Choose File
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
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  )
}
