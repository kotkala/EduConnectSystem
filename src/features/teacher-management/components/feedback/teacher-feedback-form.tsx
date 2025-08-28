import { Loader2 } from 'lucide-react'
"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/components/ui/button'
import { Textarea } from '@/shared/components/ui/textarea'

import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'

import { Skeleton } from "@/shared/components/ui/skeleton"
import { Checkbox } from "@/shared/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  MessageSquare,
  Users,
  User,
  ArrowLeft,
  Edit,
  Save,
  X,
  Search
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getClassStudentsAction,
  createStudentFeedbackAction,
  type StudentInfo,
  type FeedbackData
} from '@/features/teacher-management/actions/teacher-feedback-actions'

interface TimetableEvent {
  id: string
  class_id: string
  subject_id: string
  class_name: string
  subject_name: string
  subject_code: string
  day_of_week: number
  start_time: string
  end_time: string
  week_number: number
  semester_name: string
  academic_year_name: string
}

interface ExistingFeedback {
  id: string
  student_id: string
  student_name: string
  feedback_text: string
  rating?: number
  feedback_type: string
  group_id?: string
  created_at: string
}

interface TeacherFeedbackFormProps {
  readonly timetableEvent: TimetableEvent
  readonly existingFeedback: ExistingFeedback[]
  readonly canEdit: boolean
  readonly hasExistingFeedback: boolean
}

type FeedbackMode = 'individual' | 'group' | 'class'

interface IndividualFeedback {
  studentId: string
  feedbackText: string
  rating?: number
}

export function TeacherFeedbackForm({
  timetableEvent,
  existingFeedback,
  canEdit,
  hasExistingFeedback
}: TeacherFeedbackFormProps) {
  const router = useRouter()
  const [students, setStudents] = useState<StudentInfo[]>([])
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>('individual')
  const [feedbackText, setFeedbackText] = useState('')
  const [rating, setRating] = useState<number | undefined>(undefined)
  const [individualFeedbacks, setIndividualFeedbacks] = useState<Map<string, IndividualFeedback>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditing, setIsEditing] = useState(!hasExistingFeedback)
  const [searchTerm, setSearchTerm] = useState('')

  const loadStudents = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await getClassStudentsAction(timetableEvent.class_id)
      if (result.success && result.data) {
        setStudents(result.data)
      } else {
        toast.error(result.error || 'Không thể tải danh sách học sinh')
      }
    } catch {
      toast.error('Lỗi khi tải danh sách học sinh')
    } finally {
      setIsLoading(false)
    }
  }, [timetableEvent.class_id])

  // Load students when component mounts
  useEffect(() => {
    loadStudents()
  }, [loadStudents])

  // Load existing feedback data when editing
  useEffect(() => {
    if (hasExistingFeedback && existingFeedback.length > 0) {
      const firstFeedback = existingFeedback[0]
      setFeedbackText(firstFeedback.feedback_text)
      setRating(firstFeedback.rating)
      setFeedbackMode(firstFeedback.feedback_type as FeedbackMode)

      // Set selected students based on existing feedback
      const feedbackStudentIds = new Set(existingFeedback.map(f => f.student_id))
      setSelectedStudents(feedbackStudentIds)
    }
  }, [hasExistingFeedback, existingFeedback])



  const handleSelectAll = () => {
    if (selectedStudents.size === students.length) {
      setSelectedStudents(new Set())
    } else {
      setSelectedStudents(new Set(students.map(s => s.id)))
    }
  }

  // Memoized computations for performance - Context7 pattern
  const studentsWithFeedback = useMemo(() => {
    return Array.from(individualFeedbacks.values()).filter(f => f.feedbackText.trim())
  }, [individualFeedbacks])

  const feedbackCompletionStats = useMemo(() => {
    const completed = studentsWithFeedback.length
    const total = students.length
    const remaining = total - completed
    return { completed, total, remaining }
  }, [studentsWithFeedback.length, students.length])

  // Filtered students based on search term
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students
    const term = searchTerm.toLowerCase()
    return students.filter(student =>
      student.full_name.toLowerCase().includes(term) ||
      student.student_id.toLowerCase().includes(term)
    )
  }, [students, searchTerm])

  const canSubmit = useMemo(() => {
    if (feedbackMode === 'individual') {
      return studentsWithFeedback.length > 0
    } else {
      return feedbackText.trim().length > 0 && (
        feedbackMode === 'class' ||
        (feedbackMode === 'group' && selectedStudents.size >= 2)
      )
    }
  }, [feedbackMode, studentsWithFeedback.length, feedbackText, selectedStudents.size])

  const handleSubmitFeedback = useCallback(async () => {
    // Early validation using memoized values - Context7 pattern
    if (!canSubmit) {
      if (feedbackMode === 'individual') {
        toast.error('Vui lòng nhập phản hồi cho ít nhất một học sinh')
      } else if (feedbackMode === 'group') {
        toast.error('Vui lòng chọn ít nhất 2 học sinh cho phản hồi nhóm')
      } else {
        toast.error('Vui lòng nhập nội dung phản hồi')
      }
      return
    }

    let feedbackData: FeedbackData[] = []

    if (feedbackMode === 'individual') {
      // Use memoized studentsWithFeedback for better performance
      feedbackData = studentsWithFeedback.map(feedback => ({
        student_id: feedback.studentId,
        feedback_text: feedback.feedbackText,
        rating: feedback.rating,
        feedback_type: feedbackMode,
        group_id: undefined
      }))
    } else {
      // Group and class feedback - optimized logic
      const targetStudents = feedbackMode === 'class'
        ? students.map(s => s.id)
        : Array.from(selectedStudents)

      feedbackData = targetStudents.map(studentId => ({
        student_id: studentId,
        feedback_text: feedbackText,
        rating: rating,
        feedback_type: feedbackMode,
        group_id: undefined
      }))
    }

    setIsSubmitting(true)
    try {
      const result = await createStudentFeedbackAction({
        timetable_event_id: timetableEvent.id,
        class_id: timetableEvent.class_id,
        subject_id: timetableEvent.subject_id,
        feedback_data: feedbackData
      })

      if (result.success) {
        const action = hasExistingFeedback ? 'cập nhật' : 'tạo'
        toast.success(`Đã ${action} phản hồi cho ${result.data?.created_count} học sinh`)

        // Redirect back to schedule with preserved filters
        router.back()
      } else {
        toast.error(result.error || 'Không thể lưu phản hồi')
      }
    } catch {
      toast.error('Lỗi khi lưu phản hồi')
    } finally {
      setIsSubmitting(false)
    }
  }, [canSubmit, feedbackMode, studentsWithFeedback, students, selectedStudents, feedbackText, rating, timetableEvent, hasExistingFeedback, router])

  const handleCancel = () => {
    router.back()
  }

  const getFeedbackModeText = (mode: FeedbackMode): string => {
    if (mode === 'individual') return 'cá nhân'
    if (mode === 'group') return 'nhóm'
    return 'cả lớp'
  }

  const getFeedbackTargetText = (mode: FeedbackMode): string => {
    if (mode === 'individual') return 'học sinh'
    if (mode === 'group') return 'nhóm học sinh'
    return 'cả lớp'
  }

  const getFeedbackPlaceholder = (mode: FeedbackMode): string => {
    if (mode === 'individual') return 'Nhập phản hồi cá nhân...'
    if (mode === 'group') return 'Nhập phản hồi cho nhóm...'
    return 'Nhập phản hồi cho cả lớp...'
  }

  // Helper functions for individual feedback - Optimized with useCallback
  const updateIndividualFeedback = useCallback((studentId: string, field: 'feedbackText' | 'rating', value: string | number | undefined) => {
    setIndividualFeedbacks(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(studentId) || { studentId, feedbackText: '', rating: undefined }

      // Only update if value actually changed - prevent unnecessary re-renders
      const currentValue = field === 'feedbackText' ? existing.feedbackText : existing.rating
      if (currentValue === value) {
        return prev // Return same reference to prevent re-render
      }

      if (field === 'feedbackText') {
        existing.feedbackText = value as string
      } else if (field === 'rating') {
        existing.rating = value as number | undefined
      }

      newMap.set(studentId, existing)
      return newMap
    })
  }, [])

  const getIndividualFeedback = useCallback((studentId: string): IndividualFeedback => {
    return individualFeedbacks.get(studentId) || { studentId, feedbackText: '', rating: undefined }
  }, [individualFeedbacks])





  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="space-y-2">
            <div className="h-8 md:h-9 lg:h-10 bg-gray-200 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>

          {/* Tabs skeleton */}
          <div className="flex space-x-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 bg-gray-200 rounded animate-pulse w-24"></div>
            ))}
          </div>

          {/* Content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3"></div>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3"></div>
              <div className="h-32 md:h-40 lg:h-48 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-orange-gradient-soft">
      {/* Modern Header with Context */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={handleCancel}
                className="flex items-center gap-2 hover:bg-blue-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại thời khóa biểu
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Phản hồi học sinh
                </h1>
                <p className="text-sm text-gray-600">
                  {timetableEvent.subject_name} - Lớp {timetableEvent.class_name}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                Tuần {timetableEvent.week_number} - {timetableEvent.semester_name}
              </div>
              <div className="text-xs text-gray-500">
                {timetableEvent.start_time} - {timetableEvent.end_time}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">

        {/* Existing Feedback Display - Modern Teacher-Friendly Design */}
        {hasExistingFeedback && !isEditing && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-green-50 border-b border-green-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900">Phản hồi đã hoàn thành</h3>
                    <p className="text-sm text-green-700">
                      Đã gửi phản hồi cho {existingFeedback.length} học sinh
                    </p>
                  </div>
                </div>
                {canEdit && (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Chỉnh sửa phản hồi
                  </Button>
                )}
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Thông tin phản hồi</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {getFeedbackModeText(existingFeedback[0]?.feedback_type as FeedbackMode)}
                      </Badge>
                      {existingFeedback[0]?.rating && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-20 md:w-24 lg:w-280">
                          {existingFeedback[0].rating}/5 ⭐
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      <strong>Thời gian tạo:</strong><br/>
                      {new Date(existingFeedback[0]?.created_at).toLocaleString('vi-VN')}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Học sinh nhận phản hồi</h4>
                  <div className="flex flex-wrap gap-2">
                    {existingFeedback.slice(0, 6).map(feedback => (
                      <Badge key={feedback.id} variant="secondary" className="bg-gray-100">
                        {feedback.student_name}
                      </Badge>
                    ))}
                    {existingFeedback.length > 6 && (
                      <Badge variant="secondary" className="bg-gray-100">
                        +{existingFeedback.length - 6} khác
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Nội dung phản hồi</h4>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-800 leading-relaxed">
                    {existingFeedback[0]?.feedback_text}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modern Feedback Form - Teacher-Friendly Design */}
        {isEditing && canEdit && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 md:h-14 lg:h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {hasExistingFeedback ? 'Chỉnh sửa phản hồi' : 'Tạo phản hồi mới'}
                    </h2>
                    <p className="text-blue-100">
                      Gửi phản hồi cho học sinh về buổi học hôm nay
                    </p>
                  </div>
                </div>
                {hasExistingFeedback && (
                  <Button
                    variant="ghost"
                    onClick={() => setIsEditing(false)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Hủy chỉnh sửa
                  </Button>
                )}
              </div>
            </div>

            <div className="p-6 space-y-8">
              {/* Modern Feedback Mode Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Chọn cách gửi phản hồi</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    type="button"
                    className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all w-full text-left ${
                      feedbackMode === 'individual'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    onClick={() => setFeedbackMode('individual')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        feedbackMode === 'individual' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <User className={`h-5 w-5 ${
                          feedbackMode === 'individual' ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Phản hồi cá nhân</h4>
                        <p className="text-sm text-gray-600">Mỗi học sinh một phản hồi riêng</p>
                      </div>
                    </div>
                    {feedbackMode === 'individual' && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all w-full text-left ${
                      feedbackMode === 'group'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    onClick={() => setFeedbackMode('group')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        feedbackMode === 'group' ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Users className={`h-5 w-5 ${
                          feedbackMode === 'group' ? 'text-green-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Phản hồi nhóm</h4>
                        <p className="text-sm text-gray-600">Chọn một số học sinh</p>
                      </div>
                    </div>
                    {feedbackMode === 'group' && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all w-full text-left ${
                      feedbackMode === 'class'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    onClick={() => setFeedbackMode('class')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        feedbackMode === 'class' ? 'bg-purple-100' : 'bg-gray-100'
                      }`}>
                        <Users className={`h-5 w-5 ${
                          feedbackMode === 'class' ? 'text-purple-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Phản hồi cả lớp</h4>
                        <p className="text-sm text-gray-600">Gửi cùng nội dung cho tất cả</p>
                      </div>
                    </div>
                    {feedbackMode === 'class' && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </button>
                </div>
              </div>

            {/* Full Width Layout - Student list removed for better UX */}
            <div className="space-y-4">
              {/* Summary information without student list */}
              {feedbackMode === 'class' && (
                <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md border border-blue-200">
                  ✓ Tất cả {students.length} học sinh trong lớp sẽ nhận phản hồi
                </div>
              )}

              {feedbackMode === 'individual' && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200">
                  ✓ Mỗi học sinh sẽ có phản hồi riêng biệt. Nhập phản hồi ở phần dưới.
                </div>
              )}

              {feedbackMode === 'group' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200 flex-1">
                      {selectedStudents.size > 0 ? (
                        <>✓ Đã chọn {selectedStudents.size}/{students.length} học sinh</>
                      ) : (
                        <>Chưa chọn học sinh nào. Vui lòng chọn ít nhất 2 học sinh cho phản hồi nhóm.</>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      className="ml-3"
                    >
                      {selectedStudents.size === students.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </Button>
                  </div>

                  {/* Student Selection List for Group Feedback */}
                  <div className="border rounded-lg p-4 bg-white">
                    <h4 className="font-medium text-gray-900 mb-3">Chọn học sinh cho phản hồi nhóm</h4>

                    {/* Search bar for students */}
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Tìm kiếm học sinh theo tên hoặc MSSV..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Student list with checkboxes */}
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {filteredStudents.map((student) => (
                        <div key={student.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md">
                          <Checkbox
                            checked={selectedStudents.has(student.id)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedStudents)
                              if (checked) {
                                newSelected.add(student.id)
                              } else {
                                newSelected.delete(student.id)
                              }
                              setSelectedStudents(newSelected)
                            }}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{student.full_name}</div>
                            <div className="text-xs text-gray-500">{student.student_id}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {filteredStudents.length === 0 && searchTerm && (
                      <div className="text-center py-4 text-gray-500">
                        Không tìm thấy học sinh nào với từ khóa &quot;{searchTerm}&quot;
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Feedback Content - Full Width */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  {feedbackMode === 'individual' ? 'Phản hồi cá nhân cho từng học sinh' : 'Nội dung phản hồi'}
                </h3>

                {feedbackMode === 'individual' ? (
                  /* Simplified Individual Feedback Mode - Horizontal rows */
                  <div className="space-y-4">
                    {/* Search bar */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Tìm kiếm học sinh theo tên hoặc MSSV..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    {/* Summary stats */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="text-sm text-blue-800">
                        <strong>Tổng số học sinh:</strong> {feedbackCompletionStats.total} |
                        <strong> Đã có phản hồi:</strong> {feedbackCompletionStats.completed} |
                        <strong> Chưa có phản hồi:</strong> {feedbackCompletionStats.remaining}
                      </div>
                    </div>

                    {/* Student feedback list - simplified horizontal rows */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredStudents.map((student) => {
                        const feedback = getIndividualFeedback(student.id)
                        return (
                          <div key={student.id} className="border rounded-lg p-3 bg-white hover:bg-gray-50">
                            <div className="grid grid-cols-12 gap-3 items-center">
                              {/* Student info */}
                              <div className="col-span-3">
                                <div className="font-medium text-sm">{student.full_name}</div>
                                <div className="text-xs text-gray-500">{student.student_id}</div>
                              </div>

                              {/* Feedback input */}
                              <div className="col-span-6">
                                <Textarea
                                  placeholder={`Phản hồi cho ${student.full_name}...`}
                                  value={feedback.feedbackText}
                                  onChange={(e) => updateIndividualFeedback(student.id, 'feedbackText', e.target.value)}
                                  rows={2}
                                  className="resize-none text-sm"
                                />
                              </div>

                              {/* Rating */}
                              <div className="col-span-3">
                                <Select
                                  value={feedback.rating?.toString() || ''}
                                  onValueChange={(value) => updateIndividualFeedback(student.id, 'rating', value ? parseInt(value) : undefined)}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Đánh giá" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">⭐ 1</SelectItem>
                                    <SelectItem value="2">⭐⭐ 2</SelectItem>
                                    <SelectItem value="3">⭐⭐⭐ 3</SelectItem>
                                    <SelectItem value="4">⭐⭐⭐⭐ 4</SelectItem>
                                    <SelectItem value="5">⭐⭐⭐⭐⭐ 5</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  /* Group and Class Feedback Mode - Single input for all */
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="feedback-text" className="text-sm font-medium block mb-2">
                        Phản hồi cho {getFeedbackTargetText(feedbackMode)}:
                      </label>
                      <Textarea
                        id="feedback-text"
                        placeholder={getFeedbackPlaceholder(feedbackMode)}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        rows={6}
                        className="resize-none"
                      />
                    </div>

                    {/* Rating */}
                    <div>
                      <label htmlFor="rating-select" className="text-sm font-medium block mb-2">Đánh giá (tùy chọn):</label>
                      <Select value={rating?.toString()} onValueChange={(value) => setRating(value ? parseInt(value) : undefined)}>
                        <SelectTrigger id="rating-select" className="w-full">
                          <SelectValue placeholder="Chọn mức đánh giá" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">⭐ 1 - Cần cải thiện</SelectItem>
                          <SelectItem value="2">⭐⭐ 2 - Khá</SelectItem>
                          <SelectItem value="3">⭐⭐⭐ 3 - Tốt</SelectItem>
                          <SelectItem value="4">⭐⭐⭐⭐ 4 - Rất tốt</SelectItem>
                          <SelectItem value="5">⭐⭐⭐⭐⭐ 5 - Xuất sắc</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Preview */}
                    <div className="bg-gray-50 border rounded-lg p-4">
                      <h4 className="text-sm font-medium mb-2">Xem trước phản hồi:</h4>
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Loại:</strong> Phản hồi {getFeedbackModeText(feedbackMode)}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Số học sinh:</strong> {feedbackMode === 'class' ? students.length : selectedStudents.size}
                      </div>
                      {rating && (
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>Đánh giá:</strong> {rating}/5 ⭐
                        </div>
                      )}
                      <div className="text-sm text-gray-600">
                        <strong>Nội dung:</strong>
                        <div className="mt-1 p-2 bg-white border rounded text-gray-800">
                          {feedbackText || 'Chưa có nội dung phản hồi...'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>



              {/* Modern Action Buttons */}
              <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {(() => {
                    if (feedbackMode === 'individual') {
                      return `${feedbackCompletionStats.completed}/${feedbackCompletionStats.total} học sinh đã có phản hồi`
                    }
                    if (feedbackMode === 'group') {
                      return `${selectedStudents.size} học sinh được chọn`
                    }
                    return `Gửi cho tất cả ${students.length} học sinh`
                  })()}
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (hasExistingFeedback) {
                        setIsEditing(false)
                      } else {
                        handleCancel()
                      }
                    }}
                    className="px-6"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Hủy
                  </Button>
                  <Button
                    onClick={handleSubmitFeedback}
                    disabled={isSubmitting || !canSubmit}
                    className="px-6 bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    {hasExistingFeedback ? 'Cập nhật phản hồi' : 'Gửi phản hồi'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Edit Permission - Modern Design */}
        {!canEdit && (
          <div className="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden">
            <div className="bg-orange-50 border-b border-orange-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <X className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900">Không thể chỉnh sửa phản hồi</h3>
                  <p className="text-sm text-orange-700">
                    Thời gian chỉnh sửa đã hết hạn
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 leading-relaxed">
                Bạn chỉ có thể tạo hoặc chỉnh sửa phản hồi trong vòng 24 giờ kể từ khi kết thúc tiết học.
                Thời gian này đã qua, vì vậy phản hồi không thể thay đổi được nữa.
              </p>
              <div className="mt-4 text-sm text-gray-600">
                <strong>Lưu ý:</strong> Nếu bạn cần thay đổi phản hồi khẩn cấp, vui lòng liên hệ với ban quản lý.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
