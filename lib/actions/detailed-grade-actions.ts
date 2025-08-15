'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { checkAdminPermissions } from '@/lib/utils/permission-utils'
import { z } from 'zod'

// Grade component type enum
export const gradeComponentTypes = [
  'regular_1', 'regular_2', 'regular_3', 'regular_4',
  'midterm', 'final',
  'semester_1', 'semester_2', 'yearly'
] as const

export type GradeComponentType = typeof gradeComponentTypes[number]

// Validation schema for detailed grade
export const detailedGradeSchema = z.object({
  period_id: z.string().uuid(),
  student_id: z.string().uuid(),
  subject_id: z.string().uuid(),
  class_id: z.string().uuid(),
  component_type: z.enum(gradeComponentTypes),
  grade_value: z.number().min(0).max(10).nullable(),
  notes: z.string().optional()
})

export type DetailedGradeFormData = z.infer<typeof detailedGradeSchema>

// Bulk import schema for Excel data
export const bulkDetailedGradeSchema = z.object({
  period_id: z.string().uuid(),
  class_id: z.string().uuid(),
  subject_id: z.string().uuid(),
  grade_type: z.enum(['semester1', 'semester2', 'yearly']),
  grades: z.array(z.object({
    student_id: z.string().uuid(),
    regular_grades: z.array(z.number().min(0).max(10).nullable()).optional(),
    midterm_grade: z.number().min(0).max(10).nullable().optional(),
    final_grade: z.number().min(0).max(10).nullable().optional(),
    semester_1_grade: z.number().min(0).max(10).nullable().optional(),
    semester_2_grade: z.number().min(0).max(10).nullable().optional(),
    yearly_grade: z.number().min(0).max(10).nullable().optional(),
    notes: z.string().optional()
  }))
})

export type BulkDetailedGradeFormData = z.infer<typeof bulkDetailedGradeSchema>

// Create or update detailed grade
export async function createDetailedGradeAction(formData: DetailedGradeFormData) {
  try {
    const { userId } = await checkAdminPermissions()
    const validatedData = detailedGradeSchema.parse(formData)
    
    const supabase = createAdminClient()

    // Check if grade already exists for this combination
    const { data: existingGrade } = await supabase
      .from('student_detailed_grades')
      .select('id')
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
          notes: validatedData.notes,
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
          notes,
          is_locked,
          created_by,
          created_at,
          updated_at,
          student:profiles!student_detailed_grades_student_id_fkey!inner(
            full_name,
            student_id
          ),
          subject:subjects!student_detailed_grades_subject_id_fkey!inner(
            name_vietnamese,
            code
          ),
          class:classes!student_detailed_grades_class_id_fkey!inner(
            name
          )
        `)
        .single()

      if (error) throw new Error(error.message)
      result = grade
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
          notes,
          is_locked,
          created_by,
          created_at,
          updated_at,
          student:profiles!student_detailed_grades_student_id_fkey!inner(
            full_name,
            student_id
          ),
          subject:subjects!student_detailed_grades_subject_id_fkey!inner(
            name_vietnamese,
            code
          ),
          class:classes!student_detailed_grades_class_id_fkey!inner(
            name
          )
        `)
        .single()

      if (error) throw new Error(error.message)
      result = grade
    }

    revalidatePath('/dashboard/admin/grade-management')
    
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
    student_search?: string
    page?: number
    limit?: number
  }
) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

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
        notes,
        is_locked,
        created_at,
        student:profiles!student_detailed_grades_student_id_fkey!inner(
          full_name,
          student_id
        ),
        subject:subjects!student_detailed_grades_subject_id_fkey!inner(
          name_vietnamese,
          code
        ),
        class:classes!student_detailed_grades_class_id_fkey!inner(
          name
        )
      `, { count: 'exact' })
      .eq('period_id', periodId)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.class_id) {
      query = query.eq('class_id', filters.class_id)
    }

    if (filters?.subject_id) {
      query = query.eq('subject_id', filters.subject_id)
    }

    if (filters?.student_search) {
      query = query.or(`student.full_name.ilike.%${filters.student_search}%,student.student_id.ilike.%${filters.student_search}%`)
    }

    // Apply pagination
    const page = filters?.page || 1
    const limit = filters?.limit || 50
    const from = (page - 1) * limit
    const to = from + limit - 1

    query = query.range(from, to)

    const { data: grades, error, count } = await query

    if (error) {
      throw new Error(error.message)
    }

    return {
      success: true,
      data: grades || [],
      count: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    }
  } catch (error) {
    console.error('Error fetching detailed grades:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Không thể lấy danh sách điểm số'
    }
  }
}

// Bulk import detailed grades from Excel
export async function bulkImportDetailedGradesAction(formData: BulkDetailedGradeFormData) {
  try {
    const { userId } = await checkAdminPermissions()
    const validatedData = bulkDetailedGradeSchema.parse(formData)
    
    const supabase = createAdminClient()

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
            notes: studentGrade.notes,
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
            notes: studentGrade.notes,
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
            notes: studentGrade.notes,
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
                notes: studentGrade.notes,
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
            notes: studentGrade.notes,
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
            notes: studentGrade.notes,
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

      revalidatePath('/dashboard/admin/grade-management')
      
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
