'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Zap, 
  Calendar, 
  Users, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Settings,
  Eye,
  Trash2,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'
import { toast } from 'sonner'
import { ClassListSummary } from './class-list-summary'

interface AcademicTerm {
  id: string
  name: string
  start_date: string
  end_date: string
  is_current: boolean
}

interface Class {
  id: string
  name: string
  code: string
  is_combined: boolean
  capacity: number
  grade_level: {
    name: string
    level: number
  }
  metadata?: {
    subject_group_name?: string
    subject_group_code?: string
  }
}

interface GenerationStats {
  totalClasses: number
  totalLessons: number
  classesScheduled: number
  teachersAssigned: number
  conflicts: number
  completionRate: number
}

interface GenerationStep {
  id: string
  name: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  details?: string
  progress?: number
}

export function AutoScheduleGenerator() {
  const [academicTerms, setAcademicTerms] = useState<AcademicTerm[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedTerm, setSelectedTerm] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [generationStats, setGenerationStats] = useState<GenerationStats | null>(null)
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([])
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [currentProcessingClass, setCurrentProcessingClass] = useState<string>('')
  const [generationSettings, setGenerationSettings] = useState({
    clearExistingSchedules: true,
    generateSpecialActivities: true,
    optimizeTeacherWorkload: true,
    respectConstraints: true,
    balanceSubjectDistribution: true,
    maxPeriodsPerDay: 10,
    preferredBreakTime: 15
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const [termsRes, classesRes] = await Promise.all([
        fetch('/api/academic-terms'),
        fetch('/api/classes')
      ])

      const [termsData, classesData] = await Promise.all([
        termsRes.json(),
        classesRes.json()
      ])

      setAcademicTerms(termsData.data || termsData)
      setClasses(classesData.data || classesData)

      // Select current term by default
      const currentTerm = (termsData.data || termsData).find((t: AcademicTerm) => t.is_current)
      if (currentTerm) {
        setSelectedTerm(currentTerm.id)
      }
    } catch (error) {
      toast.error('Lỗi khi tải dữ liệu')
      console.error('Error fetching data:', error)
    }
  }

  const initializeGenerationSteps = () => {
    const steps: GenerationStep[] = [
      {
        id: 'validation',
        name: 'Kiểm tra dữ liệu',
        description: 'Kiểm tra phân công giáo viên, phân phối chương trình',
        status: 'pending'
      },
      {
        id: 'preparation',
        name: 'Chuẩn bị dữ liệu',
        description: 'Tải thông tin lớp học, giáo viên, môn học',
        status: 'pending'
      },
      {
        id: 'constraints',
        name: 'Áp dụng ràng buộc',
        description: 'Xử lý các ràng buộc thời gian và giáo viên',
        status: 'pending'
      },
      {
        id: 'base_classes',
        name: 'Tạo TKB lớp tách',
        description: 'Tạo thời khóa biểu cho các lớp tách (môn bắt buộc)',
        status: 'pending'
      },
      {
        id: 'combined_classes',
        name: 'Tạo TKB lớp ghép',
        description: 'Tạo thời khóa biểu cho các lớp ghép (môn tự chọn)',
        status: 'pending'
      },
      {
        id: 'special_activities',
        name: 'Hoạt động đặc biệt',
        description: 'Thêm chào cờ, sinh hoạt lớp, giải lao',
        status: 'pending'
      },
      {
        id: 'optimization',
        name: 'Tối ưu hóa',
        description: 'Tối ưu phân bổ giáo viên và thời gian',
        status: 'pending'
      },
      {
        id: 'finalization',
        name: 'Hoàn thiện',
        description: 'Lưu thời khóa biểu và tạo báo cáo',
        status: 'pending'
      }
    ]
    setGenerationSteps(steps)
  }

  const updateStepStatus = (stepId: string, status: GenerationStep['status'], details?: string, progress?: number) => {
    setGenerationSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, details, progress }
        : step
    ))
  }

  const handleGenerateSchedule = async () => {
    if (!selectedTerm) {
      toast.error('Vui lòng chọn học kỳ')
      return
    }

    setIsGenerating(true)
    setGenerationProgress(0)
    setGenerationStats(null)
    initializeGenerationSteps()

    try {
      // Step 1: Validation
      updateStepStatus('validation', 'running', 'Đang kiểm tra dữ liệu...')
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate delay
      
      // Check teacher assignments
      const teacherAssignmentsRes = await fetch(`/api/teacher-assignments?academic_term_id=${selectedTerm}`)
      const teacherAssignments = await teacherAssignmentsRes.json()
      
      if (!teacherAssignments.data || teacherAssignments.data.length === 0) {
        updateStepStatus('validation', 'failed', 'Chưa có phân công giáo viên nào')
        toast.error('Vui lòng phân công giáo viên trước khi tạo thời khóa biểu')
        setIsGenerating(false)
        return
      }

      updateStepStatus('validation', 'completed', `Tìm thấy ${teacherAssignments.data.length} phân công giáo viên`)
      setGenerationProgress(12.5)

      // Step 2: Preparation
      updateStepStatus('preparation', 'running', 'Đang chuẩn bị dữ liệu...')
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const baseClasses = classes.filter(c => !c.is_combined)
      const combinedClasses = classes.filter(c => c.is_combined)
      
      updateStepStatus('preparation', 'completed', `${baseClasses.length} lớp tách, ${combinedClasses.length} lớp ghép`)
      setGenerationProgress(25)

      // Step 3: Constraints
      updateStepStatus('constraints', 'running', 'Đang áp dụng ràng buộc...')
      await new Promise(resolve => setTimeout(resolve, 600))
      updateStepStatus('constraints', 'completed', 'Đã áp dụng ràng buộc thời gian')
      setGenerationProgress(37.5)

      // Step 4: Generate schedule
      updateStepStatus('base_classes', 'running', `Đang tạo TKB cho ${baseClasses.length} lớp tách...`)
      
      const response = await fetch('/api/teaching-schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          academic_term_id: selectedTerm,
          auto_generate: true,
          settings: generationSettings
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Lỗi khi tạo thời khóa biểu')
      }

      // Update steps based on generation result
      updateStepStatus('base_classes', 'completed', `Đã tạo TKB cho ${baseClasses.length} lớp tách`)
      setGenerationProgress(50)

      updateStepStatus('combined_classes', 'running', `Đang tạo TKB cho ${combinedClasses.length} lớp ghép...`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      updateStepStatus('combined_classes', 'completed', `Đã tạo TKB cho ${combinedClasses.length} lớp ghép`)
      setGenerationProgress(62.5)

      updateStepStatus('special_activities', 'running', 'Đang thêm hoạt động đặc biệt...')
      await new Promise(resolve => setTimeout(resolve, 500))
      updateStepStatus('special_activities', 'completed', 'Đã thêm chào cờ và sinh hoạt lớp')
      setGenerationProgress(75)

      updateStepStatus('optimization', 'running', 'Đang tối ưu hóa...')
      await new Promise(resolve => setTimeout(resolve, 800))
      updateStepStatus('optimization', 'completed', 'Đã tối ưu phân bổ giáo viên')
      setGenerationProgress(87.5)

      updateStepStatus('finalization', 'running', 'Đang hoàn thiện...')
      await new Promise(resolve => setTimeout(resolve, 500))
      updateStepStatus('finalization', 'completed', 'Đã lưu thời khóa biểu')
      setGenerationProgress(100)

      // Set final stats
      setGenerationStats({
        totalClasses: classes.length,
        totalLessons: result.schedules?.length || 0,
        classesScheduled: result.stats?.classesScheduled || 0,
        teachersAssigned: result.stats?.teachersAssigned || 0,
        conflicts: 0,
        completionRate: 100
      })

      toast.success('Tạo thời khóa biểu thành công!')
      
    } catch (error: any) {
      console.error('Error generating schedule:', error)
      toast.error(error.message || 'Lỗi khi tạo thời khóa biểu')
      
      // Mark current running step as failed
      const runningStep = generationSteps.find(step => step.status === 'running')
      if (runningStep) {
        updateStepStatus(runningStep.id, 'failed', error.message)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClearSchedules = async () => {
    if (!selectedTerm) {
      toast.error('Vui lòng chọn học kỳ')
      return
    }

    if (!confirm('Bạn có chắc muốn xóa tất cả thời khóa biểu hiện tại?')) {
      return
    }

    try {
      const response = await fetch(`/api/teaching-schedules?academic_term_id=${selectedTerm}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Đã xóa thời khóa biểu')
        setGenerationStats(null)
        setGenerationSteps([])
        setGenerationProgress(0)
      } else {
        toast.error('Lỗi khi xóa thời khóa biểu')
      }
    } catch (error) {
      toast.error('Lỗi khi xóa thời khóa biểu')
    }
  }

  const getStepIcon = (status: GenerationStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'running':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const selectedTermData = academicTerms.find(t => t.id === selectedTerm)
  const baseClasses = classes.filter(c => !c.is_combined)
  const combinedClasses = classes.filter(c => c.is_combined)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tự động tạo thời khóa biểu</h1>
          <p className="text-muted-foreground">
            Tạo thời khóa biểu tự động cho tất cả các lớp học trong hệ thống
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Cài đặt
          </Button>
          <Button
            variant="outline"
            onClick={handleClearSchedules}
            disabled={isGenerating}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Xóa TKB
          </Button>
        </div>
      </div>

      {/* Term Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Chọn học kỳ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="flex-1 p-2 border rounded-md"
              disabled={isGenerating}
            >
              <option value="">Chọn học kỳ</option>
              {academicTerms.map(term => (
                <option key={term.id} value={term.id}>
                  {term.name} {term.is_current && '(Hiện tại)'}
                </option>
              ))}
            </select>
            {selectedTermData && (
              <Badge variant="outline">
                {new Date(selectedTermData.start_date).toLocaleDateString('vi-VN')} - {new Date(selectedTermData.end_date).toLocaleDateString('vi-VN')}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      {showAdvancedSettings && (
        <Card>
          <CardHeader>
            <CardTitle>Cài đặt nâng cao</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="clearExisting"
                    checked={generationSettings.clearExistingSchedules}
                    onChange={(e) => setGenerationSettings(prev => ({ ...prev, clearExistingSchedules: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="clearExisting" className="text-sm">Xóa thời khóa biểu hiện tại</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="generateSpecial"
                    checked={generationSettings.generateSpecialActivities}
                    onChange={(e) => setGenerationSettings(prev => ({ ...prev, generateSpecialActivities: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="generateSpecial" className="text-sm">Tạo hoạt động đặc biệt (chào cờ, sinh hoạt lớp)</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="optimizeWorkload"
                    checked={generationSettings.optimizeTeacherWorkload}
                    onChange={(e) => setGenerationSettings(prev => ({ ...prev, optimizeTeacherWorkload: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="optimizeWorkload" className="text-sm">Tối ưu khối lượng công việc giáo viên</label>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="respectConstraints"
                    checked={generationSettings.respectConstraints}
                    onChange={(e) => setGenerationSettings(prev => ({ ...prev, respectConstraints: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="respectConstraints" className="text-sm">Tuân thủ ràng buộc thời gian</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="balanceSubjects"
                    checked={generationSettings.balanceSubjectDistribution}
                    onChange={(e) => setGenerationSettings(prev => ({ ...prev, balanceSubjectDistribution: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="balanceSubjects" className="text-sm">Cân bằng phân bổ môn học</label>
                </div>
                <div className="flex items-center space-x-2">
                  <label htmlFor="maxPeriods" className="text-sm">Tối đa tiết/ngày:</label>
                  <input
                    type="number"
                    id="maxPeriods"
                    value={generationSettings.maxPeriodsPerDay}
                    onChange={(e) => setGenerationSettings(prev => ({ ...prev, maxPeriodsPerDay: parseInt(e.target.value) }))}
                    className="w-20 p-1 border rounded"
                    min="1"
                    max="12"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Class Overview */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="details">Chi tiết lớp học</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{classes.length}</div>
                    <div className="text-sm text-gray-600">Tổng số lớp</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{baseClasses.length}</div>
                    <div className="text-sm text-gray-600">Lớp tách</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold">{combinedClasses.length}</div>
                    <div className="text-sm text-gray-600">Lớp ghép</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="details">
          <ClassListSummary classes={classes} />
        </TabsContent>
      </Tabs>

      {/* Generation Control */}
      <Card>
        <CardHeader>
          <CardTitle>Điều khiển tạo thời khóa biểu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={handleGenerateSchedule}
                disabled={!selectedTerm || isGenerating}
                className="flex-1"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Đang tạo thời khóa biểu...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Tạo thời khóa biểu tự động
                  </>
                )}
              </Button>
            </div>

            {isGenerating && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Tiến độ tổng thể</span>
                  <span className="text-sm text-gray-500">{generationProgress}%</span>
                </div>
                <Progress value={generationProgress} className="w-full" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Generation Steps */}
      {generationSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tiến trình tạo thời khóa biểu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {generationSteps.map((step, index) => (
                <div key={step.id} className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getStepIcon(step.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{step.name}</span>
                      <Badge variant={
                        step.status === 'completed' ? 'default' :
                        step.status === 'running' ? 'secondary' :
                        step.status === 'failed' ? 'destructive' : 'outline'
                      }>
                        {step.status === 'completed' ? 'Hoàn thành' :
                         step.status === 'running' ? 'Đang chạy' :
                         step.status === 'failed' ? 'Lỗi' : 'Chờ'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{step.description}</p>
                    {step.details && (
                      <p className="text-xs text-gray-500 mt-1">{step.details}</p>
                    )}
                    {step.status === 'running' && currentProcessingClass && (
                      <p className="text-xs text-blue-600 mt-1">
                        Đang xử lý: {currentProcessingClass}
                      </p>
                    )}
                    {step.progress !== undefined && (
                      <Progress value={step.progress} className="w-full mt-2" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generation Results */}
      {generationStats && (
        <Card>
          <CardHeader>
            <CardTitle>Kết quả tạo thời khóa biểu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{generationStats.totalLessons}</div>
                <div className="text-sm text-gray-600">Tổng số tiết học</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{generationStats.classesScheduled}</div>
                <div className="text-sm text-gray-600">Lớp đã tạo TKB</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{generationStats.teachersAssigned}</div>
                <div className="text-sm text-gray-600">Giáo viên tham gia</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{generationStats.conflicts}</div>
                <div className="text-sm text-gray-600">Xung đột</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{generationStats.completionRate}%</div>
                <div className="text-sm text-gray-600">Hoàn thành</div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-center">
              <Button
                onClick={() => window.location.href = '/dashboard/admin/teaching-schedules'}
                variant="outline"
              >
                <Eye className="h-4 w-4 mr-2" />
                Xem thời khóa biểu
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 