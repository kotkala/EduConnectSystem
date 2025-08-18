"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidateTag } from "next/cache"
import type { ValidatedGradeData } from "@/lib/utils/teacher-excel-import-validation"

export interface GradeImportResult {
  success: boolean
  message: string
  importedCount: number
  errorCount: number
  errors: string[]
}

export async function importValidatedGradesAction(
  periodId: string,
  classId: string,
  subjectId: string,
  validatedData: ValidatedGradeData[]
): Promise<GradeImportResult> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        success: false,
        message: 'Không thể xác thực người dùng',
        importedCount: 0,
        errorCount: 0,
        errors: ['Lỗi xác thực người dùng']
      }
    }

    let importedCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Process each student's grades
    for (const studentData of validatedData) {
      try {
        // Find student by student ID
        const { data: students, error: studentError } = await supabase
          .from('student_class_assignments_view')
          .select('student_id, student_name')
          .eq('class_id', classId)
          .eq('student_number', studentData.studentId)
          .limit(1)

        if (studentError) {
          errors.push(`Lỗi tìm học sinh ${studentData.studentId}: ${studentError.message}`)
          errorCount++
          continue
        }

        if (!students || students.length === 0) {
          errors.push(`Không tìm thấy học sinh với mã ${studentData.studentId} trong lớp`)
          errorCount++
          continue
        }

        const student = students[0]

        // Prepare grade records for insertion/update
        const gradeRecords = []

        // Regular grades
        studentData.regularGrades.forEach((grade, index) => {
          if (grade !== null) {
            gradeRecords.push({
              period_id: periodId,
              student_id: student.student_id,
              subject_id: subjectId,
              class_id: classId,
              component_type: `regular_${index + 1}`,
              grade_value: grade,
              created_by: user.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
          }
        })

        // Midterm grade
        if (studentData.midtermGrade !== null && studentData.midtermGrade !== undefined) {
          gradeRecords.push({
            period_id: periodId,
            student_id: student.student_id,
            subject_id: subjectId,
            class_id: classId,
            component_type: 'midterm',
            grade_value: studentData.midtermGrade,
            created_by: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }

        // Final grade
        if (studentData.finalGrade !== null && studentData.finalGrade !== undefined) {
          gradeRecords.push({
            period_id: periodId,
            student_id: student.student_id,
            subject_id: subjectId,
            class_id: classId,
            component_type: 'final',
            grade_value: studentData.finalGrade,
            created_by: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }

        // Summary grade
        if (studentData.summaryGrade !== null && studentData.summaryGrade !== undefined) {
          gradeRecords.push({
            period_id: periodId,
            student_id: student.student_id,
            subject_id: subjectId,
            class_id: classId,
            component_type: 'summary',
            grade_value: studentData.summaryGrade,
            created_by: user.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }

        // Insert/update grades using upsert
        if (gradeRecords.length > 0) {
          const { error: insertError } = await supabase
            .from('student_detailed_grades')
            .upsert(gradeRecords, {
              onConflict: 'period_id,student_id,subject_id,class_id,component_type',
              ignoreDuplicates: false
            })

          if (insertError) {
            errors.push(`Lỗi lưu điểm cho học sinh ${studentData.studentId}: ${insertError.message}`)
            errorCount++
          } else {
            importedCount++
          }
        } else {
          // No grades to import for this student
          importedCount++
        }

        // Update notes if provided
        if (studentData.notes && studentData.notes.trim() !== '') {
          // Check if individual_subject_grades record exists
          const { data: existingGrade, error: checkError } = await supabase
            .from('individual_subject_grades')
            .select('id')
            .eq('subject_id', subjectId)
            .eq('submission_id', periodId) // Assuming submission_id maps to period_id
            .limit(1)

          if (!checkError && existingGrade && existingGrade.length > 0) {
            // Update existing record
            const { error: updateError } = await supabase
              .from('individual_subject_grades')
              .update({
                notes: studentData.notes,
                updated_at: new Date().toISOString()
              })
              .eq('id', existingGrade[0].id)

            if (updateError) {
              errors.push(`Lỗi cập nhật ghi chú cho học sinh ${studentData.studentId}: ${updateError.message}`)
            }
          }
        }

      } catch (error) {
        console.error(`Error processing student ${studentData.studentId}:`, error)
        errors.push(`Lỗi xử lý học sinh ${studentData.studentId}: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`)
        errorCount++
      }
    }

    // Revalidate cache
    revalidateTag(`grades-${periodId}-${classId}-${subjectId}`)
    revalidateTag(`grade-overview-${periodId}-${classId}-${subjectId}`)

    return {
      success: errorCount === 0,
      message: errorCount === 0 
        ? `Nhập điểm thành công cho ${importedCount} học sinh`
        : `Nhập điểm hoàn tất với ${importedCount} thành công, ${errorCount} lỗi`,
      importedCount,
      errorCount,
      errors
    }

  } catch (error) {
    console.error('Error importing grades:', error)
    return {
      success: false,
      message: 'Có lỗi xảy ra khi nhập điểm',
      importedCount: 0,
      errorCount: 0,
      errors: [error instanceof Error ? error.message : 'Lỗi không xác định']
    }
  }
}

export async function getGradeOverviewAction(
  periodId: string,
  classId: string,
  subjectId: string
) {
  try {
    const supabase = await createClient()

    // Get students in class with their grades
    const { data: gradeData, error: gradeError } = await supabase
      .from('student_detailed_grades')
      .select(`
        student_id,
        component_type,
        grade_value,
        updated_at,
        created_by
      `)
      .eq('period_id', periodId)
      .eq('class_id', classId)
      .eq('subject_id', subjectId)

    if (gradeError) {
      throw new Error(`Lỗi tải dữ liệu điểm: ${gradeError.message}`)
    }

    // Get all students in class (including those without grades)
    const { data: allStudents, error: studentsError } = await supabase
      .from('student_class_assignments_view')
      .select('student_id, student_number, student_name')
      .eq('class_id', classId)
      .order('student_name')

    if (studentsError) {
      throw new Error(`Lỗi tải danh sách học sinh: ${studentsError.message}`)
    }

    // Group grades by student
    const gradesByStudent = new Map()

    if (gradeData) {
      gradeData.forEach(grade => {
        const studentId = grade.student_id
        if (!gradesByStudent.has(studentId)) {
          gradesByStudent.set(studentId, {
            regularGrades: [null, null, null, null],
            midtermGrade: null,
            finalGrade: null,
            summaryGrade: null,
            lastModified: null,
            modifiedBy: null
          })
        }

        const studentGrades = gradesByStudent.get(studentId)

        if (grade.component_type.startsWith('regular_')) {
          const index = parseInt(grade.component_type.split('_')[1]) - 1
          if (index >= 0 && index < 4) {
            studentGrades.regularGrades[index] = grade.grade_value
          }
        } else if (grade.component_type === 'midterm') {
          studentGrades.midtermGrade = grade.grade_value
        } else if (grade.component_type === 'final') {
          studentGrades.finalGrade = grade.grade_value
        } else if (grade.component_type === 'summary') {
          studentGrades.summaryGrade = grade.grade_value
        }

        // Track latest modification
        if (!studentGrades.lastModified || new Date(grade.updated_at) > new Date(studentGrades.lastModified)) {
          studentGrades.lastModified = grade.updated_at
          studentGrades.modifiedBy = grade.created_by
        }
      })
    }

    // Ensure all students are included (even those without grades)
    const result = allStudents.map(student => {
      const existingGrades = gradesByStudent.get(student.student_id)
      return {
        id: student.student_id,
        studentId: student.student_number,
        studentName: student.student_name,
        regularGrades: existingGrades?.regularGrades || [null, null, null, null],
        midtermGrade: existingGrades?.midtermGrade || null,
        finalGrade: existingGrades?.finalGrade || null,
        summaryGrade: existingGrades?.summaryGrade || null,
        lastModified: existingGrades?.lastModified || null,
        modifiedBy: existingGrades?.modifiedBy || null
      }
    })

    return {
      success: true,
      data: result
    }

  } catch (error) {
    console.error('Error getting grade overview:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    }
  }
}

export async function getClassStudentsAction(classId: string) {
  try {
    const supabase = await createClient()

    const { data: students, error } = await supabase
      .from('student_class_assignments_view')
      .select('student_id, student_number, student_name')
      .eq('class_id', classId)
      .order('student_name')

    if (error) {
      throw new Error(`Lỗi tải danh sách học sinh: ${error.message}`)
    }

    return {
      success: true,
      data: students?.map(s => ({
        id: s.student_id,
        studentId: s.student_number,
        name: s.student_name
      })) || []
    }

  } catch (error) {
    console.error('Error getting class students:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Lỗi không xác định'
    }
  }
}
