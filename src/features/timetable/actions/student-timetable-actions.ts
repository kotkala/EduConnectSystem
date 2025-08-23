'use server'

import { createClient } from '@/lib/supabase/server'
import { checkStudentPermissions } from '@/lib/utils/permission-utils'

interface TimetableEvent {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  week_number: number
  notes?: string
  subject?: {
    id: string
    name_vietnamese: string
    code: string
  }
  teacher?: {
    id: string
    full_name: string
  }
  classroom?: {
    id: string
    name: string
    building?: string
    floor?: number
  }
  class?: {
    id: string
    name: string
  }
}

interface StudentClass {
  id: string
  name: string
  assignment_type: 'main' | 'combined'
}

interface StudentTimetableFilters {
  classId?: string
  weekNumber?: number
}

export async function getStudentTimetableAction(filters: StudentTimetableFilters = {}) {
  try {
    const { userId } = await checkStudentPermissions()
    const supabase = await createClient()

    // Get student's class assignments (both main and combined)
    const { data: classAssignments, error: classError } = await supabase
      .from('class_assignments')
      .select(`
        class_id,
        assignment_type,
        classes!class_assignments_class_id_fkey(
          id,
          name
        )
      `)
      .eq('user_id', userId)
      .eq('assignment_type', 'student')
      .eq('is_active', true)

    if (classError) {
      console.error('Error fetching class assignments:', classError)
      throw new Error('Lỗi khi tải thông tin lớp học')
    }

    if (!classAssignments || classAssignments.length === 0) {
      console.error('No class assignments found for student:', userId)
      throw new Error('Bạn chưa được phân công vào lớp học nào. Vui lòng liên hệ với ban giám hiệu để được hỗ trợ.')
    }

    // Transform class assignments
    const studentClasses: StudentClass[] = classAssignments.map(assignment => {
      const classData = Array.isArray(assignment.classes) ? assignment.classes[0] : assignment.classes
      return {
        id: assignment.class_id,
        name: classData?.name || 'Unknown Class',
        assignment_type: assignment.assignment_type
      }
    })

    // Get class IDs to query timetable
    const classIds = filters.classId ? [filters.classId] : studentClasses.map(cls => cls.id)

    // Get timetable events for the student's classes
    let timetableQuery = supabase
      .from('timetable_events')
      .select(`
        id,
        day_of_week,
        start_time,
        end_time,
        week_number,
        notes,
        subject:subjects!timetable_events_subject_id_fkey(
          id,
          name_vietnamese,
          code
        ),
        teacher:profiles!timetable_events_teacher_id_fkey(
          id,
          full_name
        ),
        classroom:classrooms!timetable_events_classroom_id_fkey(
          id,
          name,
          building,
          floor
        ),
        class:classes!timetable_events_class_id_fkey(
          id,
          name
        )
      `)
      .in('class_id', classIds)
      .order('day_of_week')
      .order('start_time')

    // Apply week filter if specified
    if (filters.weekNumber) {
      timetableQuery = timetableQuery.eq('week_number', filters.weekNumber)
    }

    const { data: timetableEvents, error: timetableError } = await timetableQuery

    if (timetableError) {
      console.error('Error fetching timetable events:', timetableError)
      throw new Error('Lỗi khi tải thời khóa biểu')
    }

    return {
      success: true,
      data: {
        events: timetableEvents as unknown as TimetableEvent[],
        classes: studentClasses
      }
    }
  } catch (error) {
    console.error('getStudentTimetableAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể tải thời khóa biểu'
    }
  }
}

// Get student's personal grades
export async function getStudentGradesAction() {
  try {
    const { userId } = await checkStudentPermissions()
    const supabase = await createClient()

    // Get student's class assignments to get class IDs
    const { data: classAssignments, error: classError } = await supabase
      .from('class_assignments')
      .select('class_id')
      .eq('user_id', userId)
      .eq('assignment_type', 'student')
      .eq('is_active', true)

    if (classError) {
      console.error('Error fetching class assignments:', classError)
      throw new Error('Lỗi khi tải thông tin lớp học')
    }

    if (!classAssignments || classAssignments.length === 0) {
      throw new Error('Bạn chưa được phân công vào lớp học nào.')
    }

    const classIds = classAssignments.map(assignment => assignment.class_id)

    // Get student's detailed grades
    const { data: grades, error: gradesError } = await supabase
      .from('student_detailed_grades')
      .select(`
        id,
        grade_value,
        component_type,
        notes,
        created_at,
        subject:subjects!student_detailed_grades_subject_id_fkey(
          id,
          name_vietnamese,
          code,
          category
        ),
        class:classes!student_detailed_grades_class_id_fkey(
          id,
          name
        ),
        period:grade_reporting_periods!student_detailed_grades_period_id_fkey(
          id,
          name,
          start_date,
          end_date
        )
      `)
      .eq('student_id', userId)
      .in('class_id', classIds)
      .order('created_at', { ascending: false })

    if (gradesError) {
      console.error('Error fetching student grades:', gradesError)
      throw new Error('Lỗi khi tải điểm số')
    }

    return {
      success: true,
      data: grades || []
    }
  } catch (error) {
    console.error('getStudentGradesAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể tải điểm số'
    }
  }
}

// Get student's grade summary by subject and period
export async function getStudentGradeSummaryAction() {
  try {
    const { userId } = await checkStudentPermissions()
    const supabase = await createClient()

    // Get student's class assignments
    const { data: classAssignments, error: classError } = await supabase
      .from('class_assignments')
      .select('class_id')
      .eq('user_id', userId)
      .eq('assignment_type', 'student')
      .eq('is_active', true)

    if (classError) {
      throw new Error('Lỗi khi tải thông tin lớp học')
    }

    if (!classAssignments || classAssignments.length === 0) {
      throw new Error('Bạn chưa được phân công vào lớp học nào.')
    }

    const classIds = classAssignments.map(assignment => assignment.class_id)

    // Get grade summary grouped by subject and period
    const { data: gradeSummary, error: summaryError } = await supabase
      .from('student_detailed_grades')
      .select(`
        subject_id,
        period_id,
        grade_value,
        component_type,
        subject:subjects!student_detailed_grades_subject_id_fkey(
          id,
          name_vietnamese,
          code,
          category
        ),
        period:grade_reporting_periods!student_detailed_grades_period_id_fkey(
          id,
          name,
          start_date,
          end_date
        )
      `)
      .eq('student_id', userId)
      .in('class_id', classIds)
      .order('period_id')
      .order('subject_id')

    if (summaryError) {
      throw new Error('Lỗi khi tải tổng hợp điểm số')
    }

    // Group grades by subject and period
    interface GroupedGrade {
      subject: {
        id: string
        name_vietnamese: string
        code: string
        category: string
      }
      period: {
        id: string
        name: string
        start_date: string
        end_date: string
      }
      grades: Array<{
        value: number
        type: string
        weight: number
      }>
      average: number
    }

    const groupedGrades = (gradeSummary || []).reduce((acc, grade) => {
      const key = `${grade.subject_id}-${grade.period_id}`
      if (!acc[key]) {
        const subjectData = Array.isArray(grade.subject) ? grade.subject[0] : grade.subject
        const periodData = Array.isArray(grade.period) ? grade.period[0] : grade.period
        acc[key] = {
          subject: subjectData,
          period: periodData,
          grades: [],
          average: 0
        }
      }
      acc[key].grades.push({
        value: grade.grade_value,
        type: grade.component_type,
        weight: 1 // Default weight since the table doesn't have grade_weight
      })
      return acc
    }, {} as Record<string, GroupedGrade>)

    // Calculate averages (simple average since no weights)
    Object.values(groupedGrades).forEach((group: GroupedGrade) => {
      if (group.grades.length > 0) {
        const sum = group.grades.reduce((total: number, grade) => total + grade.value, 0)
        group.average = sum / group.grades.length
      }
    })

    return {
      success: true,
      data: Object.values(groupedGrades)
    }
  } catch (error) {
    console.error('getStudentGradeSummaryAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể tải tổng hợp điểm số'
    }
  }
}
