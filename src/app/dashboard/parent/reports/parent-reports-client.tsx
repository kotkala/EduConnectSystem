'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { usePageTransition } from '@/shared/components/ui/global-loading-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
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
} from '@/shared/components/ui/dialog'
import {
  BookOpen,
  Calendar,
  MessageSquare,
  User,
  GraduationCap,
  CheckCircle,
  AlertCircle,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Send,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getParentReportNotificationsAction,
  submitParentResponseAction,
  markReportAsReadAction,
  type ParentReportNotification
} from '@/lib/actions/parent-report-actions'

interface StudentOption {
  id: string
  name: string
  student_id: string
}

interface ReportPeriodOption {
  id: string
  name: string
  start_date: string
  end_date: string
}

export default function ParentReportsClient() {
  // ðŸš€ MIGRATION: Replace scattered loading with coordinated system
  const { startPageTransition, stopLoading } = usePageTransition()
  // ðŸ§¹ CLEANUP: Removed unused coordinatedLoading
  
  const [notifications, setNotifications] = useState<ParentReportNotification[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>('all')
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all')
  const [selectedReport, setSelectedReport] = useState<ParentReportNotification | null>(null)
  const [showResponseDialog, setShowResponseDialog] = useState(false)
  const [responseForm, setResponseForm] = useState({
    agreement_status: '',
    comments: ''
  })
  
  // ðŸ“Š Keep minimal loading state for specific actions only
  const [sectionLoading, setSectionLoading] = useState({
    submitting: false, // For form submissions (non-blocking)
  })
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })

  // Memoized student options to prevent unnecessary re-renders
  const studentOptions = useMemo(() => {
    const students = new Map<string, StudentOption>()
    notifications.forEach(notification => {
      if (notification.student_report?.student) {
        const student = notification.student_report.student
        students.set(student.student_id, {
          id: student.student_id,
          name: student.full_name,
          student_id: student.student_id
        })
      }
    })
    return Array.from(students.values())
  }, [notifications])

  // Memoized report period options to prevent unnecessary re-renders
  const reportPeriodOptions = useMemo(() => {
    const periods = new Map<string, ReportPeriodOption>()
    notifications.forEach(notification => {
      if (notification.student_report?.report_period) {
        const period = notification.student_report.report_period
        periods.set(period.name, {
          id: period.name,
          name: period.name,
          start_date: period.start_date,
          end_date: period.end_date
        })
      }
    })
    return Array.from(periods.values())
  }, [notifications])

  // Filtered notifications based on selected student and period
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      const matchesStudent = selectedStudent === 'all' ||
        notification.student_report?.student?.student_id === selectedStudent
      const matchesPeriod = selectedPeriod === 'all' ||
        notification.student_report?.report_period?.name === selectedPeriod
      return matchesStudent && matchesPeriod
    })
  }, [notifications, selectedStudent, selectedPeriod])

  // Load notifications with pagination and error handling
  const loadNotifications = useCallback(async (page: number = 1) => {
    try {
      startPageTransition("Äang táº£i bÃ¡o cÃ¡o...")
      setError(null)

      const result = await getParentReportNotificationsAction(page, pagination.limit)

      if (result.success) {
        setNotifications((result.data || []) as unknown as ParentReportNotification[])
        if (result.pagination) {
          setPagination(result.pagination)
        }
      } else {
        setError(result.error || 'KhÃ´ng thá»ƒ táº£i bÃ¡o cÃ¡o')
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
      setError('CÃ³ lá»—i xáº£y ra khi táº£i bÃ¡o cÃ¡o')
    } finally {
      stopLoading()
    }
  }, [pagination.limit, startPageTransition, stopLoading])

  // Load data on component mount
  useEffect(() => {
    loadNotifications(1)
  }, [loadNotifications])

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    loadNotifications(newPage)
  }, [loadNotifications])

  // Handle viewing report details
  const handleViewReport = useCallback(async (notification: ParentReportNotification) => {
    setSelectedReport(notification)
    
    // Mark as read if not already read
    if (!notification.is_read) {
      try {
        await markReportAsReadAction(notification.id)
        // Update local state to reflect read status
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id 
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        )
      } catch (error) {
        console.error('Error marking report as read:', error)
      }
    }
  }, [])

  // Handle response submission
  const handleSubmitResponse = useCallback(async () => {
    if (!selectedReport || !responseForm.agreement_status) {
      toast.error('Vui lÃ²ng chá»n má»©c Ä‘á»™ Ä‘á»“ng Ã½')
      return
    }

    try {
      setSectionLoading(prev => ({ ...prev, submitting: true }))
      
      const result = await submitParentResponseAction({
        student_report_id: selectedReport.student_report_id,
        agreement_status: responseForm.agreement_status as 'agree' | 'disagree',
        comments: responseForm.comments.trim() || undefined
      })

      if (result.success) {
        toast.success('Pháº£n há»“i Ä‘Ã£ Ä‘Æ°á»£c gá»­i thÃ nh cÃ´ng')
        setShowResponseDialog(false)
        setResponseForm({ agreement_status: '', comments: '' })
        
        // Update local state
        setNotifications(prev => 
          prev.map(n => 
            n.student_report_id === selectedReport.student_report_id
              ? {
                  ...n,
                  parent_response: {
                    agreement_status: responseForm.agreement_status,
                    comments: responseForm.comments.trim() || null,
                    is_read: true,
                    responded_at: new Date().toISOString()
                  }
                }
              : n
          )
        )
      } else {
        toast.error(result.error || 'KhÃ´ng thá»ƒ gá»­i pháº£n há»“i')
      }
    } catch (error) {
      console.error('Error submitting response:', error)
      toast.error('CÃ³ lá»—i xáº£y ra khi gá»­i pháº£n há»“i')
    } finally {
      setSectionLoading(prev => ({ ...prev, submitting: false }))
    }
  }, [selectedReport, responseForm])

  // Format date for display
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }, [])

  // ðŸ§¹ CLEANUP: Removed loading state check - now handled by global system

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32 text-red-600">
            <AlertCircle className="h-8 w-8 mr-2" />
            <span>{error}</span>
          </div>
          <div className="flex justify-center mt-4">
            <Button onClick={() => loadNotifications(1)}>Thá»­ láº¡i</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Lá»c bÃ¡o cÃ¡o
          </CardTitle>
          <CardDescription>
            Chá»n há»c sinh vÃ  ká»³ bÃ¡o cÃ¡o Ä‘á»ƒ xem chi tiáº¿t
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="student-select">Con em</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Chá»n con em" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Táº¥t cáº£ con em</SelectItem>
                  {studentOptions.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({student.student_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="period-select">Ká»³ bÃ¡o cÃ¡o</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Chá»n ká»³ bÃ¡o cÃ¡o">
                    {selectedPeriod === 'all' ? 'Táº¥t cáº£ ká»³ bÃ¡o cÃ¡o' :
                      reportPeriodOptions.find(p => p.id === selectedPeriod)?.name || 'Chá»n ká»³ bÃ¡o cÃ¡o'
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Táº¥t cáº£ ká»³ bÃ¡o cÃ¡o</SelectItem>
                  {reportPeriodOptions.map(period => (
                    <SelectItem key={period.id} value={period.id}>
                      {period.name} ({formatDate(period.start_date)} - {formatDate(period.end_date)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32 text-gray-500">
              <BookOpen className="h-8 w-8 mr-2" />
              <span>ChÆ°a cÃ³ bÃ¡o cÃ¡o nÃ o</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map(notification => (
            <ReportCard
              key={notification.id}
              notification={notification}
              onViewReport={handleViewReport}
              onShowResponse={() => {
                setSelectedReport(notification)
                setShowResponseDialog(true)
              }}
              formatDate={formatDate}
            />
          ))}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                TrÆ°á»›c
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = pagination.page <= 3
                    ? i + 1
                    : pagination.page + i - 2

                  if (pageNum > pagination.totalPages) return null

                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              >
                Sau
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Pagination Info */}
          {pagination.total > 0 && (
            <div className="text-center text-sm text-gray-600 pt-2">
              Hiá»ƒn thá»‹ {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)}
              trong tá»•ng sá»‘ {pagination.total} bÃ¡o cÃ¡o
            </div>
          )}
        </div>
      )}

      {/* Report Detail Dialog */}
      {selectedReport && (
        <ReportDetailDialog
          report={selectedReport}
          open={!!selectedReport}
          onOpenChange={(open) => !open && setSelectedReport(null)}
          formatDate={formatDate}
        />
      )}

      {/* Response Dialog */}
      <ResponseDialog
        open={showResponseDialog}
        onOpenChange={setShowResponseDialog}
        responseForm={responseForm}
        setResponseForm={setResponseForm}
        onSubmit={handleSubmitResponse}
        submitting={sectionLoading.submitting}
        selectedReport={selectedReport}
      />
    </div>
  )
}

// Memoized ReportCard component for performance
const ReportCard = React.memo(({
  notification,
  onViewReport,
  onShowResponse,
  formatDate
}: {
  notification: ParentReportNotification
  onViewReport: (notification: ParentReportNotification) => void
  onShowResponse: () => void
  formatDate: (date: string) => string
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const report = notification.student_report
  const hasResponse = !!notification.parent_response?.responded_at

  if (!report) return null

  const handleCardClick = () => {
    setIsExpanded(!isExpanded)
    if (!notification.is_read) {
      onViewReport(notification)
    }
  }

  return (
    <Card className={`transition-all hover:shadow-md ${!notification.is_read ? 'border-blue-500 bg-blue-50/50' : ''}`}>
      <CardContent className="p-6">
        <div
          onClick={handleCardClick}
          className="w-full text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleCardClick()
            }
          }}
          aria-expanded={isExpanded}
          aria-label={`BÃ¡o cÃ¡o cá»§a ${report.student?.full_name}. ${isExpanded ? 'Thu gá»n' : 'Má»Ÿ rá»™ng'} Ä‘á»ƒ xem chi tiáº¿t`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              {/* Header */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="font-semibold">{report.student?.full_name}</span>
                  <Badge variant="outline">{report.student?.student_id}</Badge>
                </div>
                {!notification.is_read && (
                  <Badge className="bg-blue-600">Má»›i</Badge>
                )}
              </div>

            {/* Report Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span>{report.report_period?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-gray-500" />
                <span>{report.class?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span>{report.homeroom_teacher?.full_name}</span>
              </div>
            </div>

            {/* Report Summary */}
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-green-700">Æ¯u Ä‘iá»ƒm: </span>
                <span className="text-sm text-gray-600">
                  {report.strengths?.substring(0, 100)}
                  {report.strengths && report.strengths.length > 100 ? '...' : ''}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-orange-700">Khuyáº¿t Ä‘iá»ƒm: </span>
                <span className="text-sm text-gray-600">
                  {report.weaknesses?.substring(0, 100)}
                  {report.weaknesses && report.weaknesses.length > 100 ? '...' : ''}
                </span>
              </div>
            </div>

            {/* Response Status */}
            {hasResponse && (
              <div className="flex items-center gap-2 text-sm">
                {notification.parent_response?.agreement_status === 'agree' ? (
                  <>
                    <ThumbsUp className="h-4 w-4 text-green-600" />
                    <span className="text-green-600">ÄÃ£ pháº£n há»“i: Äá»“ng Ã½</span>
                  </>
                ) : (
                  <>
                    <ThumbsDown className="h-4 w-4 text-red-600" />
                    <span className="text-red-600">ÄÃ£ pháº£n há»“i: KhÃ´ng Ä‘á»“ng Ã½</span>
                  </>
                )}
                <span className="text-gray-500">
                  ({formatDate(notification.parent_response?.responded_at || '')})
                </span>
              </div>
            )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => { e.stopPropagation(); setIsExpanded(prev => !prev) }}
                aria-label={isExpanded ? 'Thu gá»n' : 'Xem chi tiáº¿t'}
              >
                {isExpanded ? 'Thu gá»n' : 'Xem chi tiáº¿t'}
              </Button>

              {!hasResponse && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onShowResponse()
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Pháº£n há»“i
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-6 pt-6 border-t space-y-4">
            {/* Report Period Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-sm font-medium">Ká»³ bÃ¡o cÃ¡o</Label>
                <p className="text-sm text-gray-600">{report.report_period?.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Thá»i gian</Label>
                <p className="text-sm text-gray-600">
                  {report.report_period?.start_date && report.report_period?.end_date ?
                    `${formatDate(report.report_period.start_date)} - ${formatDate(report.report_period.end_date)}` :
                    'ChÆ°a cÃ³ thÃ´ng tin'
                  }
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Lá»›p</Label>
                <p className="text-sm text-gray-600">{report.class?.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">NgÃ y gá»­i</Label>
                <p className="text-sm text-gray-600">
                  {report.sent_at ? formatDate(report.sent_at) : 'ChÆ°a gá»­i'}
                </p>
              </div>
            </div>

            {/* Academic Performance */}
            {report.academic_performance && (
              <div>
                <Label className="text-sm font-medium text-blue-600">Káº¿t quáº£ há»c táº­p</Label>
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                  {report.academic_performance}
                </p>
              </div>
            )}

            {/* Discipline Status */}
            {report.discipline_status && (
              <div>
                <Label className="text-sm font-medium text-green-600">TÃ¬nh hÃ¬nh rÃ¨n luyá»‡n</Label>
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                  {report.discipline_status}
                </p>
              </div>
            )}

            {/* Full Strengths */}
            <div>
              <Label className="text-sm font-medium text-green-600">Æ¯u Ä‘iá»ƒm</Label>
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                {report.strengths}
              </p>
            </div>

            {/* Full Weaknesses */}
            <div>
              <Label className="text-sm font-medium text-orange-600">Khuyáº¿t Ä‘iá»ƒm cáº§n kháº¯c phá»¥c</Label>
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                {report.weaknesses}
              </p>
            </div>

            {/* Parent Response */}
            {notification.parent_response?.responded_at && (
              <div>
                <Label className="text-sm font-medium text-blue-600">Pháº£n há»“i cá»§a phá»¥ huynh</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-medium">Má»©c Ä‘á»™ Ä‘á»“ng Ã½:</Label>
                    {notification.parent_response.agreement_status === 'agree' ? (
                      <Badge className="bg-green-100 text-green-800">Äá»“ng Ã½</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">KhÃ´ng Ä‘á»“ng Ã½</Badge>
                    )}
                  </div>

                  {notification.parent_response.comments && (
                    <div>
                      <Label className="text-xs font-medium">Nháº­n xÃ©t:</Label>
                      <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                        {notification.parent_response.comments}
                      </p>
                    </div>
                  )}

                  <div>
                    <Label className="text-xs font-medium">Thá»i gian pháº£n há»“i:</Label>
                    <p className="text-sm text-gray-600">
                      {formatDate(notification.parent_response.responded_at)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
})

ReportCard.displayName = 'ReportCard'

// Memoized ReportDetailDialog component
const ReportDetailDialog = React.memo(({
  report,
  open,
  onOpenChange,
  formatDate
}: {
  report: ParentReportNotification
  open: boolean
  onOpenChange: (open: boolean) => void
  formatDate: (date: string) => string
}) => {
  const reportData = report.student_report

  if (!reportData) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            BÃ¡o cÃ¡o há»c táº­p - {reportData.student?.full_name}
          </DialogTitle>
          <DialogDescription>
            {reportData.report_period?.name} â€¢ {reportData.class?.name} â€¢
            GiÃ¡o viÃªn: {reportData.homeroom_teacher?.full_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Period Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                ThÃ´ng tin ká»³ bÃ¡o cÃ¡o
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Ká»³ bÃ¡o cÃ¡o</Label>
                  <p className="text-sm text-gray-600">{reportData.report_period?.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Thá»i gian</Label>
                  <p className="text-sm text-gray-600">
                    {formatDate(reportData.report_period?.start_date || '')} - {formatDate(reportData.report_period?.end_date || '')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Lá»›p</Label>
                  <p className="text-sm text-gray-600">{reportData.class?.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">NgÃ y gá»­i</Label>
                  <p className="text-sm text-gray-600">
                    {reportData.sent_at ? formatDate(reportData.sent_at) : 'ChÆ°a gá»­i'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic Performance */}
          {reportData.academic_performance && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-blue-600" />
                  Káº¿t quáº£ há»c táº­p
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {reportData.academic_performance}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Discipline Status */}
          {reportData.discipline_status && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  TÃ¬nh hÃ¬nh rÃ¨n luyá»‡n
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {reportData.discipline_status}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Strengths */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ThumbsUp className="h-5 w-5 text-green-600" />
                Æ¯u Ä‘iá»ƒm
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {reportData.strengths}
              </p>
            </CardContent>
          </Card>

          {/* Weaknesses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                Khuyáº¿t Ä‘iá»ƒm cáº§n kháº¯c phá»¥c
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {reportData.weaknesses}
              </p>
            </CardContent>
          </Card>

          {/* Parent Response */}
          {report.parent_response?.responded_at && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Pháº£n há»“i cá»§a phá»¥ huynh
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">Má»©c Ä‘á»™ Ä‘á»“ng Ã½:</Label>
                    {report.parent_response.agreement_status === 'agree' ? (
                      <Badge className="bg-green-100 text-green-800">Äá»“ng Ã½</Badge>
                    ) : (
                      <Badge className="bg-red-100 text-red-800">KhÃ´ng Ä‘á»“ng Ã½</Badge>
                    )}
                  </div>

                  {report.parent_response.comments && (
                    <div>
                      <Label className="text-sm font-medium">Nháº­n xÃ©t:</Label>
                      <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                        {report.parent_response.comments}
                      </p>
                    </div>
                  )}

                  <div>
                    <Label className="text-sm font-medium">Thá»i gian pháº£n há»“i:</Label>
                    <p className="text-sm text-gray-600">
                      {formatDate(report.parent_response.responded_at)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
})

ReportDetailDialog.displayName = 'ReportDetailDialog'

// Memoized ResponseDialog component
const ResponseDialog = React.memo(({
  open,
  onOpenChange,
  responseForm,
  setResponseForm,
  onSubmit,
  submitting,
  selectedReport
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  responseForm: { agreement_status: string; comments: string }
  setResponseForm: React.Dispatch<React.SetStateAction<{ agreement_status: string; comments: string }>>
  onSubmit: () => void
  submitting: boolean
  selectedReport: ParentReportNotification | null
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Pháº£n há»“i bÃ¡o cÃ¡o
          </DialogTitle>
          <DialogDescription>
            Gá»­i pháº£n há»“i vá» bÃ¡o cÃ¡o há»c táº­p cá»§a {selectedReport?.student_report?.student?.full_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="agreement">Má»©c Ä‘á»™ Ä‘á»“ng Ã½ *</Label>
            <Select
              value={responseForm.agreement_status}
              onValueChange={(value) => setResponseForm(prev => ({ ...prev, agreement_status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chá»n má»©c Ä‘á»™ Ä‘á»“ng Ã½" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agree">
                  <div className="flex items-center gap-2">
                    <ThumbsUp className="h-4 w-4 text-green-600" />
                    Äá»“ng Ã½
                  </div>
                </SelectItem>
                <SelectItem value="disagree">
                  <div className="flex items-center gap-2">
                    <ThumbsDown className="h-4 w-4 text-red-600" />
                    KhÃ´ng Ä‘á»“ng Ã½
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="comments">Nháº­n xÃ©t thÃªm (tÃ¹y chá»n)</Label>
            <Textarea
              id="comments"
              value={responseForm.comments}
              onChange={(e) => setResponseForm(prev => ({ ...prev, comments: e.target.value }))}
              placeholder="Chia sáº» Ã½ kiáº¿n cá»§a báº¡n vá» bÃ¡o cÃ¡o nÃ y..."
              className="mt-1"
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Há»§y
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitting || !responseForm.agreement_status}
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Gá»­i pháº£n há»“i
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
})

ResponseDialog.displayName = 'ResponseDialog'
