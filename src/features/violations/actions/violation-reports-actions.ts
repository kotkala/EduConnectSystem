'use server'

import { checkAdminPermissions, checkAuthenticatedUser } from './shared/violation-permissions'
import {
  MONTHLY_VIOLATION_ALERT_FIELDS,
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
 * SIMPLIFIED: Always use real-time data from database
 */
export async function getWeeklyGroupedViolationsAction(params: {
  semester_id: string;
  week_index: number;
  class_id?: string
}) {
  try {
    console.log('🔍 getWeeklyGroupedViolationsAction - Starting with params:', params)
    const { supabase } = await checkAuthenticatedUser()

    // Get semester start date for week calculation
    const { data: semester } = await supabase
      .from('semesters')
      .select('start_date')
      .eq('id', params.semester_id)
      .single()

    if (!semester) {
      throw new Error('Không tìm thấy học kỳ')
    }

    // Calculate week date range
    const startDate = new Date(semester.start_date)
    const weekStart = new Date(startDate)
    weekStart.setDate(startDate.getDate() + (params.week_index - 1) * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    console.log('🔍 Week range:', { weekStart: weekStart.toISOString().split('T')[0], weekEnd: weekEnd.toISOString().split('T')[0] })

    // Always use real-time data from database
    let query = supabase
      .from('student_violations')
      .select(`
        id, student_id, class_id, violation_type_id, severity, points, description, violation_date, sent_status, sent_at,
        student:profiles!student_id(id, full_name, student_id),
        class:classes!class_id(id, name),
        violation_type:violation_types!violation_type_id(id, name, points)
      `)
      .eq('semester_id', params.semester_id)
      .gte('violation_date', weekStart.toISOString().split('T')[0])
      .lte('violation_date', weekEnd.toISOString().split('T')[0])

    if (params.class_id) {
      query = query.eq('class_id', params.class_id)
    }

    const { data: violations, error } = await query.order('student_id')

    if (error) {
      console.error('🔍 Query error:', error)
      throw new Error('Không thể lấy báo cáo vi phạm tuần')
    }

    console.log('🔍 Query result:', { violations: violations?.length || 0, dataSource: 'realtime' })

    // Group by student using the same logic as old code
    const map = new Map<string, {
      student: { id: string; full_name: string; student_id: string } | null;
      class: { id: string; name: string } | null;
      total_points: number;
      total_violations: number;
      sent_violations: number;
      unsent_violations: number;
      violations: Array<{
        id: string;
        name: string;
        points: number;
        date: string;
        description: string | null;
        sent_status: string;
        sent_at: string | null;
      }>;
    }>()

    for (const row of (violations || [])) {
      const key = row.student_id
      if (!map.has(key)) {
        map.set(key, {
          student: Array.isArray(row.student) ? row.student[0] : row.student,
          class: Array.isArray(row.class) ? row.class[0] : row.class,
          total_points: 0,
          total_violations: 0,
          sent_violations: 0,
          unsent_violations: 0,
          violations: []
        })
      }
      const agg = map.get(key)!
      // Normalize supabase arrays
      const rowData = row as { violation_type?: { points?: number; name?: string } | { points?: number; name?: string }[] }
      const vt = (Array.isArray(rowData.violation_type) ? rowData.violation_type[0] : rowData.violation_type) || null
      const typePoints = Number((vt?.points ?? 0))
      const svPoints = Number(row.points ?? 0)
      const effectivePoints = svPoints > 0 ? svPoints : typePoints

      agg.total_points += effectivePoints
      agg.total_violations += 1

      // Track sent/unsent status
      if (row.sent_status === 'sent') {
        agg.sent_violations += 1
      } else {
        agg.unsent_violations += 1
      }

      agg.violations.push({
        id: row.id,
        name: (vt?.name) || '',
        points: effectivePoints,
        date: row.violation_date,
        description: row.description,
        sent_status: row.sent_status || 'unsent',
        sent_at: row.sent_at
      })
    }

    // Calculate current totals
    const currentViolationCount = violations?.length || 0
    const currentTotalPoints = Array.from(map.values()).reduce((sum, item) => sum + item.total_points, 0)

    console.log('🔍 Final grouped data:', Array.from(map.values()))

    // Get report status to determine sync info
    const statusResult = await getWeeklyReportStatusAction({
      semester_id: params.semester_id,
      week_index: params.week_index,
      class_id: params.class_id
    })

    const reportStatus = statusResult.success ? statusResult.data : null
    const needsResync = reportStatus?.needs_resync || false
    const reportWasSent = reportStatus?.is_sent_to_teacher || false

    // Determine data source
    let dataSource: 'cached' | 'realtime' = 'realtime'
    if (!needsResync && reportWasSent) {
      dataSource = 'cached'
    }

    return {
      success: true,
      data: Array.from(map.values()),
      sync_info: {
        has_existing_report: reportWasSent,
        report_was_sent: reportWasSent,
        report_sent_at: reportStatus?.sent_at || null,
        data_changed_since_sent: needsResync,
        needs_resync: needsResync,
        current_violation_count: currentViolationCount,
        current_total_points: currentTotalPoints,
        last_report_updated: null,
        data_source: dataSource
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
 * Get monthly ranking with pagination
 */
export async function getMonthlyRankingAction(params: {
  semester_id: string;
  academic_month: number; // Changed from month_index to academic_month
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
    is_admin_viewed: boolean;
    admin_viewed_at: string | null;
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

    const { startDate, endDate } = buildMonthDateRange(semester.start_date, params.academic_month)

    // Manual query approach
    const violationsQuery = supabase
      .from('student_violations')
      .select('student_id, class_id, points')
      .gte('violation_date', startDate)
      .lte('violation_date', endDate)
      .eq('semester_id', params.semester_id)

    if (params.class_id) {
      violationsQuery.eq('class_id', params.class_id)
    }

    const { data: violationData, error: violationError } = await violationsQuery

    if (violationError) throw new Error('Không thể lấy dữ liệu vi phạm')

    // Get unique student and class IDs
    const studentIds = [...new Set(violationData?.map(v => v.student_id) || [])]
    const classIds = [...new Set(violationData?.map(v => v.class_id) || [])]

    // Get student profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, student_id')
      .in('id', studentIds)

    // Get class info
    const { data: classes } = await supabase
      .from('classes')
      .select('id, name')
      .in('id', classIds)

    // Group and rank students
    const studentStats: Record<string, {
      student_id: string;
      student_name: string;
      student_code: string;
      class_name: string;
      total_violations: number;
      total_points: number;
    }> = {}

    violationData?.forEach(violation => {
      const studentId = violation.student_id
      if (!studentStats[studentId]) {
        const profile = profiles?.find(p => p.id === studentId)
        const classInfo = classes?.find(c => c.id === violation.class_id)
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
      .map((student, index) => ({ ...student, rank: index + 1 }))

    // Get viewed status from academic_monthly_violation_alerts
    const rankedStudentIds = rankedStudents.map(s => s.student_id)
    const { data: alertStatuses } = await supabase
      .from('academic_monthly_violation_alerts')
      .select('student_id, is_seen, seen_at')
      .eq('semester_id', params.semester_id)
      .eq('academic_month', params.academic_month)
      .in('student_id', rankedStudentIds)

    // Ensure monthly_violation_alerts exist for students with 3+ violations
    const studentsNeedingAlerts = rankedStudents.filter(s => s.total_violations >= 3)
    if (studentsNeedingAlerts.length > 0) {
      const alertsToCreate = studentsNeedingAlerts
        .filter(student => !alertStatuses?.some(a => a.student_id === student.student_id))
        .map(student => ({
          id: crypto.randomUUID(),
          student_id: student.student_id,
          semester_id: params.semester_id,
          academic_month: params.academic_month,
          total_violations: student.total_violations,
          is_seen: false,
          created_at: new Date().toISOString()
        }))

      if (alertsToCreate.length > 0) {
        await supabase
          .from('monthly_violation_alerts')
          .insert(alertsToCreate)
      }
    }

    // Add viewed status to results
    const resultsWithViewStatus = rankedStudents.map(student => {
      const alertStatus = alertStatuses?.find(a => a.student_id === student.student_id)
      return {
        ...student,
        is_admin_viewed: alertStatus?.is_seen || false,
        admin_viewed_at: alertStatus?.seen_at || null
      }
    })

    // Apply pagination
    const paginatedResults = resultsWithViewStatus.slice(offset, offset + limit)

    return {
      success: true,
      data: paginatedResults,
      total: resultsWithViewStatus.length
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
 * Mark weekly reports as sent to teachers using unified_violation_reports
 */
export async function markWeeklyReportsAsSentAction(params: {
  semester_id: string;
  week_index: number;
  class_id?: string;
}): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const { userId, supabase } = await checkAdminPermissions()

    // Get semester start date to calculate period
    const { data: semester } = await supabase
      .from('semesters')
      .select('start_date')
      .eq('id', params.semester_id)
      .single()

    if (!semester) throw new Error('Không tìm thấy học kỳ')

    // Calculate week period
    const startDate = new Date(semester.start_date)
    const weekStart = new Date(startDate)
    weekStart.setDate(startDate.getDate() + (params.week_index - 1) * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    // Get current UNSENT violation data for this period to store in report
    let violationQuery = supabase
      .from('student_violations')
      .select(`
        id, student_id, points, severity, description, violation_date, sent_status,
        violation_type:violation_types!violation_type_id(name, points)
      `)
      .eq('semester_id', params.semester_id)
      .eq('sent_status', 'unsent')  // Only get unsent violations
      .gte('violation_date', weekStart.toISOString().split('T')[0])
      .lte('violation_date', weekEnd.toISOString().split('T')[0])

    if (params.class_id) {
      violationQuery = violationQuery.eq('class_id', params.class_id)
    }

    const { data: currentViolations } = await violationQuery

    const violationCount = currentViolations?.length || 0
    const totalPoints = currentViolations?.reduce((sum, v) => sum + (v.points || 0), 0) || 0
    const violationDetails = currentViolations?.map(v => {
      const violationType = Array.isArray(v.violation_type) ? v.violation_type[0] : v.violation_type
      return {
        id: v.id,
        student_id: v.student_id,
        type: violationType?.name || 'Unknown',
        points: v.points,
        severity: v.severity,
        description: v.description,
        date: v.violation_date
      }
    }) || []

    // Create or update unified violation report for weekly type
    // Use the unique constraint fields for upsert, let database generate ID
    const { error } = await supabase
      .from('unified_violation_reports')
      .upsert({
        report_type: 'weekly',
        report_period: `week_${params.week_index}`,
        semester_id: params.semester_id,
        class_id: params.class_id || null,
        period_start: weekStart.toISOString().split('T')[0],
        period_end: weekEnd.toISOString().split('T')[0],
        violation_count: violationCount,
        total_points: totalPoints,
        violation_details: violationDetails,
        is_alert_sent: true,
        alert_sent_at: new Date().toISOString(),
        created_by: userId,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'report_type,report_period,semester_id,class_id'
      })

    if (error) throw new Error('Không thể cập nhật trạng thái gửi báo cáo')

    // Mark individual violations as sent
    if (currentViolations && currentViolations.length > 0) {
      const violationIds = currentViolations.map(v => v.id)
      const { error: updateError } = await supabase
        .from('student_violations')
        .update({
          sent_status: 'sent',
          sent_at: new Date().toISOString()
        })
        .in('id', violationIds)

      if (updateError) {
        console.error('Error marking violations as sent:', updateError)
        // Don't throw error here, report was still created successfully
      }
    }

    return {
      success: true,
      message: 'Đã gửi báo cáo tuần cho giáo viên chủ nhiệm'
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra'
    }
  }
}

/**
 * Get weekly report status using unified_violation_reports
 * Also checks if data has changed since the report was sent
 */
export async function getWeeklyReportStatusAction(params: {
  semester_id: string;
  week_index: number;
  class_id?: string;
}): Promise<{
  success: boolean;
  data?: {
    is_sent_to_teacher: boolean;
    sent_at: string | null;
    needs_resync?: boolean;
    current_violation_count?: number;
    report_violation_count?: number;
    sent_violations?: number;
    unsent_violations?: number;
  };
  error?: string;
}> {
  try {
    const { supabase } = await checkAuthenticatedUser()

    // Get semester start date for week calculation
    const { data: semester } = await supabase
      .from('semesters')
      .select('start_date')
      .eq('id', params.semester_id)
      .single()

    if (!semester) {
      throw new Error('Không tìm thấy học kỳ')
    }

    // Calculate week date range
    const startDate = new Date(semester.start_date)
    const weekStart = new Date(startDate)
    weekStart.setDate(startDate.getDate() + (params.week_index - 1) * 7)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    // Get current violation count and sent status for this week
    let violationQuery = supabase
      .from('student_violations')
      .select('id, sent_status')
      .eq('semester_id', params.semester_id)
      .gte('violation_date', weekStart.toISOString().split('T')[0])
      .lte('violation_date', weekEnd.toISOString().split('T')[0])

    if (params.class_id) {
      violationQuery = violationQuery.eq('class_id', params.class_id)
    }

    const { data: violations } = await violationQuery
    const currentViolationCount = violations?.length || 0
    const sentViolationCount = violations?.filter(v => v.sent_status === 'sent').length || 0
    const unsentViolationCount = violations?.filter(v => v.sent_status === 'unsent').length || 0

    // We no longer need to check unified_violation_reports since we're using individual violation status

    // Determine status based on individual violation sent status
    const hasAnySentViolations = sentViolationCount > 0
    const hasAnyUnsentViolations = unsentViolationCount > 0

    // If there are unsent violations, the report is not fully sent
    const isSent = hasAnySentViolations && !hasAnyUnsentViolations
    const needsResync = hasAnySentViolations && hasAnyUnsentViolations

    // Get the most recent sent_at from violations if any were sent
    let mostRecentSentAt: string | null = null
    if (hasAnySentViolations) {
      let sentAtQuery = supabase
        .from('student_violations')
        .select('sent_at')
        .eq('semester_id', params.semester_id)
        .eq('sent_status', 'sent')
        .gte('violation_date', weekStart.toISOString().split('T')[0])
        .lte('violation_date', weekEnd.toISOString().split('T')[0])
        .not('sent_at', 'is', null)
        .order('sent_at', { ascending: false })
        .limit(1)

      if (params.class_id) {
        sentAtQuery = sentAtQuery.eq('class_id', params.class_id)
      }

      const { data: sentViolation } = await sentAtQuery.single()
      mostRecentSentAt = sentViolation?.sent_at || null
    }

    return {
      success: true,
      data: {
        is_sent_to_teacher: isSent,
        sent_at: mostRecentSentAt,
        needs_resync: needsResync,
        current_violation_count: currentViolationCount,
        report_violation_count: sentViolationCount,
        sent_violations: sentViolationCount,
        unsent_violations: unsentViolationCount
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
 * Mark monthly violation summary as viewed by admin using unified_violation_reports
 */
export async function markMonthlyViolationAsViewedAction(params: {
  student_id: string;
  semester_id: string;
  academic_month: number; // Changed from month_index to academic_month
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { userId, supabase } = await checkAdminPermissions()

    // Check if record already exists
    const { data: existingRecord } = await supabase
      .from('unified_violation_reports')
      .select('id')
      .eq('report_type', 'alert')
      .eq('report_period', 'monthly')
      .eq('semester_id', params.semester_id)
      .eq('student_id', params.student_id)
      .single()

    if (existingRecord) {
      // Update existing record
      const { error } = await supabase
        .from('unified_violation_reports')
        .update({
          is_alert_sent: true,
          alert_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id)

      if (error) throw new Error('Không thể cập nhật trạng thái đã xem')
    } else {
      // Get semester info to calculate period dates
      const { data: semester } = await supabase
        .from('semesters')
        .select('start_date')
        .eq('id', params.semester_id)
        .single()

      if (!semester) throw new Error('Không tìm thấy học kỳ')

      // Calculate academic month period
      const semesterStart = new Date(semester.start_date)
      const monthStart = new Date(semesterStart)
      monthStart.setDate(monthStart.getDate() + (params.academic_month - 1) * 30.44)
      const monthEnd = new Date(monthStart)
      monthEnd.setDate(monthEnd.getDate() + 30.44 - 1)

      // Create new record
      const { error } = await supabase
        .from('unified_violation_reports')
        .insert({
          report_type: 'alert',
          report_period: 'monthly',
          semester_id: params.semester_id,
          student_id: params.student_id,
          period_start: monthStart.toISOString().split('T')[0],
          period_end: monthEnd.toISOString().split('T')[0],
          is_alert_sent: true,
          alert_sent_at: new Date().toISOString(),
          created_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) throw new Error('Không thể tạo trạng thái đã xem')
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Có lỗi xảy ra'
    }
  }
}


