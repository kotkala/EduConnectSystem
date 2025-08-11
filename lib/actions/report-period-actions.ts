'use server'

import { createClient } from '@/utils/supabase/server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Validation schemas
const reportPeriodSchema = z.object({
  name: z.string().min(1, 'Report period name is required').max(100),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  academic_year_id: z.string().uuid('Invalid academic year ID'),
  semester_id: z.string().uuid('Invalid semester ID')
}).refine((data) => {
  const startDate = new Date(data.start_date)
  const endDate = new Date(data.end_date)
  return endDate > startDate
}, {
  message: "End date must be after start date",
  path: ["end_date"]
})

const updateReportPeriodSchema = reportPeriodSchema.extend({
  id: z.string().uuid('Invalid report period ID')
})

// Types
export type ReportPeriodFormData = z.infer<typeof reportPeriodSchema>
export type UpdateReportPeriodFormData = z.infer<typeof updateReportPeriodSchema>

export interface ReportPeriod {
  id: string
  name: string
  start_date: string
  end_date: string
  academic_year_id: string
  semester_id: string
  created_by: string
  is_active: boolean
  created_at: string
  updated_at: string
  academic_year?: {
    name: string
  }
  semester?: {
    name: string
  }
}

export interface ClassProgress {
  class_id: string
  class_name: string
  homeroom_teacher_name: string
  total_students: number
  sent_reports: number
  status: 'incomplete' | 'complete'
}

// Helper function to check admin permissions
async function checkAdminPermissions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    throw new Error('Admin permissions required')
  }

  return { userId: user.id, profile }
}

// Get all report periods
export async function getReportPeriodsAction() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { success: false, error: 'Authentication required' }
    }

    const { data: reportPeriods, error } = await supabase
      .from('report_periods')
      .select(`
        id,
        name,
        start_date,
        end_date,
        academic_year_id,
        semester_id,
        created_by,
        is_active,
        created_at,
        updated_at,
        academic_year:academic_years(name),
        semester:semesters(name)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      throw new Error(error.message)
    }

    // Normalize potential array relations to single objects and assert type
    type ReportPeriodRow = Omit<ReportPeriod, 'academic_year' | 'semester'> & {
      academic_year: { name: string } | { name: string }[] | null
      semester: { name: string } | { name: string }[] | null
    }

    const normalized: ReportPeriod[] = ((reportPeriods || []) as ReportPeriodRow[]).map((r) => ({
      ...r,
      academic_year: Array.isArray(r.academic_year) ? r.academic_year[0] : r.academic_year || undefined,
      semester: Array.isArray(r.semester) ? r.semester[0] : r.semester || undefined
    }))

    return { success: true, data: normalized }
  } catch (error) {
    console.error('Error in getReportPeriodsAction:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch report periods' 
    }
  }
}

// Create new report period
export async function createReportPeriodAction(formData: ReportPeriodFormData) {
  try {
    const { userId } = await checkAdminPermissions()
    const validatedData = reportPeriodSchema.parse(formData)
    
    const supabase = await createClient()

    const { data: reportPeriod, error } = await supabase
      .from('report_periods')
      .insert({
        ...validatedData,
        created_by: userId
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/admin/report-periods')
    return { success: true, data: reportPeriod }
  } catch (error) {
    console.error('Error in createReportPeriodAction:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create report period' 
    }
  }
}

// Update report period
export async function updateReportPeriodAction(formData: UpdateReportPeriodFormData) {
  try {
    await checkAdminPermissions()
    const validatedData = updateReportPeriodSchema.parse(formData)
    const { id, ...updateData } = validatedData
    
    const supabase = await createClient()

    const { data: reportPeriod, error } = await supabase
      .from('report_periods')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/admin/report-periods')
    return { success: true, data: reportPeriod }
  } catch (error) {
    console.error('Error in updateReportPeriodAction:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update report period' 
    }
  }
}

// Delete report period
export async function deleteReportPeriodAction(id: string) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    const { error } = await supabase
      .from('report_periods')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/dashboard/admin/report-periods')
    return { success: true }
  } catch (error) {
    console.error('Error in deleteReportPeriodAction:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to delete report period' 
    }
  }
}

// Get class progress for a report period
export async function getClassProgressAction(reportPeriodId: string, classBlockId?: string) {
  try {
    await checkAdminPermissions()
    const supabase = await createClient()

    // Fetch the semester_id for the selected report period to scope the classes query
    const { data: period, error: periodError } = await supabase
      .from('report_periods')
      .select('semester_id')
      .eq('id', reportPeriodId)
      .single()

    if (periodError) {
      // Not fatal; continue without semester scoping if column or data is missing
      console.warn('Unable to load report period details for scoping:', periodError.message)
    }

    // Build the classes query with proper filtering (avoid columns that may not exist across envs)
    let classesQuery = supabase
      .from('classes')
      .select(`
        id,
        name,
        homeroom_teacher:profiles!homeroom_teacher_id(full_name)
      `)

    if (classBlockId) {
      classesQuery = classesQuery.eq('class_block_id', classBlockId)
    }

    if (period?.semester_id) {
      classesQuery = classesQuery.eq('semester_id', period.semester_id)
    }

    const { data: classes, error: classError } = await classesQuery

    if (classError) {
      throw new Error(classError.message)
    }

    if (!classes || classes.length === 0) {
      return { success: true, data: [] }
    }

    const classIds = classes.map(c => c.id)

    // Use optimized PostgreSQL function for server-side aggregation
    // This replaces 2 separate queries + client-side aggregation with 1 server call
    const { data: progressCounts, error: countsError } = await supabase
      .rpc('get_class_progress_counts', {
        report_period_id_param: reportPeriodId,
        class_ids_param: classIds
      })

    if (countsError) {
      throw new Error(countsError.message)
    }

    // Create lookup objects from aggregated server results
    interface ProgressCountRow {
      class_id: string
      total_students: number
      sent_reports: number
    }

    const countsByClass = (progressCounts || []).reduce((acc: Record<string, { total_students: number; sent_reports: number }>, row: ProgressCountRow) => {
      acc[row.class_id] = {
        total_students: row.total_students || 0,
        sent_reports: row.sent_reports || 0
      }
      return acc
    }, {})

    // Build class progress data using optimized server-side aggregation
    const classProgress: ClassProgress[] = classes.map(classItem => {
      const homeroomTeacher = Array.isArray(classItem.homeroom_teacher)
        ? classItem.homeroom_teacher[0]
        : classItem.homeroom_teacher

      const counts = countsByClass[classItem.id] || { total_students: 0, sent_reports: 0 }
      const totalStudents = counts.total_students
      const sentReportsCount = counts.sent_reports

      return {
        class_id: classItem.id,
        class_name: classItem.name,
        homeroom_teacher_name: (homeroomTeacher as { full_name?: string } | null)?.full_name || 'Chưa phân công',
        total_students: totalStudents,
        sent_reports: sentReportsCount,
        status: sentReportsCount >= totalStudents && totalStudents > 0 ? 'complete' : 'incomplete'
      }
    })

    return { success: true, data: classProgress }
  } catch (error) {
    console.error('Error in getClassProgressAction:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch class progress'
    }
  }
}
