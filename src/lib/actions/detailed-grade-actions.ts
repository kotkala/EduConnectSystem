'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/shared/utils/supabase/admin'
import { createClient } from "@/lib/supabase/server"
import { checkAdminPermissions, checkTeacherPermissions } from '@/lib/utils/permission-utils'
import { logGradeUpdateAudit, logGradeCreateAudit } from '@/lib/utils/audit-utils'
import { GoogleGenAI } from '@google/genai'
import {
  detailedGradeSchema,
  bulkDetailedGradeSchema,
  type GradeComponentType,
  type DetailedGradeFormData,
  type BulkDetailedGradeFormData
} from '@/lib/validations/detailed-grade-validations'

// Interface for AI feedback generation
interface StudentGradeData {
  student?: {
    full_name: string
    student_id: string
  }
  subjects: {
    [subjectCode: string]: {
      subject?: {
        name_vietnamese: string
        code: string
        category: string
      }
      grades: Array<{
        component_type: GradeComponentType
        grade_value: number | null
      }>
    }
  }
}

interface StudentGradesCollection {
  [studentId: string]: StudentGradeData
}

// Create or update detailed grade
export async function createDetailedGradeAction(formData: DetailedGradeFormData) {
  try {
    const { userId } = await checkAdminPermissions()
    const validatedData = detailedGradeSchema.parse(formData)
    
    const supabase = createAdminClient()

    // Check if grade already exists for this combination
    const { data: existingGrade } = await supabase
      .from('student_detailed_grades')
      .select('id, grade_value')
      .eq('period_id', validatedData.period_id)
      .eq('student_id', validatedData.student_id)
      .eq('subject_id', validatedData.subject_id)
      .eq('class_id', validatedData.class_id)
      .eq('component_type', validatedData.component_type)
      .single()

    let result
    if (existingGrade) {
      // Update existing grade
      const { data: grade, error } = await supabase
        .from('student_detailed_grades')
        .update({
          grade_value: validatedData.grade_value,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingGrade.id)
        .select(`
          id,
          period_id,
          student_id,
          subject_id,
          class_id,
          component_type,
          grade_value,
          is_locked,
          created_by,
          created_at,
          updated_at,
          student:profiles!student_id(
            full_name,
            student_id
          ),
          subject:subjects!subject_id(
            name_vietnamese,
            code
          ),
          class:classes!class_id(
            name
          )
        `)
        .single()

      if (error) throw new Error(error.message)
      result = grade

      // Log grade update to audit system
      const studentData = Array.isArray(grade.student) ? grade.student[0] : grade.student
      const subjectData = Array.isArray(grade.subject) ? grade.subject[0] : grade.subject
      await logGradeUpdateAudit(
        grade.id,
        userId,
        existingGrade.grade_value,
        validatedData.grade_value,
        `Cập nhật điểm ${validatedData.component_type}`,
        validatedData.component_type,
        studentData?.full_name,
        subjectData?.name_vietnamese
      )
    } else {
      // Create new grade
      const { data: grade, error } = await supabase
        .from('student_detailed_grades')
        .insert({
          ...validatedData,
          created_by: userId
        })
        .select(`
          id,
          period_id,
          student_id,
          subject_id,
          class_id,
          component_type,
          grade_value,
          is_locked,
          created_by,
          created_at,
          updated_at,
          student:profiles!student_id(
            full_name,
            student_id
          ),
          subject:subjects!subject_id(
            name_vietnamese,
            code
          ),
          class:classes!class_id(
            name
          )
        `)
        .single()

      if (error) throw new Error(error.message)
      result = grade

      // Log grade creation to audit system
      const studentData = Array.isArray(grade.student) ? grade.student[0] : grade.student
      const subjectData = Array.isArray(grade.subject) ? grade.subject[0] : grade.subject
      await logGradeCreateAudit(
        grade.id,
        userId,
        validatedData.grade_value,
        `Tạo điểm ${validatedData.component_type}`,
        validatedData.component_type,
        studentData?.full_name,
        subjectData?.name_vietnamese
      )
    }

    revalidatePath('/dashboard/admin/grade-periods')
    
    return {
      success: true,
      data: result,
      message: existingGrade ? 'Cập nhật điểm số thành công' : 'Tạo điểm số thành công'
    }
  } catch (error) {
    console.error('Error creating/updating detailed grade:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể tạo/cập nhật điểm số'
    }
  }
}

// Get detailed grades for a period with filters
export async function getDetailedGradesAction(
  periodId: string,
  filters?: {
    class_id?: string
    subject_id?: string
    component_type?: string
    student_search?: string
    student_id?: string
    page?: number
    limit?: number
  }
) {
  try {
    await checkAdminPermissions()
    const supabase = createAdminClient()



    // Use explicit foreign key syntax for multiple relationships
    let query = supabase
      .from('student_detailed_grades')
      .select(`
        id,
        period_id,
        student_id,
        subject_id,
        class_id,
        component_type,
        grade_value,
        is_locked,
        created_by,
        created_at,
        updated_at,
        student:profiles!student_id(
          full_name,
          student_id
        ),
        subject:subjects!subject_id(
          name_vietnamese,
          code
        ),
        class:classes!class_id(
          name
        )
      `, { count: 'exact' })
      .eq('period_id', periodId)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.class_id && filters.class_id !== 'all') {
      query = query.eq('class_id', filters.class_id)
    }

    if (filters?.subject_id && filters.subject_id !== 'all') {
      query = query.eq('subject_id', filters.subject_id)
    }

    if (filters?.component_type && filters.component_type !== 'all') {
      query = query.eq('component_type', filters.component_type)
    }

    if (filters?.student_search) {
      query = query.or(`student.full_name.ilike.%${filters.student_search}%,student.student_id.ilike.%${filters.student_search}%`)
    }

    if (filters?.student_id) {
      query = query.eq('student_id', filters.student_id)
    }

    // Apply pagination
    const page = filters?.page || 1
    const limit = filters?.limit || 50
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to)

    const { data: grades, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      throw new Error(error.message)
    }

    // Data is already properly aliased, no transformation needed
    const transformedGrades = grades || []

    return {
      success: true,
      data: transformedGrades,
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  } catch (error) {
    console.error('Error fetching detailed grades:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể lấy danh sách điểm số',
      data: [],
      count: 0
    }
  }
}

// Bulk import detailed grades from Excel
export async function bulkImportDetailedGradesAction(formData: BulkDetailedGradeFormData) {
  try {
    const { userId } = await checkAdminPermissions()
    const validatedData = bulkDetailedGradeSchema.parse(formData)
    
    const supabase = createAdminClient()

    console.log('bulkImportDetailedGradesAction called with:', {
      period_id: validatedData.period_id,
      class_id: validatedData.class_id,
      subject_id: validatedData.subject_id,
      grade_type: validatedData.grade_type,
      gradesCount: validatedData.grades.length
    })

    // Process each student's grades
    const gradeEntries = []
    
    for (const studentGrade of validatedData.grades) {
      if (validatedData.grade_type === 'yearly') {
        // For yearly grades: semester_1, semester_2, yearly
        if (studentGrade.semester_1_grade !== null && studentGrade.semester_1_grade !== undefined) {
          gradeEntries.push({
            period_id: validatedData.period_id,
            student_id: studentGrade.student_id,
            subject_id: validatedData.subject_id,
            class_id: validatedData.class_id,
            component_type: 'semester_1' as GradeComponentType,
            grade_value: studentGrade.semester_1_grade,

            created_by: userId
          })
        }
        
        if (studentGrade.semester_2_grade !== null && studentGrade.semester_2_grade !== undefined) {
          gradeEntries.push({
            period_id: validatedData.period_id,
            student_id: studentGrade.student_id,
            subject_id: validatedData.subject_id,
            class_id: validatedData.class_id,
            component_type: 'semester_2' as GradeComponentType,
            grade_value: studentGrade.semester_2_grade,

            created_by: userId
          })
        }
        
        if (studentGrade.yearly_grade !== null && studentGrade.yearly_grade !== undefined) {
          gradeEntries.push({
            period_id: validatedData.period_id,
            student_id: studentGrade.student_id,
            subject_id: validatedData.subject_id,
            class_id: validatedData.class_id,
            component_type: 'yearly' as GradeComponentType,
            grade_value: studentGrade.yearly_grade,

            created_by: userId
          })
        }
      } else {
        // For semester grades: regular_1, regular_2, regular_3, regular_4, midterm, final
        if (studentGrade.regular_grades) {
          studentGrade.regular_grades.forEach((grade, index) => {
            if (grade !== null && grade !== undefined) {
              const componentType = `regular_${index + 1}` as GradeComponentType
              gradeEntries.push({
                period_id: validatedData.period_id,
                student_id: studentGrade.student_id,
                subject_id: validatedData.subject_id,
                class_id: validatedData.class_id,
                component_type: componentType,
                grade_value: grade,

                created_by: userId
              })
            }
          })
        }
        
        if (studentGrade.midterm_grade !== null && studentGrade.midterm_grade !== undefined) {
          gradeEntries.push({
            period_id: validatedData.period_id,
            student_id: studentGrade.student_id,
            subject_id: validatedData.subject_id,
            class_id: validatedData.class_id,
            component_type: 'midterm' as GradeComponentType,
            grade_value: studentGrade.midterm_grade,

            created_by: userId
          })
        }
        
        if (studentGrade.final_grade !== null && studentGrade.final_grade !== undefined) {
          gradeEntries.push({
            period_id: validatedData.period_id,
            student_id: studentGrade.student_id,
            subject_id: validatedData.subject_id,
            class_id: validatedData.class_id,
            component_type: 'final' as GradeComponentType,
            grade_value: studentGrade.final_grade,

            created_by: userId
          })
        }
      }
    }

    // Bulk insert with upsert (ON CONFLICT DO UPDATE)
    if (gradeEntries.length > 0) {
      const { data: grades, error } = await supabase
        .from('student_detailed_grades')
        .upsert(gradeEntries, {
          onConflict: 'period_id,student_id,subject_id,class_id,component_type'
        })
        .select()

      if (error) {
        throw new Error(error.message)
      }

      console.log(`Successfully imported ${gradeEntries.length} grade entries:`, grades?.length)

      revalidatePath('/dashboard/admin/grade-periods')
      revalidatePath('/dashboard/teacher/grade-reports')
      revalidatePath('/dashboard/parent')

      return {
        success: true,
        data: grades,
        message: `Nhập thành công ${gradeEntries.length} điểm số`
      }
    } else {
      return {
        success: false,
        error: 'Không có dữ liệu điểm số hợp lệ để nhập'
      }
    }
  } catch (error) {
    console.error('Error bulk importing detailed grades:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể nhập điểm số hàng loạt'
    }
  }
}

// Debug function to check grades data
export async function debugGradesAction() {
  try {
    await checkAdminPermissions()
    const supabase = createAdminClient()

    // Check total grades
    const { data: allGrades, count: totalGrades } = await supabase
      .from('student_detailed_grades')
      .select(`
        id,
        period_id,
        student_id,
        subject_id,
        class_id,
        component_type,
        grade_value,
        student:profiles!student_id(full_name, student_id),
        subject:subjects!subject_id(name_vietnamese, code),
        class:classes!class_id(name)
      `, { count: 'exact' })
      .limit(20)

    // Check periods
    const { data: periods } = await supabase
      .from('grade_reporting_periods')
      .select('id, name, start_date, end_date')

    // Check for specific subject "Âm nhạc"
    const { data: musicSubject } = await supabase
      .from('subjects')
      .select('id, name_vietnamese, code')
      .ilike('name_vietnamese', '%âm nhạc%')

    // Check for class "10A2"
    const { data: class10A2 } = await supabase
      .from('classes')
      .select('id, name')
      .ilike('name', '%10A2%')

    return {
      success: true,
      data: {
        totalGrades,
        sampleGrades: allGrades,
        periods,
        musicSubject,
        class10A2
      }
    }
  } catch (error) {
    console.error('Debug error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Debug failed'
    }
  }
}

// Update detailed grade action
export async function updateDetailedGradeAction(data: {
  grade_id: string
  grade_value: number
}) {
  try {
    const { userId } = await checkAdminPermissions()
    const supabase = createAdminClient()

    // Get existing grade for audit logging
    const { data: existingGrade, error: existingError } = await supabase
      .from('student_detailed_grades')
      .select('grade_value, component_type')
      .eq('id', data.grade_id)
      .single()

    if (existingError) {
      throw new Error(`Không thể tìm thấy điểm: ${existingError.message}`)
    }

    const { data: updatedGrade, error } = await supabase
      .from('student_detailed_grades')
      .update({
        grade_value: data.grade_value,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.grade_id)
      .select(`
        id,
        period_id,
        student_id,
        subject_id,
        class_id,
        component_type,
        grade_value,
        is_locked,
        created_at,
        updated_at,
        student:profiles!student_detailed_grades_student_id_fkey(
          full_name,
          student_id
        ),
        subject:subjects!student_detailed_grades_subject_id_fkey(
          name_vietnamese,
          code
        ),
        class:classes!student_detailed_grades_class_id_fkey(
          name
        )
      `)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    // Log grade update to audit system
    const studentData = Array.isArray(updatedGrade.student) ? updatedGrade.student[0] : updatedGrade.student
    const subjectData = Array.isArray(updatedGrade.subject) ? updatedGrade.subject[0] : updatedGrade.subject
    await logGradeUpdateAudit(
      updatedGrade.id,
      userId,
      existingGrade.grade_value,
      data.grade_value,
      `Cập nhật điểm ${existingGrade.component_type}`,
      existingGrade.component_type,
      studentData?.full_name,
      subjectData?.name_vietnamese
    )

    revalidatePath('/dashboard/admin/grade-periods')
    revalidatePath('/dashboard/teacher/grade-reports')
    revalidatePath('/dashboard/parent')

    return {
      success: true,
      data: updatedGrade,
      message: 'Cập nhật điểm số thành công'
    }
  } catch (error) {
    console.error('updateDetailedGradeAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể cập nhật điểm số'
    }
  }
}

// Check if all subjects are completed for a class in a period
export async function checkClassGradeCompletionAction(
  periodId: string,
  classId: string
) {
  try {
    await checkAdminPermissions()
    const supabase = createAdminClient()

    // Get all students in this class
    const { data: classStudents, error: studentsError } = await supabase
      .from('student_class_assignments')
      .select('student_id')
      .eq('class_id', classId)
      .eq('is_active', true)

    if (studentsError) {
      console.error('Error fetching class students:', studentsError)
      throw new Error(`Lỗi khi lấy danh sách học sinh: ${studentsError.message}`)
    }

    if (!classStudents || classStudents.length === 0) {
      return {
        success: true,
        data: {
          class_id: classId,
          period_id: periodId,
          all_completed: true,
          overall_completion: 100,
          subjects: []
        }
      }
    }

    const studentCount = classStudents.length

    // Get all subjects that have grades for this class and period (more reliable than class_subjects table)
    const { data: subjectGrades, error: gradesError } = await supabase
      .from('student_detailed_grades')
      .select(`
        subject_id,
        subject:subjects!student_detailed_grades_subject_id_fkey(
          id,
          name_vietnamese,
          code
        )
      `)
      .eq('period_id', periodId)
      .eq('class_id', classId)
      .in('component_type', ['final', 'semester_1', 'semester_2', 'yearly'])

    if (gradesError) {
      console.error('Error fetching subject grades:', gradesError)
      throw new Error(`Lỗi khi lấy điểm số môn học: ${gradesError.message}`)
    }

    // Group by subject to get unique subjects
    const subjectMap = new Map()
    subjectGrades?.forEach(grade => {
      if (grade.subject && !subjectMap.has(grade.subject_id)) {
        subjectMap.set(grade.subject_id, grade.subject)
      }
    })

    const uniqueSubjects = Array.from(subjectMap.entries()).map(([subjectId, subject]) => ({
      subject_id: subjectId,
      subject
    }))

    if (uniqueSubjects.length === 0) {
      return {
        success: true,
        data: {
          class_id: classId,
          period_id: periodId,
          all_completed: false,
          overall_completion: 0,
          subjects: []
        }
      }
    }

    // Get completion status for each subject using aggregated query
    const { data: completionData, error: completionError } = await supabase
      .from('student_detailed_grades')
      .select('subject_id, student_id')
      .eq('period_id', periodId)
      .eq('class_id', classId)
      .in('component_type', ['final', 'semester_1', 'semester_2', 'yearly'])

    if (completionError) {
      console.error('Error fetching completion data:', completionError)
      throw new Error(`Lỗi khi kiểm tra tình trạng hoàn thành: ${completionError.message}`)
    }

    // Count students with grades per subject
    const subjectStudentCounts = new Map()
    completionData?.forEach(grade => {
      const count = subjectStudentCounts.get(grade.subject_id) || new Set()
      count.add(grade.student_id)
      subjectStudentCounts.set(grade.subject_id, count)
    })

    // Build completion status
    const completionStatus = uniqueSubjects.map(({ subject_id, subject }) => {
      const studentsWithGrades = subjectStudentCounts.get(subject_id)?.size || 0
      const isCompleted = studentsWithGrades >= studentCount
      const completionPercentage = studentCount > 0 ? Math.round((studentsWithGrades / studentCount) * 100) : 0

      return {
        subject_id,
        subject,
        total_students: studentCount,
        students_with_grades: studentsWithGrades,
        is_completed: isCompleted,
        completion_percentage: completionPercentage
      }
    })

    const allCompleted = completionStatus.every(status => status.is_completed)
    const overallCompletion = completionStatus.length > 0
      ? Math.round(completionStatus.reduce((sum, status) => sum + status.completion_percentage, 0) / completionStatus.length)
      : 0

    return {
      success: true,
      data: {
        class_id: classId,
        period_id: periodId,
        all_completed: allCompleted,
        overall_completion: overallCompletion,
        subjects: completionStatus
      }
    }
  } catch (error) {
    console.error('checkClassGradeCompletionAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể kiểm tra tình trạng hoàn thành điểm số'
    }
  }
}

// Send completed grades to homeroom teacher
export async function sendGradesToHomeroomTeacherAction(
  periodId: string,
  classId: string
) {
  try {
    await checkAdminPermissions()
    const supabase = createAdminClient()

    // First check if grades are completed
    const completionResult = await checkClassGradeCompletionAction(periodId, classId)
    if (!completionResult.success || !completionResult.data?.all_completed) {
      return {
        success: false,
        error: 'Chưa hoàn thành điểm số cho tất cả môn học của lớp này'
      }
    }

    // Get homeroom teacher for this class
    const { data: classInfo, error: classError } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        homeroom_teacher_id,
        homeroom_teacher:profiles!classes_homeroom_teacher_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .eq('id', classId)
      .single()

    if (classError || !classInfo?.homeroom_teacher_id) {
      throw new Error('Không tìm thấy giáo viên chủ nhiệm cho lớp này')
    }

    // Create notification for homeroom teacher
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: classInfo.homeroom_teacher_id,
        title: 'Bảng điểm mới',
        message: `Bảng điểm lớp ${classInfo.name} đã được gửi từ admin. Vui lòng kiểm tra trong mục quản lý bảng điểm.`,
        type: 'grade_report',
        data: {
          period_id: periodId,
          class_id: classId,
          sent_at: new Date().toISOString()
        }
      })

    if (notificationError) {
      console.error('Error creating notification:', notificationError)
      // Don't fail the whole operation if notification fails
    }

    revalidatePath('/dashboard/admin/grade-periods')
    revalidatePath('/dashboard/teacher/grade-reports')

    // Extract teacher name safely
    const teacherName = classInfo.homeroom_teacher && typeof classInfo.homeroom_teacher === 'object'
      ? (classInfo.homeroom_teacher as { full_name?: string }).full_name || 'Giáo viên chủ nhiệm'
      : 'Giáo viên chủ nhiệm'

    return {
      success: true,
      data: { period_id: periodId, class_id: classId },
      message: `Đã gửi bảng điểm lớp ${classInfo.name} tới ${teacherName}`
    }
  } catch (error) {
    console.error('sendGradesToHomeroomTeacherAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể gửi bảng điểm tới giáo viên chủ nhiệm'
    }
  }
}

// Bulk send grades to all homeroom teachers for a period
export async function bulkSendGradesToHomeroomTeachersAction(periodId: string) {
  try {
    await checkAdminPermissions()
    const supabase = createAdminClient()

    // Get all classes with homeroom teachers
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        homeroom_teacher_id,
        homeroom_teacher:profiles!classes_homeroom_teacher_id_fkey(
          id,
          full_name,
          email
        )
      `)
      .not('homeroom_teacher_id', 'is', null)

    if (classesError) {
      throw new Error(classesError.message)
    }

    if (!classes || classes.length === 0) {
      return {
        success: false,
        error: 'Không tìm thấy lớp học nào có giáo viên chủ nhiệm'
      }
    }

    // Check completion and send for each class
    const results = []
    let successCount = 0
    let errorCount = 0
    const incompleteClasses = []

    for (const classInfo of classes) {
      try {
        // Check if grades are completed for this class
        const completionResult = await checkClassGradeCompletionAction(periodId, classInfo.id)

        if (!completionResult.success || !completionResult.data?.all_completed) {
          const incompleteSubjects = completionResult.data?.subjects?.filter(s => !s.is_completed) || []
          incompleteClasses.push({
            className: classInfo.name,
            reason: incompleteSubjects.length
              ? `Thiếu điểm môn: ${incompleteSubjects.map(s => (s.subject as { code?: string })?.code || 'N/A').join(', ')}`
              : 'Chưa hoàn thành điểm số'
          })
          errorCount++
          continue
        }

        // Send to homeroom teacher
        const sendResult = await sendGradesToHomeroomTeacherAction(periodId, classInfo.id)

        if (sendResult.success) {
          successCount++
          results.push({
            className: classInfo.name,
            teacherName: (classInfo.homeroom_teacher as { full_name?: string })?.full_name || 'N/A',
            status: 'success'
          })
        } else {
          errorCount++
          results.push({
            className: classInfo.name,
            teacherName: (classInfo.homeroom_teacher as { full_name?: string })?.full_name || 'N/A',
            status: 'error',
            error: sendResult.error
          })
        }
      } catch (error) {
        errorCount++
        results.push({
          className: classInfo.name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Lỗi không xác định'
        })
      }
    }

    // Prepare response message
    let message = `Đã gửi thành công ${successCount}/${classes.length} bảng điểm`

    if (incompleteClasses.length > 0) {
      const incompleteList = incompleteClasses.map(c => `- ${c.className}: ${c.reason}`).join('\n')
      message += `\n\nCác lớp chưa hoàn thành điểm số:\n${incompleteList}`
    }

    if (errorCount > 0 && incompleteClasses.length < errorCount) {
      message += `\n\n${errorCount - incompleteClasses.length} lớp gặp lỗi khác khi gửi`
    }

    return {
      success: successCount > 0,
      data: {
        successCount,
        errorCount,
        totalClasses: classes.length,
        incompleteClasses,
        results
      },
      message
    }
  } catch (error) {
    console.error('bulkSendGradesToHomeroomTeachersAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể gửi bảng điểm tới các giáo viên chủ nhiệm'
    }
  }
}

// Generate AI feedback for class grades
export async function generateAIFeedbackForGradesAction(
  submissionId: string
) {
  try {
    const supabase = createAdminClient()

    // Get submission details
    const { data: submission, error: submissionError } = await supabase
      .from('grade_submissions')
      .select(`
        id,
        period_id,
        class_id,
        homeroom_teacher_id,
        status,
        class:classes!grade_submissions_class_id_fkey(
          name
        ),
        period:grade_reporting_periods!grade_submissions_period_id_fkey(
          name,
          start_date,
          end_date
        )
      `)
      .eq('id', submissionId)
      .single()

    if (submissionError || !submission) {
      throw new Error('Không tìm thấy bảng điểm')
    }

    // Get all grades for this class and period
    const { data: grades, error: gradesError } = await supabase
      .from('student_detailed_grades')
      .select(`
        id,
        component_type,
        grade_value,
        student:profiles!student_id(
          full_name,
          student_id
        ),
        subject:subjects!subject_id(
          name_vietnamese,
          code,
          category
        )
      `)
      .eq('period_id', submission.period_id)
      .eq('class_id', submission.class_id)
      .not('grade_value', 'is', null)
      .order('student_id')

    if (gradesError) {
      throw new Error(gradesError.message)
    }

    if (!grades || grades.length === 0) {
      throw new Error('Không có điểm số để tạo phản hồi')
    }

    // Group grades by student
    const studentGrades: StudentGradesCollection = grades.reduce((acc, grade) => {
      const student = Array.isArray(grade.student) ? grade.student[0] : grade.student
      const studentId = student?.student_id || 'unknown'
      const studentKey = studentId as string

      if (!acc[studentKey]) {
        acc[studentKey] = {
          student: student,
          subjects: {}
        }
      }

      const subject = Array.isArray(grade.subject) ? grade.subject[0] : grade.subject
      const subjectCode = subject?.code || 'unknown'
      const subjectKey = subjectCode as string

      if (!acc[studentKey].subjects[subjectKey]) {
        acc[studentKey].subjects[subjectKey] = {
          subject: subject,
          grades: []
        }
      }

      acc[studentKey].subjects[subjectKey].grades.push({
        component_type: grade.component_type,
        grade_value: grade.grade_value
      })

      return acc
    }, {} as StudentGradesCollection)

    // Generate AI feedback
    const genAI = new GoogleGenAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!
    })

    // Prepare data for AI analysis
    const classStats = {
      totalStudents: Object.keys(studentGrades).length,
      totalSubjects: new Set(grades.map(g => {
        const subject = Array.isArray(g.subject) ? g.subject[0] : g.subject
        return subject?.code
      })).size,
      averageGrade: grades.reduce((sum, g) => sum + (g.grade_value || 0), 0) / grades.length,
      gradeDistribution: grades.reduce((acc, g) => {
        const grade = g.grade_value || 0
        if (grade >= 8) acc.excellent++
        else if (grade >= 6.5) acc.good++
        else if (grade >= 5) acc.average++
        else acc.poor++
        return acc
      }, { excellent: 0, good: 0, average: 0, poor: 0 })
    }

    // Extract class and period names safely
    const className = submission.class && typeof submission.class === 'object'
      ? (submission.class as { name?: string }).name || 'Lớp học'
      : 'Lớp học'
    const periodName = submission.period && typeof submission.period === 'object'
      ? (submission.period as { name?: string }).name || 'Kỳ học'
      : 'Kỳ học'

    const prompt = `Bạn là một giáo viên chủ nhiệm có kinh nghiệm. Hãy tạo nhận xét tổng quan về kết quả học tập của lớp ${className} trong ${periodName}.

THÔNG TIN LỚP HỌC:
- Tổng số học sinh: ${classStats.totalStudents}
- Số môn học: ${classStats.totalSubjects}
- Điểm trung bình lớp: ${classStats.averageGrade.toFixed(2)}
- Phân bố điểm:
  + Giỏi (8.0-10): ${classStats.gradeDistribution.excellent} học sinh
  + Khá (6.5-7.9): ${classStats.gradeDistribution.good} học sinh
  + Trung bình (5.0-6.4): ${classStats.gradeDistribution.average} học sinh
  + Yếu (<5.0): ${classStats.gradeDistribution.poor} học sinh

YÊU CẦU:
- Viết nhận xét tích cực, khuyến khích
- Nêu điểm mạnh của lớp
- Đưa ra gợi ý cải thiện nếu cần
- Độ dài: 150-200 từ
- Giọng điệu: Chuyên nghiệp, ấm áp của giáo viên
- Kết thúc bằng lời động viên

LƯU Ý: Đây là nhận xét được tạo bằng AI chỉ mang tính chất tham khảo, giáo viên có thể chỉnh sửa trước khi gửi phụ huynh.

Nhận xét tổng quan về lớp:`

    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash-001',
      contents: prompt,
      config: {
        temperature: 0.7,
        maxOutputTokens: 300,
        topP: 0.9,
        topK: 40
      }
    })

    const aiFeedback = response.text?.trim()

    if (!aiFeedback) {
      throw new Error('Không thể tạo phản hồi AI')
    }

    // Add disclaimer
    const feedbackWithDisclaimer = `${aiFeedback}\n\n---\n*Nhận xét này được tạo bằng AI chỉ mang tính chất tham khảo. Giáo viên có thể chỉnh sửa trước khi gửi phụ huynh.*`

    return {
      success: true,
      data: {
        ai_feedback: feedbackWithDisclaimer,
        class_stats: classStats,
        student_count: classStats.totalStudents
      },
      message: 'Tạo phản hồi AI thành công'
    }
  } catch (error) {
    console.error('generateAIFeedbackForGradesAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể tạo phản hồi AI'
    }
  }
}

// Get detailed grades for homeroom teacher's class
export async function getHomeroomDetailedGradesAction(
  periodId: string,
  filters?: {
    student_search?: string
    subject_id?: string
    component_type?: string
    page?: number
    limit?: number
  }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Authentication required')
    }

    // Check if user is a homeroom teacher
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, homeroom_enabled')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'teacher') {
      throw new Error('Teacher permissions required')
    }

    // Get teacher's homeroom class (take first one if multiple)
    const { data: homeroomClasses } = await supabase
      .from('classes')
      .select('id, name')
      .eq('homeroom_teacher_id', user.id)
      .limit(1)

    if (!homeroomClasses || homeroomClasses.length === 0) {
      throw new Error('No homeroom class found')
    }

    const homeroomClass = homeroomClasses[0]

    // Build query for detailed grades
    let query = supabase
      .from('student_detailed_grades')
      .select(`
        id,
        grade_value,
        component_type,
        is_locked,
        created_at,
        updated_at,
        student_id,
        class_id,
        subject_id,
        period_id,
        student:profiles!student_detailed_grades_student_id_fkey(
          id,
          full_name,
          student_id
        ),
        class:classes!student_detailed_grades_class_id_fkey(
          id,
          name
        ),
        subject:subjects!student_detailed_grades_subject_id_fkey(
          id,
          name_vietnamese,
          code,
          category
        )
      `)
      .eq('period_id', periodId)
      .eq('class_id', homeroomClass.id) // Only homeroom class students

    // Apply filters (skip student search for now as it requires complex query)

    if (filters?.subject_id) {
      query = query.eq('subject_id', filters.subject_id)
    }

    if (filters?.component_type) {
      query = query.eq('component_type', filters.component_type)
    }

    // Apply pagination
    const page = filters?.page || 1
    const limit = filters?.limit || 50
    const offset = (page - 1) * limit

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: grades, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      data: grades || [],
      count: count || 0
    }
  } catch (error) {
    console.error('getHomeroomDetailedGradesAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể tải điểm số'
    }
  }
}

// Get submitted grades from admin for homeroom teacher
export async function getHomeroomSubmittedGradesAction(
  periodId: string,
  filters?: {
    student_search?: string
    page?: number
    limit?: number
  }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Authentication required')
    }

    // Check if user is a homeroom teacher
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, homeroom_enabled')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'teacher') {
      throw new Error('Teacher permissions required')
    }

    // Get submitted grades for this homeroom teacher
    let query = supabase
      .from('admin_student_submissions')
      .select(`
        id,
        period_id,
        student_id,
        class_id,
        submission_count,
        status,
        submission_reason,
        submitted_at,
        received_at,
        student:profiles!admin_student_submissions_student_id_fkey(
          id,
          full_name,
          student_id
        ),
        class:classes!admin_student_submissions_class_id_fkey(
          id,
          name
        ),
        period:grade_reporting_periods!admin_student_submissions_period_id_fkey(
          id,
          name
        )
      `)
      .eq('period_id', periodId)
      .eq('homeroom_teacher_id', user.id)
      .eq('status', 'submitted')

    // Apply pagination
    const page = filters?.page || 1
    const limit = filters?.limit || 50
    const offset = (page - 1) * limit

    query = query
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: submissions, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      data: submissions || [],
      count: count || 0
    }
  } catch (error) {
    console.error('getHomeroomSubmittedGradesAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể tải bảng điểm đã gửi'
    }
  }
}

// Send grade reports to all parents for homeroom teacher
export async function sendGradeReportsToParentsAction(
  periodId: string
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Authentication required')
    }

    // Check if user is a homeroom teacher
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, homeroom_enabled, full_name')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'teacher') {
      throw new Error('Teacher permissions required')
    }

    // Get submitted grades for this homeroom teacher
    const { data: submissions, error: submissionsError } = await supabase
      .from('admin_student_submissions')
      .select(`
        id,
        student_id,
        class_id,
        student:profiles!admin_student_submissions_student_id_fkey(
          id,
          full_name,
          student_id
        ),
        class:classes!admin_student_submissions_class_id_fkey(
          id,
          name
        ),
        period:grade_reporting_periods!admin_student_submissions_period_id_fkey(
          id,
          name
        )
      `)
      .eq('period_id', periodId)
      .eq('homeroom_teacher_id', user.id)
      .eq('status', 'submitted')

    if (submissionsError) {
      throw new Error(submissionsError.message)
    }

    if (!submissions || submissions.length === 0) {
      throw new Error('Không có bảng điểm nào để gửi')
    }

    // Import email service
    const { sendGradeNotificationEmail } = await import('@/lib/services/email-service')

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Send email to each parent
    for (const submission of submissions) {
      try {
        // Handle both single object and array cases
        const studentData = Array.isArray(submission.student) ? submission.student[0] : submission.student
        const student = studentData as { id: string; full_name: string; student_id: string }

        // Get parent emails for this student
        const { data: parentRelationships, error: parentError } = await supabase
          .from('parent_student_relationships')
          .select(`
            parent:profiles!parent_id(
              full_name,
              email
            )
          `)
          .eq('student_id', student.id)

        if (parentError) {
          errors.push(`Lỗi lấy thông tin phụ huynh của ${student.full_name}: ${parentError.message}`)
          errorCount++
          continue
        }

        if (!parentRelationships || parentRelationships.length === 0) {
          errors.push(`Học sinh ${student.full_name} không có phụ huynh trong hệ thống`)
          errorCount++
          continue
        }

        // Handle class and period data
        const classData = Array.isArray(submission.class) ? submission.class[0] : submission.class
        const periodData = Array.isArray(submission.period) ? submission.period[0] : submission.period

        // Send email to each parent of this student
        for (const relationship of parentRelationships) {
          // Handle both single object and array cases for parent data
          const parentData = Array.isArray(relationship.parent) ? relationship.parent[0] : relationship.parent
          const parent = parentData as { full_name: string; email: string }

          if (!parent?.email) {
            errors.push(`Phụ huynh của ${student.full_name} không có email`)
            errorCount++
            continue
          }

          const emailResult = await sendGradeNotificationEmail({
            parentEmail: parent.email,
            parentName: parent.full_name || 'Phụ huynh',
            studentName: student.full_name,
            className: (classData as { id: string; name: string }).name,
            periodName: (periodData as { id: string; name: string }).name,
            teacherName: profile.full_name || 'Giáo viên chủ nhiệm'
          })

          if (emailResult.success) {
            successCount++
          } else {
            errors.push(`Lỗi gửi email cho phụ huynh ${parent.full_name} của ${student.full_name}: ${emailResult.error}`)
            errorCount++
          }
        }
      } catch (emailError) {
        const studentData = Array.isArray(submission.student) ? submission.student[0] : submission.student
        const studentName = (studentData as { full_name: string }).full_name
        errors.push(`Lỗi gửi email cho phụ huynh của ${studentName}: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`)
        errorCount++
      }
    }

    const errorSuffix = errorCount > 0 ? `, ${errorCount} lỗi` : ''
    const message = `Đã gửi email thành công cho ${successCount} phụ huynh${errorSuffix}`

    return {
      success: true,
      message: message,
      data: {
        successCount,
        errorCount,
        errors: errorCount > 0 ? errors : undefined
      }
    }
  } catch (error) {
    console.error('sendGradeReportsToParentsAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể gửi email cho phụ huynh'
    }
  }
}

// Get submitted student grade details for homeroom teacher
export async function getSubmittedStudentGradeDetailsAction(
  periodId: string,
  studentId: string
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Authentication required')
    }

    // Check if user is a homeroom teacher
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, homeroom_enabled')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'teacher') {
      throw new Error('Teacher permissions required')
    }

    // Check if there are any submissions for this teacher at all
    const { data: teacherSubmissions } = await supabase
      .from('admin_student_submissions')
      .select('period_id, student_id, status')
      .eq('homeroom_teacher_id', user.id)
      .eq('status', 'submitted')



    if (!teacherSubmissions || teacherSubmissions.length === 0) {
      throw new Error('Không có bảng điểm nào được gửi cho bạn. Vui lòng liên hệ Ban Giám Hiệu.')
    }

    // Check if this specific student has any submissions to this teacher
    const studentSubmissions = teacherSubmissions.filter(sub => sub.student_id === studentId)
    if (studentSubmissions.length === 0) {
      throw new Error('Học sinh này chưa được gửi bảng điểm cho bạn. Vui lòng kiểm tra lại hoặc liên hệ Ban Giám Hiệu.')
    }

    // Check if this specific period has submissions for this teacher
    const periodSubmissions = teacherSubmissions.filter(sub => sub.period_id === periodId)
    if (periodSubmissions.length === 0) {
      // Get the periods that DO have submissions for better error message
      const availablePeriods = [...new Set(teacherSubmissions.map(sub => sub.period_id))]



      throw new Error(`Kỳ báo cáo này chưa có bảng điểm nào được gửi cho bạn. Bạn có bảng điểm trong ${availablePeriods.length} kỳ báo cáo khác. Vui lòng chọn kỳ báo cáo khác.`)
    }

    // Now try to find the specific student submission for this period
    const { data: submissionData, error: submissionError } = await supabase
      .from('admin_student_submissions')
      .select(`
        id,
        period_id,
        student_id,
        class_id,
        submission_count,
        status,
        submitted_at,
        student:profiles!admin_student_submissions_student_id_fkey(
          id,
          full_name,
          student_id
        ),
        class:classes!admin_student_submissions_class_id_fkey(
          id,
          name
        ),
        period:grade_reporting_periods!admin_student_submissions_period_id_fkey(
          id,
          name
        )
      `)
      .eq('period_id', periodId)
      .eq('student_id', studentId)
      .eq('homeroom_teacher_id', user.id)
      .eq('status', 'submitted')
      .single()

    let submission = submissionData

    if (submissionError || !submission) {
      // If no submission found, check if this student is in teacher's homeroom class
      // and fall back to showing their grades directly
      const { data: studentClass } = await supabase
        .from('student_class_assignments')
        .select(`
          class_id,
          classes!student_class_assignments_class_id_fkey(
            id,
            name,
            homeroom_teacher_id
          )
        `)
        .eq('student_id', studentId)
        .single()

      if (!studentClass?.classes) {
        throw new Error('Bạn không có quyền xem điểm của học sinh này. Chỉ giáo viên chủ nhiệm mới có thể xem điểm học sinh.')
      }

      // Handle both single object and array cases
      const classData = Array.isArray(studentClass.classes) ? studentClass.classes[0] : studentClass.classes
      const classInfo = classData as { id: string; name: string; homeroom_teacher_id: string }

      if (classInfo.homeroom_teacher_id !== user.id) {
        throw new Error('Bạn không có quyền xem điểm của học sinh này. Chỉ giáo viên chủ nhiệm mới có thể xem điểm học sinh.')
      }

      // Create a mock submission object for fallback
      const mockSubmission = {
        id: 'fallback',
        submission_count: 1,
        status: 'fallback',
        submitted_at: new Date().toISOString(),
        student_id: studentId,
        class_id: classInfo.id,
        period_id: periodId
      }

      // Get student and period info for fallback
      const { data: studentInfo } = await supabase
        .from('profiles')
        .select('id, full_name, student_id')
        .eq('id', studentId)
        .single()

      const { data: periodInfo } = await supabase
        .from('grade_reporting_periods')
        .select('id, name')
        .eq('id', periodId)
        .single()

      if (!studentInfo || !periodInfo) {
        throw new Error('Không tìm thấy thông tin học sinh hoặc kỳ báo cáo.')
      }

      // Use fallback data
      submission = {
        ...mockSubmission,
        student: studentInfo,
        class: classInfo,
        period: periodInfo
      } as unknown as typeof submission
    }

    // Ensure we have a valid submission at this point
    if (!submission) {
      throw new Error('Không thể tải thông tin bảng điểm.')
    }

    // Get period information to check if it's a summary period
    const { data: periodInfo, error: periodInfoError } = await supabase
      .from('grade_reporting_periods')
      .select('period_type, academic_year_id, semester_id')
      .eq('id', periodId)
      .single()

    if (periodInfoError) {
      throw new Error(periodInfoError.message)
    }

    let gradeData, gradeError

    // Check if this is a summary period (like admin logic)
    if (periodInfo.period_type && periodInfo.period_type.includes('summary')) {
      // For summary periods, get grades from all component periods in the same semester
      const { data: componentPeriods, error: componentError } = await supabase
        .from('grade_reporting_periods')
        .select('id')
        .eq('academic_year_id', periodInfo.academic_year_id)
        .eq('semester_id', periodInfo.semester_id)
        .not('period_type', 'like', '%summary%')

      if (componentError) throw componentError

      const componentPeriodIds = componentPeriods?.map(p => p.id) || []

      // Get grades from component periods AND summary period
      const allPeriodIds = [...componentPeriodIds, periodId]

      const { data: allGrades, error: allGradesError } = await supabase
        .from('student_detailed_grades')
        .select(`
          id,
          subject_id,
          component_type,
          grade_value,
          created_at,
          updated_at,
          subject:subjects!student_detailed_grades_subject_id_fkey(
            id,
            name_vietnamese,
            code
          )
        `)
        .in('period_id', allPeriodIds)
        .eq('student_id', studentId)
        .eq('class_id', submission.class_id)
        .order('subject_id')
        .order('component_type')
        .order('updated_at', { ascending: false })

      gradeData = allGrades
      gradeError = allGradesError
    } else {
      // For regular periods, get grades from the specific period only
      const { data: regularGrades, error: regularGradeError } = await supabase
        .from('student_detailed_grades')
        .select(`
          id,
          subject_id,
          component_type,
          grade_value,
          created_at,
          updated_at,
          subject:subjects!student_detailed_grades_subject_id_fkey(
            id,
            name_vietnamese,
            code
          )
        `)
        .eq('period_id', periodId)
        .eq('student_id', studentId)
        .eq('class_id', submission.class_id)
        .order('subject_id')
        .order('component_type')

      gradeData = regularGrades
      gradeError = regularGradeError
    }

    if (gradeError) {
      throw new Error(gradeError.message)
    }

    // Group grades by subject
    const subjectMap = new Map()

    if (gradeData && gradeData.length > 0) {
      for (const grade of gradeData) {
        const subjectId = grade.subject_id
        // Handle both single object and array cases
        const subjectData = Array.isArray(grade.subject) ? grade.subject[0] : grade.subject

        // Skip grades with missing subject data (data integrity issue)
        if (!subjectData) {
          console.warn(`Missing subject data for grade with subject_id: ${subjectId}`)
          continue
        }

        const subjectInfo = subjectData as { id: string; name_vietnamese: string; code: string }

        if (!subjectMap.has(subjectId)) {
          subjectMap.set(subjectId, {
            subject_id: subjectId,
            subject_name: subjectInfo.name_vietnamese || 'Unknown Subject',
            subject_code: subjectInfo.code || 'UNKNOWN',
            grades: {
              regular: [],
              midterm: null,
              final: null,
              summary: null
            }
          })
        }

        const subject = subjectMap.get(subjectId)
        if (grade.grade_value !== null) {
          if (grade.component_type.startsWith('regular_')) {
            subject.grades.regular.push(grade.grade_value)
          } else if (grade.component_type === 'midterm') {
            subject.grades.midterm = grade.grade_value
          } else if (grade.component_type === 'final') {
            subject.grades.final = grade.grade_value
          } else if (grade.component_type.includes('semester') || grade.component_type === 'summary') {
            subject.grades.summary = grade.grade_value
          }
        }
      }
    }

    const subjects = Array.from(subjectMap.values())

    // Handle array cases for related data
    const studentData = Array.isArray(submission.student) ? submission.student[0] : submission.student
    const classData = Array.isArray(submission.class) ? submission.class[0] : submission.class
    const periodData = Array.isArray(submission.period) ? submission.period[0] : submission.period

    return {
      success: true,
      data: {
        submission: {
          id: submission.id,
          submission_count: submission.submission_count,
          status: submission.status,
          submitted_at: submission.submitted_at
        },
        student: studentData as { id: string; full_name: string; student_id: string },
        class: classData as { id: string; name: string },
        period: periodData as { id: string; name: string },
        subjects: subjects
      }
    }
  } catch (error) {
    console.error('getSubmittedStudentGradeDetailsAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể tải chi tiết điểm số học sinh'
    }
  }
}

// Get periods that have submissions for the homeroom teacher
export async function getPeriodsWithSubmissionsAction() {
  try {
    const { userId } = await checkTeacherPermissions()
    const supabase = await createClient()

    // Get all periods with submissions for this teacher
    const { data: submissions, error: submissionsError } = await supabase
      .from('admin_student_submissions')
      .select(`
        period_id,
        period:grade_reporting_periods!admin_student_submissions_period_id_fkey(
          id,
          name,
          academic_year:academic_years!grade_reporting_periods_academic_year_id_fkey(
            name
          ),
          semester:semesters!grade_reporting_periods_semester_id_fkey(
            name
          )
        )
      `)
      .eq('homeroom_teacher_id', userId)
      .eq('status', 'submitted')

    if (submissionsError) {
      throw new Error(submissionsError.message)
    }

    // Group by period and count submissions
    const periodMap = new Map()

    if (submissions && submissions.length > 0) {
      for (const submission of submissions) {
        const periodId = submission.period_id
        const periodData = Array.isArray(submission.period) ? submission.period[0] : submission.period

        if (!periodMap.has(periodId)) {
          // Handle both single object and array cases from Supabase joins
          const period = periodData as unknown as {
            id: string;
            name: string;
            academic_year?: { name: string } | { name: string }[];
            semester?: { name: string } | { name: string }[]
          }

          // Extract academic year name (handle array case)
          const academicYearName = Array.isArray(period?.academic_year)
            ? period.academic_year[0]?.name
            : period?.academic_year?.name

          // Extract semester name (handle array case)
          const semesterName = Array.isArray(period?.semester)
            ? period.semester[0]?.name
            : period?.semester?.name

          periodMap.set(periodId, {
            id: periodId,
            name: period?.name || 'Unknown Period',
            academic_year: academicYearName || 'Unknown Year',
            semester: semesterName || 'Unknown Semester',
            submission_count: 0
          })
        }

        const period = periodMap.get(periodId)
        period.submission_count++
      }
    }

    const periodsWithSubmissions = Array.from(periodMap.values())

    return {
      success: true,
      data: periodsWithSubmissions
    }
  } catch (error) {
    console.error('getPeriodsWithSubmissionsAction error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể tải danh sách kỳ báo cáo'
    }
  }
}