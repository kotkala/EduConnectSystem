import { createClient } from '@/utils/supabase/server'

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

// Common query pattern for recent feedback data
export async function getRecentFeedbackData(studentIds: string[], daysBack: number = 30) {
  const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()
  
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

// Common query pattern for recent grade data
export async function getRecentGradeData(studentIds: string[], daysBack: number = 30) {
  const cutoffDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()
  
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
}

export async function getFormattedParentContextData(parentId: string): Promise<FormattedContextData> {
  // Get parent-student relationships
  const relationships = await getParentStudentRelationships(parentId)
  const studentIds = extractStudentIds(relationships)
  const studentNames = extractStudentNames(relationships)
  
  // Get all data in parallel
  const [feedbackData, gradeData, violationsData] = await Promise.all([
    getRecentFeedbackData(studentIds),
    getRecentGradeData(studentIds),
    getRecentViolationsData(studentIds)
  ])
  
  return {
    students: studentNames,
    recentFeedback: feedbackData || [],
    recentGrades: gradeData || [],
    recentViolations: violationsData || []
  }
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
