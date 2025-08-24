'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { usePageTransition } from '@/shared/components/ui/global-loading-provider'
import { useCoordinatedLoading } from '@/shared/hooks/use-coordinated-loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import {
  TrendingUp,
  Plus,
  Calendar,
  BookOpen,
  CheckCircle,
  XCircle,
  Clock,

  AlertCircle,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  getActiveGradeImprovementPeriodsAction,
  createGradeImprovementRequestAction,
  getStudentGradeImprovementRequestsAction,
  getStudentSubjectsForImprovementAction
} from '@/lib/actions/grade-improvement-actions'
import {
  type GradeImprovementRequest,
  type GradeImprovementPeriod
} from '@/lib/validations/grade-improvement-validations'

interface Subject {
  id: string
  name_vietnamese: string
  code: string
  category: string
}

export function StudentGradeImprovementClient() {
  // ðŸš€ COORDINATED LOADING: Replace scattered loading with coordinated system
  const { startPageTransition, stopLoading } = usePageTransition()
  const coordinatedLoading = useCoordinatedLoading()

  // State management
  const [activePeriods, setActivePeriods] = useState<GradeImprovementPeriod[]>([])
  const [myRequests, setMyRequests] = useState<GradeImprovementRequest[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  
  // Dialog states
  const [showCreateRequestDialog, setShowCreateRequestDialog] = useState(false)
  
  // Form state
  const [requestForm, setRequestForm] = useState({
    improvement_period_id: '',
    subject_id: '',
    reason: '',
    current_grade: '',
    target_grade: ''
  })
  
  // ðŸ“Š Section loading for non-blocking operations
  const [sectionLoading, setSectionLoading] = useState({
    creatingRequest: false
  })

  // Load data functions
  const loadActivePeriods = useCallback(async () => {
    try {
      const result = await getActiveGradeImprovementPeriodsAction()
      if (result.success && result.data) {
        setActivePeriods(result.data)
      } else {
        toast.error(result.error || 'Không thể tải danh sách kỳ cải thiện điểm')
      }
    } catch (error) {
      console.error('Error loading active periods:', error)
      toast.error('Lỗi khi tải danh sách kỳ cải thiện điểm')
    }
  }, [])

  const loadMyRequests = useCallback(async () => {
    try {
      // ðŸŽ¯ UX IMPROVEMENT: Use global loading for initial load
      const isInitialLoad = myRequests.length === 0
      
      if (isInitialLoad) {
        startPageTransition("Đang tải danh sách đơn của bạn...")
      }

      const result = await getStudentGradeImprovementRequestsAction()
      if (result.success && result.data) {
        setMyRequests(result.data)
      } else {
        toast.error(result.error || 'Không thể tải danh sách đơn của bạn')
      }
    } catch (error) {
      console.error('Error loading my requests:', error)
      toast.error('Lỗi khi tải danh sách đơn của bạn')
    } finally {
      stopLoading()
    }
  }, [myRequests.length, startPageTransition, stopLoading])

  const loadSubjects = useCallback(async () => {
    try {
      const result = await getStudentSubjectsForImprovementAction()
      if (result.success && result.data) {
        setSubjects(result.data)
      } else {
        toast.error(result.error || 'Không thể tải danh sách môn học')
      }
    } catch (error) {
      console.error('Error loading subjects:', error)
      toast.error('Lỗi khi tải danh sách môn học')
    }
  }, [])

  // Initial data loading
  useEffect(() => {
    loadActivePeriods()
    loadMyRequests()
    loadSubjects()
  }, [loadActivePeriods, loadMyRequests, loadSubjects])

  // Memoized status badge component to prevent re-renders
  const StatusBadge = useMemo(() => {
    const StatusBadgeComponent = ({ status }: { status: string }) => {
      const statusConfig = {
        pending: { label: 'Chờ duyệt', variant: 'secondary' as const, icon: Clock },
        approved: { label: 'Đã duyệt', variant: 'default' as const, icon: CheckCircle },
        rejected: { label: 'Từ chối', variant: 'destructive' as const, icon: XCircle }
      }
      
      const config = statusConfig[status as keyof typeof statusConfig]
      if (!config) return null
      
      const Icon = config.icon
      
      return (
        <Badge variant={config.variant} className="flex items-center gap-1">
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
      )
    }
    StatusBadgeComponent.displayName = 'StatusBadge'
    return StatusBadgeComponent
  }, [])

  // Check if student can create new request for a specific period and subject
  const canCreateRequest = useCallback((periodId: string, subjectId: string) => {
    return !myRequests.some(request => 
      request.improvement_period_id === periodId && 
      request.subject_id === subjectId
    )
  }, [myRequests])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            Cải thiện điểm số
          </h1>
          <p className="text-muted-foreground">
            Nộp đơn yêu cầu cải thiện điểm số và theo dõi trạng thái xử lý
          </p>
        </div>
        
        {activePeriods.length > 0 && (
          <Dialog open={showCreateRequestDialog} onOpenChange={setShowCreateRequestDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Tạo đơn yêu cầu
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Tạo đơn cải thiện điểm</DialogTitle>
                <DialogDescription>
                  Nộp đơn yêu cầu cải thiện điểm cho môn học cụ thể
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="improvement-period">Kỳ cải thiện điểm</Label>
                  <Select
                    value={requestForm.improvement_period_id}
                    onValueChange={(value) => setRequestForm(prev => ({ ...prev, improvement_period_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn kỳ cải thiện điểm" />
                    </SelectTrigger>
                    <SelectContent>
                      {activePeriods.map((period) => (
                        <SelectItem key={period.id} value={period.id}>
                          {period.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="subject">Môn học</Label>
                  <Select
                    value={requestForm.subject_id}
                    onValueChange={(value) => setRequestForm(prev => ({ ...prev, subject_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn môn học" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem 
                          key={subject.id} 
                          value={subject.id}
                          disabled={requestForm.improvement_period_id ? !canCreateRequest(requestForm.improvement_period_id, subject.id) : false}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{subject.name_vietnamese} ({subject.code})</span>
                            {requestForm.improvement_period_id && !canCreateRequest(requestForm.improvement_period_id, subject.id) && (
                              <Badge variant="secondary" className="ml-2 text-xs">Đã nộp</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="current-grade">Điểm hiện tại (tùy chọn)</Label>
                    <Input
                      id="current-grade"
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={requestForm.current_grade}
                      onChange={(e) => setRequestForm(prev => ({ ...prev, current_grade: e.target.value }))}
                      placeholder="VD: 6.5"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="target-grade">Điểm mục tiêu (tùy chọn)</Label>
                    <Input
                      id="target-grade"
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={requestForm.target_grade}
                      onChange={(e) => setRequestForm(prev => ({ ...prev, target_grade: e.target.value }))}
                      placeholder="VD: 8.0"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="reason">Lý do yêu cầu cải thiện điểm</Label>
                  <Textarea
                    id="reason"
                    value={requestForm.reason}
                    onChange={(e) => setRequestForm(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Mô tả lý do bạn muốn cải thiện điểm cho môn học này..."
                    rows={4}
                    className="resize-none"
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {requestForm.reason.length}/500 ký tự
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateRequestDialog(false)
                      setRequestForm({
                        improvement_period_id: '',
                        subject_id: '',
                        reason: '',
                        current_grade: '',
                        target_grade: ''
                      })
                    }}
                    disabled={sectionLoading.creatingRequest}
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!requestForm.improvement_period_id || !requestForm.subject_id || !requestForm.reason.trim()) {
                        toast.error('Vui lòng điền đầy đủ thông tin bắt buộc')
                        return
                      }
                      
                      if (requestForm.reason.length < 10) {
                        toast.error('Lý do phải có ít nhất 10 ký tự')
                        return
                      }
                      
                      if (requestForm.current_grade && requestForm.target_grade) {
                        const current = parseFloat(requestForm.current_grade)
                        const target = parseFloat(requestForm.target_grade)
                        if (target <= current) {
                          toast.error('Điểm mục tiêu phải cao hơn điểm hiện tại')
                          return
                        }
                      }
                      
                      setSectionLoading(prev => ({ ...prev, creatingRequest: true }))
                      try {
                        const formData = {
                          improvement_period_id: requestForm.improvement_period_id,
                          subject_id: requestForm.subject_id,
                          reason: requestForm.reason,
                          current_grade: requestForm.current_grade ? parseFloat(requestForm.current_grade) : undefined,
                          target_grade: requestForm.target_grade ? parseFloat(requestForm.target_grade) : undefined
                        }
                        
                        const result = await createGradeImprovementRequestAction(formData)
                        if (result.success) {
                          toast.success(result.message)
                          setShowCreateRequestDialog(false)
                          setRequestForm({
                            improvement_period_id: '',
                            subject_id: '',
                            reason: '',
                            current_grade: '',
                            target_grade: ''
                          })
                          loadMyRequests()
                        } else {
                          toast.error(result.error)
                        }
                      } catch (error) {
                        console.error('Error creating request:', error)
                        toast.error('Lỗi khi tạo đơn yêu cầu')
                      } finally {
                        setSectionLoading(prev => ({ ...prev, creatingRequest: false }))
                      }
                    }}
                    disabled={sectionLoading.creatingRequest || !requestForm.improvement_period_id || !requestForm.subject_id || !requestForm.reason.trim()}
                  >
                    {sectionLoading.creatingRequest ? 'Đang tạo...' : 'Tạo đơn'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Active Periods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Kỳ cải thiện điểm đang mở
          </CardTitle>
          <CardDescription>
            Các kỳ thời gian hiện tại cho phép nộp đơn cải thiện điểm
          </CardDescription>
        </CardHeader>
        <CardContent>
          {coordinatedLoading.isLoading && activePeriods.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Đang tải...</p>
              </div>
            </div>
          ) : activePeriods.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Hiện tại không có kỳ cải thiện điểm nào đang mở</p>
              <p className="text-sm text-muted-foreground mt-2">
                Vui lòng liên hệ với giáo viên hoặc ban giám hiệu để biết thêm thông tin
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activePeriods.map((period) => (
                <Card key={period.id} className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold">{period.name}</h3>
                      {period.description && (
                        <p className="text-sm text-muted-foreground">{period.description}</p>
                      )}
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>
                          Từ: {format(new Date(period.start_date), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </div>
                        <div>
                          Đến: {format(new Date(period.end_date), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </div>
                      </div>
                      <Badge variant="default" className="bg-green-500">
                        Đang mở
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Đơn yêu cầu của tôi
          </CardTitle>
          <CardDescription>
            Danh sách các đơn cải thiện điểm bạn đã nộp và trạng thái xử lý
          </CardDescription>
        </CardHeader>
        <CardContent>
          {coordinatedLoading.isLoading && myRequests.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground">Đang tải danh sách đơn...</p>
              </div>
            </div>
          ) : myRequests.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Bạn chưa nộp đơn cải thiện điểm nào</p>
              {activePeriods.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Nhấn nút &ldquo;Tạo đơn yêu cầu&rdquo; để nộp đơn cải thiện điểm
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {myRequests.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">{request.subject?.name_vietnamese}</span>
                            <Badge variant="outline">{request.subject?.code}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {request.improvement_period?.name}
                          </div>
                        </div>
                        <StatusBadge status={request.status} />
                      </div>
                      
                      {/* Grades */}
                      {(request.current_grade !== null || request.target_grade !== null) && (
                        <div className="flex gap-4 text-sm">
                          {request.current_grade !== null && (
                            <div>
                              <span className="text-muted-foreground">Điểm hiện tại: </span>
                              <span className="font-medium">{request.current_grade}</span>
                            </div>
                          )}
                          {request.target_grade !== null && (
                            <div>
                              <span className="text-muted-foreground">Điểm mục tiêu: </span>
                              <span className="font-medium">{request.target_grade}</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Reason */}
                      <div>
                        <div className="text-sm font-medium mb-1">Lý do:</div>
                        <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                          {request.reason}
                        </div>
                      </div>
                      
                      {/* Admin Response */}
                      {request.status !== 'pending' && request.admin_comment && (
                        <div>
                          <div className="text-sm font-medium mb-1">Phản hồi từ admin:</div>
                          <div className="text-sm text-muted-foreground bg-muted p-2 rounded">
                            {request.admin_comment}
                          </div>
                          {request.reviewed_by_profile && request.reviewed_at && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Phản hồi bởi {request.reviewed_by_profile.full_name} vào {format(new Date(request.reviewed_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Footer */}
                      <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                        <div>
                          Nộp đơn: {format(new Date(request.created_at), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
