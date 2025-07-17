'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  BookOpen, 
  School, 
  Users, 
  GraduationCap,
  Plus,
  Settings,
  Download,
  Upload,
  RefreshCw,
  AlertCircle
} from 'lucide-react'

interface AcademicTerm {
  id: string
  name: string
  type: string
  is_current: boolean
}

interface GradeLevel {
  id: string
  name: string
  level: number
}

interface Class {
  id: string
  name: string
  code: string
  grade_level_id: string
}

interface Subject {
  id: string
  code: string
  name: string
  credits: number
}

interface CurriculumAssignment {
  id: string
  subject: Subject
  type: 'mandatory' | 'elective'
  weekly_periods: number
  grade_level?: GradeLevel
  class?: Class
}

interface CurriculumSummary {
  mandatory: {
    count: number
    total_periods: number
    total_credits: number
  }
  elective: {
    count: number
    total_periods: number
    total_credits: number
  }
}

export default function CurriculumDistributionPage() {
  const [activeTab, setActiveTab] = useState('school')
  const [selectedTerm, setSelectedTerm] = useState<string>('')
  const [selectedGrade, setSelectedGrade] = useState<string>('')
  const [selectedClass, setSelectedClass] = useState<string>('')
  
  const [academicTerms, setAcademicTerms] = useState<AcademicTerm[]>([])
  const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [assignments, setAssignments] = useState<CurriculumAssignment[]>([])
  const [summary, setSummary] = useState<CurriculumSummary | null>(null)
  
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedTerm) {
      fetchCurriculumDistribution()
    }
  }, [selectedTerm, selectedGrade, selectedClass, activeTab])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      
      // Fetch academic terms, grade levels, and classes in parallel
      const [termsRes, gradesRes, classesRes] = await Promise.all([
        fetch('/api/academic-terms'),
        fetch('/api/grade-levels'),
        fetch('/api/classes')
      ])

      const [termsData, gradesData, classesData] = await Promise.all([
        termsRes.json(),
        gradesRes.json(),
        classesRes.json()
      ])

      const terms = termsData.data || termsData || [];
      const grades = gradesData.data || gradesData || [];
      const classes = classesData.data || classesData || [];
      
      setAcademicTerms(terms)
      setGradeLevels(grades)
      setClasses(classes)

      // Set current term as default
      const currentTerm = terms.find((term: AcademicTerm) => term.is_current)
      if (currentTerm) {
        setSelectedTerm(currentTerm.id)
      }

    } catch (error) {
      console.error('Error fetching initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCurriculumDistribution = async () => {
    if (!selectedTerm) return

    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        academic_term_id: selectedTerm,
        scope: activeTab
      })

      if (activeTab === 'grade' && selectedGrade) {
        params.append('grade_level_id', selectedGrade)
      } else if (activeTab === 'class' && selectedClass) {
        params.append('class_id', selectedClass)
      }

      const response = await fetch(`/api/curriculum-distribution?${params}`)
      const result = await response.json()

      if (response.ok) {
        setAssignments(result.data || [])
        setSummary(result.summary || null)
      } else {
        console.error('Error fetching curriculum distribution:', result.error)
      }

    } catch (error) {
      console.error('Error fetching curriculum distribution:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInitializeDefault = async () => {
    if (!selectedTerm) return

    try {
      setLoading(true)
      
      const response = await fetch('/api/curriculum-distribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'initialize_default',
          academic_term_id: selectedTerm,
          grade_level_id: activeTab === 'grade' ? selectedGrade : undefined
        })
      })

      const result = await response.json()

      if (response.ok) {
        await fetchCurriculumDistribution()
        alert(`Khởi tạo thành công ${result.count} môn học`)
      } else {
        alert('Error: ' + result.error)
      }

    } catch (error) {
      console.error('Error initializing curriculum:', error)
      alert('Error initializing curriculum')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyToSchool = async () => {
    if (!selectedTerm || assignments.length === 0) return

    try {
      setLoading(true)
      
      const response = await fetch('/api/curriculum-distribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'apply_to_school',
          academic_term_id: selectedTerm,
          assignments: assignments.map(a => ({
            subject_id: a.subject.id,
            type: a.type,
            weekly_periods: a.weekly_periods
          }))
        })
      })

      const result = await response.json()

      if (response.ok) {
        alert(`Áp dụng thành công cho toàn trường: ${result.count} môn học`)
      } else {
        alert('Error: ' + result.error)
      }

    } catch (error) {
      console.error('Error applying to school:', error)
      alert('Error applying to school')
    } finally {
      setLoading(false)
    }
  }

  const filteredClasses = classes.filter(c => 
    !selectedGrade || c.grade_level_id === selectedGrade
  )

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Khai báo Phân phối Chương trình</h1>
        <p className="text-gray-600">
          Thiết lập phân phối chương trình chung cho toàn trường và riêng từng lớp
        </p>
      </div>

      {/* Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Thiết lập
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="term">Học kỳ *</Label>
              <select
                id="term"
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn học kỳ</option>
                {academicTerms.map(term => (
                  <option key={term.id} value={term.id}>
                    {term.name} {term.is_current && '(Hiện tại)'}
                  </option>
                ))}
              </select>
            </div>

            {activeTab === 'grade' && (
              <div className="space-y-2">
                <Label htmlFor="grade">Khối lớp</Label>
                <select
                  id="grade"
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn khối lớp</option>
                  {gradeLevels.map(grade => (
                    <option key={grade.id} value={grade.id}>
                      {grade.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeTab === 'class' && (
              <div className="space-y-2">
                <Label htmlFor="class">Lớp học</Label>
                <select
                  id="class"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn lớp học</option>
                  {filteredClasses.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="school" className="flex items-center gap-2">
            <School className="w-4 h-4" />
            Thiết lập chung toàn trường
          </TabsTrigger>
          <TabsTrigger value="grade" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Thiết lập riêng theo khối
          </TabsTrigger>
          <TabsTrigger value="class" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Thiết lập riêng theo lớp
          </TabsTrigger>
        </TabsList>

        <TabsContent value="school" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Thiết lập chung cho toàn trường</h2>
              <p className="text-gray-600">
                Phân phối chương trình mặc định áp dụng cho tất cả các lớp
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleInitializeDefault} disabled={loading || !selectedTerm}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Khởi tạo mặc định
              </Button>
              <Button onClick={handleApplyToSchool} disabled={loading || !selectedTerm || assignments.length === 0}>
                <Download className="w-4 h-4 mr-2" />
                Áp dụng toàn trường
              </Button>
            </div>
          </div>

          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Môn Bắt buộc
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{summary.mandatory.count} môn</div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>Tổng tiết/tuần: {summary.mandatory.total_periods}</div>
                    <div>Tổng tín chỉ: {summary.mandatory.total_credits}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Môn Tự chọn
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{summary.elective.count} môn</div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>Tổng tiết/tuần: {summary.elective.total_periods}</div>
                    <div>Tổng tín chỉ: {summary.elective.total_credits}</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <CurriculumTable 
            assignments={assignments}
            loading={loading}
            onRefresh={fetchCurriculumDistribution}
          />
        </TabsContent>

        <TabsContent value="grade" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Thiết lập riêng theo khối lớp</h2>
              <p className="text-gray-600">
                Phân phối chương trình riêng cho từng khối lớp
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleInitializeDefault} disabled={loading || !selectedTerm || !selectedGrade}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Khởi tạo cho khối
              </Button>
            </div>
          </div>

          {selectedGrade ? (
            <CurriculumTable 
              assignments={assignments}
              loading={loading}
              onRefresh={fetchCurriculumDistribution}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Vui lòng chọn khối lớp để xem phân phối chương trình
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="class" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Thiết lập riêng theo lớp học</h2>
              <p className="text-gray-600">
                Phân phối chương trình riêng cho từng lớp học cụ thể
              </p>
            </div>
          </div>

          {selectedClass ? (
            <CurriculumTable 
              assignments={assignments}
              loading={loading}
              onRefresh={fetchCurriculumDistribution}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                Vui lòng chọn lớp học để xem phân phối chương trình
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Phân phối chương trình</h1>
        <p className="text-muted-foreground mt-2">
          Thiết lập phân phối chương trình học cho toàn trường và riêng từng lớp
        </p>
      </div>

      {/* System Explanation */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Hướng dẫn sử dụng phân phối chương trình
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700 space-y-3">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">🎯 Mục đích:</h4>
              <p className="text-sm">
                Phân phối chương trình xác định số tiết học mỗi tuần cho từng môn học. 
                Điều này cần thiết để hệ thống có thể tạo thời khóa biểu tự động.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📚 Mối quan hệ với cụm môn học:</h4>
              <p className="text-sm">
                - <strong>Môn bắt buộc (8 môn):</strong> Tất cả học sinh học chung ở lớp gốc<br/>
                - <strong>Môn tự chọn:</strong> Học sinh học theo cụm khoa học tự nhiên/xã hội ở lớp ghép
              </p>
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-blue-200">
            <p className="text-sm font-medium">
              💡 <strong>Lưu ý:</strong> Sau khi thiết lập phân phối chương trình, bạn cần:
            </p>
            <ol className="text-sm mt-2 space-y-1 ml-4 list-decimal">
              <li>Phân công giáo viên dạy từng môn cho các lớp</li>
              <li>Tạo thời khóa biểu tự động dựa trên phân phối này</li>
              <li>Điều chỉnh thời khóa biểu nếu cần thiết</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function CurriculumTable({ 
  assignments, 
  loading, 
  onRefresh 
}: { 
  assignments: CurriculumAssignment[]
  loading: boolean
  onRefresh: () => void
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">Đang tải...</p>
        </CardContent>
      </Card>
    )
  }

  if (assignments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 mb-4">Chưa có phân phối chương trình</p>
          <Button onClick={onRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tải lại
          </Button>
        </CardContent>
      </Card>
    )
  }

  const mandatory = assignments.filter(a => a.type === 'mandatory')
  const elective = assignments.filter(a => a.type === 'elective')

  return (
    <div className="space-y-6">
      {/* Mandatory Subjects */}
      {mandatory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Môn Bắt buộc ({mandatory.length} môn)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Mã môn</th>
                    <th className="text-left py-2">Tên môn học</th>
                    <th className="text-center py-2">Tín chỉ</th>
                    <th className="text-center py-2">Tiết/tuần</th>
                    <th className="text-center py-2">Loại</th>
                  </tr>
                </thead>
                <tbody>
                  {mandatory.map((assignment) => (
                    <tr key={assignment.id} className="border-b">
                      <td className="py-2 font-mono text-sm">{assignment.subject.code}</td>
                      <td className="py-2">{assignment.subject.name}</td>
                      <td className="py-2 text-center">{assignment.subject.credits}</td>
                      <td className="py-2 text-center">{assignment.weekly_periods}</td>
                      <td className="py-2 text-center">
                        <Badge variant="default" className="bg-blue-100 text-blue-800">
                          Bắt buộc
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Elective Subjects */}
      {elective.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Môn Tự chọn ({elective.length} môn)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Mã môn</th>
                    <th className="text-left py-2">Tên môn học</th>
                    <th className="text-center py-2">Tín chỉ</th>
                    <th className="text-center py-2">Tiết/tuần</th>
                    <th className="text-center py-2">Loại</th>
                  </tr>
                </thead>
                <tbody>
                  {elective.map((assignment) => (
                    <tr key={assignment.id} className="border-b">
                      <td className="py-2 font-mono text-sm">{assignment.subject.code}</td>
                      <td className="py-2">{assignment.subject.name}</td>
                      <td className="py-2 text-center">{assignment.subject.credits}</td>
                      <td className="py-2 text-center">{assignment.weekly_periods}</td>
                      <td className="py-2 text-center">
                        <Badge variant="outline" className="bg-green-100 text-green-800">
                          Tự chọn
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 