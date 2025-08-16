'use server'

import { checkAdminPermissions } from '@/lib/utils/permission-utils'
import { createClient } from '@/utils/supabase/server'
import { generateExcelTemplate } from '@/lib/utils/grade-excel-utils'

// Generate Excel template for grade import
export async function generateGradeTemplateAction(params: {
  class_id: string
  subject_id: string
  grade_type: string
}) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    // Get class information
    const { data: classInfo, error: classError } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        academic_year:academic_years(name),
        semester:semesters(name)
      `)
      .eq('id', params.class_id)
      .single()

    if (classError || !classInfo) {
      return {
        success: false,
        error: 'Không tìm thấy thông tin lớp học'
      }
    }

    // Get subject information
    const { data: subjectInfo, error: subjectError } = await supabase
      .from('subjects')
      .select('id, name_vietnamese, code')
      .eq('id', params.subject_id)
      .single()

    if (subjectError || !subjectInfo) {
      return {
        success: false,
        error: 'Không tìm thấy thông tin môn học'
      }
    }

    // Get students in the class through student_class_assignments (OPTIMIZED)
    const { data: students, error: studentsError } = await supabase
      .from('student_class_assignments')
      .select(`
        student:profiles!student_class_assignments_student_id_fkey(
          id,
          student_id,
          full_name
        )
      `)
      .eq('class_id', params.class_id)
      .eq('is_active', true)
      .in('assignment_type', ['main', 'homeroom'])
      .order('student(full_name)')
      .limit(100) // Reasonable limit for class size

    if (studentsError) {
      return {
        success: false,
        error: 'Không thể tải danh sách học sinh'
      }
    }

    // Filter and validate student data (OPTIMIZED)
    const validStudents = students?.filter(assignment => {
      const student = Array.isArray(assignment.student) ? assignment.student[0] : assignment.student
      return student?.student_id && student?.full_name
    }) || []

    if (validStudents.length === 0) {
      return {
        success: false,
        error: 'Lớp học này chưa có học sinh nào'
      }
    }

    // Map grade type to Vietnamese - Updated for VNedu compatibility
    const gradeTypeMap: Record<string, string> = {
      'semester1': 'Cuối học kỳ 1',
      'semester2': 'Cuối học kỳ 2',
      'yearly': 'Cả năm học'
    }

    // Prepare data for template generation
    const templateData = {
      className: classInfo.name,
      subjectName: subjectInfo.name_vietnamese,
      gradeType: params.grade_type // Keep original English value for column structure logic
    }

    const studentData = validStudents.map(assignment => {
      const student = Array.isArray(assignment.student) ? assignment.student[0] : assignment.student
      return {
        student_id: student.student_id,
        full_name: student.full_name
      }
    })

    // Generate Excel template
    const excelBuffer = generateExcelTemplate(studentData, templateData)

    // Convert ArrayBuffer to base64 for transmission
    const base64 = Buffer.from(excelBuffer).toString('base64')

    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 10)
    const filename = `Template_${classInfo.name}_${subjectInfo.code}_${gradeTypeMap[params.grade_type]}_${timestamp}.xlsx`

    return {
      success: true,
      data: {
        filename,
        content: base64,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      },
      message: 'Tạo template Excel thành công'
    }

  } catch (error) {
    console.error('Error generating Excel template:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể tạo template Excel'
    }
  }
}

// Get template info for download
export async function getTemplateInfoAction(params: {
  class_id: string
  subject_id: string
}) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    // Get class and subject info for template preview
    const [classResult, subjectResult, studentsResult] = await Promise.all([
      supabase
        .from('classes')
        .select('id, name')
        .eq('id', params.class_id)
        .single(),
      
      supabase
        .from('subjects')
        .select('id, name_vietnamese, code')
        .eq('id', params.subject_id)
        .single(),
      
      supabase
        .from('student_class_assignments')
        .select('id')
        .eq('class_id', params.class_id)
        .eq('is_active', true)
    ])

    if (classResult.error || !classResult.data) {
      return {
        success: false,
        error: 'Không tìm thấy thông tin lớp học'
      }
    }

    if (subjectResult.error || !subjectResult.data) {
      return {
        success: false,
        error: 'Không tìm thấy thông tin môn học'
      }
    }

    if (studentsResult.error) {
      return {
        success: false,
        error: 'Không thể đếm số lượng học sinh'
      }
    }

    return {
      success: true,
      data: {
        className: classResult.data.name,
        subjectName: subjectResult.data.name_vietnamese,
        subjectCode: subjectResult.data.code,
        studentCount: studentsResult.data?.length || 0
      }
    }

  } catch (error) {
    console.error('Error getting template info:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể lấy thông tin template'
    }
  }
}

// Validate template requirements
export async function validateTemplateRequirementsAction(params: {
  class_id: string
  subject_id: string
}) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    const errors: string[] = []

    // Check if class exists and is active
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, name, is_active')
      .eq('id', params.class_id)
      .single()

    if (classError || !classData) {
      errors.push('Lớp học không tồn tại')
    } else if (!classData.is_active) {
      errors.push('Lớp học đã bị vô hiệu hóa')
    }

    // Check if subject exists and is active
    const { data: subjectData, error: subjectError } = await supabase
      .from('subjects')
      .select('id, name_vietnamese, is_active')
      .eq('id', params.subject_id)
      .single()

    if (subjectError || !subjectData) {
      errors.push('Môn học không tồn tại')
    } else if (!subjectData.is_active) {
      errors.push('Môn học đã bị vô hiệu hóa')
    }

    // Check if class has students
    const { data: students, error: studentsError } = await supabase
      .from('student_class_assignments')
      .select('id')
      .eq('class_id', params.class_id)
      .eq('is_active', true)
      .limit(1)

    if (studentsError) {
      errors.push('Không thể kiểm tra danh sách học sinh')
    } else if (!students || students.length === 0) {
      errors.push('Lớp học chưa có học sinh nào')
    }

    return {
      success: errors.length === 0,
      errors,
      data: errors.length === 0 ? {
        className: classData?.name,
        subjectName: subjectData?.name_vietnamese
      } : null
    }

  } catch (error) {
    console.error('Error validating template requirements:', error)
    return {
      success: false,
      errors: [error instanceof Error ? error.message : 'Lỗi kiểm tra yêu cầu template']
    }
  }
}
