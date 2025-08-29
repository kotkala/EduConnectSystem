"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import { Label } from "@/shared/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { Calendar, Clock, BookOpen, Users, Send } from "lucide-react"
import { toast } from "sonner"
import { createScheduleChangeRequestAction } from "../actions/schedule-change-actions"
import { type ScheduleChangeRequestFormData } from "../types/schedule-change-types"

interface AcademicYear {
  id: string
  name: string
  is_current: boolean
}

interface Semester {
  id: string
  name: string
  is_current: boolean
}

interface Subject {
  id: string
  name_vietnamese: string
  code: string
}

interface Class {
  id: string
  name: string
}

interface TeacherScheduleChangeFormProps {
  onSuccess?: () => void
}

export default function TeacherScheduleChangeForm({ onSuccess }: TeacherScheduleChangeFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  
  const [formData, setFormData] = useState<ScheduleChangeRequestFormData>({
    academic_year_id: '',
    semester_id: '',
    week_number: 1,
    change_date: '',
    subject_id: '',
    class_id: '',
    original_period: 1,
    reason: ''
  })

  // Load academic years
  useEffect(() => {
    const loadAcademicYears = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        const { data, error } = await supabase
          .from('academic_years')
          .select('id, name, is_current')
          .order('is_current', { ascending: false })

        if (error) throw error
        
        setAcademicYears(data || [])
        
        // Auto-select current academic year
        const currentYear = data?.find(year => year.is_current)
        if (currentYear) {
          setFormData(prev => ({ ...prev, academic_year_id: currentYear.id }))
        }
      } catch (error) {
        console.error('Error loading academic years:', error)
        toast.error('Không thể tải danh sách năm học')
      }
    }
    
    loadAcademicYears()
  }, [])

  // Load semesters when academic year changes
  useEffect(() => {
    if (!formData.academic_year_id) return
    
    const loadSemesters = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        const { data, error } = await supabase
          .from('semesters')
          .select('id, name, is_current')
          .eq('academic_year_id', formData.academic_year_id)
          .order('is_current', { ascending: false })

        if (error) throw error
        
        setSemesters(data || [])
        
        // Auto-select current semester
        const currentSemester = data?.find(semester => semester.is_current)
        if (currentSemester) {
          setFormData(prev => ({ ...prev, semester_id: currentSemester.id }))
        }
      } catch (error) {
        console.error('Error loading semesters:', error)
        toast.error('Không thể tải danh sách học kỳ')
      }
    }
    
    loadSemesters()
  }, [formData.academic_year_id])

  // Load teacher's subjects and classes
  useEffect(() => {
    if (!formData.academic_year_id || !formData.semester_id) return
    
    const loadTeacherData = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get teacher's subjects and classes from timetable
        const { data: timetableData, error } = await supabase
          .from('timetable_events')
          .select(`
            subject:subjects(id, name_vietnamese, code),
            class:classes(id, name)
          `)
          .eq('teacher_id', user.id)
          .eq('semester_id', formData.semester_id)

        if (error) throw error

        // Extract unique subjects and classes
        const subjectMap = new Map<string, Subject>()
        const classMap = new Map<string, Class>()

        timetableData?.forEach(item => {
          // Handle array format from Supabase
          const subject = Array.isArray(item.subject) ? item.subject[0] : item.subject
          const classItem = Array.isArray(item.class) ? item.class[0] : item.class

          if (subject?.id) {
            subjectMap.set(subject.id, subject)
          }
          if (classItem?.id) {
            classMap.set(classItem.id, classItem)
          }
        })

        const uniqueSubjects = Array.from(subjectMap.values())
        const uniqueClasses = Array.from(classMap.values())

        setSubjects(uniqueSubjects)
        setClasses(uniqueClasses)
      } catch (error) {
        console.error('Error loading teacher data:', error)
        toast.error('Không thể tải danh sách môn học và lớp')
      }
    }
    
    loadTeacherData()
  }, [formData.academic_year_id, formData.semester_id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.academic_year_id || !formData.semester_id || !formData.subject_id || 
        !formData.class_id || !formData.change_date || !formData.reason.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }

    setLoading(true)
    
    try {
      const result = await createScheduleChangeRequestAction(formData)
      
      if (result.success) {
        toast.success('Đã gửi đơn thay đổi lịch dạy thành công')
        if (onSuccess) {
          onSuccess()
        } else {
          router.push('/dashboard/teacher/schedule-change')
        }
      } else {
        toast.error(result.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Error creating request:', error)
      toast.error('Có lỗi xảy ra khi gửi đơn')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Tạo Đơn Thay Đổi Lịch Dạy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Academic Year and Semester */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="academic-year">Năm học</Label>
                <Select
                  value={formData.academic_year_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, academic_year_id: value }))}
                >
                  <SelectTrigger id="academic-year">
                    <SelectValue placeholder="Chọn năm học" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.name} {year.is_current && '(Hiện tại)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="semester">Học kỳ</Label>
                <Select
                  value={formData.semester_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, semester_id: value }))}
                >
                  <SelectTrigger id="semester">
                    <SelectValue placeholder="Chọn học kỳ" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((semester) => (
                      <SelectItem key={semester.id} value={semester.id}>
                        {semester.name} {semester.is_current && '(Hiện tại)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Week and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="week">Tuần học</Label>
                <Select
                  value={formData.week_number.toString()}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, week_number: parseInt(value) }))}
                >
                  <SelectTrigger id="week">
                    <SelectValue placeholder="Chọn tuần" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 52 }, (_, i) => i + 1).map((week) => (
                      <SelectItem key={week} value={week.toString()}>
                        Tuần {week}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Ngày thay đổi</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.change_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, change_date: e.target.value }))}
                  required
                />
              </div>
            </div>

            {/* Subject and Class */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Môn học</Label>
                <Select
                  value={formData.subject_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, subject_id: value }))}
                >
                  <SelectTrigger id="subject">
                    <SelectValue placeholder="Chọn môn học" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          {subject.name_vietnamese} ({subject.code})
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="class">Lớp học</Label>
                <Select
                  value={formData.class_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, class_id: value }))}
                >
                  <SelectTrigger id="class">
                    <SelectValue placeholder="Chọn lớp" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {classItem.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Period */}
            <div className="space-y-2">
              <Label htmlFor="period">Tiết học</Label>
              <Select
                value={formData.original_period.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, original_period: parseInt(value) }))}
              >
                <SelectTrigger id="period">
                  <SelectValue placeholder="Chọn tiết học" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((period) => (
                    <SelectItem key={period} value={period.toString()}>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Tiết {period}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">Lý do thay đổi</Label>
              <Textarea
                id="reason"
                placeholder="Nhập lý do cần thay đổi lịch dạy..."
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                rows={4}
                required
              />
            </div>

            {/* Submit Button */}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>Đang gửi...</>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Gửi Đơn Thay Đổi
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
