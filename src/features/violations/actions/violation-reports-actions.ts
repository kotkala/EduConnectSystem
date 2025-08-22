'use server'

import { checkAdminPermissions, checkAuthenticatedUser } from './shared/violation-permissions'
import {
  MONTHLY_VIOLATION_ALERT_FIELDS,
  buildWeekDateRange,
  buildMonthDateRange
} from './shared/violation-queries'

/**
 * Get violation statistics for admin dashboard
 */
export async function getViolationStatsAction(): Promise<{
  success: boolean;
  data?: {
    totalViolations: number;
    thisWeekViolations: number;
    totalCategories: number;
    totalTypes: number;
    severityBreakdown: Array<{ severity: string; count: number }>;
  };
  error?: string;
}> {
  try {
    const { supabase } = await checkAuthenticatedUser()

    // Get current week date range
    const now = new Date()
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)

    const [
      totalViolationsResult,
      thisWeekViolationsResult,
      categoriesResult,
      typesResult,
      severityResult
    ] = await Promise.all([
      // Total violations
      supabase
        .from('student_violations')
        .select('id', { count: 'exact', head: true }),
      
      // This week violations
      supabase
        .from('student_violations')
        .select('id', { count: 'exact', head: true })
        .gte('violation_date', startOfWeek.toISOString().split('T')[0])
        .lte('violation_date', endOfWeek.toISOString().split('T')[0]),
      
      // Total categories
      supabase
        .from('violation_categories')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
      
      // Total types
      supabase
        .from('violation_types')
        .select('id', { count: 'exact', head: true })
        .eq('is_active', true),
      
      // Severity breakdown
      supabase
        .from('student_violations')
        .select(`
          violation_types!inner(severity)
        `)
    ])

    // Process severity breakdown
    const severityBreakdown: Array<{ severity: string; count: number }> = []
    if (severityResult.data) {
      const severityCounts: Record<string, number> = {}
      severityResult.data.forEach((violation: { violation_types: { severity: string }[] }) => {
        const severity = violation.violation_types?.[0]?.severity || 'unknown'
        severityCounts[severity] = (severityCounts[severity] || 0) + 1
      })
      
      Object.entries(severityCounts).forEach(([severity, count]) => {
        severityBreakdown.push({ severity, count })
      })
    }

    return {
      success: true,
      data: {
        totalViolations: totalViolationsResult.count || 0,
        thisWeekViolations: thisWeekViolationsResult.count || 0,
        totalCategories: categoriesResult.count || 0,
        totalTypes: typesResult.count || 0,
        severityBreakdown
      }
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }
  }
}

/**
 * Get weekly grouped violations for reporting
 */
export async function getWeeklyGroupedViolationsAction(params: {
  semester_id: string;
  week_index: number;
  class_id?: string
}) {
  try {
    console.log('🔍 getWeeklyGroupedViolationsAction - Starting with params:', params)
    const { supabase } = await checkAuthenticatedUser()

    // Use week_index directly like the old code
    let query = supabase
      .from('student_violations')
      .select(`
        id, student_id, class_id, violation_type_id, severity, points, description, violation_date,
        student:profiles!student_id(id, full_name, student_id),
        class:classes!class_id(id, name),
        violation_type:violation_types!violation_type_id(id, name, points)
      `)
      .eq('semester_id', params.semester_id)
      .eq('week_index', params.week_index)

    if (params.class_id) {
      query = query.eq('class_id', params.class_id)
    }

    const { data: violations, error } = await query.order('student_id')

    console.log('🔍 Query result:', { violations, error })
    if (error) {
      console.error('🔍 Query error:', error)
      throw new Error('Không thể lấy báo cáo vi phạm tuần')
    }

    // Group by student using the same logic as old code
    const map = new Map<string, {
      student: { id: string; full_name: string; student_id: string } | null;
      class: { id: string; name: string } | null;
      total_points: number;
      total_violations: number;
      violations: Array<{ id: string; name: string; points: number; date: string; description: string | null }>;
    }>()

    for (const row of (violations || [])) {
      const key = row.student_id
      if (!map.has(key)) {
        map.set(key, {
          student: Array.isArray(row.student) ? row.student[0] : row.student,
          class: Array.isArray(row.class) ? row.class[0] : row.class,
          total_points: 0,
          total_violations: 0,
          violations: []
        })
      }
      const agg = map.get(key)!
      // Normalize supabase arrays
      const vt = (Array.isArray((row as any).violation_type) ? (row as any).violation_type[0] : (row as any).violation_type) || null
      const typePoints = Number((vt?.points ?? 0))
      const svPoints = Number(row.points ?? 0)
      const effectivePoints = svPoints > 0 ? svPoints : typePoints

      agg.total_points += effectivePoints
      agg.total_violations += 1
      agg.violations.push({
        id: row.id,
        name: (vt?.name) || '',
        points: effectivePoints,
        date: row.violation_date,
        description: row.description
      })
    }

    console.log('🔍 Final grouped data:', Array.from(map.values()))
    return {
      success: true,
      data: Array.from(map.values())
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }
  }
}

/**
 * Get monthly ranking with pagination
 */
export async function getMonthlyRankingAction(params: {
  semester_id: string;
  month_index: number;
  class_id?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  success: boolean;
  data?: Array<{
    student_id: string;
    student_name: string;
    student_code: string;
    class_name: string;
    total_violations: number;
    total_points: number;
    rank: number;
  }>;
  total?: number;
  error?: string;
}> {
  try {
    const { supabase } = await checkAdminPermissions()
    const { limit = 50, offset = 0 } = params

    // Get semester start date
    const { data: semester } = await supabase
      .from('semesters')
      .select('start_date')
      .eq('id', params.semester_id)
      .single()

    if (!semester) throw new Error('Không tìm thấy học kỳ')

    const { startDate, endDate } = buildMonthDateRange(semester.start_date, params.month_index)

    // Use monthly_violation_ranking view if available, otherwise build query
    let query = supabase
      .from('student_violations')
      .select(`
        student_id,
        points,
        profiles!student_id(full_name, student_id),
        classes(name)
      `)
      .gte('violation_date', startDate)
      .lte('violation_date', endDate)

    if (params.class_id) {
      query = query.eq('class_id', params.class_id)
    }

    const { data: violations, error } = await query

    if (error) throw new Error('Không thể lấy xếp hạng vi phạm tháng')

    // Group and rank students
    const studentStats: Record<string, {
      student_id: string;
      student_name: string;
      student_code: string;
      class_name: string;
      total_violations: number;
      total_points: number;
    }> = {}
    violations?.forEach(violation => {
      const studentId = violation.student_id
      if (!studentStats[studentId]) {
        const profile = Array.isArray(violation.profiles) ? violation.profiles[0] : violation.profiles
        const classInfo = Array.isArray(violation.classes) ? violation.classes[0] : violation.classes
        studentStats[studentId] = {
          student_id: studentId,
          student_name: profile?.full_name || '',
          student_code: profile?.student_id || '',
          class_name: classInfo?.name || '',
          total_violations: 0,
          total_points: 0
        }
      }
      studentStats[studentId].total_violations += 1
      studentStats[studentId].total_points += violation.points
    })

    // Convert to array and sort by total points (descending)
    const rankedStudents = Object.values(studentStats)
      .sort((a, b) => b.total_points - a.total_points)
      .map((student, index: number) => ({
        ...student,
        rank: index + 1
      }))

    // Apply pagination
    const paginatedResults = rankedStudents.slice(offset, offset + limit)

    return {
      success: true,
      data: paginatedResults,
      total: rankedStudents.length
    }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }
  }
}

/**
 * Get monthly three plus violations list (students with 3+ violations)
 */
export async function getMonthlyThreePlusListAction(params: { 
  semester_id: string; 
  month_index: number 
}) {
  try {
    const { supabase } = await checkAdminPermissions()

    const { data: alerts, error } = await supabase
      .from('monthly_violation_alerts')
      .select(MONTHLY_VIOLATION_ALERT_FIELDS)
      .eq('semester_id', params.semester_id)
      .eq('month_index', params.month_index)
      .eq('is_seen', false)
      .gte('violation_count', 3)
      .order('violation_count', { ascending: false })

    if (error) throw new Error('Không thể lấy danh sách cảnh báo vi phạm')

    return { success: true, data: alerts || [] }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }
  }
}

/**
 * Get unseen violation alerts count for sidebar badge
 */
export async function getUnseenViolationAlertsCountAction(): Promise<{
  success: boolean;
  count?: number;
  error?: string;
}> {
  try {
    const { supabase } = await checkAdminPermissions()

    const { count, error } = await supabase
      .from('monthly_violation_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('is_seen', false)
      .gte('violation_count', 3)

    if (error) throw new Error('Không thể lấy số lượng cảnh báo')

    return { success: true, count: count || 0 }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }
  }
}

/**
 * Mark monthly alert as seen
 */
export async function markMonthlyAlertSeenAction(params: { 
  student_id: string; 
  semester_id: string; 
  month_index: number 
}) {
  try {
    const { userId, supabase } = await checkAdminPermissions()

    const { error } = await supabase
      .from('monthly_violation_alerts')
      .update({
        is_seen: true,
        seen_by: userId,
        seen_at: new Date().toISOString()
      })
      .eq('student_id', params.student_id)
      .eq('semester_id', params.semester_id)
      .eq('month_index', params.month_index)

    if (error) throw new Error('Không thể đánh dấu đã xem')

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra' 
    }
  }
}
