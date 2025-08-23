'use server'

import { revalidatePath } from 'next/cache'
import { checkAdminPermissions, checkAdminOrTeacherPermissions } from './shared/violation-permissions'
import { DISCIPLINARY_CASE_FIELDS, buildPaginationParams } from './shared/violation-queries'
import {
  disciplinaryCaseSchema,
  disciplinaryActionTypeSchema,
  type DisciplinaryCaseFormData,
  type DisciplinaryActionTypeFormData,
  type DisciplinaryCase
} from '@/lib/validations/violation-validations'

/**
 * Create a new disciplinary case
 */
export async function createDisciplinaryCaseAction(data: DisciplinaryCaseFormData) {
  try {
    const { userId, supabase } = await checkAdminPermissions()
    const validatedData = disciplinaryCaseSchema.parse(data)

    const { data: disciplinaryCase, error } = await supabase
      .from('student_disciplinary_cases')
      .insert({
        ...validatedData,
        status: 'draft',
        created_by: userId,
        created_at: new Date().toISOString()
      })
      .select('*')
      .single()

    if (error) throw new Error('Không thể tạo hồ sơ kỷ luật')

    revalidatePath('/dashboard/admin/violations')
    return { success: true, data: disciplinaryCase }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }
  }
}

/**
 * Get disciplinary action types
 */
export async function getDisciplinaryActionTypesAction(): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    name: string;
    description: string;
    severity_level: number;
    is_active: boolean;
  }>;
  error?: string;
}> {
  try {
    const { supabase } = await checkAdminPermissions()

    const { data: actionTypes, error } = await supabase
      .from('disciplinary_action_types')
      .select('id, name, description, severity_level, is_active')
      .eq('is_active', true)
      .order('severity_level')

    if (error) throw new Error('Không thể lấy danh sách loại kỷ luật')

    return { success: true, data: actionTypes || [] }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }
  }
}

/**
 * Create a new disciplinary action type
 */
export async function createDisciplinaryActionTypeAction(data: DisciplinaryActionTypeFormData) {
  try {
    const { supabase } = await checkAdminPermissions()
    const validatedData = disciplinaryActionTypeSchema.parse(data)

    const { data: actionType, error } = await supabase
      .from('disciplinary_action_types')
      .insert(validatedData)
      .select('id, name, description, severity_level, is_active')
      .single()

    if (error) throw new Error('Không thể tạo loại kỷ luật')

    revalidatePath('/dashboard/admin/violations')
    return { success: true, data: actionType }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }
  }
}

/**
 * Update a disciplinary action type
 */
export async function updateDisciplinaryActionTypeAction(data: {
  id: string;
  name?: string;
  description?: string;
  severity_level?: number;
}) {
  try {
    const { supabase } = await checkAdminPermissions()
    const { id, ...updateFields } = data

    const { data: actionType, error } = await supabase
      .from('disciplinary_action_types')
      .update({ ...updateFields, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id, name, description, severity_level, is_active')
      .single()

    if (error) throw new Error('Không thể cập nhật loại kỷ luật')

    revalidatePath('/dashboard/admin/violations')
    return { success: true, data: actionType }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }
  }
}

/**
 * Deactivate a disciplinary action type
 */
export async function deactivateDisciplinaryActionTypeAction(actionTypeId: string) {
  try {
    const { supabase } = await checkAdminPermissions()

    // Check if action type is being used
    const { data: cases } = await supabase
      .from('student_disciplinary_cases')
      .select('id')
      .eq('action_type_id', actionTypeId)
      .limit(1)

    if (cases && cases.length > 0) {
      throw new Error('Không thể xóa loại kỷ luật đang được sử dụng')
    }

    const { error } = await supabase
      .from('disciplinary_action_types')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', actionTypeId)

    if (error) throw new Error('Không thể xóa loại kỷ luật')

    revalidatePath('/dashboard/admin/violations')
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }
  }
}

/**
 * Get disciplinary cases with filters and pagination
 */
export async function getDisciplinaryCasesAction(filters?: {
  student_id?: string;
  class_id?: string;
  semester_id?: string;
  status?: string;
  action_type_id?: string;
  page?: number;
  limit?: number;
}): Promise<{
  success: boolean;
  data?: DisciplinaryCase[];
  total?: number;
  error?: string;
}> {
  try {
    const { supabase } = await checkAdminOrTeacherPermissions()
    const { page = 1, limit = 10, ...otherFilters } = filters || {}
    const { from, to } = buildPaginationParams(page, limit)

    // Use simplified query to avoid complex join issues
    let query = supabase
      .from('student_disciplinary_cases')
      .select(`
        *,
        student:profiles!student_id(id, full_name, student_id, email),
        class:classes(id, name),
        action_type:disciplinary_action_types(id, name, description, severity_level),
        creator:profiles!created_by(full_name)
      `, { count: 'exact' })

    // Apply filters
    Object.entries(otherFilters).forEach(([key, value]) => {
      if (value) {
        query = query.eq(key, value)
      }
    })

    const { data: cases, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) throw new Error('Không thể lấy danh sách hồ sơ kỷ luật')

    return { 
      success: true, 
      data: cases || [], 
      total: count || 0 
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }
  }
}

/**
 * Update disciplinary case status
 */
export async function updateDisciplinaryCaseStatusAction(data: {
  caseId: string;
  status: 'draft' | 'sent_to_homeroom' | 'acknowledged' | 'meeting_scheduled' | 'resolved';
  notes?: string;
}) {
  try {
    const { userId, supabase } = await checkAdminOrTeacherPermissions()

    const { data: disciplinaryCase, error } = await supabase
      .from('student_disciplinary_cases')
      .update({
        status: data.status,
        notes: data.notes,
        updated_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.caseId)
      .select(DISCIPLINARY_CASE_FIELDS)
      .single()

    if (error) throw new Error('Không thể cập nhật trạng thái hồ sơ kỷ luật')

    revalidatePath('/dashboard/admin/violations')
    return { success: true, data: disciplinaryCase }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }
  }
}

/**
 * Get disciplinary case by ID
 */
export async function getDisciplinaryCaseByIdAction(caseId: string): Promise<{
  success: boolean;
  data?: DisciplinaryCase;
  error?: string;
}> {
  try {
    const { supabase } = await checkAdminPermissions()

    const { data: disciplinaryCase, error } = await supabase
      .from('student_disciplinary_cases')
      .select(DISCIPLINARY_CASE_FIELDS)
      .eq('id', caseId)
      .single()

    if (error) throw new Error('Không thể lấy thông tin hồ sơ kỷ luật')

    return { success: true, data: disciplinaryCase }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }
  }
}

/**
 * Delete a disciplinary case (soft delete)
 */
export async function deleteDisciplinaryCaseAction(caseId: string) {
  try {
    const { supabase } = await checkAdminPermissions()

    const { error } = await supabase
      .from('student_disciplinary_cases')
      .update({ 
        is_deleted: true, 
        deleted_at: new Date().toISOString() 
      })
      .eq('id', caseId)

    if (error) throw new Error('Không thể xóa hồ sơ kỷ luật')

    revalidatePath('/dashboard/admin/violations')
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }
  }
}

// ===== LEGACY COMPATIBILITY WRAPPERS =====
// These functions maintain backward compatibility with old function signatures

/**
 * Legacy wrapper for getDisciplinaryCasesAction with old parameter format
 * @deprecated Use getDisciplinaryCasesAction with new signature
 */
export async function getDisciplinaryCasesActionLegacy(params?: {
  semester_id?: string;
  status?: string;
  class_id?: string
}) {
  return getDisciplinaryCasesAction({
    semester_id: params?.semester_id,
    status: params?.status,
    class_id: params?.class_id
  })
}

/**
 * Legacy wrapper for updateDisciplinaryCaseStatusAction with old parameter format
 * @deprecated Use updateDisciplinaryCaseStatusAction with new signature
 */
export async function updateDisciplinaryCaseStatusActionLegacy(params: {
  case_id: string;
  status: string
}) {
  return updateDisciplinaryCaseStatusAction({
    caseId: params.case_id,
    status: params.status as 'draft' | 'sent_to_homeroom' | 'acknowledged' | 'meeting_scheduled' | 'resolved'
  })
}
