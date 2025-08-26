import { createClient } from '@/lib/supabase/server'

// Generic error handling for Supabase queries
export function handleSupabaseError(error: unknown, context: string): never {
  console.error(`${context}:`, error)
  throw new Error(error instanceof Error ? error.message : `An error occurred in ${context}`)
}

// Generic function to execute Supabase queries with error handling
export async function executeSupabaseQuery<T>(
  queryFn: (supabase: Awaited<ReturnType<typeof createClient>>) => Promise<{ data: T | null; error: unknown }>,
  context: string
): Promise<T> {
  const supabase = await createClient()
  const { data, error } = await queryFn(supabase)

  if (error) {
    handleSupabaseError(error, context)
  }

  return data as T
}

// Common query patterns for parent-student relationships
export async function getParentStudentRelationships(parentId: string) {
  return executeSupabaseQuery(
    async (supabase) => supabase
      .from('parent_student_relationships')
      .select(`
        student_id,
        profiles!parent_student_relationships_student_id_fkey(
          full_name,
          student_id
        )
      `)
      .eq('parent_id', parentId),
    'getParentStudentRelationships'
  )
}

// Common query pattern for recent feedback data - optimized with batch processing
export async function getRecentFeedbackData(studentIds: string[], daysBack: number = 30): Promise<unknown[]> {
  // Optimize: Early return for empty student list
  if (studentIds.length === 0) return []

  const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()

  // Optimize: Batch process large student lists to avoid query size limits
  const BATCH_SIZE = 100
  if (studentIds.length > BATCH_SIZE) {
    const batches = []
    for (let i = 0; i < studentIds.length; i += BATCH_SIZE) {
      const batch = studentIds.slice(i, i + BATCH_SIZE)
      batches.push(getRecentFeedbackData(batch, daysBack))
    }
    const results = await Promise.all(batches)
    const flatResults = results.flat()
    const sortedResults = flatResults.toSorted((a: unknown, b: unknown) => {
      const aDate = (a as { feedback_created_at: string }).feedback_created_at
      const bDate = (b as { feedback_created_at: string }).feedback_created_at
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    })
    return sortedResults.slice(0, 50) // Limit final results
  }

  return executeSupabaseQuery(
    async (supabase) => supabase
      .from('parent_feedback_with_ai_summary')
      .select(`
        student_name,
        subject_name,
        teacher_name,
        rating,
        comment,
        ai_summary,
        feedback_created_at,
        week_number
      `)
      .in('student_id', studentIds)
      .gte('feedback_created_at', cutoffDate)
      .order('feedback_created_at', { ascending: false })
      .limit(50),
    'getRecentFeedbackData'
  )
}

// Common query pattern for recent grade data - optimized with batch processing
export async function getRecentGradeData(studentIds: string[], daysBack: number = 30): Promise<unknown[]> {
  // Optimize: Early return for empty student list
  if (studentIds.length === 0) return []

  const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()

  // Optimize: Batch process large student lists
  const BATCH_SIZE = 100
  if (studentIds.length > BATCH_SIZE) {
    const batches = []
    for (let i = 0; i < studentIds.length; i += BATCH_SIZE) {
      const batch = studentIds.slice(i, i + BATCH_SIZE)
      batches.push(getRecentGradeData(batch, daysBack))
    }
    const results = await Promise.all(batches)
    const flatResults = results.flat()
    const sortedResults = flatResults.toSorted((a: unknown, b: unknown) => {
      const aDate = (a as { submission_date: string }).submission_date
      const bDate = (b as { submission_date: string }).submission_date
      return new Date(bDate).getTime() - new Date(aDate).getTime()
    })
    return sortedResults.slice(0, 30) // Limit final results
  }

  return executeSupabaseQuery(
    async (supabase) => supabase
      .from('submission_grades')
      .select(`
        grade,
        submission_date,
        subjects(name_vietnamese),
        profiles!submission_grades_student_id_fkey(full_name)
      `)
      .in('student_id', studentIds)
      .gte('submission_date', cutoffDate)
      .order('submission_date', { ascending: false })
      .limit(30),
    'getRecentGradeData'
  )
}

// Common query pattern for recent violations data
export async function getRecentViolationsData(studentIds: string[], daysBack: number = 60) {
  const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()

  return executeSupabaseQuery(
    async (supabase) => supabase
      .from('student_violations')
      .select(`
        id,
        severity,
        description,
        recorded_at,
        violation_date,
        student:profiles!student_violations_student_id_fkey(full_name, student_id),
        violation_type:violation_types(
          name,
          violation_categories(name)
        ),
        recorded_by:profiles!student_violations_recorded_by_fkey(full_name)
      `)
      .in('student_id', studentIds)
      .gte('recorded_at', cutoffDate)
      .order('recorded_at', { ascending: false })
      .limit(20),
    'getRecentViolationsData'
  )
}

// Get grade submission data for students (using existing tables)
export async function getGradeReportsData(studentIds: string[]) {
  if (studentIds.length === 0) return []

  return executeSupabaseQuery(
    async (supabase) => {
      const query = supabase
        .from('grade_submissions')
        .select(`
          id,
          status,
          ai_feedback,
          teacher_notes,
          sent_at,
          reviewed_at,
          sent_to_parents_at,
          created_at,
          period:grade_reporting_periods(
            id,
            name,
            start_date,
            end_date,
            period_type,
            academic_year:academic_years(name),
            semester:semesters(name)
          ),
          class:classes(name),
          homeroom_teacher:profiles!grade_submissions_homeroom_teacher_id_fkey(full_name)
        `)
        .in('class_id', studentIds) // Note: This needs to be adjusted based on actual relationship
        .order('created_at', { ascending: false })

      return query.limit(30)
    },
    'getGradeReportsData'
  )
}

// Get student reports data (using existing student_reports table)
export async function getAcademicReportsData(studentIds: string[]) {
  if (studentIds.length === 0) return []

  return executeSupabaseQuery(
    async (supabase) => {
      const query = supabase
        .from('student_reports')
        .select(`
          id,
          strengths,
          weaknesses,
          academic_performance,
          discipline_status,
          status,
          sent_at,
          created_at,
          student:profiles!student_reports_student_id_fkey(full_name, student_id),
          report_period:report_periods(
            id,
            name,
            start_date,
            end_date,
            academic_year:academic_years(name),
            semester:semesters(name)
          ),
          class:classes(name),
          homeroom_teacher:profiles!student_reports_homeroom_teacher_id_fkey(full_name)
        `)
        .in('student_id', studentIds)
        .order('created_at', { ascending: false })

      return query.limit(30)
    },
    'getAcademicReportsData'
  )
}

// Get grade reporting periods for context
export async function getGradeReportingPeriods(academicYearId?: string) {
  return executeSupabaseQuery(
    async (supabase) => {
      let query = supabase
        .from('grade_reporting_periods')
        .select(`
          id,
          name,
          start_date,
          end_date,
          is_final,
          academic_year:academic_years(name)
        `)
        .order('start_date', { ascending: true })

      if (academicYearId) {
        query = query.eq('academic_year_id', academicYearId)
      }

      return query
    },
    'getGradeReportingPeriods'
  )
}

// Get report periods for academic reports
export async function getReportPeriods(academicYearId?: string) {
  return executeSupabaseQuery(
    async (supabase) => {
      let query = supabase
        .from('report_periods')
        .select(`
          id,
          name,
          start_date,
          end_date,
          report_type,
          academic_year:academic_years(name)
        `)
        .order('start_date', { ascending: true })

      if (academicYearId) {
        query = query.eq('academic_year_id', academicYearId)
      }

      return query
    },
    'getReportPeriods'
  )
}

// Helper function to extract student IDs from relationships
export function extractStudentIds(relationships: unknown[]): string[] {
  return relationships?.map(rel => (rel as { student_id: string }).student_id) || []
}

// Helper function to extract student names from relationships
export function extractStudentNames(relationships: unknown[]): string[] {
  return relationships?.map(rel => 
    (rel as { profiles?: { full_name?: string } }).profiles?.full_name
  ).filter(Boolean) as string[] || []
}

// Common data formatting patterns
export interface FormattedContextData {
  students: string[]
  recentFeedback: unknown[]
  recentGrades: unknown[]
  recentViolations: unknown[]
  gradeReports: unknown[]
  academicReports: unknown[]
  gradeReportingPeriods: unknown[]
  reportPeriods: unknown[]
}

// Optimized batch query function with caching
const dataCache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getCachedData(key: string): unknown {
  const cached = dataCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  dataCache.delete(key)
  return null
}

function setCachedData(key: string, data: unknown): void {
  dataCache.set(key, { data, timestamp: Date.now() })
}

// Cache cleanup function to prevent memory leaks
export function cleanupExpiredCache(): void {
  const now = Date.now()
  for (const [key, value] of dataCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      dataCache.delete(key)
    }
  }
}

// Auto cleanup every 10 minutes
if (typeof window === 'undefined') { // Server-side only
  setInterval(cleanupExpiredCache, 10 * 60 * 1000)
}

export async function getFormattedParentContextData(parentId: string): Promise<FormattedContextData> {
  const cacheKey = `parent_context_${parentId}`
  const cached = getCachedData(cacheKey)
  if (cached) {
    return cached as FormattedContextData
  }

  // Get parent-student relationships
  const relationships = await getParentStudentRelationships(parentId)
  const studentIds = extractStudentIds(relationships)
  const studentNames = extractStudentNames(relationships)

  // Optimize: Early return if no students
  if (studentIds.length === 0) {
    const emptyData = {
      students: [],
      recentFeedback: [],
      recentGrades: [],
      recentViolations: [],
      gradeReports: [],
      academicReports: [],
      gradeReportingPeriods: [],
      reportPeriods: []
    }
    setCachedData(cacheKey, emptyData)
    return emptyData
  }

  // Get current academic year for context
  let currentAcademicYear: { id: string; name: string } | null = null
  try {
    currentAcademicYear = await executeSupabaseQuery(
      async (supabase) => supabase
        .from('academic_years')
        .select('id, name')
        .eq('is_current', true)
        .single(),
      'getCurrentAcademicYear'
    )
  } catch {
    // Handle case where no current academic year is set
    currentAcademicYear = null
  }

  // Get all data in parallel with optimized batch sizes
  const [feedbackData, gradeData, violationsData, gradeReports, academicReports, gradeReportingPeriods, reportPeriods] = await Promise.all([
    getRecentFeedbackData(studentIds, 30), // Reduced from default
    getRecentGradeData(studentIds, 30),    // Reduced from default
    getRecentViolationsData(studentIds, 60), // Keep longer for violations
    getGradeReportsData(studentIds),
    getAcademicReportsData(studentIds),
    getGradeReportingPeriods(currentAcademicYear?.id),
    getReportPeriods(currentAcademicYear?.id)
  ])

  const result = {
    students: studentNames,
    recentFeedback: feedbackData || [],
    recentGrades: gradeData || [],
    recentViolations: violationsData || [],
    gradeReports: gradeReports || [],
    academicReports: academicReports || [],
    gradeReportingPeriods: gradeReportingPeriods || [],
    reportPeriods: reportPeriods || []
  }

  setCachedData(cacheKey, result)
  return result
}

// Severity labels mapping
export const severityLabels: Record<string, string> = {
  minor: 'Nhẹ',
  moderate: 'Trung bình',
  serious: 'Nghiêm trọng',
  severe: 'Rất nghiêm trọng'
}

// Helper function to format violation data for display
export function formatViolationForDisplay(violation: unknown): string {
  const v = violation as {
    student?: { full_name?: string; student_id?: string };
    violation_type?: { name?: string; violation_categories?: { name?: string } };
    severity?: string;
    description?: string;
    recorded_at?: string;
    recorded_by?: { full_name?: string };
  };
  
  const description = v.description ? `"${v.description}"` : '';
  return `- ${v.student?.full_name} (${v.student?.student_id}): ${v.violation_type?.violation_categories?.name} - ${v.violation_type?.name} [${severityLabels[v.severity || ''] || v.severity}] ${description} (${new Date(v.recorded_at || '').toLocaleDateString('vi-VN')}, ghi nhận bởi ${v.recorded_by?.full_name})`;
}

// Helper function to format feedback data for display
export function formatFeedbackForDisplay(feedback: unknown): string {
  const f = feedback as {
    student_name?: string;
    subject_name?: string;
    rating?: number;
    comment?: string;
    ai_summary?: string;
    teacher_name?: string;
    week_number?: number;
  };
  
  return `- ${f.student_name} - ${f.subject_name}: ${f.rating}/5 sao, "${f.comment || f.ai_summary || 'Không có nhận xét'}" (${f.teacher_name}, tuần ${f.week_number})`;
}

// Helper function to format grade data for display
export function formatGradeForDisplay(grade: unknown): string {
  const g = grade as {
    profiles?: { full_name?: string };
    subjects?: { name_vietnamese?: string };
    grade?: number;
    submission_date?: string;
  };
  
  return `- ${g.profiles?.full_name} - ${g.subjects?.name_vietnamese}: ${g.grade} điểm (${new Date(g.submission_date || '').toLocaleDateString('vi-VN')})`;
}

// Format grade report data for display
export function formatGradeReportForDisplay(report: unknown): string {
  const r = report as {
    student?: { full_name?: string; student_id?: string }
    grade_reporting_period?: { name?: string; start_date?: string; end_date?: string; is_final?: boolean }
    total_score?: number
    average_score?: number
    rank_in_class?: number | null
    rank_in_grade?: number | null
    conduct_score?: number | null
    academic_year?: { name?: string }
    semester?: { name?: string }
    class?: { name?: string }
    created_at?: string
  }

  const startDate = r.grade_reporting_period?.start_date ? new Date(r.grade_reporting_period.start_date).toLocaleDateString('vi-VN') : 'N/A'
  const endDate = r.grade_reporting_period?.end_date ? new Date(r.grade_reporting_period.end_date).toLocaleDateString('vi-VN') : 'N/A'
  const createdDate = r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN') : 'N/A'

  let rankInfo = ''
  if (r.rank_in_class) {
    rankInfo += `Xếp hạng lớp: ${r.rank_in_class}`
  }
  if (r.rank_in_grade) {
    rankInfo += rankInfo ? `, Xếp hạng khối: ${r.rank_in_grade}` : `Xếp hạng khối: ${r.rank_in_grade}`
  }

  const conductInfo = r.conduct_score ? `, Điểm hạnh kiểm: ${r.conduct_score}` : ''
  const finalInfo = r.grade_reporting_period?.is_final ? ' (Báo cáo cuối kỳ)' : ''

  return `- ${r.student?.full_name || 'N/A'} (${r.student?.student_id || 'N/A'}) - ${r.grade_reporting_period?.name || 'N/A'}${finalInfo} (${startDate} - ${endDate}): Tổng điểm: ${r.total_score || 'N/A'}, Điểm TB: ${r.average_score || 'N/A'}${conductInfo}${rankInfo ? `, ${rankInfo}` : ''}. Lớp: ${r.class?.name || 'N/A'}, ${r.semester?.name || 'N/A'}, ${r.academic_year?.name || 'N/A'}. Cập nhật: ${createdDate}`
}

// Format academic report data for display
export function formatAcademicReportForDisplay(report: unknown): string {
  const r = report as {
    student?: { full_name?: string; student_id?: string }
    report_period?: { name?: string; start_date?: string; end_date?: string; report_type?: string }
    learning_attitude?: string | null
    participation_level?: string | null
    homework_completion?: string | null
    class_behavior?: string | null
    strengths?: string | null
    areas_for_improvement?: string | null
    teacher_comments?: string | null
    academic_year?: { name?: string }
    semester?: { name?: string }
    class?: { name?: string }
    teacher?: { full_name?: string }
    created_at?: string
  }

  const startDate = r.report_period?.start_date ? new Date(r.report_period.start_date).toLocaleDateString('vi-VN') : 'N/A'
  const endDate = r.report_period?.end_date ? new Date(r.report_period.end_date).toLocaleDateString('vi-VN') : 'N/A'
  const createdDate = r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN') : 'N/A'

  const details = []
  if (r.learning_attitude) details.push(`Thái độ học tập: ${r.learning_attitude}`)
  if (r.participation_level) details.push(`Mức độ tham gia: ${r.participation_level}`)
  if (r.homework_completion) details.push(`Hoàn thành BTVN: ${r.homework_completion}`)
  if (r.class_behavior) details.push(`Hành vi lớp học: ${r.class_behavior}`)
  if (r.strengths) details.push(`Điểm mạnh: ${r.strengths}`)
  if (r.areas_for_improvement) details.push(`Cần cải thiện: ${r.areas_for_improvement}`)
  if (r.teacher_comments) details.push(`Nhận xét GV: ${r.teacher_comments}`)

  return `- ${r.student?.full_name || 'N/A'} (${r.student?.student_id || 'N/A'}) - ${r.report_period?.name || 'N/A'} (${r.report_period?.report_type || 'N/A'}) (${startDate} - ${endDate}): ${details.join(', ')}. Lớp: ${r.class?.name || 'N/A'}, ${r.semester?.name || 'N/A'}, ${r.academic_year?.name || 'N/A'}. GV: ${r.teacher?.full_name || 'N/A'}. Cập nhật: ${createdDate}`
}
