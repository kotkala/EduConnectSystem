/**
 * Shared Supabase queries for violation management
 * Centralized query definitions to avoid duplication
 */

/**
 * Common select fields for violation categories
 */
export const VIOLATION_CATEGORY_FIELDS = `
  id,
  name,
  description,
  is_active,
  created_at,
  updated_at
`

/**
 * Common select fields for violation types with category info
 */
export const VIOLATION_TYPE_WITH_CATEGORY_FIELDS = `
  id,
  name,
  description,
  category_id,
  default_severity,
  points,
  is_active,
  created_at,
  updated_at,
  violation_categories!inner(
    id,
    name
  )
`

/**
 * Common select fields for student violations with full details
 */
export const STUDENT_VIOLATION_WITH_DETAILS_FIELDS = `
  id,
  violation_type_id,
  student_id,
  class_id,
  severity,
  description,
  points,
  violation_date,
  academic_year_id,
  semester_id,
  recorded_by,
  recorded_at,
  created_at,
  updated_at,
  violation_types!inner(
    id,
    name,
    category_id,
    default_severity,
    points,
    violation_categories!inner(
      id,
      name
    )
  ),
  profiles!student_id(
    id,
    full_name,
    student_id,
    email
  ),
  classes(
    id,
    name,
    academic_year:academic_years(name),
    semester:semesters(name)
  ),
  recorded_by_user:profiles!recorded_by(
    id,
    full_name
  )
`

/**
 * Common select fields for disciplinary cases
 */
export const DISCIPLINARY_CASE_FIELDS = `
  id,
  student_id,
  class_id,
  semester_id,
  week_index,
  action_type_id,
  total_points,
  notes,
  status,
  created_by,
  created_at,
  updated_at,
  profiles!student_id(
    id,
    full_name,
    student_id,
    email
  ),
  classes(
    id,
    name
  ),
  disciplinary_action_types(
    id,
    name,
    description,
    severity_level
  ),
  created_by_profile:profiles!created_by(
    full_name
  )
`

/**
 * Common select fields for violation statistics
 */
export const VIOLATION_STATS_FIELDS = `
  id,
  violation_date,
  points,
  violation_types(
    severity,
    violation_categories(name)
  )
`

/**
 * Common select fields for class blocks
 */
export const CLASS_BLOCK_FIELDS = `
  id,
  name,
  display_name,
  is_active
`

/**
 * Common select fields for classes with academic info
 */
export const CLASS_WITH_ACADEMIC_INFO_FIELDS = `
  id,
  name,
  academic_year:academic_years!inner(
    id,
    name,
    is_current
  ),
  semester:semesters!inner(
    id,
    name,
    is_current
  )
`

/**
 * Common select fields for students
 */
export const STUDENT_BASIC_FIELDS = `
  id,
  full_name,
  student_id,
  email,
  phone_number,
  date_of_birth
`

/**
 * Common select fields for monthly violation alerts
 */
export const MONTHLY_VIOLATION_ALERT_FIELDS = `
  id,
  student_id,
  semester_id,
  month_index,
  violation_count,
  total_points,
  is_seen,
  seen_by,
  seen_at,
  created_at,
  profiles!student_id(
    id,
    full_name,
    student_id
  ),
  semesters(
    id,
    name
  )
`

/**
 * Helper function to build date range filters
 */
export function buildDateRangeFilter(startDate?: string, endDate?: string) {
  const filters: string[] = []
  
  if (startDate) {
    filters.push(`violation_date.gte.${startDate}`)
  }
  
  if (endDate) {
    filters.push(`violation_date.lte.${endDate}`)
  }
  
  return filters
}

/**
 * Helper function to build pagination parameters
 */
export function buildPaginationParams(page: number = 1, limit: number = 10) {
  const from = (page - 1) * limit
  const to = from + limit - 1
  
  return { from, to }
}

/**
 * Helper function to build week date range
 */
export function buildWeekDateRange(semesterStartDate: string, weekIndex: number) {
  const startDate = new Date(semesterStartDate)
  const weekStartDate = new Date(startDate)
  weekStartDate.setDate(startDate.getDate() + (weekIndex - 1) * 7)
  
  const weekEndDate = new Date(weekStartDate)
  weekEndDate.setDate(weekStartDate.getDate() + 6)
  
  return {
    startDate: weekStartDate.toISOString().split('T')[0],
    endDate: weekEndDate.toISOString().split('T')[0]
  }
}

/**
 * Helper function to build month date range (4 weeks)
 */
export function buildMonthDateRange(semesterStartDate: string, monthIndex: number) {
  const startDate = new Date(semesterStartDate)
  const monthStartDate = new Date(startDate)
  monthStartDate.setDate(startDate.getDate() + (monthIndex - 1) * 28) // 4 weeks = 28 days
  
  const monthEndDate = new Date(monthStartDate)
  monthEndDate.setDate(monthStartDate.getDate() + 27) // 28 days - 1
  
  return {
    startDate: monthStartDate.toISOString().split('T')[0],
    endDate: monthEndDate.toISOString().split('T')[0]
  }
}
